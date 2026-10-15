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
const ISCO = 1.15 // innermost stable orbit, in world units (3 Rs)
const v = new THREE.Vector3()
const flatV = new THREE.Vector3()
const radial = new THREE.Vector3()
const tangent = new THREE.Vector3()
const basis = new THREE.Matrix4()
const tidal = new THREE.Quaternion()
const tint = new THREE.Color()

/**
 * A storm of wallets. Calm and distant in the intro, red and close once the
 * problem is named, then captured by the black hole: each one settles into
 * the disk plane and spirals in on a Keplerian orbit (faster the deeper it
 * goes), plunges once it passes the innermost stable orbit, is stretched
 * radially by tides, and reddens and dims from gravitational redshift as it
 * nears the horizon.
 */
export function Swarm({ count = 1800 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tex = useMemo(() => walletTexture(), [])
  const chips = useMemo(() => {
    const origins = printWorldPoints(count)
    return Array.from({ length: count }, (_, i) => ({
        origin: origins[i],
        r: 3 + Math.pow(Math.random(), 0.55) * 8,
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        speed: (0.05 + Math.random() * 0.13) * (Math.random() < 0.5 ? -1 : 1),
        spin: new THREE.Vector3(Math.random() * 0.8, Math.random() * 1.2, Math.random() * 0.6),
        wobble: Math.random() * 10,
        size: 0.5 + Math.random() * 0.7,
        lag: Math.random() * 0.09,
        ang: 0,
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
    const pull = smooth(seg(p, P.void - 0.06, P.collapse))
    color.copy(COLD).lerp(THREAT, threat).lerp(HOT, pull * 0.8)
    m.material.color.copy(color)
    // absent on the hero: the wallets are born out of the print as it fractures
    m.material.opacity = (0.45 + 0.55 * threat) * smooth(seg(p, 0.004, 0.04))

    for (let i = 0; i < count; i++) {
      const c = chips[i]
      // each wallet is captured at a slightly different moment
      const k = smooth(seg(p, P.void - 0.07 + c.lag, P.collapse - 0.02 + c.lag * 0.4))
      const r0 = c.r + Math.sin(t * 0.6 + c.wobble) * 0.25
      // slow inspiral while the orbit is stable, then a fast plunge inside the ISCO
      const r = k < 0.75 ? THREE.MathUtils.lerp(r0, ISCO, Math.pow(k / 0.75, 1.6)) : THREE.MathUtils.lerp(ISCO, 0.9, Math.pow((k - 0.75) / 0.25, 2))
      // Keplerian angular speed, integrated so the orbit stays continuous as r shrinks
      const kepler = Math.sign(c.speed) * 2.6 * Math.pow(r, -1.5)
      c.ang += dt * THREE.MathUtils.lerp(c.speed * (1 + threat), kepler, smooth(Math.min(1, k * 3)))
      const a = c.theta + c.ang
      const shell = v.set(r * Math.sin(c.phi) * Math.cos(a), r * Math.cos(c.phi) * 0.6, r * Math.sin(c.phi) * Math.sin(a))
      // captured wallets settle into the disk plane
      const flat = flatV.set(Math.cos(a) * r, Math.sin(a) * r, 0).applyQuaternion(tilt)
      const settle = smooth(Math.min(1, k * 1.6))
      dummy.position.copy(shell).lerp(flat, settle)
      // the fracture: each wallet leaves its spot on the print and flies out to the swarm
      const emerge = smooth(seg(p, 0.004 + c.lag * 0.4, P.problem * 0.82 + c.lag * 0.15))
      const out = 1 - Math.pow(1 - emerge, 3)
      if (out < 1) dummy.position.lerpVectors(c.origin, dummy.position, out)

      // tumbling in free space; once captured, tides line each one up radially
      dummy.rotation.set(t * c.spin.x + c.wobble, t * c.spin.y, t * c.spin.z)
      if (settle > 0) {
        radial.copy(flat).normalize()
        tangent.crossVectors(NORMAL, radial)
        tidal.setFromRotationMatrix(basis.makeBasis(radial, tangent, NORMAL))
        dummy.quaternion.slerp(tidal, settle)
      }
      // tidal stretch grows as 1/r^3
      const stretch = settle * Math.min(6, Math.pow(ISCO / r, 3)) * 1.4
      // tides shred each wallet into the disk's gas well before the shadow's edge
      const gone = smooth(seg(r, 3.4, 2.3))
      const sz = c.size * (1 - gone) * (0.15 + 0.85 * out)
      dummy.scale.set(sz * (1 + stretch), sz / (1 + stretch * 0.5), 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      // gravitational redshift: sqrt(1 - Rs/r), with r in Rs units
      const z = Math.sqrt(Math.max(0, 1 - 0.385 / Math.max(r, 0.4)))
      const heat = settle * 1.6 * Math.pow(ISCO / Math.max(r, 0.9), 1.5)
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
