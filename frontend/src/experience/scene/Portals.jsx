import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { P, PORTALS, seg, smooth } from '../chapters'
import { CARD_Y } from './Credential'

const UP = new THREE.Vector3(0, 1, 0)

/**
 * The apps that ask. Rings hang over the valley in an arc; a beam leaves the
 * credential for each one in turn and the ring ignites when it lands.
 */
export function Portals() {
  const rings = useRef([])
  const beams = useRef([])
  const labels = useRef([])

  const layout = useMemo(() => {
    const R = xp.mobile ? 2.6 : 4.4
    return PORTALS.map((name, i) => {
      const a = Math.PI * (0.08 + (i / (PORTALS.length - 1)) * 0.84) // a fan across the valley
      const pos = new THREE.Vector3(Math.cos(a) * R, CARD_Y + 0.9 + Math.sin(a) * 1.6, -Math.abs(Math.sin(a)) * 1.2 - 0.6)
      const rel = pos.clone().sub(new THREE.Vector3(0, CARD_Y, 0))
      const dir = rel.clone().normalize()
      return { name, pos, dir, len: rel.length(), quat: new THREE.Quaternion().setFromUnitVectors(UP, dir) }
    })
  }, [])

  useFrame((state) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    layout.forEach((l, i) => {
      const appear = smooth(seg(p, P.card + 0.03 + i * 0.008, P.everywhere - 0.04 + i * 0.006))
      const fire = smooth(seg(p, P.card + 0.06 + i * 0.01, P.everywhere - 0.005 + i * 0.002))
      const lit = smooth(seg(p, P.card + 0.08 + i * 0.01, P.everywhere + i * 0.002))
      const ring = rings.current[i]
      if (ring) {
        ring.visible = appear > 0.001
        ring.scale.setScalar(Math.max(0.0001, appear * (1 + lit * 0.12 * Math.sin(t * 3 + i))))
        ring.material.color.setRGB(0.5 + lit * 2.4, 0.6 + lit * 3.8, 0.8 + lit * 4.6)
        ring.material.opacity = appear
        ring.lookAt(state.camera.position)
      }
      const beam = beams.current[i]
      if (beam) {
        beam.visible = fire > 0.001
        beam.scale.set(1, Math.max(0.0001, fire * l.len), 1)
        beam.position.set(0, CARD_Y, 0).addScaledVector(l.dir, (fire * l.len) / 2)
        beam.material.opacity = fire * (0.55 + 0.45 * Math.sin(t * 6 + i))
      }
      if (labels.current[i]) labels.current[i].style.opacity = String(lit)
    })
  })

  return (
    <group>
      {layout.map((l, i) => (
        <group key={l.name}>
          <mesh ref={(el) => (rings.current[i] = el)} position={l.pos} visible={false}>
            <torusGeometry args={[0.34, 0.022, 16, 64]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0} />
          </mesh>
          <mesh ref={(el) => (beams.current[i] = el)} quaternion={l.quat} visible={false}>
            <cylinderGeometry args={[0.009, 0.009, 1, 8]} />
            <meshBasicMaterial color={[2, 5, 6]} toneMapped={false} transparent opacity={0} />
          </mesh>
          <Html position={[l.pos.x, l.pos.y + 0.62, l.pos.z]} center zIndexRange={[20, 0]}>
            <div
              ref={(el) => (labels.current[i] = el)}
              style={{ opacity: 0 }}
              className="pointer-events-none rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white backdrop-blur sm:px-3 sm:text-xs"
            >
              {l.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
