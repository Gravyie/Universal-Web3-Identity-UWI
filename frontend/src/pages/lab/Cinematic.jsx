import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Lightformer, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useStats } from '../../hooks/useCredential'
import { LabSwitcher } from './LabSwitcher'

/* ── Card face, drawn once into a canvas texture ────────────────────────── */

function useCardTexture() {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      const W = 1024
      const H = 646
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const g = c.getContext('2d')
      const grad = g.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, '#0b1a2e')
      grad.addColorStop(0.5, '#10233f')
      grad.addColorStop(1, '#071019')
      g.fillStyle = grad
      g.fillRect(0, 0, W, H)
      // fine security rings
      g.strokeStyle = 'rgba(120,210,255,0.16)'
      g.lineWidth = 1.2
      for (let r = 40; r < 520; r += 14) {
        g.beginPath()
        g.arc(W * 0.82, H * 0.5, r, 0, Math.PI * 2)
        g.stroke()
      }
      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.font = '600 46px "Geist Variable", sans-serif'
      g.fillText('UWI', 70, 110)
      g.fillStyle = 'rgba(160,220,255,0.7)'
      g.font = '500 18px "Geist Mono Variable", monospace'
      g.fillText('PROOF OF PERSONHOOD', 72, 142)
      g.fillStyle = '#ffffff'
      g.font = '600 76px "Geist Variable", sans-serif'
      g.fillText('@ada_lovelace', 70, 470)
      g.fillStyle = 'rgba(120,230,255,0.95)'
      g.font = '500 26px "Geist Variable", sans-serif'
      g.fillText('● Verified human', 72, 520)
      g.fillStyle = 'rgba(255,255,255,0.45)'
      g.font = '400 20px "Geist Mono Variable", monospace'
      g.fillText('NO. 000042      HEDERA 296      SOULBOUND', 72, 590)
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      setTex(t)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return tex
}

/* ── The glass credential ───────────────────────────────────────────────── */

function GlassCard({ pointer, offset = [1.25, 0.45, 0], scale = 0.78 }) {
  const group = useRef()
  const tex = useCardTexture()
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.current.x * 0.45, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.current.y * 0.3, 3, dt)
  })
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6}>
      <group ref={group} position={offset} scale={scale}>
        {tex && (
          <mesh position={[0, 0, 0.085]}>
            <planeGeometry args={[3.2, 2.02]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
        )}
        <RoundedBox args={[3.5, 2.24, 0.16]} radius={0.12} smoothness={8}>
          <MeshTransmissionMaterial
            backside
            samples={6}
            resolution={512}
            thickness={0.35}
            roughness={0}
            ior={1.25}
            chromaticAberration={0.35}
            anisotropy={0.2}
            distortion={0.06}
            distortionScale={0.3}
            temporalDistortion={0.04}
            color="#d8ecff"
            attenuationColor="#9fd8ff"
            attenuationDistance={2}
          />
        </RoundedBox>
      </group>
    </Float>
  )
}

/* ── Wallet particles: a vortex that spirals into the credential ────────── */

function Vortex({ count = 2200 }) {
  const ref = useRef()
  const seeds = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push({
        r: 2.4 + Math.random() * 5.5,
        a: Math.random() * Math.PI * 2,
        y: (Math.random() - 0.5) * 1.6,
        s: 0.08 + Math.random() * 0.25,
      })
    }
    return arr
  }, [count])
  const positions = useMemo(() => new Float32Array(count * 3), [count])

  useFrame((_, dt) => {
    for (let i = 0; i < count; i++) {
      const p = seeds[i]
      p.a += (p.s / p.r) * dt * 2.2
      p.r -= dt * 0.18 * p.s * 3
      if (p.r < 1.9) {
        p.r = 7.5
        p.a = Math.random() * Math.PI * 2
      }
      positions[i * 3] = Math.cos(p.a) * p.r
      positions[i * 3 + 1] = p.y * (p.r / 6) + Math.sin(p.a * 2) * 0.05
      positions[i * 3 + 2] = Math.sin(p.a) * p.r * 0.55 - 1.2
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} rotation={[0.35, 0, 0.08]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#7fdcff" transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Scene({ pointer }) {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  return (
    <>
      <color attach="background" args={['#04060a']} />
      <fog attach="fog" args={['#04060a', 7, 15]} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} color="#9fe6ff" position={[-4, 2, 3]} scale={[4, 1, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[4, -1, 2]} scale={[3, 3, 1]} />
        <Lightformer form="ring" intensity={3} color="#5b8cff" position={[0, 3, -4]} scale={5} />
      </Environment>
      <Vortex />
      <GlassCard pointer={pointer} offset={narrow ? [0, 0.95, 0] : [1.25, 0.45, 0]} scale={narrow ? 0.4 : 0.78} />
    </>
  )
}

export default function Cinematic() {
  const pointer = useRef({ x: 0, y: 0 })
  const { humans } = useStats()
  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-[#04060a] text-white"
      onPointerMove={(e) => {
        pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }
      }}
    >
      <Canvas camera={{ position: [0, 0, 6.2], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true }} className="!absolute inset-0">
        <Suspense fallback={null}>
          <Scene pointer={pointer} />
        </Suspense>
      </Canvas>

      {/* vignette for text legibility */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent_40%,#04060a_100%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 pt-6">
        <span className="text-[17px] font-semibold tracking-[-0.04em]">UWI</span>
        <nav className="hidden gap-8 text-sm text-white/55 md:flex">
          <span>Product</span>
          <span>Gates</span>
          <span>Developers</span>
        </nav>
        <Link to="/app" className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm backdrop-blur hover:bg-white/10">
          Launch app
        </Link>
      </header>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-7xl px-6 pb-24 md:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-gradient-to-b from-white to-white/45 bg-clip-text text-[clamp(3.2rem,8.5vw,8.5rem)] leading-[0.92] font-semibold tracking-[-0.06em] text-transparent"
            >
              One human.
              <br />
              Every app.
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 1 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/start" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-black">
                Get verified <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-sm text-white/50">Private. Soulbound. Gasless.</span>
            </motion.div>
          </div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }} className="font-mono text-xs text-white/50">
            <dt>VERIFIED HUMANS</dt>
            <dd className="mt-1 text-3xl text-white">{humans !== undefined ? String(humans) : '...'}</dd>
          </motion.dl>
        </div>
      </div>

      <LabSwitcher tone="dark" />
    </div>
  )
}
