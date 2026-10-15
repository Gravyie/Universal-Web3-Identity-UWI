import * as THREE from 'three'
import { ridgePoint, ridgesFor } from '../../components/holo/print'
import { HERO_CARD } from '../heroCard'

// Where the hero print sits in the world, and its height in world units.
export const PRINT_POS = [0, 1.45, 0]
export const PRINT_HEIGHT = 3.9 // nominal box height; the ridges' stretch makes the print itself taller

/**
 * Points along @you's print ridges (the same geometry as the card tile), in
 * the print's local space. Each point carries its ridge index and position
 * along the ridge so shaders can run light through the print.
 */
export function samplePrint(count, width = 0.32) {
  const print = ridgesFor(HERO_CARD.address)
  const k = PRINT_HEIGHT / 116
  const twist = (-print.twist * Math.PI) / 180
  const cos = Math.cos(twist)
  const sin = Math.sin(twist)
  const lengths = print.ridges.map((r) => r.r * (Math.PI * 2 - r.gap))
  const total = lengths.reduce((a, b) => a + b, 0)
  const position = new Float32Array(count * 3)
  const u = new Float32Array(count)
  const ridge = new Float32Array(count)
  let n = 0
  let radius = 0
  print.ridges.forEach((rd, ri) => {
    const m = ri === print.ridges.length - 1 ? count - n : Math.round((lengths[ri] / total) * count)
    for (let j = 0; j < m; j++, n++) {
      const t = Math.random()
      const [x0, y0] = ridgePoint(print, rd, t)
      // ridges have width: jitter across each one, densest on the centre line
      const [x1, y1] = ridgePoint(print, rd, Math.min(1, t + 0.002))
      const nx = -(y1 - y0)
      const ny = x1 - x0
      const nl = Math.hypot(nx, ny) || 1
      const w = (Math.random() + Math.random() - 1) * width
      const sx = x0 + (nx / nl) * w - 50
      const sy = -(y0 + (ny / nl) * w - 58)
      position[n * 3] = (sx * cos - sy * sin) * k
      position[n * 3 + 1] = (sx * sin + sy * cos) * k
      position[n * 3 + 2] = (Math.random() - 0.5) * 0.08
      radius = Math.max(radius, Math.hypot(position[n * 3], position[n * 3 + 1]))
      u[n] = t
      ridge[n] = rd.i / print.ridges.length
    }
  })
  return { position, u, ridge, ridges: print.ridges.length, radius }
}

/** The same points placed in the world, for things that are born from the print. */
export function printWorldPoints(count) {
  const { position } = samplePrint(count, 0.2)
  const out = []
  for (let i = 0; i < count; i++) out.push(new THREE.Vector3(position[i * 3] + PRINT_POS[0], position[i * 3 + 1] + PRINT_POS[1], position[i * 3 + 2] + PRINT_POS[2]))
  return out
}
