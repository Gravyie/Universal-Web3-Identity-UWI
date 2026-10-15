import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { CheckCircle, Fingerprint, GasPump, Files } from '@phosphor-icons/react'
import { HoloCard } from '../holo/HoloCard'

const DECK = [
  { username: 'kwame_osei', address: '0x51c2a9f8e6d4b3a1c7e9f0d2b4a6c8e0f1a3b5d7', tokenId: 128, proof: 'self', issuedAt: Date.UTC(2026, 7, 2) },
  { username: 'mei_tanaka', address: '0x93ab1e7c5d2f8a6b4c0e9d1f3a5b7c9e2d4f6a80', tokenId: 77, proof: 'self', issuedAt: Date.UTC(2026, 8, 19) },
  { username: 'ada_lovelace', address: '0x7a3F1c9E0b5D2A8e4C6f1B3d9E7a2C5b8D0e4F61', tokenId: 42, proof: 'self', issuedAt: Date.UTC(2026, 9, 14) },
]

// Little proofs of what UWI does, floating at different depths around the deck.
const CHIPS = [
  { icon: CheckCircle, text: 'isVerifiedHuman() → true', pos: 'left-[-4%] top-[-14%]', depth: 60, delay: 0.9 },
  { icon: Fingerprint, text: 'nullifier 0x2f9c...e41a', pos: 'right-[-3%] top-[-14%]', depth: 30, delay: 1.05 },
  { icon: Files, text: 'Documents stored: 0', pos: 'left-[0%] bottom-[-13%]', depth: 90, delay: 1.2 },
  { icon: GasPump, text: 'Gas you paid: 0 HBAR', pos: 'right-[-4%] bottom-[-13%]', depth: 45, delay: 1.35 },
]

/**
 * Three credentials in a perspective stack. The pointer tilts the whole scene
 * and parallaxes the floating chips by depth; scrolling fans the deck open.
 */
export function HeroScene() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 90, damping: 18, mass: 0.6 }
  const rotY = useSpring(useTransform(px, [-1, 1], [-7, 7]), spring)
  const rotX = useSpring(useTransform(py, [-1, 1], [6, -6]), spring)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const fan = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  const backX = useTransform(fan, [0, 1], [-22, -120])
  const backR = useTransform(fan, [0, 1], [-9, -20])
  const midX = useTransform(fan, [0, 1], [-11, -60])
  const midR = useTransform(fan, [0, 1], [-4.5, -10])

  const onMove = (e) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={() => (px.set(0), py.set(0))} className="relative [perspective:1600px]">
      <motion.div style={{ rotateX: rotX, rotateY: rotY }} className="relative [transform-style:preserve-3d]">
        {/* back cards */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ x: backX, rotate: backR, z: -140 }}
          aria-hidden="true"
          className="absolute inset-0 origin-bottom-left opacity-90 [transform-style:preserve-3d]"
        >
          <HoloCard {...DECK[0]} interactive={false} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
          style={{ x: midX, rotate: midR, z: -70 }}
          className="absolute inset-0 origin-bottom-left [transform-style:preserve-3d]"
        >
          <HoloCard {...DECK[1]} interactive={false} />
        </motion.div>
        {/* front card: the interactive one */}
        <motion.div
          initial={{ opacity: 0, y: 80, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.3, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <HoloCard {...DECK[2]} label="Example UWI credential for @ada_lovelace. Move the pointer over it, or tilt your phone." />
        </motion.div>

        {CHIPS.map((c, i) => (
          <Chip key={c.text} chip={c} px={px} py={py} index={i} />
        ))}
      </motion.div>
      {/* contact shadow */}
      <div aria-hidden="true" className="absolute inset-x-[12%] -bottom-12 h-14 rounded-[50%] bg-black/25 blur-2xl dark:bg-black/70" />
    </div>
  )
}

function Chip({ chip, px, py, index }) {
  const x = useTransform(px, (v) => v * chip.depth * 0.35)
  const y = useTransform(py, (v) => v * chip.depth * 0.35)
  const Icon = chip.icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: chip.delay, type: 'spring', stiffness: 220, damping: 18 }}
      style={{ x, y, z: chip.depth }}
      className={`absolute ${chip.pos} ${index > 0 ? 'hidden sm:flex' : 'flex'} items-center gap-2 rounded-full border border-white/40 bg-white/55 px-3 py-1.5 font-mono text-[11.5px] text-zinc-800 shadow-[0_8px_30px_-8px_rgb(0_0_0/0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/55 dark:text-zinc-100`}
    >
      <Icon weight="duotone" className="size-4 text-accent" />
      {chip.text}
    </motion.div>
  )
}
