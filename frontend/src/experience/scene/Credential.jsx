import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'

const W = 3.4
const H = 2.14
export const CARD_Y = 0.1

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
      bg.addColorStop(0, '#0b1730')
      bg.addColorStop(0.55, '#162a4d')
      bg.addColorStop(1, '#0a1120')
      g.fillStyle = bg
      g.fillRect(0, 0, cw, ch)
      g.strokeStyle = 'rgba(127,227,255,0.13)'
      g.lineWidth = 1.4
      for (let r = 30; r < 700; r += 13) {
        g.beginPath()
        g.arc(cw * 0.8, ch * 0.48, r, 0, Math.PI * 2)
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
      text('NO. 000001        HEDERA        SOULBOUND        ZK PROOF', 96, 790, '400 26px "Geist Mono Variable", monospace', 'rgba(255,255,255,0.45)')
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

/**
 * The credential rises out of the lake on a pillar of light. A scan line
 * prints its face as it surfaces; then it hangs over the water, turning
 * gently toward the pointer.
 */
export function Credential() {
  const group = useRef()
  const face = useRef()
  const beam = useRef()
  const tex = useFace()
  const glass = useMemo(() => (xp.mobile ? { samples: 3, resolution: 256 } : { samples: 6, resolution: 768 }), [])

  useFrame((state, dt) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const g = group.current
    if (!g) return
    // born in the supernova: spins out of the core and settles
    const born = smooth(seg(p, NOVA, P.dawn + 0.02))
    g.visible = born > 0.001
    g.position.y = CARD_Y + (xp.reduced ? 0 : Math.sin(t * 0.7) * 0.05 * born)
    g.scale.setScalar(Math.max(0.0001, born))
    const spin = (1 - born) * Math.PI * 3

    if (!xp.reduced) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, spin + xp.pointer.x * 0.28 + Math.sin(t * 0.35) * 0.06, born < 1 ? 20 : 3, dt)
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -xp.pointer.y * 0.16, 3, dt)
    } else g.rotation.y = spin

    // scan prints the face from the top down
    const scan = seg(p, NOVA + 0.03, P.dawn + 0.03)
    beam.current.visible = scan > 0 && scan < 1
    beam.current.position.y = H / 2 - scan * H
    beam.current.children.forEach((m) => (m.material.opacity = Math.sin(scan * Math.PI)))
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
      <group ref={group} visible={false}>
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
        </group>
        <RoundedBox args={[W + 0.18, H + 0.18, 0.16]} radius={0.14} smoothness={8} position={[0, 0, -0.1]}>
          <MeshTransmissionMaterial
            backside
            {...glass}
            thickness={0.35}
            roughness={0}
            ior={1.25}
            chromaticAberration={0.4}
            anisotropy={0.2}
            distortion={0.06}
            distortionScale={0.3}
            temporalDistortion={0.04}
            color="#e6f2ff"
            attenuationColor="#ffd2b0"
            attenuationDistance={2}
          />
        </RoundedBox>
      </group>
    </>
  )
}
