import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { P, PORTALS, seg, smooth } from '../chapters'
import { CARD_H, CARD_W, CARD_Y } from './Credential'

const RING_R = 0.34

/**
 * The apps that ask. Rings hang in an arc above the card; for each one a
 * curved beam leaves the card's edge, grows until it touches the ring, and
 * then carries pulses of light along it.
 */
export function Portals() {
  const rings = useRef([])
  const lines = useRef([])
  const labels = useRef([])

  const layout = useMemo(() => {
    const R = xp.mobile ? 2.7 : 4.6
    return PORTALS.map((name, i) => {
      const a = Math.PI * (0.1 + (i / (PORTALS.length - 1)) * 0.8)
      const pos = new THREE.Vector3(Math.cos(a) * R, CARD_Y + 1.2 + Math.sin(a) * 1.5, -0.8)
      const center = new THREE.Vector3(0, CARD_Y, 0)
      const d = pos.clone().sub(center)
      // where the line from the card centre leaves the card rectangle
      const k = Math.min(CARD_W / 2 / Math.max(Math.abs(d.x), 1e-3), CARD_H / 2 / Math.max(Math.abs(d.y), 1e-3))
      const start = center.clone().add(new THREE.Vector3(d.x * k, d.y * k, 0))
      const end = pos.clone().sub(d.clone().normalize().multiplyScalar(RING_R))
      const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.45, 0.3))
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const geo = new THREE.TubeGeometry(curve, 64, 0.012, 8, false)
      // uv.x runs 0..1 along the curve: the shader grows the beam and runs pulses along it
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uGrow: { value: 0 }, uTime: { value: 0 } },
        vertexShader: `varying float vS; void main(){ vS = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uGrow, uTime; varying float vS;
          void main(){
            if (vS > uGrow) discard;
            float head = exp(-pow((vS - uGrow) * 18.0, 2.0)) * step(uGrow, 0.999);
            float pulse = pow(0.5 + 0.5 * sin((vS * 6.0 - uTime * 1.6) * 6.2831), 8.0);
            vec3 c = vec3(0.55, 1.1, 1.4) * (0.55 + pulse * 1.6) + vec3(1.6, 2.2, 2.6) * head * 2.0;
            gl_FragColor = vec4(c, 1.0);
          }`,
      })
      return { name, pos, start, end, mid, geo, mat }
    })
  }, [])

  useFrame((state) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    layout.forEach((l, i) => {
      const appear = smooth(seg(p, P.card + 0.02 + i * 0.008, P.everywhere - 0.04 + i * 0.005))
      const grow = smooth(seg(p, P.card + 0.05 + i * 0.008, P.everywhere - 0.01 + i * 0.002))
      const lit = smooth(seg(p, P.card + 0.08 + i * 0.008, P.everywhere + i * 0.002))
      const ring = rings.current[i]
      if (ring) {
        ring.visible = appear > 0.001
        ring.scale.setScalar(Math.max(0.0001, appear * (1 + lit * 0.08 * Math.sin(t * 2.4 + i))))
        ring.material.color.setRGB(0.5 + lit * 2.2, 0.7 + lit * 3.2, 0.9 + lit * 4)
        ring.material.opacity = appear
        ring.quaternion.copy(state.camera.quaternion)
      }
      const line = lines.current[i]
      if (line) {
        line.visible = grow > 0.002
        l.mat.uniforms.uGrow.value = grow
        l.mat.uniforms.uTime.value = t
      }
      if (labels.current[i]) labels.current[i].style.opacity = String(lit)
    })
  })

  return (
    <group>
      {layout.map((l, i) => (
        <group key={l.name}>
          <mesh ref={(el) => (rings.current[i] = el)} position={l.pos} visible={false}>
            <torusGeometry args={[RING_R, 0.02, 16, 64]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={0} />
          </mesh>
          <mesh ref={(el) => (lines.current[i] = el)} geometry={l.geo} material={l.mat} visible={false} />
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
