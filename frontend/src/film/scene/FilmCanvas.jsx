import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { film } from '../store'
import { CameraRig } from './CameraRig'
import { Swarm } from './Swarm'
import { Credential } from './Credential'
import { Portals } from './Portals'

/**
 * The whole film is one scene; the camera moves, nothing reloads. Lighting is
 * built from in-scene light panels so there's no environment map to download.
 */
export default function FilmCanvas({ frameloop = 'always' }) {
  const mobile = film.mobile
  const caOffset = useMemo(() => new THREE.Vector2(0.00035, 0.00035), [])
  return (
    <Canvas
      className="!fixed inset-0"
      frameloop={frameloop}
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0.8, 17], fov: 32, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#020306']} />
      <fog attach="fog" args={['#020306', 9, 26]} />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={5} color="#9fe8ff" position={[-5, 2, 3]} scale={[5, 1.2, 1]} />
          <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[5, -1, 2]} scale={[3, 3, 1]} />
          <Lightformer form="ring" intensity={4} color="#4f7dff" position={[0, 4, -5]} scale={6} />
          <Lightformer form="rect" intensity={1.5} color="#ff6b8a" position={[0, -4, 1]} scale={[8, 1, 1]} />
        </Environment>

        <CameraRig />
        <Sparkles count={mobile ? 120 : 320} scale={[22, 12, 22]} size={2.2} speed={0.25} opacity={0.5} color="#9fdcff" />
        <Swarm count={mobile ? 700 : 1800} />
        <Credential />
        <Portals />

        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.22} luminanceSmoothing={0.2} radius={0.75} />
          {!mobile && <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.35} />}
          <Vignette eskil={false} offset={0.22} darkness={0.85} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
