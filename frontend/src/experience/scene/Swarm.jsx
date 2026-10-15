import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { P, seg, smooth } from '../chapters'
import { DISK_TILT } from './BlackHole'

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
const v = new THREE.Vector3()
const flatV = new THREE.Vector3()

/**
 * A storm of wallets. Calm and distant in the intro, red and close once the
 * problem is named, then each one spirals into the accretion disk, heating up
 * and stretching before it crosses the horizon.
 */
export function Swarm({ count = 1800 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tex = useMemo(() => walletTexture(), [])
  const chips = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        r: 3 + Math.pow(Math.random(), 0.55) * 8,
        theta: Math.random() * Math.PI * 2,
        phi: Math.acos(2 * Math.random() - 1),
        speed: (0.05 + Math.random() * 0.13) * (Math.random() < 0.5 ? -1 : 1),
        spin: new THREE.Vector3(Math.random() * 0.8, Math.random() * 1.2, Math.random() * 0.6),
        wobble: Math.random() * 10,
        size: 0.5 + Math.random() * 0.7,
        lag: Math.random() * 0.09,
      })),
    [count],
  )
  const color = useMemo(() => new THREE.Color(), [])

  useFrame((state) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const m = mesh.current
    if (!m) return
    const threat = smooth(seg(p, 0.02, P.many))
    const pull = smooth(seg(p, P.void - 0.06, P.collapse))
    m.visible = p < P.collapse + 0.04
    color.copy(COLD).lerp(THREAT, threat).lerp(HOT, pull * 0.8)
    m.material.color.copy(color)
    m.material.opacity = 0.45 + 0.55 * threat

    for (let i = 0; i < count; i++) {
      const c = chips[i]
      // each chip starts falling at a slightly different moment
      const k = smooth(seg(p, P.void - 0.07 + c.lag, P.collapse - 0.02 + c.lag * 0.4))
      const r0 = c.r + Math.sin(t * 0.6 + c.wobble) * 0.25
      const r = THREE.MathUtils.lerp(r0, 1.0, k)
      // angular speed grows sharply as they fall, like real orbits
      const a = c.theta + t * c.speed * (1 + threat) + k * k * (14 + t * 2.2)
      const shell = v.set(r * Math.sin(c.phi) * Math.cos(a), r * Math.cos(c.phi) * 0.6, r * Math.sin(c.phi) * Math.sin(a))
      // flatten into the disk plane as they get captured
      const flat = flatV.set(Math.cos(a) * r, Math.sin(a) * r, 0).applyQuaternion(tilt)
      dummy.position.copy(shell).lerp(flat, smooth(k))
      dummy.rotation.set(t * c.spin.x + c.wobble, t * c.spin.y, t * c.spin.z + k * 3)
      const gone = smooth(seg(k, 0.82, 1))
      // tidal stretch on the way in
      dummy.scale.set(c.size * (1 + k * 2.5) * (1 - gone), c.size * (1 - k * 0.6) * (1 - gone), 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[0.22, 0.1375]} />
      <meshBasicMaterial map={tex} toneMapped={false} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  )
}
