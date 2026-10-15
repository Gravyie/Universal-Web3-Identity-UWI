import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { novaTime, xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'
import { HoloCard } from '../../components/holo/HoloCard'
import { HERO_CARD } from '../heroCard'

export const CARD_Y = 0.1
export const CARD_W = 3.4
export const CARD_H = CARD_W / 1.586

const world = new THREE.Vector3()

/**
 * The credential in the scene. It is the very same HoloCard as the hero and
 * the app, drawn as a normal 2D layer that tracks its 3D position (CSS 3D
 * transforms would flatten the foil), sized to the card's projected width
 * so the portal beams meet its edges. It emerges out of the supernova's light
 * as the explosion fades, then floats and follows the pointer.
 */
export function Credential() {
  const group = useRef()
  const el = useRef()
  const width = useRef(0)

  useFrame((state) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const g = group.current
    const node = el.current
    if (!g || !node) return
    // condenses out of the remnant on the explosion's clock
    // emerges as the fireball fades, while the shell is still expanding
    const born = p >= NOVA ? smooth(seg(novaTime(), 0.9, 2.4)) : 0
    g.visible = born > 0.001
    node.style.visibility = g.visible ? 'visible' : 'hidden'
    if (!g.visible) return
    g.position.y = CARD_Y + (xp.reduced ? 0 : Math.sin(t * 0.7) * 0.06 * born)

    // projected width of a CARD_W-wide card facing the camera
    const cam = state.camera
    const dist = cam.position.distanceTo(g.getWorldPosition(world))
    const px = (CARD_W * state.size.height) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist)
    const w = Math.round(px * (0.55 + 0.45 * born))
    if (Math.abs(w - width.current) > 0.5) {
      width.current = w
      node.style.width = `${w}px`
    }
    // tell the beams exactly where the card's edges are this frame
    xp.card.x = world.x
    xp.card.y = world.y
    xp.card.z = world.z
    xp.card.halfW = (CARD_W * (0.55 + 0.45 * born)) / 2
    xp.card.halfH = xp.card.halfW / 1.586
    // it emerges out of the remnant's light: a card from the first frame, sharpening and rising to face you
    const rise = 1 - born
    node.style.transform = xp.reduced ? 'none' : `perspective(1400px) rotateX(${(rise * 22).toFixed(1)}deg) translateY(${(rise * 18).toFixed(1)}px)`
    node.style.opacity = String(born)
    node.style.filter = born < 1 ? `blur(${((1 - born) * 10).toFixed(1)}px) brightness(${(1 + (1 - born) * 1.6).toFixed(2)})` : 'none'
    node.style.pointerEvents = born >= 1 ? 'auto' : 'none'
  })

  return (
    <group ref={group} visible={false}>
      <Html center zIndexRange={[15, 0]}>
        <div ref={el} style={{ width: 0, opacity: 0, visibility: 'hidden' }}>
          <HoloCard {...HERO_CARD} label="Your UWI credential. Move your pointer over it." />
        </div>
      </Html>
    </group>
  )
}
