import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp, xpProgress } from '../store'
import { NOVA, P, easeInOut, seg } from '../chapters'

// Where the lens sits at each chapter. The controller eases progress between
// chapters, so each swipe is one camera move between two of these marks.
const SHOTS = [
  { p: P.hero, pos: [0, 0.6, 18], look: [-3, 0, 0], fov: 34 },
  { p: P.many, pos: [-5, 1.6, 9.5], look: [0.5, 0, 0], fov: 42 },
  { p: P.farmed, pos: [4, -1, 7], look: [0, 0.3, 0], fov: 44 },
  { p: P.void, pos: [0, 1.5, 12.5], look: [0, 0, 0], fov: 32 },
  { p: P.collapse, pos: [3.6, 1.4, 11.5], look: [-0.6, 0, 0], fov: 32 },
  { p: NOVA, pos: [0, 0.4, 9], look: [0, 0, 0], fov: 36 },
  { p: P.dawn, pos: [0, 0.4, 9.5], look: [0, 0.1, -2], fov: 44 },
  { p: P.card, pos: [1.1, 0.4, 7.2], look: [1.5, 0.1, 0], fov: 34 },
  { p: P.everywhere, pos: [0, 1.4, 12.5], look: [0, 0.35, -1], fov: 44 },
  { p: P.cta, pos: [-0.6, 1.1, 9.8], look: [-3.1, 1.0, 0], fov: 38 },
]

// Phones are too narrow for side-by-side framing; centre the card and keep text below it.
const MOBILE = {
  [P.card]: { pos: [0, 1.3, 7.2], look: [0, -0.2, 0] },
  [P.cta]: { pos: [0, 1.4, 8.6], look: [0, -0.1, 0] },
}
const shot = (s) => (xp.mobile && MOBILE[s.p] ? { ...s, ...MOBILE[s.p] } : s)

const a1 = new THREE.Vector3()
const a2 = new THREE.Vector3()
const b1 = new THREE.Vector3()
const b2 = new THREE.Vector3()

export function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const p = xp.progress
    xpProgress.set(p)
    const cam = state.camera
    const t = state.clock.elapsedTime

    let i = SHOTS.findIndex((s) => s.p > p) - 1
    if (i < 0) i = p >= 1 ? SHOTS.length - 2 : 0
    const A = shot(SHOTS[i])
    const B = shot(SHOTS[Math.min(i + 1, SHOTS.length - 1)])
    const k = easeInOut(seg(p, A.p, B.p))

    cam.position.lerpVectors(a1.fromArray(A.pos), a2.fromArray(B.pos), k)
    look.lerpVectors(b1.fromArray(A.look), b2.fromArray(B.look), k)

    // Shots are framed for widescreen; on tall screens, pull back so the
    // subject stays in frame, most for close-ups.
    const aspect = state.size.width / state.size.height
    const need = THREE.MathUtils.clamp(1.3 / aspect, 1, 2.4)
    if (need > 1) {
      const dist = cam.position.distanceTo(look)
      const pull = 1 + (need - 1) * THREE.MathUtils.clamp(6 / dist, 0.35, 1)
      cam.position.sub(look).multiplyScalar(pull).add(look)
    }

    if (!xp.reduced) {
      // a slow breath and a lean toward the pointer
      cam.position.x += Math.sin(t * 0.5) * 0.06 + xp.pointer.x * 0.3
      cam.position.y += Math.cos(t * 0.4) * 0.05 - xp.pointer.y * 0.18
    }
    cam.fov = THREE.MathUtils.lerp(A.fov, B.fov, k)
    cam.updateProjectionMatrix()
    cam.lookAt(look)
    if (import.meta.env.DEV) window.__cam = cam
  })
  return null
}
