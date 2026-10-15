import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValueEvent, useTransform } from 'motion/react'
import { useLenis } from 'lenis/react'
import { ArrowRight, ArrowCounterClockwise, Pause, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { film, filmProgress } from './store'
import { ACTS, CUES, actAt, timecode } from './timeline'
import { score } from './score'
import { LogoMark } from '../components/Logo'

const FILM_SECONDS = 95 // autoplay length, start to finish

function Cue({ cue }) {
  const [a, b] = cue.at
  const f = Math.min(0.012, (b - a) / 4)
  const opacity = useTransform(filmProgress, [a, a + f, b - f, b], [0, 1, 1, 0])
  const y = useTransform(filmProgress, [a, a + f, b - f, b], [24, 0, 0, -16])
  const blur = useTransform(filmProgress, [a, a + f, b - f, b], ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'])

  if (cue.kind === 'title') {
    return (
      <motion.div style={{ opacity, y, filter: blur }} className="pointer-events-none fixed inset-0 z-20 grid place-items-center px-6 text-center">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(45%_35%_at_50%_50%,rgb(2_3_6/0.72),transparent)]" />
        <div className="relative">
          {cue.eyebrow && <p className="font-mono text-[11px] tracking-[0.4em] text-cyan-200/70 uppercase">{cue.eyebrow}</p>}
          <h2 className="mt-4 text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.95] font-semibold tracking-[-0.05em] text-white">{cue.text}</h2>
          {cue.sub && <p className="mt-2 text-[clamp(2.4rem,7vw,6.5rem)] leading-[0.95] font-semibold tracking-[-0.05em] text-white/40">{cue.sub}</p>}
        </div>
      </motion.div>
    )
  }
  return (
    <motion.p
      style={{ opacity, y, filter: blur }}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bar)+2.5rem)] z-20 mx-auto max-w-3xl px-6 text-center text-[clamp(1.15rem,2.2vw,1.65rem)] leading-snug font-medium text-balance text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.9)]"
    >
      {cue.text}
    </motion.p>
  )
}

/**
 * Everything that sits on the glass: letterbox bars, the HUD (act, timecode,
 * transport), title cards, subtitles and the finale. Driven by `filmProgress`,
 * which the 3D camera rig updates each frame, so text and picture stay in sync.
 */
export function FilmOverlay({ trackRef }) {
  const lenis = useLenis()
  const [act, setAct] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState(false)
  const [ended, setEnded] = useState(false)
  const tcRef = useRef(null)

  const bar = useTransform(filmProgress, [0, 0.012, 0.965, 0.99], [0, 1, 1, 0])
  const flash = useTransform(filmProgress, [0.925, 0.95, 0.985], [0, 1, 0])
  const progressScale = useTransform(filmProgress, [0, 1], [0, 1])
  const finale = useTransform(filmProgress, [0.955, 0.985], [0, 1])

  useMotionValueEvent(filmProgress, 'change', (p) => {
    if (tcRef.current) tcRef.current.textContent = timecode(p)
    const next = actAt(p)
    if (next !== act) {
      setAct(next)
      score.whoosh()
      if (ACTS[next].id === 'finale') score.hit()
    }
    score.setIntensity(Math.min(1, p * 1.2))
    const isEnd = p > 0.955
    if (isEnd !== ended) setEnded(isEnd)
    if (playing && p > 0.995) setPlaying(false)
  })

  // Any manual scroll input takes the controls back from autoplay.
  useEffect(() => {
    if (!playing) return
    const take = () => {
      setPlaying(false)
      lenis?.scrollTo(lenis.scroll, { immediate: true })
    }
    window.addEventListener('wheel', take, { passive: true })
    window.addEventListener('touchstart', take, { passive: true })
    window.addEventListener('keydown', take)
    return () => {
      window.removeEventListener('wheel', take)
      window.removeEventListener('touchstart', take)
      window.removeEventListener('keydown', take)
    }
  }, [playing, lenis])

  const trackEnd = () => {
    const el = trackRef.current
    return el ? el.offsetTop + el.offsetHeight - window.innerHeight : 0
  }

  const play = () => {
    if (!lenis) return
    if (playing) {
      setPlaying(false)
      lenis.scrollTo(lenis.scroll, { immediate: true })
      return
    }
    const from = film.target >= 0.99 ? 0 : film.target
    if (from === 0) lenis.scrollTo(trackRef.current?.offsetTop ?? 0, { immediate: true })
    setPlaying(true)
    lenis.scrollTo(trackEnd(), { duration: FILM_SECONDS * (1 - from), easing: (t) => t, lock: false })
  }

  const toggleSound = async () => {
    if (sound) {
      score.stop()
      setSound(false)
    } else {
      await score.start()
      setSound(true)
    }
  }

  const replay = () => {
    lenis?.scrollTo(trackRef.current?.offsetTop ?? 0, { immediate: true })
    setTimeout(play, 60)
  }

  return (
    <>
      {/* letterbox */}
      <motion.div aria-hidden="true" style={{ scaleY: bar }} className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[var(--bar)] origin-top bg-black" />
      <motion.div aria-hidden="true" style={{ scaleY: bar }} className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[var(--bar)] origin-bottom bg-black" />

      {/* top HUD: brand, act, transport */}
      <header className={`fixed inset-x-0 top-0 z-50 flex h-[max(var(--bar),3.5rem)] transition-[background-color,backdrop-filter] duration-500 ${ended ? 'bg-black/60 backdrop-blur-xl' : ''} items-center justify-between gap-4 px-5 sm:px-8`}>
        <Link to="/" className="flex items-center gap-2 text-white" aria-label="UWI home">
          <LogoMark className="size-5" />
          <span className="font-semibold tracking-[-0.04em]">UWI</span>
        </Link>
        <motion.p key={act} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="hidden font-mono text-[11px] tracking-[0.3em] text-white/60 uppercase md:block">
          {ended ? 'Credits' : ACTS[act].label}
        </motion.p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Mute score' : 'Play score'}
            className="grid size-9 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {sound ? <SpeakerHigh weight="fill" className="size-4" /> : <SpeakerSlash className="size-4" />}
          </button>
          <button
            type="button"
            onClick={play}
            className="flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/5 pr-4 pl-3 text-sm text-white backdrop-blur transition-colors hover:bg-white/15"
          >
            {playing ? <Pause weight="fill" className="size-3.5" /> : <Play weight="fill" className="size-3.5" />}
            {playing ? 'Pause' : 'Play the film'}
          </button>
          <Link to="/app" className="hidden h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-black sm:flex">
            Open app
          </Link>
        </div>
      </header>

      {/* bottom HUD: timecode and reel progress */}
      <motion.div style={{ opacity: bar }} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-[var(--bar)] items-center gap-5 px-5 font-mono text-[11px] tracking-[0.2em] text-white/50 sm:px-8">
        <span className="flex items-center gap-2">
          <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
          <span ref={tcRef}>00:00:00:00</span>
        </span>
        <span className="relative h-px flex-1 bg-white/15">
          <motion.span style={{ scaleX: progressScale }} className="absolute inset-0 origin-left bg-white/70" />
        </span>
        <span className="hidden sm:inline">UWI / HEDERA</span>
      </motion.div>

      {CUES.map((c) => (
        <Cue key={c.text} cue={c} />
      ))}

      {/* cut to white, then the final card */}
      <motion.div aria-hidden="true" style={{ opacity: flash }} className="pointer-events-none fixed inset-0 z-30 bg-white" />
      <motion.div
        style={{ opacity: finale }}
        className={`fixed inset-0 z-30 grid place-items-center bg-[#020306] bg-[radial-gradient(60%_60%_at_50%_45%,rgb(20_60_90/0.5),transparent)] px-6 text-center ${ended ? '' : 'pointer-events-none'}`}
      >
        <div>
          <p className="font-mono text-[11px] tracking-[0.4em] text-cyan-200/70 uppercase">Now playing everywhere</p>
          <h2 className="mt-5 text-[clamp(3rem,9vw,8.5rem)] leading-[0.9] font-semibold tracking-[-0.06em] text-white">
            One human.
            <br />
            <span className="text-white/45">Every app.</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/start" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-black">
              Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button type="button" onClick={replay} className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-[15px] text-white hover:bg-white/10">
              <ArrowCounterClockwise className="size-4" /> Watch again
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
