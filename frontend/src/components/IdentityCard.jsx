import { forwardRef } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { BadgeCheck, CircleDashed, PenLine } from 'lucide-react'
import { Guilloche } from './Guilloche'
import { LogoMark } from './Logo'
import { buildMrz, formatDate, padTokenId, shortAddress } from '../lib/format'

const STATUS = {
  draft: { label: 'Draft', icon: PenLine, cls: 'border-line-strong bg-bg-elev text-muted' },
  pending: { label: 'Awaiting proof', icon: CircleDashed, cls: 'border-dashed border-line-strong bg-bg-elev text-ink-2' },
  verified: {
    label: 'Verified human',
    icon: BadgeCheck,
    cls: 'border-accent/40 bg-bg-elev text-accent shadow-[inset_0_0_0_100px_var(--accent-soft)]',
  },
}

/**
 * The UWI credential. Sized with container query units so the whole card
 * scales as one object from a 280px phone column to a 560px hero.
 */
export const IdentityCard = forwardRef(function IdentityCard(
  { username, address, tokenId, issuedAt, status = 'draft', demo = false, interactive = true, className = '' },
  ref,
) {
  const reduce = useReducedMotion()
  const tilt = interactive && !reduce

  const hover = useSpring(0, { stiffness: 120, damping: 20 })
  const holoOpacity = useTransform(hover, [0, 1], [0, 0.16])
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 180, damping: 20, mass: 0.6 }
  const rotateX = useSpring(useTransform(py, [0, 1], [9, -9]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-12, 12]), spring)
  const glareX = useTransform(px, (v) => `${v * 100}%`)
  const glareY = useTransform(py, (v) => `${v * 100}%`)
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.22), transparent 45%)`
  const holoAngle = useTransform(px, [0, 1], [0, 220])
  const holo = useMotionTemplate`conic-gradient(from ${holoAngle}deg at 70% 40%, #ff9ad5, #9ad9ff, #b6ffa8, #ffe79a, #ff9ad5)`

  const onMove = (e) => {
    if (!tilt) return
    hover.set(1)
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    hover.set(0)
    px.set(0.5)
    py.set(0.5)
  }

  const s = STATUS[status]
  const StatusIcon = s.icon
  const shownName = username?.trim() || 'your_name'
  const [mrz1, mrz2] = buildMrz({ username: shownName, address, tokenId })

  return (
    <div className={`[perspective:1400px] ${className}`}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={tilt ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
        className="relative will-change-transform"
      >
        <div
          ref={ref}
          className="@container relative aspect-[1.586] w-full overflow-hidden rounded-[4.5cqw] border border-line-strong bg-bg-elev text-ink shadow-card"
          style={{ containerType: 'inline-size' }}
        >
          {/* Paper: accent wash + fine line field */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 100% 0%, var(--accent-soft), transparent 55%), radial-gradient(80% 80% at 0% 100%, var(--accent-soft), transparent 60%)',
            }}
          />
          <svg className="absolute inset-0 size-full text-ink opacity-[0.06]" aria-hidden="true">
            <defs>
              <pattern id="uwi-lines" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#uwi-lines)" />
          </svg>

          {/* Security seal */}
          <div className="absolute top-1/2 -right-[14%] aspect-square w-[62%] -translate-y-1/2 text-accent">
            <Guilloche variant="card" strokeWidth={0.22} opacity={0.6} />
          </div>

          {/* Microprint along the top edge */}
          <div className="absolute inset-x-0 top-0 overflow-hidden border-b border-line px-[4cqw] py-[0.6cqw] font-mono text-[1.35cqw] leading-none tracking-[0.3em] whitespace-nowrap text-muted/70 uppercase">
            {'UNIVERSAL·WEB3·IDENTITY·SOULBOUND·NON·TRANSFERABLE·ZERO·KNOWLEDGE·'.repeat(4)}
          </div>

          <div className="relative flex h-full flex-col px-[5.5cqw] pt-[6.5cqw] pb-[4cqw]">
            {/* Header */}
            <div className="flex items-start justify-between gap-[3cqw]">
              <div className="flex items-center gap-[1.8cqw]">
                <span className="text-accent">
                  <LogoMark className="size-[6.2cqw]" />
                </span>
                <div className="leading-none">
                  <div className="text-[3.6cqw] font-semibold tracking-[-0.03em]">UWI</div>
                  <div className="mt-[0.8cqw] font-mono text-[1.6cqw] tracking-[0.18em] text-muted uppercase">
                    Proof of personhood
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-[1cqw]">
                <span
                  className={`inline-flex items-center gap-[1cqw] rounded-full border px-[2cqw] py-[0.9cqw] font-mono text-[1.7cqw] tracking-[0.12em] uppercase ${s.cls}`}
                >
                  <StatusIcon className="size-[2.4cqw]" strokeWidth={2.2} />
                  {s.label}
                </span>
                {demo && (
                  <span className="rounded-full border border-warn/40 px-[1.6cqw] py-[0.5cqw] font-mono text-[1.4cqw] tracking-[0.12em] text-warn uppercase">
                    Demo proof
                  </span>
                )}
              </div>
            </div>

            {/* Holder */}
            <div className="mt-auto">
              <div className="font-mono text-[1.6cqw] tracking-[0.2em] text-muted uppercase">Holder</div>
              <div
                className={`mt-[0.6cqw] truncate font-display text-[8.6cqw] leading-[0.95] tracking-[-0.01em] ${username?.trim() ? '' : 'text-muted/50'}`}
              >
                <span className="text-muted/60 italic">@</span>
                {shownName}
              </div>
              <div className="mt-[1cqw] font-mono text-[2cqw] text-ink-2">
                {address ? shortAddress(address, 8, 6) : '0x0000…000000'}
              </div>
            </div>

            {/* Fields */}
            <dl className="mt-[3.2cqw] grid grid-cols-3 gap-[2cqw] border-t border-line pt-[2.2cqw]">
              {[
                ['Token №', tokenId ? padTokenId(tokenId) : '——————'],
                ['Issued', issuedAt ? formatDate(issuedAt) : '——'],
                ['Network', 'Hedera · 296'],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="font-mono text-[1.45cqw] tracking-[0.18em] text-muted uppercase">{k}</dt>
                  <dd className="mt-[0.5cqw] truncate font-mono text-[2.1cqw] text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            {/* Machine readable zone */}
            <div className="mt-[2.2cqw] font-mono text-[2.05cqw] leading-[1.35] tracking-[0.16em] text-ink-2/70 select-none">
              <div className="truncate">{mrz1}</div>
              <div className="truncate">{mrz2}</div>
            </div>
          </div>

          {/* Holographic foil + glare follow the pointer */}
          {tilt && (
            <>
              <motion.div
                className="pointer-events-none absolute inset-0 mix-blend-color-dodge"
                style={{ background: holo, opacity: holoOpacity }}
              />
              <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare, opacity: hover }} />
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
})
