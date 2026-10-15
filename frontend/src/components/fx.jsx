import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react'

/**
 * A surface whose border and fill catch a soft light under the cursor.
 * Pointer tracking writes motion values, so React never re-renders on move.
 */
export function Spotlight({ as: Tag = 'div', className = '', children, ...props }) {
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const glow = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, var(--accent-soft), transparent 60%)`
  const ring = useMotionTemplate`radial-gradient(240px circle at ${x}px ${y}px, color-mix(in oklab, var(--accent) 55%, transparent), transparent 70%)`
  const M = motion[Tag] ?? motion.div
  return (
    <M
      {...props}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set(e.clientX - r.left)
        y.set(e.clientY - r.top)
      }}
      onPointerLeave={() => {
        x.set(-400)
        y.set(-400)
      }}
      className={`group/spot relative isolate overflow-hidden rounded-[20px] border border-line bg-surface ${className}`}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100" style={{ background: glow }} />
      {/* 1px ring lit only near the pointer, via a masked border box */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-300 [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] group-hover/spot:opacity-100"
        style={{ background: ring }}
      />
      {children}
    </M>
  )
}

/** Slow drifting light behind a section. Transform-only animation, blurred once. */
export function Aurora({ className = '' }) {
  const reduce = useReducedMotion()
  const blobs = [
    { c: 'var(--accent)', s: 'size-[38rem]', p: 'left-[8%] top-[-12%]', d: 26, o: 0.22 },
    { c: 'hsl(190 90% 60%)', s: 'size-[30rem]', p: 'right-[4%] top-[6%]', d: 32, o: 0.14 },
    { c: 'hsl(320 85% 65%)', s: 'size-[26rem]', p: 'left-[38%] top-[30%]', d: 38, o: 0.12 },
  ]
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[90px] ${b.s} ${b.p}`}
          style={{ background: b.c, opacity: b.o }}
          animate={reduce ? undefined : { x: [0, 60, -40, 0], y: [0, -40, 30, 0], scale: [1, 1.08, 0.95, 1] }}
          transition={{ duration: b.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/** A perspective grid floor that recedes to the horizon and slowly flows toward you. */
export function GridFloor({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 h-[55%] overflow-hidden [perspective:600px] ${className}`}>
      <div
        className="absolute inset-x-[-50%] bottom-[-10%] h-[200%] origin-bottom [transform:rotateX(72deg)] motion-safe:animate-[grid-flow_6s_linear_infinite]"
        style={{
          backgroundImage: 'linear-gradient(var(--line-strong) 1px, transparent 1px), linear-gradient(90deg, var(--line-strong) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(to top, #000 10%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to top, #000 10%, transparent 70%)',
        }}
      />
    </div>
  )
}

/** The UWI mark as a 3D object: a ring and three orbits turning in space. */
export function Orbits({ className = '', speed = 40 }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const rings = [0, 60, -60]
  return (
    <div ref={ref} aria-hidden="true" className={`[perspective:900px] ${className}`}>
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        initial={{ rotateX: 62, rotateZ: 0 }}
        animate={reduce ? { rotateX: 62 } : { rotateX: 62, rotateZ: 360 }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border border-line-strong" />
        {rings.map((deg) => (
          <div key={deg} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `rotateZ(${deg}deg)` }}>
            <div className="absolute inset-0 rounded-full border border-accent/40 [transform:rotateX(70deg)]" />
          </div>
        ))}
        <div className="absolute top-1/2 left-1/2 size-3 -translate-1/2 rounded-full bg-accent shadow-[0_0_24px_var(--accent)]" />
      </motion.div>
    </div>
  )
}
