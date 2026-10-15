import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, Sparkles } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { novaTime, xp } from '../store'
import { NOVA } from '../chapters'
import { loading } from '../loading'
import { TIERS, createFrameGuard } from '../quality'
import { CameraRig } from './CameraRig'
import { Swarm } from './Swarm'
import { BlackHole } from './BlackHole'
import { Supernova } from './Supernova'
import { Nebula } from './Nebula'
import { Credential } from './Credential'
import { Portals } from './Portals'
import { Fingerprint } from './Fingerprint'
import { Constellation } from './Constellation'

/**
 * Gets every shader ready before the preloader lifts. three.js compiles a
 * material the first time it is drawn, and only for visible objects, so the
 * black hole, the supernova, the nebula and the rest would otherwise compile
 * mid-story, right when they appear. This shows everything for one compile
 * pass (off screen, while the preloader covers it), compiles it all for the
 * post-processing render target the scene really draws into, waits for the
 * GPU to finish (KHR_parallel_shader_compile, where available), then waits
 * for a few consecutive smooth frames.
 */
function Warmup({ toTarget }) {
  const { gl, scene, camera } = useThree()
  const smooth = useRef(-1)
  const since = useRef(0)
  useEffect(() => {
    if (import.meta.env.DEV) window.__gl = gl
    let live = true
    // after the first frame, so every component has mounted and set up its buffers
    const id = requestAnimationFrame(async () => {
      const hidden = []
      scene.traverse((o) => {
        if (!o.visible) {
          o.visible = true
          hidden.push(o)
        }
      })
      // compile for wherever the scene really draws: the post-processing buffer, or the screen
      const target = toTarget ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }) : null
      const previous = gl.getRenderTarget()
      if (target) gl.setRenderTarget(target)
      const compiled = gl.compileAsync(scene, camera)
      gl.setRenderTarget(previous)
      hidden.forEach((o) => (o.visible = false))
      await compiled.catch(() => {})
      target?.dispose()
      if (!live) return
      loading.mark('shaders')
      smooth.current = 0
      since.current = performance.now()
    })
    return () => {
      live = false
      cancelAnimationFrame(id)
    }
  }, [gl, scene, camera, toTarget])
  useFrame((_, dt) => {
    if (smooth.current < 0 || loading.has('frames')) return
    smooth.current = dt < 1 / 20 ? smooth.current + 1 : 0
    // five smooth frames in a row; a device that can't get there in 2.5s won't by waiting longer
    if (smooth.current >= 5 || performance.now() - since.current > 2500) loading.mark('frames')
  })
  return null
}

/**
 * Phones draw at a steady 30fps instead of chasing 60 (or 120): each frame then
 * has twice the time to finish, so the GPU never falls behind and the browser
 * never shows a frame it couldn't complete.
 */
function FrameCap({ fps }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let raf = 0
    let last = 0
    const step = 1000 / fps
    const tick = (now) => {
      if (now - last >= step - 2) {
        last = now
        invalidate()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [invalidate, fps])
  return null
}

/**
 * Phones only: steps quality down when frames run slow for a while (see
 * quality.js). First the frame cap drops to 30fps, then fewer particles are
 * drawn. Neither touches the canvas or a render target, so neither can flash.
 */
function FrameGuard({ fps, setFps }) {
  const guard = useMemo(() => createFrameGuard({ budgetMs: 1000 / fps }), [fps])
  useFrame((_, dt) => {
    if (guard(performance.now(), dt * 1000) !== 'step-down') return
    if (fps > 30) setFps(30)
    else if (xp.particleScale > 0.6) xp.particleScale = 0.6
  })
  return null
}

/** Deep space, visible until the supernova. */
function Space() {
  const ref = useRef()
  useFrame(() => {
    // the space before the supernova: hidden while the explosion is on screen, both ways
    ref.current.visible = xp.progress < NOVA + 0.01 && novaTime() < 0.45
  })
  return (
    <group ref={ref}>
      <Sparkles count={TIERS[xp.tier].sparkles} scale={[34, 20, 34]} size={1.6} speed={0.12} opacity={0.5} color="#cfe0ff" />
      <Swarm count={TIERS[xp.tier].swarm} />
      <BlackHole />
    </group>
  )
}

/**
 * One persistent scene for the whole landing experience. Every material is lit
 * by its own shader, so there is no environment map to build.
 *
 * Desktop: device pixel ratio up to 1.5, lowered when frames slow down, with
 * bloom, chromatic aberration and vignette.
 *
 * Phones (lite, tiers in quality.js): a fixed resolution, a frame cap, and no
 * post-processing at all.
 * Post-processing keeps a stack of full-screen half-float buffers, the largest
 * GPU memory cost here and a format some phones handle badly; together with
 * fill-rate spikes that is what makes mobile WebGL flash black. The heavy
 * shaders have lighter phone variants too (see Nebula, Supernova, BlackHole).
 */
export default function Stage() {
  const tier = TIERS[xp.tier]
  const lite = !tier.post
  const ca = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  const [dpr, setDpr] = useState(Math.min(tier.dpr, window.devicePixelRatio || 1))
  const [fps, setFps] = useState(tier.fps)
  // three.js restores a lost GPU context by itself; if it stays lost, hand over to the static page
  const [lost, setLost] = useState(false)
  if (lost) throw new Error('WebGL context lost and not restored')
  const watchContext = ({ gl }) => {
    loading.mark('gl')
    let timer = 0
    gl.domElement.addEventListener('webglcontextlost', () => (timer = setTimeout(() => setLost(true), 4000)))
    gl.domElement.addEventListener('webglcontextrestored', () => clearTimeout(timer))
  }
  return (
    <Canvas
      className="stage-canvas"
      // only real size changes resize the canvas (each resize clears it for a frame)
      resize={{ scroll: false, debounce: { scroll: 0, resize: 250 } }}
      dpr={dpr}
      frameloop={fps ? 'demand' : 'always'}
      camera={{ position: [0, 0.6, 18], fov: 34, near: 0.1, far: 140 }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={watchContext}
    >
      <color attach="background" args={['#020306']} />
      {/* Phones: a frame cap and a guard that only lowers it. Desktop: resolution only steps
          down, and gives up after a couple of changes (every change reallocates the canvas). */}
      {fps ? (
        <>
          <FrameCap fps={fps} />
          <FrameGuard fps={fps} setFps={setFps} />
        </>
      ) : (
        <PerformanceMonitor flipflops={2} onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onFallback={() => setDpr(1)} />
      )}
      <Suspense fallback={null}>
        <CameraRig />
        <Fingerprint />
        <Space />
        <Supernova />
        <Nebula />
        <Credential />
        <Portals />
        <Constellation />
        {!lite && (
          <EffectComposer multisampling={0} disableNormalPass>
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.32} luminanceSmoothing={0.2} radius={0.78} />
            <ChromaticAberration offset={ca} radialModulation modulationOffset={0.4} />
            <Vignette eskil={false} offset={0.25} darkness={0.75} />
          </EffectComposer>
        )}
        <Warmup toTarget={!lite} />
      </Suspense>
    </Canvas>
  )
}
