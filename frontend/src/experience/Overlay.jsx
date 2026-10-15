import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowDown, ArrowRight, List, Pause, Play, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react'
import { CHAPTERS } from './chapters'
import { novaTime } from './store'
import { score } from './score'
import { LogoMark, Wordmark } from '../components/Logo'
import { HeroProof } from './HeroVisual'
import { useLiveStats } from '../hooks/useLiveStats'

const ease = [0.16, 1, 0.3, 1]

function Words({ text, className, wordClassName = '', delay = 0 }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <motion.span
          key={i}
          className={`inline-block whitespace-pre ${wordClassName}`}
          initial={{ opacity: 0, y: '0.55em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: delay + i * 0.05, ease }}
        >
          {w}{' '}
        </motion.span>
      ))}
    </span>
  )
}

const Sub = ({ children, delay = 0.35, className = '' }) => (
  <motion.p
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease }}
    className={`text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-white/70 ${className}`}
  >
    {children}
  </motion.p>
)

const H = 'text-[clamp(2.2rem,5.4vw,5rem)] leading-[1.02] font-semibold tracking-[-0.05em] text-white text-balance'

/** Fine corner brackets framing the hero like a scanner's viewport. */
function HudFrame() {
  const corner = 'absolute size-4 border-white/25'
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, delay: 0.3, ease }}
      className="pointer-events-none absolute inset-x-4 top-20 bottom-4 hidden sm:block"
    >
      <span className={`${corner} top-0 left-0 border-t border-l`} />
      <span className={`${corner} top-0 right-0 border-t border-r`} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} />
      <span className={`${corner} right-0 bottom-0 border-r border-b`} />
    </motion.div>
  )
}

/**
 * The landing's menu on phones: a full-screen sheet with the main links and
 * every chapter of the story, so any part is one tap away.
 */
function MobileMenu({ chapters }) {
  const [open, setOpen] = useState(false)
  const { index, mode, goTo, enterChapters } = chapters
  const jump = (i) => {
    setOpen(false)
    if (mode === 'page') enterChapters()
    goTo(i)
  }
  const links = [
    ['Get verified', '/app/verify'],
    ['Gates', '/app/gates'],
    ['Developers', '/app/developers'],
    ['Open the app', '/app'],
  ]
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Menu"
        className="grid size-9 place-items-center rounded-full border border-white/15 bg-black/50 md:bg-black/30 text-white md:backdrop-blur md:hidden"
      >
        <List className="size-[18px]" />
      </Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Content forceMount asChild aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-[#020306]/95 px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white md:backdrop-blur-xl"
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex h-12 items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <LogoMark className="size-5" />
                    <Wordmark />
                  </span>
                  <Dialog.Close aria-label="Close menu" className="grid size-9 place-items-center rounded-full border border-white/15 text-white">
                    <X className="size-[18px]" />
                  </Dialog.Close>
                </div>
                <nav aria-label="Main" className="mt-10 grid gap-1">
                  {links.map(([label, to], i) => (
                    <motion.div key={to} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease }}>
                      <Link to={to} onClick={() => setOpen(false)} className="group flex items-center justify-between border-b border-white/10 py-4 text-[28px] font-semibold tracking-[-0.04em]">
                        {label}
                        <ArrowRight className="size-5 text-white/40 transition-transform group-active:translate-x-1" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>
                <p className="mt-10 font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">The story</p>
                <ol className="mt-3 grid grid-cols-2 gap-x-4">
                  {CHAPTERS.map((c, i) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => jump(i)}
                        aria-current={i === index && mode === 'chapters' ? 'step' : undefined}
                        className="flex w-full items-baseline gap-2 py-2 text-left text-[15px] text-white/70 aria-[current=step]:text-white"
                      >
                        <span className="font-mono text-[11px] text-white/35">{String(i + 1).padStart(2, '0')}</span>
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

/** The conclusion: the call to act, over the galaxy of people already counted. */
function Finale({ onExplore }) {
  const { humans } = useLiveStats()
  return (
    <div className="absolute inset-x-0 bottom-[12vh] px-6 sm:px-10 md:top-1/2 md:bottom-auto md:-translate-y-1/2 lg:px-16">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase"
      >
        Every point of light is one person
      </motion.p>
      <h2 className="mt-5 max-w-xl text-[clamp(2.8rem,6.4vw,6rem)] leading-[0.94] font-semibold tracking-[-0.06em] text-white">
        <Words text="Be counted" delay={0.1} />
        <br />
        <Words text="once." delay={0.3} wordClassName="bg-gradient-to-r from-[#7fe3ff] via-[#b9a6ff] to-[#ff9ad5] bg-clip-text pb-[0.1em] text-transparent" />
      </h2>
      <Sub delay={0.55} className="mt-5 max-w-sm">
        {humans === undefined ? 'Join' : `Join ${humans.toLocaleString()} verified ${humans === 1 ? 'human' : 'humans'}`} on Hedera. Free, private, and about two minutes.
      </Sub>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease }} className="mt-9 flex flex-wrap gap-3">
        <Link to="/app/verify" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-black transition-transform active:scale-[0.98]">
          Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={onExplore}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[15px] text-white md:backdrop-blur transition-transform hover:bg-white/10 active:scale-[0.98]"
        >
          Explore UWI <ArrowDown className="size-4" />
        </button>
      </motion.div>
      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        className="mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.14em] text-white/40 uppercase max-sm:hidden"
      >
        <li>Passport read by Self</li>
        <li>Zero-knowledge proof</li>
        <li>Soulbound on Hedera</li>
      </motion.ul>
    </div>
  )
}

/** What each chapter says, and where on screen it says it. */
function Copy({ id, onPlay, onExplore }) {
  switch (id) {
    case 'hero':
      return (
        <div className="absolute inset-0">
          <HudFrame />
          {/* left rail */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 1.2 }}
            className="absolute top-1/2 left-7 hidden origin-left -translate-y-1/2 -rotate-90 font-mono text-[10.5px] tracking-[0.22em] whitespace-nowrap text-white/35 uppercase lg:block"
            style={{ translate: '0 4rem' }}
          >
            Proof of personhood · Hedera · N°000001
          </motion.p>
          {/* the base: headline left, action right */}
          <div className="absolute inset-x-0 bottom-0 grid items-end gap-7 px-6 pb-24 sm:px-10 md:grid-cols-[1fr_minmax(0,22rem)] md:gap-10 lg:px-16 lg:pb-20 [@media(max-height:560px)]:gap-4 [@media(max-height:560px)]:pb-20">
            <h1 className="text-[clamp(2.6rem,11vw,4rem)] leading-[0.9] font-semibold tracking-[-0.06em] text-white md:text-[clamp(3.4rem,6.6vw,7.4rem)] [@media(max-height:560px)]:text-[clamp(2rem,10vh,3rem)]">
              <Words text="Prove you're human" delay={0.15} />
              <br />
              <Words
                text="once."
                delay={0.4}
                wordClassName="bg-gradient-to-r from-[#7fe3ff] via-[#b9a6ff] to-[#ff9ad5] bg-clip-text pb-[0.1em] text-transparent"
              />
            </h1>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7, ease }} className="md:pb-3">
              <p className="text-[15px] leading-relaxed text-white/65 [@media(max-height:560px)]:hidden">
                Then use it everywhere. One private credential tells any app you're a unique person, and nothing else about you.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/app/verify"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-black transition-transform active:scale-[0.98]"
                >
                  Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={onPlay}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[15px] text-white md:backdrop-blur transition-transform hover:bg-white/10 active:scale-[0.98]"
                >
                  <Play weight="fill" className="size-3.5" /> Watch the story
                </button>
              </div>
              <HeroProof className="mt-6 hidden md:flex [@media(max-height:560px)]:!hidden" />
            </motion.div>
          </div>
        </div>
      )
    case 'problem':
      return (
        <div className="absolute inset-x-6 bottom-[13vh] grid items-end gap-6 sm:inset-x-10 md:grid-cols-[1fr_minmax(0,24rem)] lg:inset-x-16">
          <h2 className={H}>
            <Words text="Online, anyone can be" />
            <br />
            <Words text="a thousand people." delay={0.15} className="text-[#ff6b8a]" />
          </h2>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease }} className="md:pb-2">
            <p className="font-mono text-[11px] tracking-[0.18em] text-[#ff6b8a] uppercase">One script · a thousand claims</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              Airdrops, votes and rewards built on one wallet, one person are farmed by whoever writes the best bot. Real people get diluted.
            </p>
          </motion.div>
        </div>
      )
    case 'void':
      return (
        <div className="absolute inset-x-6 bottom-[12vh] text-center">
          <h2 className={H}>
            <Words text="So prove you're one." />
            <Words text=" Once." delay={0.2} className="text-[#ffb36b]" />
          </h2>
        </div>
      )
    case 'collapse':
      return (
        <div className="absolute right-6 bottom-[14vh] left-6 max-w-md sm:left-10 md:top-[22vh] md:right-auto md:bottom-auto lg:left-16">
          <Sub delay={0.1} className="text-[clamp(1.25rem,2vw,1.75rem)] !leading-snug text-white">
            Self reads your passport's chip on your phone and compresses it into a zero-knowledge proof.
          </Sub>
          <Sub delay={0.4} className="mt-4">
            Everything else collapses away.
          </Sub>
        </div>
      )
    case 'dawn':
      return (
        <div className="absolute bottom-[13vh] left-6 max-w-xl sm:left-10 lg:left-16">
          <h2 className={H}>
            <Words text="From the collapse," />
            <br />
            <Words text="one true thing." delay={0.15} className="text-[#ff9ad5]" />
          </h2>
          <Sub className="mt-4 max-w-md">Your documents never leave your hand. Only the proof does.</Sub>
        </div>
      )
    case 'everywhere':
      return (
        <div className="absolute inset-x-6 bottom-[9vh] text-center">
          <h2 className={H}>
            <Words text="One human. One credential." />
            <br />
            <Words text="Every app asks it." delay={0.2} className="text-[#7fe3ff]" />
          </h2>
          <Sub className="mx-auto mt-4 max-w-xl">
            Soulbound to your wallet, recoverable if you lose it. Airdrops, DAO votes, games and communities check the same card. No forms, no repeat KYC.
          </Sub>
        </div>
      )
    case 'cta':
      return <Finale onExplore={onExplore} />
    default:
      return null
  }
}

// The story's text and controls scroll away with the page: --story-fade runs 0..1 over the first half screen.
const fadeStyle = { opacity: 'calc(1 - var(--story-fade, 0))' }

export function Overlay({ chapters, revealed, faded }) {
  const { index, playing, goTo, play, enterPage } = chapters
  const sound = useSyncExternalStore(score.subscribe, () => score.on)
  // the supernova's light washes over the screen: a fast rise and a slow fall, on the explosion's clock
  const flash = useRef(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const t = novaTime()
      const v = t <= 0 || t > 3 ? 0 : t < 0.07 ? t / 0.07 : Math.exp(-(t - 0.07) * 3.2)
      if (flash.current) {
        flash.current.style.opacity = String(v * 0.6)
        // fully out of the compositor when invisible, so it never blends over the canvas
        flash.current.style.visibility = v > 0 ? 'visible' : 'hidden'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const id = CHAPTERS[index].id

  const toggleSound = () => (sound ? score.stop() : score.start())

  return (
    <>
      <motion.div
        aria-hidden="true"
        ref={flash}
        style={{ opacity: 0, visibility: 'hidden' }}
        className="pointer-events-none fixed inset-0 z-30 bg-[radial-gradient(circle_at_50%_50%,#fff,#e8f4ff_30%,#ffd1ec_60%,#9b7bff_90%)] md:mix-blend-screen"
      />

      <header className="fixed inset-x-0 top-0 z-50 flex h-[calc(4rem+env(safe-area-inset-top))] items-center justify-between gap-4 px-[max(1.25rem,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] sm:px-8">
        <Link to="/" onClick={() => goTo(0)} className="flex items-center gap-2.5 text-white" aria-label="UWI home">
          <LogoMark className="size-5" />
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 text-sm text-white/70 md:backdrop-blur-xl md:flex">
          <button type="button" onClick={() => goTo(1)} className="rounded-full px-4 py-1.5 hover:text-white">
            Why UWI
          </button>
          <Link to="/app/gates" className="rounded-full px-4 py-1.5 hover:text-white">
            Gates
          </Link>
          <Link to="/app/developers" className="rounded-full px-4 py-1.5 hover:text-white">
            Developers
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/app" className="flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-black">
            Open app
          </Link>
          <MobileMenu chapters={chapters} />
        </div>
      </header>

      {/* a soft floor of shade so the story's text always reads over bright scenes */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[15] h-[48vh] bg-gradient-to-t from-black/55 via-black/20 to-transparent"
        style={fadeStyle}
      />
      <div className={`pointer-events-none fixed inset-0 z-20 ${faded ? '[&_*]:!pointer-events-none' : ''}`} style={fadeStyle}>
        <AnimatePresence mode="wait">
          {revealed && (
            <motion.section
              key={id}
              aria-live="polite"
              className="pointer-events-auto absolute inset-0 [&>*]:pointer-events-auto"
              exit={{
                opacity: 0,
                filter: 'blur(8px)',
                transition: { duration: 0.35 },
              }}
              style={{ pointerEvents: 'none' }}
            >
              <Copy id={id} onPlay={play} onExplore={enterPage} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* chapter index */}
      <nav
        aria-label="Chapters"
        className={`fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 sm:flex ${faded ? 'pointer-events-none' : ''}`}
        style={fadeStyle}
      >
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={c.name}
            aria-current={i === index ? 'step' : undefined}
            className="group flex items-center gap-3 py-0.5"
          >
            <span
              className={`text-xs text-white transition-all duration-300 ${i === index ? 'opacity-80' : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'}`}
            >
              {c.name}
            </span>
            <span
              className={`h-px rounded-full bg-white transition-all duration-500 ${i === index ? 'w-8 opacity-100' : 'w-3 opacity-35 group-hover:opacity-70'}`}
            />
          </button>
        ))}
      </nav>

      {/* controls */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 ${faded ? 'pointer-events-none' : ''}`}
        style={fadeStyle}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={play}
            aria-label={playing ? 'Pause' : 'Play'}
            className="grid size-10 place-items-center rounded-full border border-white/15 bg-black/50 md:bg-black/30 text-white md:backdrop-blur hover:bg-white/10"
          >
            {playing ? <Pause weight="fill" className="size-3.5" /> : <Play weight="fill" className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Sound off' : 'Sound on'}
            className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/50 md:bg-black/30 px-3.5 text-xs text-white/80 md:backdrop-blur hover:bg-white/10"
          >
            {sound ? <SpeakerHigh weight="fill" className="size-4" /> : <SpeakerSlash className="size-4" />}
            <span className="hidden sm:inline">{sound ? 'Sound on' : 'Sound off'}</span>
          </button>
        </div>
        <AnimatePresence>
          {index === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2 }}
              className="flex items-center gap-2 text-xs text-white/55"
            >
              <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <ArrowDown className="size-3.5" />
              </motion.span>
              Swipe or scroll
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
