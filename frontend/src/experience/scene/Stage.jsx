import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor, Sparkles } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA } from '../chapters'
import { CameraRig } from './CameraRig'
import { Swarm } from './Swarm'
import { BlackHole } from './BlackHole'
import { Supernova } from './Supernova'
import { Nebula } from './Nebula'
import { Credential } from './Credential'
import { Portals } from './Portals'
import { Fingerprint } from './Fingerprint'

/** Deep space, visible until the supernova. */
function Space() {
  const ref = useRef()
  useFrame(() => {
    ref.current.visible = xp.progress < NOVA + 0.01
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
 * One persistent scene for the whole landing experience. Resolution adapts
 * to the GPU (dropping when frames slow down), and while the page is being
 * read over it the scene holds its last frame instead of re-rendering.
 */
export default function Stage({ paused = false }) {
  const ca = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  const max = xp.mobile ? 1.25 : 1.5
  const [dpr, setDpr] = useState(Math.min(max, window.devicePixelRatio || 1))
  return (
    <Canvas
      className="!fixed inset-0 overflow-hidden"
      frameloop={paused ? 'demand' : 'always'}
      dpr={dpr}
      camera={{ position: [0, 0.6, 18], fov: 34, near: 0.1, far: 140 }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#020306']} />
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(max, d + 0.25))} />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={4} color="#ffd2b0" position={[-5, 2, 3]} scale={[5, 1.2, 1]} />
          <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[5, -1, 2]} scale={[3, 3, 1]} />
          <Lightformer form="ring" intensity={3} color="#7f8cff" position={[0, 4, -5]} scale={6} />
        </Environment>
        <CameraRig />
        <Fingerprint />
        <Space />
        <Supernova />
        <Nebula />
        <Credential />
        <Portals />
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.32} luminanceSmoothing={0.2} radius={0.78} />
          {!xp.mobile && <ChromaticAberration offset={ca} radialModulation modulationOffset={0.4} />}
          <Vignette eskil={false} offset={0.25} darkness={0.75} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
