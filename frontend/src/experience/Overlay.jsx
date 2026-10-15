import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useTransform } from 'motion/react'
import { ArrowDown, ArrowRight, Pause, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { CHAPTERS, NOVA } from './chapters'
import { xpProgress } from './store'
import { score } from './score'
import { LogoMark } from '../components/Logo'
import { HeroProof } from './HeroVisual'

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

/** What each chapter says, and where on screen it says it. */
function Copy({ id, onPlay, onExplore }) {
  switch (id) {
    case 'hero':
      return (
        <div className="absolute inset-0 flex flex-col justify-end px-6 pt-20 pb-24 sm:px-10 md:justify-center md:pb-10 lg:px-16">
          <div className="max-w-[min(46rem,52vw)] max-md:max-w-none">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease }}
              className="flex items-center gap-2.5 text-[13px] text-white/60"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative size-1.5 rounded-full bg-emerald-400" />
              </span>
              Proof of personhood, live on Hedera
            </motion.p>
            <h1 className="mt-5 text-[clamp(2.7rem,11vw,4rem)] leading-[0.94] font-semibold tracking-[-0.055em] text-white md:text-[clamp(3.4rem,6.4vw,6.6rem)]">
              <Words text="Prove you're human" delay={0.35} />
              <br />
              <Words text="once." delay={0.6} wordClassName="bg-gradient-to-r from-[#7fe3ff] via-[#b9a6ff] to-[#ff9ad5] bg-clip-text pb-[0.08em] text-transparent" />
            </h1>
            <Sub delay={0.85} className="mt-6 max-w-[30rem]">
              Then use it everywhere. One private credential tells any app you're a unique person, and nothing else about you.
            </Sub>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.05, ease }} className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/app/verify" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-black transition-transform active:scale-[0.98]">
                Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button type="button" onClick={onPlay} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[15px] text-white backdrop-blur transition-transform hover:bg-white/10 active:scale-[0.98]">
                <Play weight="fill" className="size-3.5" /> Watch the story
              </button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.3 }} className="mt-12 hidden border-t border-white/10 pt-6 md:block">
              <HeroProof />
            </motion.div>
          </div>
        </div>
      )
    case 'many':
      return (
        <div className="absolute bottom-[14vh] left-6 max-w-3xl sm:left-10 lg:left-16">
          <h2 className={H}>
            <Words text="Online, anyone can be" />
            <br />
            <Words text="a thousand people." delay={0.15} className="text-[#ff6b8a]" />
          </h2>
        </div>
      )
    case 'farmed':
      return (
        <div className="absolute top-1/2 right-6 max-w-xl -translate-y-1/2 text-right sm:right-24 lg:right-44">
          <h2 className={H}>
            <Words text="One script." />
            <br />
            <Words text="A thousand claims." delay={0.15} />
          </h2>
          <Sub className="ml-auto max-w-sm">Airdrops, votes and rewards built on one wallet, one person are farmed by whoever writes the best bot.</Sub>
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
        <div className="absolute top-[22vh] left-6 max-w-md sm:left-10 lg:left-16">
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
    case 'card':
      return (
        <div className="absolute right-6 bottom-[13vh] left-6 max-w-md md:top-1/2 md:bottom-auto md:left-auto md:-translate-y-1/2 md:text-right lg:right-56">
          <h2 className="text-[clamp(2rem,4.2vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.05em] text-white">
            <Words text="One human." />
            <br />
            <Words text="One credential." delay={0.15} className="text-white/50" />
          </h2>
          <Sub className="mt-4">Soulbound to your wallet. A username and a hash. Recoverable if you lose the wallet.</Sub>
        </div>
      )
    case 'everywhere':
      return (
        <div className="absolute inset-x-6 bottom-[11vh] text-center">
          <h2 className={H}>
            <Words text="Every app asks." />
            <Words text=" One answer." delay={0.15} className="text-[#7fe3ff]" />
          </h2>
          <Sub className="mx-auto mt-4 max-w-lg">Airdrops, DAO votes, games and communities check the same credential. No forms, no repeat KYC.</Sub>
        </div>
      )
    case 'cta':
      return (
        <div className="absolute inset-x-0 bottom-[14vh] px-6 sm:px-10 md:top-1/2 md:bottom-auto md:-translate-y-1/2 lg:px-16">
          <h2 className="max-w-xl text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-white">
            <Words text="Be counted" />
            <br />
            <Words text="once." delay={0.15} className="text-white/45" />
          </h2>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease }} className="mt-9 flex flex-wrap gap-3">
            <Link to="/app/verify" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-black">
              Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button type="button" onClick={onExplore} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-[15px] text-white backdrop-blur hover:bg-white/10">
              Explore UWI <ArrowDown className="size-4" />
            </button>
          </motion.div>
        </div>
      )
    default:
      return null
  }
}

export function Overlay({ chapters }) {
  const { index, mode, playing, goTo, play, enterPage } = chapters
  const sound = useSyncExternalStore(score.subscribe, () => score.on)
  const flash = useTransform(xpProgress, [NOVA - 0.004, NOVA + 0.001, NOVA + 0.02], [0, 0.32, 0])
  const id = CHAPTERS[index].id

  const toggleSound = () => (sound ? score.stop() : score.start())

  return (
    <>
      <motion.div aria-hidden="true" style={{ opacity: flash }} className="pointer-events-none fixed inset-0 z-30 bg-[radial-gradient(circle_at_50%_50%,#fff,#ffd1ec_35%,#9b7bff_75%,transparent)] mix-blend-screen" />

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" onClick={() => goTo(0)} className="flex items-center gap-2 text-white" aria-label="UWI home">
          <LogoMark className="size-5" />
          <span className="font-semibold tracking-[-0.04em]">UWI</span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 text-sm text-white/70 backdrop-blur-xl md:flex">
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
        <Link to="/app" className="flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-black">
          Open app
        </Link>
      </header>

      <div className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-500 ${mode === 'page' ? 'opacity-0' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.section
            key={id}
            aria-live="polite"
            className="pointer-events-auto absolute inset-0 [&>*]:pointer-events-auto"
            exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.35 } }}
            style={{ pointerEvents: 'none' }}
          >
            <Copy id={id} onPlay={play} onExplore={enterPage} />
          </motion.section>
        </AnimatePresence>
      </div>

      {/* chapter index */}
      <nav
        aria-label="Chapters"
        className={`fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 transition-opacity duration-500 sm:flex ${mode === 'page' ? 'pointer-events-none opacity-0' : ''}`}
      >
        {CHAPTERS.map((c, i) => (
          <button key={c.id} type="button" onClick={() => goTo(i)} aria-label={c.name} aria-current={i === index ? 'step' : undefined} className="group flex items-center gap-3 py-0.5">
            <span className={`text-xs text-white transition-all duration-300 ${i === index ? 'opacity-80' : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'}`}>{c.name}</span>
            <span className={`h-px rounded-full bg-white transition-all duration-500 ${i === index ? 'w-8 opacity-100' : 'w-3 opacity-35 group-hover:opacity-70'}`} />
          </button>
        ))}
      </nav>

      {/* controls */}
      <div className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between px-5 pb-5 transition-opacity duration-500 sm:px-8 ${mode === 'page' ? 'pointer-events-none opacity-0' : ''}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={play}
            aria-label={playing ? 'Pause' : 'Play'}
            className="grid size-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur hover:bg-white/10"
          >
            {playing ? <Pause weight="fill" className="size-3.5" /> : <Play weight="fill" className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Sound off' : 'Sound on'}
            className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3.5 text-xs text-white/80 backdrop-blur hover:bg-white/10"
          >
            {sound ? <SpeakerHigh weight="fill" className="size-4" /> : <SpeakerSlash className="size-4" />}
            <span className="hidden sm:inline">{sound ? 'Sound on' : 'Sound off'}</span>
          </button>
        </div>
        <AnimatePresence>
          {index === 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.2 }} className="flex items-center gap-2 text-xs text-white/55">
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
