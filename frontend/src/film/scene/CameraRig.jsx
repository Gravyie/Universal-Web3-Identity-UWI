import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { film, filmProgress } from '../store'
import { easeInOut, seg } from '../timeline'

// Camera marks, like a shot list: where the lens sits and what it looks at.
const SHOTS = [
  { p: 0.0, pos: [0, 0.8, 17], look: [0, 0, 0], fov: 32 },
  { p: 0.08, pos: [0, 0.5, 12.5], look: [0, 0, 0], fov: 34 },
  { p: 0.19, pos: [-4.2, 1.6, 6.5], look: [0.5, 0, 0], fov: 42 },
  { p: 0.29, pos: [3.4, -0.9, 5.2], look: [0, 0.2, 0], fov: 44 },
  { p: 0.42, pos: [0, 0.1, 6.4], look: [0, 0, 0], fov: 34 },
  { p: 0.52, pos: [0, 0, 5.1], look: [0, 0, 0], fov: 32 },
  { p: 0.6, pos: [4.4, 1.1, 4.6], look: [0, -0.1, 0], fov: 32 },
  { p: 0.68, pos: [-2.4, 1.3, 4.2], look: [0, 0, 0], fov: 34 },
  { p: 0.83, pos: [0, 5.2, 9.6], look: [0, -0.3, 0], fov: 40 },
  { p: 0.9, pos: [0, 0.4, 4.6], look: [0, 0, 0], fov: 32 },
  { p: 1.0, pos: [0, 0, 0.55], look: [0, 0, 0], fov: 30 },
]

const vA = new THREE.Vector3()
const vB = new THREE.Vector3()
const lA = new THREE.Vector3()
const lB = new THREE.Vector3()

export function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    // Scroll gives the target; the film catches up smoothly, like a fluid head.
    film.progress = film.reduced ? film.target : THREE.MathUtils.damp(film.progress, film.target, 3.2, Math.min(dt, 0.25))
    const p = film.progress
    filmProgress.set(p)
    const cam = state.camera
    const t = state.clock.elapsedTime

    let i = SHOTS.findIndex((s) => s.p > p) - 1
    if (i < 0) i = p >= 1 ? SHOTS.length - 2 : 0
    const a = SHOTS[i]
    const b = SHOTS[Math.min(i + 1, SHOTS.length - 1)]
    const k = easeInOut(seg(p, a.p, b.p))

    vA.fromArray(a.pos)
    vB.fromArray(b.pos)
    cam.position.lerpVectors(vA, vB, k)
    // Shots are framed for widescreen. On tall screens, pull the lens back in
    // proportion to the aspect ratio, easing out for the final push-in.
    const aspect = state.size.width / state.size.height
    // Close-ups need the most room; wide shots are already wide.
    const dist = cam.position.length()
    const need = THREE.MathUtils.clamp(1.3 / aspect, 1, 2.6)
    const pullback = 1 + (need - 1) * THREE.MathUtils.clamp(5.5 / dist, 0.35, 1)
    cam.position.multiplyScalar(THREE.MathUtils.lerp(pullback, 1, seg(p, 0.9, 1)))
    lA.fromArray(a.look)
    lB.fromArray(b.look)
    look.lerpVectors(lA, lB, k)

    if (!film.reduced) {
      // handheld: slow, low-amplitude drift, quieter as we close in
      const dist = cam.position.length()
      const amp = Math.min(1, dist / 8) * 0.06
      cam.position.x += Math.sin(t * 0.7) * amp + film.pointer.x * 0.25
      cam.position.y += Math.cos(t * 0.53) * amp - film.pointer.y * 0.15
    }

    cam.fov = THREE.MathUtils.lerp(a.fov, b.fov, k)
    cam.updateProjectionMatrix()
    cam.lookAt(look)
  })

  return null
}
