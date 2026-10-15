import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { P, seg, smooth } from '../chapters'
import { DISK_TILT } from './BlackHole'
import { printWorldPoints } from './printGeometry'

// The problem: a crowd of wallets in every colour, each one a different identity.
const CROWD = ['#7fe3ff', '#b9a6ff', '#ff9ad5', '#ffd27f', '#8affc1', '#7f9bff', '#ff8f7f', '#f2f2ff'].map((c) => new THREE.Color(c).multiplyScalar(1.25))
// The proof: near the hole, all of them redshifted to the same deep red.
const REDSHIFT = new THREE.Color('#ff2e63').multiplyScalar(1.6)
// Straight out of the print, they still carry its holo light.
const PRINT_LIGHT = new THREE.Color('#b9d8ff').multiplyScalar(1.1)

function walletTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 160
  const g = c.getContext('2d')
  const r = 22
  g.beginPath()
  g.moveTo(8 + r, 8)
  g.arcTo(248, 8, 248, 152, r)
  g.arcTo(248, 152, 8, 152, r)
  g.arcTo(8, 152, 8, 8, r)
  g.arcTo(8, 8, 248, 8, r)
  g.closePath()
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.fill()
  g.lineWidth = 5
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.stroke()
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.fillRect(34, 46, 46, 34)
  g.fillStyle = 'rgba(255,255,255,0.45)'
  g.fillRect(34, 104, 150, 10)
  g.fillRect(34, 122, 90, 8)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/*
 * Gravitational lensing, applied per vertex. A wallet behind the hole is seen
 * by light that has bent around it: each point's offset from the hole, on
 * the plane through the hole facing the camera, is pushed outward by the
 * lens equation r' = (r + sqrt(r^2 + 4 rE^2)) / 2. The Einstein radius rE
 * grows with how far behind the hole the wallet is, so wallets passing
 * behind swell into arcs that wrap over the top of the shadow and hug its
 * edge, and are back to normal by the time they come round the front.
 */
function lensedMaterial(map) {
  const m = new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
  m.userData.uniforms = { uLens: { value: new THREE.Vector3() }, uLensRE: { value: 0 } }
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, m.userData.uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uLens;\nuniform float uLensRE;')
      .replace(
        '#include <project_vertex>',
        `vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        float behind = uLens.z - mvPosition.z;
        if (uLensRE > 0.0 && behind > 0.0) {
          float k = uLens.z / mvPosition.z;
          vec2 q = mvPosition.xy * k - uLens.xy;
          float r = length(q);
          float re2 = uLensRE * uLensRE * behind / (behind + 1.6);
          float rp = 0.5 * (r + sqrt(r * r + 4.0 * re2));
          mvPosition.xy = (uLens.xy + q * (rp / max(r, 1e-4))) / k;
        }
        gl_Position = projectionMatrix * mvPosition;`,
      )
  }
  return m
}

const lensCenter = new THREE.Vector3()
const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + DISK_TILT, 0, 0))
const NORMAL = new THREE.Vector3(0, 0, 1).applyQuaternion(tilt)
const KEPLER = 3.4 // angular speed at r = 1 world unit; falls off as r^-1.5
const v = new THREE.Vector3()
const orbitPos = new THREE.Vector3()
const radial = new THREE.Vector3()
const tangent = new THREE.Vector3()
const toCam = new THREE.Vector3()
const basis = new THREE.Matrix4()
const ride = new THREE.Quaternion()
const roll = new THREE.Quaternion()
const tint = new THREE.Color()
const base = new THREE.Color()

/**
 * A crowd of wallets, born out of the hero's print as it fractures, each one
 * a different colour: a thousand identities. Then the black hole takes them.
 *
 * Captured, they form one coherent prograde vortex: a thin disk of Keplerian
 * orbits where angular speed falls off as r^-1.5. Each wallet rides its orbit
 * facing outward, its long side along its motion, so the swirl reads at a
 * glance. The inner ones whip round so fast they streak; the outer ones, big
 * and close, drift slowly through the foreground. Their light is shifted by
 * physics: everything is redshifted to the same deep red, redder and dimmer
 * the deeper it sits, and Doppler beaming brightens the side coming toward
 * the camera and dims the side going away. As the hole feeds, every orbit
 * decays inward and the wallets are shredded into the disk's gas.
 */
export function Swarm({ count = 1800 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const material = useMemo(() => lensedMaterial(walletTexture()), [])
  const chips = useMemo(() => {
    const origins = printWorldPoints(count)
    return Array.from({ length: count }, (_, i) => {
      const ro = 2.3 + Math.pow(Math.random(), 1.35) * 11
      return {
        origin: origins[i],
        hue: CROWD[i % CROWD.length],
        // free-floating crowd
        r: 3 + Math.pow(Math.random(), 0.55) * 8,
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        speed: (0.05 + Math.random() * 0.13) * (Math.random() < 0.5 ? -1 : 1),
        spin: new THREE.Vector3(Math.random() * 0.8, Math.random() * 1.2, Math.random() * 0.6),
        wobble: Math.random() * 10,
        lag: Math.random() * 0.09,
        ang: 0,
        // its orbit once captured: one thin prograde disk; the outer, nearer ones are bigger
        ro,
        size: (0.5 + Math.random() * 0.6) * (1 + smooth(seg(ro, 7, 13)) * 1.6),
        inc: (Math.random() - 0.5) * 0.14,
        node: Math.random() * Math.PI * 2,
        oang: Math.random() * Math.PI * 2,
        bank: (Math.random() - 0.5) * 0.5,
      }
    })
  }, [count])

  useFrame((state, delta) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const m = mesh.current
    if (!m) return
    m.visible = p > 0.004 && p < P.collapse + 0.04
    if (!m.visible) return
    if (!m.instanceColor) {
      m.setColorAt(0, tint.setRGB(1, 1, 1))
      m.material.needsUpdate = true
    }
    // absent on the hero: the wallets are born out of the print as it fractures
    m.material.opacity = smooth(seg(p, 0.004, 0.04))
    // the lens sits at the hole, in view space, and is as strong as the hole is grown
    const lens = material.userData.uniforms
    lens.uLens.value.copy(lensCenter.set(0, 0, 0).applyMatrix4(state.camera.matrixWorldInverse))
    lens.uLensRE.value = 1.6 * xp.bhScale
    const crowd = smooth(seg(p, 0.03, P.problem))
    const cam = state.camera.position

    for (let i = 0; i < count; i++) {
      const c = chips[i]
      // drifting crowd
      c.ang += dt * c.speed * (1 + crowd)
      const a = c.theta + c.ang
      const free = v.set(c.r * Math.sin(c.phi) * Math.cos(a), c.r * Math.cos(c.phi) * 0.6, c.r * Math.sin(c.phi) * Math.sin(a))

      // captured onto an orbit, which decays as the hole feeds
      const capture = smooth(seg(p, P.problem + 0.015 + c.lag * 0.25, P.void - 0.012))
      const decay = smooth(seg(p, P.void + 0.03 + c.lag * 0.3, P.collapse - 0.005 + c.lag * 0.08))
      // inspiral: the orbit shrinks slowly at first, then plunges (r ~ (t_c - t)^(1/4))
      const r = 0.95 + (c.ro - 0.95) * Math.pow(1 - decay, 0.42)
      const omega = KEPLER * Math.pow(r, -1.5)
      c.oang += dt * omega
      const inc = c.inc * (1 - decay)
      const x0 = r * Math.cos(c.oang)
      const y0 = r * Math.sin(c.oang)
      const y1 = y0 * Math.cos(inc)
      const cn = Math.cos(c.node)
      const sn = Math.sin(c.node)
      orbitPos.set(x0 * cn - y1 * sn, x0 * sn + y1 * cn, y0 * Math.sin(inc)).applyQuaternion(tilt)
      dummy.position.copy(free).lerp(orbitPos, capture)

      // the fracture: each wallet leaves its spot on the print and flies out to the crowd
      const emerge = smooth(seg(p, 0.004 + c.lag * 0.4, P.problem * 0.82 + c.lag * 0.15))
      const out = 1 - Math.pow(1 - emerge, 3)
      if (out < 1) dummy.position.lerpVectors(c.origin, dummy.position, out)

      // tumbling while free; once captured, riding the orbit: long side along the motion, facing out
      dummy.rotation.set(t * c.spin.x + c.wobble, t * c.spin.y, t * c.spin.z)
      radial.copy(orbitPos).normalize()
      tangent.crossVectors(NORMAL, radial).normalize()
      if (capture > 0) {
        ride.setFromRotationMatrix(basis.makeBasis(tangent, NORMAL, radial))
        roll.setFromAxisAngle(tangent, c.bank + Math.sin(t * 0.5 + c.wobble) * 0.12)
        ride.premultiply(roll)
        dummy.quaternion.slerp(ride, capture)
      }

      // speed streak: inner orbits move so fast they smear along their path
      const speed = omega * r
      // tides pull each falling wallet into a thin stream along its orbit
      const tide = decay * Math.min(6, Math.pow(2.6 / r, 2.2))
      const streak = capture * Math.min(2.2, Math.max(0, speed - 1.1) * 1.4) + tide
      // shredded into the disk's gas well before the shadow's edge
      const gone = decay > 0 ? smooth(seg(r, 2.3, 1.5)) : 0
      // wallets that pass right by the lens fade rather than fill the screen
      const camDist = dummy.position.distanceTo(cam)
      const near = smooth(seg(camDist, 0.7, 2.6))
      const sz = c.size * (1 - gone) * (0.15 + 0.85 * out) * near
      dummy.scale.set(sz * (1 + streak), sz / (1 + streak * 0.35 + tide * 0.6), 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      // colour: print light, then the crowd's colours, then one deep redshifted red
      base.copy(PRINT_LIGHT).lerp(c.hue, out).lerp(REDSHIFT, capture)
      // gravitational redshift deepens and dims near the hole: sqrt(1 - Rs/r), r in Rs units
      const z = 1 - capture * (1 - Math.sqrt(Math.max(0, 1 - 0.385 / Math.max(r, 0.4))))
      // Doppler beaming: brighter coming toward the camera, dimmer going away
      toCam.copy(cam).sub(dummy.position).normalize()
      const beta = capture * Math.min(0.3, speed * 0.12)
      const D = 1 / (1 - beta * tangent.dot(toCam))
      const glow = Math.min(1.9, Math.pow(D, 2.2)) * (capture ? 0.75 + 0.25 * z : 1) / (1 + streak * 0.5)
      tint.setRGB(base.r * glow * z, base.g * glow * z * z, base.b * glow * z * z * z)
      m.setColorAt(i, tint)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, material, count]} frustumCulled={false}>
      {/* subdivided so the lens can bend each wallet into an arc */}
      <planeGeometry args={[0.22, 0.1375, 10, 6]} />
    </instancedMesh>
  )
}
