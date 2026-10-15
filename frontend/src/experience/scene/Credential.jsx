import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'
import { HoloCard } from '../../components/holo/HoloCard'

export const CARD_Y = 0.1
export const CARD_W = 3.4
export const CARD_H = CARD_W / 1.586
const PX = 420 // CSS width; drei maps 40px to one world unit in transform mode

/**
 * The real UWI holo card (same component as the app), placed in the scene.
 * It condenses out of the supernova, spinning and sharpening from a blur of
 * light, then idles with a gentle float.
 */
export function Credential() {
  const group = useRef()
  const el = useRef()

  useFrame((state, dt) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const g = group.current
    if (!g) return
    const born = smooth(seg(p, NOVA + 0.005, P.dawn - 0.035))
    g.visible = born > 0.001
    g.position.y = CARD_Y + (xp.reduced ? 0 : Math.sin(t * 0.7) * 0.06 * born)
    g.scale.setScalar(0.25 + 0.75 * born)
    const spin = (1 - born) * Math.PI * 2.5
    if (!xp.reduced) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, spin + xp.pointer.x * 0.22 + Math.sin(t * 0.35) * 0.05, 14, dt)
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -xp.pointer.y * 0.12, 4, dt)
    } else g.rotation.y = spin
    if (el.current) {
      el.current.style.opacity = String(born)
      el.current.style.filter = born < 1 ? `blur(${((1 - born) * 14).toFixed(1)}px) brightness(${(1 + (1 - born) * 2).toFixed(2)})` : 'none'
    }
  })

  return (
    <group ref={group} visible={false}>
      <Html transform scale={(CARD_W * 40) / PX} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={el} style={{ width: PX, opacity: 0 }}>
          <HoloCard username="you" address="0x7a3F1c9E0b5D2A8e4C6f1B3d9E7a2C5b8D0e4F61" tokenId={1} issuedAt={Date.now()} proof="self" label="Your UWI credential" />
        </div>
      </Html>
    </group>
  )
}
