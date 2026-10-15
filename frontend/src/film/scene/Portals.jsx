import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { film } from '../store'
import { PORTALS, seg, smooth } from '../timeline'

const RADIUS_WIDE = 3.6
const RADIUS_TALL = 2.5
const UP = new THREE.Vector3(0, 1, 0)

/**
 * Act IV: the apps that ask. Each portal is a ring on an orbit around the
 * credential; a beam travels to it and the ring ignites when it lands.
 */
export function Portals() {
  const rings = useRef([])
  const beams = useRef([])
  const labels = useRef([])

  const layout = useMemo(() => {
    const RADIUS = film.mobile ? RADIUS_TALL : RADIUS_WIDE
    return PORTALS.map((name, i) => {
        const a = (i / PORTALS.length) * Math.PI * 2 + 0.4
        const pos = new THREE.Vector3(Math.cos(a) * RADIUS, Math.sin(a * 2) * 0.55, Math.sin(a) * RADIUS * 0.75)
        const dir = pos.clone().normalize()
        const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir)
        return { name, pos, dir, quat, len: pos.length() }
      })
  }, [])

  useFrame((state) => {
    const p = film.progress
    const t = state.clock.elapsedTime
    layout.forEach((l, i) => {
      const appear = smooth(seg(p, 0.69 + i * 0.012, 0.73 + i * 0.012))
      const fire = smooth(seg(p, 0.73 + i * 0.016, 0.77 + i * 0.016))
      const lit = smooth(seg(p, 0.765 + i * 0.016, 0.79 + i * 0.016))
      const out = 1 - smooth(seg(p, 0.9, 0.95))

      const ring = rings.current[i]
      if (ring) {
        ring.scale.setScalar(Math.max(0.0001, appear * out * (1 + lit * 0.15 * Math.sin(t * 3 + i))))
        ring.material.color.setRGB(0.4 + lit * 2.6, 0.6 + lit * 4.4, 0.8 + lit * 5.2)
        ring.material.opacity = appear * out
        ring.lookAt(0, 0, 0)
      }
      const beam = beams.current[i]
      if (beam) {
        // a unit cylinder from the origin toward the portal, grown along its length
        beam.scale.set(1, Math.max(0.0001, fire * l.len), 1)
        beam.position.copy(l.dir).multiplyScalar((fire * l.len) / 2)
        beam.material.opacity = fire * out * (0.55 + 0.45 * Math.sin(t * 6 + i))
      }
      const label = labels.current[i]
      if (label) label.style.opacity = String(lit * out)
    })
  })

  return (
    <group>
      {layout.map((l, i) => (
        <group key={l.name}>
          <mesh ref={(el) => (rings.current[i] = el)} position={l.pos}>
            <torusGeometry args={[0.32, 0.022, 16, 64]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0} />
          </mesh>
          <mesh ref={(el) => (beams.current[i] = el)} quaternion={l.quat}>
            <cylinderGeometry args={[0.008, 0.008, 1, 8]} />
            <meshBasicMaterial color={[2, 5, 6]} toneMapped={false} transparent opacity={0} />
          </mesh>
          <Html position={[l.pos.x, l.pos.y - 0.6, l.pos.z]} center zIndexRange={[20, 0]}>
            <div
              ref={(el) => (labels.current[i] = el)}
              style={{ opacity: 0 }}
              className="pointer-events-none rounded-full border border-white/15 bg-black/50 px-2.5 py-1 font-mono text-[10px] sm:px-3 sm:text-[11px] tracking-[0.12em] whitespace-nowrap text-cyan-100 uppercase backdrop-blur"
            >
              {l.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
