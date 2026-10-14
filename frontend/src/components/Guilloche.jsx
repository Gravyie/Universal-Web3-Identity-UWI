import { useMemo } from 'react'
import { motion } from 'motion/react'

/*
 * Guilloché — the interlaced line-work printed on passports and banknotes to
 * make them hard to forge. Each band is a set of sine-modulated rings with
 * staggered phase; overlapping bands produce the woven rosette.
 */

function ringPath(radius, amplitude, lobes, phase, steps = 360) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const r = radius + amplitude * Math.sin(lobes * t + phase)
    const x = (r * Math.cos(t)).toFixed(2)
    const y = (r * Math.sin(t)).toFixed(2)
    d += `${i ? 'L' : 'M'}${x} ${y}`
  }
  return `${d}Z`
}

// A narrow phase spread bunches rings into ribbons; a wide one weaves a mesh.
function band({ radius, amplitude, lobes, count, spread = (Math.PI * 4) / lobes }) {
  return Array.from({ length: count }, (_, i) => ringPath(radius, amplitude, lobes, (i / count) * spread))
}

const ROSETTES = {
  seal: [
    { radius: 78, amplitude: 14, lobes: 9, count: 18 },
    { radius: 48, amplitude: 10, lobes: 12, count: 14 },
    { radius: 22, amplitude: 6, lobes: 7, count: 10 },
  ],
  card: [
    { radius: 82, amplitude: 8, lobes: 22, count: 16, spread: Math.PI },
    { radius: 58, amplitude: 9, lobes: 15, count: 14, spread: Math.PI },
    { radius: 33, amplitude: 7, lobes: 9, count: 10, spread: Math.PI },
  ],
  mark: [
    { radius: 70, amplitude: 22, lobes: 6, count: 6 },
    { radius: 34, amplitude: 10, lobes: 6, count: 4 },
  ],
}

export function Guilloche({
  variant = 'seal',
  className = '',
  strokeWidth = 0.35,
  draw = false,
  spin = true,
  opacity = 1,
}) {
  const paths = useMemo(
    () => ROSETTES[variant].flatMap((b, bi) => band(b).map((d, i) => ({ d, key: `${bi}-${i}`, bi }))),
    [variant],
  )

  return (
    <svg viewBox="-100 -100 200 200" className={className} fill="none" aria-hidden="true" style={{ opacity }}>
      <g className={spin ? 'animate-spin-slow origin-center' : ''} style={{ transformBox: 'fill-box' }}>
        {paths.map(({ d, key, bi }, i) =>
          draw ? (
            <motion.path
              key={key}
              d={d}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 - bi * 0.18 }}
              transition={{ duration: 2.4, delay: 0.2 + i * 0.025, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : (
            <path key={key} d={d} stroke="currentColor" strokeWidth={strokeWidth} opacity={1 - bi * 0.18} />
          ),
        )}
      </g>
    </svg>
  )
}
