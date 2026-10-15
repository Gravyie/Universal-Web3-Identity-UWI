import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { P, seg, smooth } from '../chapters'
import { DISK_TILT } from './BlackHole'
import { printWorldPoints } from './printGeometry'

const COLD = new THREE.Color('#9fb4ff').multiplyScalar(0.9)
const THREAT = new THREE.Color('#ff2e63').multiplyScalar(1.7)
const HOT = new THREE.Color('#ffb36b').multiplyScalar(2.4)

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

const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + DISK_TILT, 0, 0))
const NORMAL = new THREE.Vector3(0, 0, 1).applyQuaternion(tilt)
const v = new THREE.Vector3()
const flatV = new THREE.Vector3()
const radial = new THREE.Vector3()
const tangent = new THREE.Vector3()
const basis = new THREE.Matrix4()
const tidal = new THREE.Quaternion()
const tint = new THREE.Color()

const KEPLER = 3.4 // angular speed at r = 1 world unit; falls off as r^-1.5

/**
 * A storm of wallets, born out of the hero's print as it fractures. Red and
 * close once the problem is named, then captured by the black hole onto real
 * orbits: a thick disk of Keplerian orbits where angular speed falls off as
 * r^-1.5, so the inner wallets whip round while the outer ones, out past the
 * camera, sweep slowly by. Close in, tides line each one up radially and
 * stretch it. As the hole feeds, every orbit decays and spirals inward,
 * flattening into the disk, and the wallets are shredded into its gas well
 * before the shadow's edge.
 */
export function Swarm({ count = 1800 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tex = useMemo(() => walletTexture(), [])
  const chips = useMemo(() => {
    const origins = printWorldPoints(count)
    return Array.from({ length: count }, (_, i) => ({
      origin: origins[i],
      // free-floating swarm
      r: 3 + Math.pow(Math.random(), 0.55) * 8,
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      speed: (0.05 + Math.random() * 0.13) * (Math.random() < 0.5 ? -1 : 1),
      spin: new THREE.Vector3(Math.random() * 0.8, Math.random() * 1.2, Math.random() * 0.6),
      wobble: Math.random() * 10,
      size: 0.5 + Math.random() * 0.7,
      lag: Math.random() * 0.09,
      ang: 0,
      // its orbit once captured: mostly prograde, in a thick disk around the hole
      ro: 2.4 + Math.pow(Math.random(), 1.6) * 10.5,
      inc: (Math.random() - 0.5) * 0.5,
      node: Math.random() * Math.PI * 2,
      dir: Math.random() < 0.92 ? 1 : -1,
      oang: Math.random() * Math.PI * 2,
    }))
  }, [count])
  const color = useMemo(() => new THREE.Color(), [])

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
    const threat = smooth(seg(p, 0.03, P.problem))
    const pull = smooth(seg(p, P.problem + 0.02, P.collapse))
    color.copy(COLD).lerp(THREAT, threat).lerp(HOT, pull * 0.8)
    m.material.color.copy(color)
    // absent on the hero: the wallets are born out of the print as it fractures
    m.material.opacity = (0.45 + 0.55 * threat) * smooth(seg(p, 0.004, 0.04))
    const cam = state.camera.position

    for (let i = 0; i < count; i++) {
      const c = chips[i]
      // drifting swarm
      c.ang += dt * c.speed * (1 + threat)
      const a = c.theta + c.ang
      const free = v.set(c.r * Math.sin(c.phi) * Math.cos(a), c.r * Math.cos(c.phi) * 0.6, c.r * Math.sin(c.phi) * Math.sin(a))

      // captured onto an orbit, which decays as the hole feeds
      const capture = smooth(seg(p, P.problem + 0.015 + c.lag * 0.25, P.void - 0.015))
      const decay = smooth(seg(p, P.void + 0.02 + c.lag * 0.3, P.collapse - 0.005 + c.lag * 0.08))
      const r = c.ro + (0.95 - c.ro) * Math.pow(decay, 1.5)
      c.oang += dt * c.dir * KEPLER * Math.pow(r, -1.5)
      const inc = c.inc * (1 - decay)
      const x0 = r * Math.cos(c.oang)
      const y0 = r * Math.sin(c.oang)
      const y1 = y0 * Math.cos(inc)
      const z1 = y0 * Math.sin(inc)
      const cn = Math.cos(c.node)
      const sn = Math.sin(c.node)
      const orbit = flatV.set(x0 * cn - y1 * sn, x0 * sn + y1 * cn, z1).applyQuaternion(tilt)
      dummy.position.copy(free).lerp(orbit, capture)

      // the fracture: each wallet leaves its spot on the print and flies out to the swarm
      const emerge = smooth(seg(p, 0.004 + c.lag * 0.4, P.problem * 0.82 + c.lag * 0.15))
      const out = 1 - Math.pow(1 - emerge, 3)
      if (out < 1) dummy.position.lerpVectors(c.origin, dummy.position, out)

      // tumbling in free space, faster on tighter orbits; close in, tides line each one up radially
      const spinUp = 1 + capture * 3 * Math.pow(3 / r, 1.5)
      dummy.rotation.set(t * c.spin.x * spinUp + c.wobble, t * c.spin.y * spinUp, t * c.spin.z)
      const align = capture * smooth(seg(r, 5.5, 2.6))
      if (align > 0) {
        radial.copy(orbit).normalize()
        tangent.crossVectors(NORMAL, radial)
        tidal.setFromRotationMatrix(basis.makeBasis(radial, tangent, NORMAL))
        dummy.quaternion.slerp(tidal, align)
      }
      // tidal stretch grows as 1/r^3
      const stretch = align * Math.min(5, Math.pow(2.4 / r, 3)) * 1.2
      // shredded into the disk's gas well before the shadow's edge
      const gone = decay > 0 ? smooth(seg(r, 2.4, 1.6)) : 0
      // wallets that pass right by the lens fade rather than fill the screen
      const near = smooth(seg(dummy.position.distanceTo(cam), 0.6, 2.2))
      const sz = c.size * (1 - gone) * (0.15 + 0.85 * out) * near
      dummy.scale.set(sz * (1 + stretch), sz / (1 + stretch * 0.5), 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      // heating as they fall in, then gravitational redshift: sqrt(1 - Rs/r), with r in Rs units
      const z = Math.sqrt(Math.max(0, 1 - 0.385 / Math.max(r, 0.4)))
      const heat = capture * 1.3 * Math.pow(2.4 / Math.max(r, 0.9), 1.5)
      tint.setRGB((1 + heat) * z, (1 + heat * 0.55) * z * z, (1 + heat * 0.2) * z * z * z)
      m.setColorAt(i, tint)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[0.22, 0.1375]} />
      <meshBasicMaterial map={tex} toneMapped={false} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  )
}
