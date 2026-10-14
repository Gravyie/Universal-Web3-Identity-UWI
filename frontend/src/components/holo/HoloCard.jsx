import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { CircleDashed, SealCheck, Flask } from '@phosphor-icons/react'
import { FOILS, Follow, Kick, Orientation, applyFoil, applyFrame, fromPointer } from './engine'
import { hueFor, printFor } from './print'
import { useTheme } from '../../theme/ThemeProvider'
import { LogoMark } from '../Logo'
import { padTokenId, shortAddress } from '../../lib/format'

const STATUS = {
  self: { icon: SealCheck, label: 'Verified human' },
  demo: { icon: Flask, label: 'Verified human (demo)' },
  pending: { icon: CircleDashed, label: 'Awaiting proof' },
}

/**
 * The UWI credential as a physical object. Tilt it with the pointer, or the
 * phone itself on mobile; the foil follows the light and the security pattern
 * rises on the side you turned. `seed` (the holder's address) picks the card's
 * colour and the print on the tile.
 */
export const HoloCard = forwardRef(function HoloCard(
  { username, address, tokenId, issuedAt, proof = 'pending', foil: foilKey, interactive = true, className = '', label },
  ref,
) {
  const hostRef = useRef(null)
  const cardRef = useRef(null)
  const { finish } = useTheme()
  const foil = FOILS[foilKey ?? finish] ?? FOILS.holo
  useImperativeHandle(ref, () => cardRef.current)

  useEffect(() => {
    if (cardRef.current) applyFoil(cardRef.current, foil)
  }, [foil])

  useEffect(() => {
    const host = hostRef.current
    const card = cardRef.current
    if (!host || !card) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tilt = new Follow(0.12)
    const sheet = new Follow(0.07)
    const kick = new Kick()
    const orient = new Orientation()
    const t0 = performance.now()
    let raf = 0
    let running = false
    let onScreen = false
    let touched = false
    let idle = Math.random() * 10
    let aim = { x: 0, y: 0 }

    // Reduced motion: hold a gentle static angle so the foil is still visible.
    if (reduced || !interactive) {
      applyFrame(card, { x: 0.35, y: -0.2 }, { x: 0.35, y: -0.2 }, foil)
      return
    }

    const frame = () => {
      raf = 0
      if (!touched) {
        idle += 0.0045
        tilt.target = { x: Math.sin(idle) * 0.32, y: Math.cos(idle * 0.73) * 0.22 }
      } else {
        tilt.target = aim
      }
      const k = kick.step()
      tilt.target = { x: tilt.target.x + k.x, y: tilt.target.y + k.y }
      tilt.step()
      sheet.target = tilt.value
      sheet.step()
      applyFrame(card, tilt.value, sheet.value, foil, {
        speed: sheet.speed,
        velocity: sheet.velocity,
        time: (performance.now() - t0) / 1000,
      })
      if (running) raf = requestAnimationFrame(frame)
    }

    const sync = () => {
      const should = onScreen && !document.hidden
      if (should === running) return
      running = should
      if (should && !raf) raf = requestAnimationFrame(frame)
      if (!should && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const onPointer = (e) => {
      if (e.pointerType === 'touch') return
      aim = fromPointer(host.getBoundingClientRect(), e.clientX, e.clientY)
      touched = true
    }
    const onLeave = () => {
      touched = false
      kick.fire(tilt.velocity)
    }
    const onOrient = (e) => {
      const v = orient.read(e)
      if (!v) return
      aim = v
      touched = true
    }
    // iOS needs a user gesture before it hands out device orientation.
    const askOrientation = () => {
      const DOE = window.DeviceOrientationEvent
      if (typeof DOE?.requestPermission === 'function') DOE.requestPermission().catch(() => {})
    }

    const io = new IntersectionObserver((es) => {
      onScreen = es.some((e) => e.isIntersecting)
      sync()
    })
    io.observe(host)
    document.addEventListener('visibilitychange', sync)
    host.addEventListener('pointermove', onPointer)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointerdown', askOrientation, { once: true })
    window.addEventListener('deviceorientation', onOrient)

    return () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
      host.removeEventListener('pointermove', onPointer)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', askOrientation)
      window.removeEventListener('deviceorientation', onOrient)
    }
  }, [foil, interactive])

  const seed = address ?? username ?? ''
  const hue = hueFor(seed)
  const status = STATUS[proof] ?? STATUS.pending
  const Icon = status.icon
  const name = username?.trim() || 'your_name'
  const issued = issuedAt
    ? new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(issuedAt))
    : 'Not issued'

  return (
    <div ref={hostRef} className={`[perspective:1100px] ${className}`}>
      <div
        ref={cardRef}
        role="img"
        aria-label={label ?? `UWI credential for @${name}, ${status.label.toLowerCase()}`}
        className="holo-card"
        style={{
          '--hue': hue,
          '--tile-src': printFor(seed),
          '--tile-dark': `hsl(${(hue + 200) % 360} 62% 34%)`,
          '--tile-light': `hsl(${(hue + 30) % 360} 80% 74%)`,
          '--tile-hue': `${(hue + 160) % 360}deg`,
        }}
      >
        <div className="holo-body" />
        <div className="holo-pattern" />
        <div className="holo-pattern--lit" />
        <div className="holo-foil" />
        <div className="holo-foil--b" />
        <div className="holo-foil--c" />
        <div className="holo-smear" />
        <div className="holo-spot" />
        <div className="holo-noise" />
        <div className="holo-glare" />
        <div className="holo-sheen" />

        <div className="holo-content">
          <div className="holo-emboss flex items-center gap-[1.6cqw]">
            <LogoMark className="size-[5.6cqw]" />
            <div className="leading-none">
              <div className="text-[3.5cqw] font-semibold tracking-[-0.03em]">UWI</div>
              <div className="mt-[0.7cqw] font-mono text-[1.55cqw] tracking-[0.16em] uppercase opacity-70">
                Proof of personhood
              </div>
            </div>
          </div>

          <div />

          <div className="holo-emboss min-w-0 self-end">
            <div className={`truncate text-[7.2cqw] leading-[1.05] font-semibold tracking-[-0.035em] ${username ? '' : 'opacity-40'}`}>
              @{name}
            </div>
            <div className="mt-[1.2cqw] flex items-center gap-[1cqw] text-[2.3cqw] font-medium">
              <Icon weight="fill" className="size-[2.8cqw] shrink-0" />
              {status.label}
            </div>
            <div className="mt-[2.4cqw] grid grid-cols-3 gap-[2cqw] font-mono text-[1.75cqw] leading-tight opacity-75">
              <div>
                <div className="opacity-60">NO.</div>
                <div>{tokenId ? padTokenId(tokenId) : '------'}</div>
              </div>
              <div>
                <div className="opacity-60">ISSUED</div>
                <div className="truncate">{issued}</div>
              </div>
              <div className="min-w-0">
                <div className="opacity-60">HOLDER</div>
                <div className="truncate">{address ? shortAddress(address, 4, 4) : '0x...'}</div>
              </div>
            </div>
          </div>

          <div className="holo-tile">
            <div className="holo-tile__print" />
            <div className="holo-tile__print--neg" />
            <div className="holo-tile__duo" />
            <div className="holo-tile__tone" />
            <div className="holo-tile__foil" />
            <div className="holo-tile__grain" />
            <div className="holo-tile__gloss" />
          </div>
        </div>
      </div>
    </div>
  )
})
