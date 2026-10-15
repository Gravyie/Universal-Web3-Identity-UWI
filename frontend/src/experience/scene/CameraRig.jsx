import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp, xpProgress } from '../store'
import { NOVA, P, easeInOut, seg } from '../chapters'

// Where the lens sits at each chapter. The controller eases progress between
// chapters, so each swipe is one camera move between two of these marks.
const SHOTS = [
  { p: P.hero, pos: [0, 0.2, 17], look: [0, 0.2, 0], fov: 34 },
  { p: P.problem, pos: [-4.2, 1.2, 8.2], look: [0.6, 0.2, 0], fov: 46 },
  { p: P.void, pos: [-1.2, 0.85, 9.8], look: [0.3, -0.05, 0], fov: 42 },
  { p: P.collapse, pos: [3.6, 1.4, 11.5], look: [-0.6, 0, 0], fov: 32 },
  // the collapse and the explosion share one point, right of centre, where the card then appears
  { p: NOVA, pos: [-0.8, 0.0, 7.8], look: [-1.45, -0.4, 0], fov: 40 },
  { p: P.dawn, pos: [-1.0, -0.2, 6.9], look: [-1.55, -0.5, 0], fov: 40 },
  { p: P.everywhere, pos: [0, 0.75, 10.8], look: [0, -0.35, -1], fov: 44 },
  { p: P.cta, pos: [-2.1, 1.7, 8.8], look: [-2.4, 0.2, 0], fov: 42 },
]

// Phones are too narrow for side-by-side framing; centre the subject and keep text below it.
const MOBILE = {
  [P.hero]: { pos: [0, -0.6, 17.5], look: [0, -2.7, 0] },
  // the hole sits in the upper half, clear of the copy at the bottom
  [P.void]: { pos: [0, 1.0, 12.5], look: [0, -1.7, 0] },
  [P.collapse]: { pos: [0, 1.5, 11.5], look: [0, -1.3, 0] },
  [NOVA]: { pos: [0, 0.9, 9.2], look: [0, -0.5, 0] },
  [P.dawn]: { pos: [0, 0.9, 8.6], look: [0, -0.5, 0] },
  [P.cta]: { pos: [0, 1.0, 12.5], look: [0, -3.1, 0] },
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

    // The hero's print and reticle are composed around the copy; on short
    // screens the camera backs off so they keep clear of it.
    const hero = 1 - Math.min(1, p / (P.problem * 0.6))
    if (hero > 0 && !xp.mobile) {
      const back = 1 + (THREE.MathUtils.clamp(900 / state.size.height, 1, 1.35) - 1) * hero
      cam.position.sub(look).multiplyScalar(back).add(look)
    }

    // Shots are framed for widescreen; on tall screens, pull back so the
    // subject stays in frame, most for close-ups.
    const aspect = state.size.width / state.size.height
    const need = THREE.MathUtils.clamp(1.3 / aspect, 1, 2.4)
    if (need > 1) {
      const dist = cam.position.distanceTo(look)
      const pull = 1 + (need - 1) * THREE.MathUtils.clamp(6 / dist, 0.35, 1)
      cam.position.sub(look).multiplyScalar(pull).add(look)
    }

    // in the vortex the camera drifts with the flow, for parallax through the orbits
    const inVortex = 1 - Math.min(1, Math.abs(p - P.void) / ((P.collapse - P.void) * 0.75))
    if (inVortex > 0 && !xp.reduced) {
      const yaw = Math.sin(t * 0.11) * 0.16 * inVortex
      const c = Math.cos(yaw)
      const s = Math.sin(yaw)
      cam.position.set(cam.position.x * c + cam.position.z * s, cam.position.y, -cam.position.x * s + cam.position.z * c)
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
