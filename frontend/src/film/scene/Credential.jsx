import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { film } from '../store'
import { seg, smooth } from '../timeline'

const W = 3.4
const H = 2.14

/** The card face, painted into a canvas once fonts are ready. */
function useFace() {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    let live = true
    document.fonts.ready.then(() => {
      if (!live) return
      const cw = 1360
      const ch = Math.round(cw * (H / W))
      const c = document.createElement('canvas')
      c.width = cw
      c.height = ch
      const g = c.getContext('2d')
      const bg = g.createLinearGradient(0, 0, cw, ch)
      bg.addColorStop(0, '#071528')
      bg.addColorStop(0.55, '#0c2240')
      bg.addColorStop(1, '#050c16')
      g.fillStyle = bg
      g.fillRect(0, 0, cw, ch)
      // concentric security print
      g.strokeStyle = 'rgba(127,227,255,0.13)'
      g.lineWidth = 1.4
      for (let r = 30; r < 700; r += 13) {
        g.beginPath()
        g.arc(cw * 0.8, ch * 0.48, r, 0, Math.PI * 2)
        g.stroke()
      }
      // fine diagonal hatching
      g.strokeStyle = 'rgba(127,227,255,0.05)'
      for (let x = -ch; x < cw; x += 9) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x + ch, ch)
        g.stroke()
      }
      const text = (s, x, y, font, color) => {
        g.font = font
        g.fillStyle = color
        g.fillText(s, x, y)
      }
      text('UWI', 92, 150, '600 64px "Geist Variable", sans-serif', '#ffffff')
      text('PROOF OF PERSONHOOD', 95, 196, '500 24px "Geist Mono Variable", monospace', 'rgba(127,227,255,0.75)')
      text('@you', 92, 610, '600 120px "Geist Variable", sans-serif', '#ffffff')
      text('●  Verified human', 96, 680, '500 34px "Geist Variable", sans-serif', '#7fe3ff')
      text('NO. 000001        HEDERA 296        SOULBOUND        ZK', 96, 790, '400 26px "Geist Mono Variable", monospace', 'rgba(255,255,255,0.45)')
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      setTex(t)
    })
    return () => {
      live = false
    }
  }, [])
  return tex
}

export function Credential() {
  const group = useRef()
  const face = useRef()
  const beam = useRef()
  const core = useRef()
  const tex = useFace()
  // soft vertical falloff for the scan glow, fading toward the top
  const glow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 128
    const g = c.getContext('2d')
    const grad = g.createLinearGradient(0, 128, 0, 0)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 4, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  const glassProps = useMemo(
    () =>
      film.mobile
        ? { samples: 3, resolution: 256 }
        : { samples: 6, resolution: 768 },
    [],
  )

  useFrame((state, dt) => {
    const p = film.progress
    const t = state.clock.elapsedTime
    const g = group.current
    if (!g) return

    // A point of light gathers the swarm, then the card unfolds out of it.
    const gather = smooth(seg(p, 0.36, 0.43)) * (1 - smooth(seg(p, 0.43, 0.46)))
    core.current.scale.setScalar(0.05 + gather * 0.55)
    core.current.material.opacity = gather

    const form = smooth(seg(p, 0.43, 0.5))
    g.scale.setScalar(Math.max(0.0001, form))
    g.visible = form > 0.001

    // Idle life plus a slow pointer lean; reduced motion keeps it still.
    if (!film.reduced) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, film.pointer.x * 0.25 + Math.sin(t * 0.4) * 0.06, 3, dt)
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -film.pointer.y * 0.18 + Math.cos(t * 0.33) * 0.04, 3, dt)
      g.position.y = Math.sin(t * 0.7) * 0.05
    }

    // The scan: a light plane sweeps top to bottom and prints the face as it passes.
    const scan = seg(p, 0.46, 0.53)
    beam.current.visible = scan > 0 && scan < 1
    beam.current.position.y = H / 2 - scan * H
    const glowOn = Math.sin(scan * Math.PI)
    beam.current.children.forEach((m) => (m.material.opacity = glowOn))
    // Wipe the face in from the top, exactly behind the beam: shrink the plane
    // to the scanned height and crop the texture to match, so nothing ghosts.
    if (face.current) {
      const s = Math.max(0.0001, scan)
      const map = face.current.material.map
      face.current.scale.y = s
      face.current.position.y = H / 2 - (H * s) / 2
      map.repeat.set(1, s)
      map.offset.set(0, 1 - s)
    }
  })

  return (
    <>
      <mesh ref={core}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={[4, 6, 7]} toneMapped={false} transparent opacity={0} />
      </mesh>
      <group ref={group}>
        {tex && (
          <mesh ref={face} position={[0, 0, 0.02]}>
            <planeGeometry args={[W, H]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
        )}
        <group ref={beam} position={[0, 0, 0.05]} visible={false}>
          <mesh>
            <planeGeometry args={[W + 0.5, 0.012]} />
            <meshBasicMaterial color={[4, 8, 10]} toneMapped={false} transparent />
          </mesh>
          <mesh position={[0, 0.08, -0.001]}>
            <planeGeometry args={[W + 0.2, 0.16]} />
            <meshBasicMaterial map={glow} color={[0.25, 0.8, 1.1]} toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
        <RoundedBox args={[W + 0.18, H + 0.18, 0.16]} radius={0.14} smoothness={8} position={[0, 0, -0.1]}>
          <MeshTransmissionMaterial
            backside
            {...glassProps}
            thickness={0.35}
            roughness={0}
            ior={1.25}
            chromaticAberration={0.4}
            anisotropy={0.2}
            distortion={0.06}
            distortionScale={0.3}
            temporalDistortion={0.04}
            color="#dff1ff"
            attenuationColor="#9fdcff"
            attenuationDistance={2}
          />
        </RoundedBox>
      </group>
    </>
  )
}
