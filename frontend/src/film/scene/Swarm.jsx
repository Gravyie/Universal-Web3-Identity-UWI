import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { film } from '../store'
import { seg, smooth } from '../timeline'

const THREAT = new THREE.Color('#ff2e63').multiplyScalar(1.6)
const CALM = new THREE.Color('#7fe3ff').multiplyScalar(1.8)

/** A tiny wallet card: glowing outline, chip and a stripe. Drawn once. */
function walletTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 160
  const g = c.getContext('2d')
  const r = 22
  const path = (x, y, w, h) => {
    g.beginPath()
    g.moveTo(x + r, y)
    g.arcTo(x + w, y, x + w, y + h, r)
    g.arcTo(x + w, y + h, x, y + h, r)
    g.arcTo(x, y + h, x, y, r)
    g.arcTo(x, y, x + w, y, r)
    g.closePath()
  }
  path(8, 8, 240, 144)
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.fill()
  g.lineWidth = 5
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.stroke()
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.fillRect(34, 46, 46, 34) // chip
  g.fillStyle = 'rgba(255,255,255,0.45)'
  g.fillRect(34, 104, 150, 10) // stripe
  g.fillRect(34, 122, 90, 8)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Act I and II: a storm of wallets. Each orbits on its own shell with a
 * little turbulence; when the proof lands they pour inward and vanish into
 * the credential.
 */
export function Swarm({ count = 1800 }) {
  const mesh = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tex = useMemo(() => walletTexture(), [])
  const chips = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const r = 2.2 + Math.pow(Math.random(), 0.55) * 7
        return {
          r,
          theta: Math.random() * Math.PI * 2,
          phi: Math.acos(2 * Math.random() - 1),
          speed: (0.05 + Math.random() * 0.14) * (Math.random() < 0.5 ? -1 : 1),
          spin: new THREE.Vector3(Math.random() * 0.8, Math.random() * 1.2, Math.random() * 0.6),
          wobble: Math.random() * 10,
          size: 0.55 + Math.random() * 0.7,
          delay: Math.random() * 0.06,
        }
      }),
    [count],
  )

  useFrame((state) => {
    const p = film.progress
    const t = state.clock.elapsedTime
    const m = mesh.current
    if (!m) return
    // faintly there in the cold open, full strength once Act I starts
    const enter = 0.25 + 0.75 * smooth(seg(p, 0.0, 0.1))
    const calm = smooth(seg(p, 0.3, 0.4))
    m.material.color.copy(THREAT).lerp(CALM, calm)
    m.material.opacity = enter

    for (let i = 0; i < count; i++) {
      const c = chips[i]
      const k = smooth(seg(p, 0.31 + c.delay, 0.43 + c.delay))
      const a = c.theta + t * c.speed * (1 + calm * 3)
      const turb = Math.sin(t * 0.6 + c.wobble) * 0.25
      const r = (c.r + turb) * (1 - k)
      dummy.position.set(r * Math.sin(c.phi) * Math.cos(a), r * Math.cos(c.phi) * 0.62, r * Math.sin(c.phi) * Math.sin(a))
      dummy.rotation.set(t * c.spin.x + c.wobble, t * c.spin.y, t * c.spin.z)
      const vanish = 1 - smooth(seg(p, 0.42 + c.delay, 0.47 + c.delay))
      dummy.scale.setScalar(c.size * vanish * (1 - k * 0.5))
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
