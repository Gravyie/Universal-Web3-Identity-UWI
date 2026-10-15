import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, Sparkles } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { novaTime, xp } from '../store'
import { NOVA } from '../chapters'
import { loading } from '../loading'
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
function Warmup() {
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
      const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })
      const previous = gl.getRenderTarget()
      gl.setRenderTarget(target)
      const compiled = gl.compileAsync(scene, camera)
      gl.setRenderTarget(previous)
      hidden.forEach((o) => (o.visible = false))
      await compiled.catch(() => {})
      target.dispose()
      if (!live) return
      loading.mark('shaders')
      smooth.current = 0
      since.current = performance.now()
    })
    return () => {
      live = false
      cancelAnimationFrame(id)
    }
  }, [gl, scene, camera])
  useFrame((_, dt) => {
    if (smooth.current < 0 || loading.has('frames')) return
    smooth.current = dt < 1 / 20 ? smooth.current + 1 : 0
    // five smooth frames in a row; a device that can't get there in 2.5s won't by waiting longer
    if (smooth.current >= 5 || performance.now() - since.current > 2500) loading.mark('frames')
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
      <Sparkles count={xp.mobile ? 160 : 420} scale={[34, 20, 34]} size={1.6} speed={0.12} opacity={0.5} color="#cfe0ff" />
      <Swarm count={xp.mobile ? 700 : 1800} />
      <BlackHole />
    </group>
  )
}

/**
 * One persistent scene for the whole landing experience. Device pixel ratio
 * is capped (1.5 desktop, 1.25 phones) and adapts to the GPU, dropping when
 * frames slow down. Every material is lit by its own shader, so there is no
 * environment map to build.
 */
export default function Stage() {
  const ca = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  const max = xp.mobile ? 1.25 : 1.5
  const [dpr, setDpr] = useState(Math.min(max, window.devicePixelRatio || 1))
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
      className="!fixed inset-0 overflow-hidden"
      dpr={dpr}
      camera={{ position: [0, 0.6, 18], fov: 34, near: 0.1, far: 140 }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={watchContext}
    >
      <color attach="background" args={['#020306']} />
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(max, d + 0.25))} />
      <Suspense fallback={null}>
        <CameraRig />
        <Fingerprint />
        <Space />
        <Supernova />
        <Nebula />
        <Credential />
        <Portals />
        <Constellation />
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.32} luminanceSmoothing={0.2} radius={0.78} />
          {!xp.mobile && <ChromaticAberration offset={ca} radialModulation modulationOffset={0.4} />}
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
        </EffectComposer>
        <Warmup />
      </Suspense>
    </Canvas>
  )
}
