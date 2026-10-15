import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { P, PORTALS, seg, smooth } from '../chapters'
import { CARD_Y } from './Credential'

const RING_R = 0.34
const SEGMENTS = 64

/*
 * A beam is a quadratic Bezier drawn as a camera-facing ribbon in the vertex
 * shader. Its three control points are uniforms, updated every frame from
 * the card's live position, so the beam is always attached to the card's edge.
 */
const vertex = /* glsl */ `
  attribute float aT, aSide;
  uniform vec3 uA, uB, uC;
  uniform float uWidth;
  varying float vS, vSide;
  void main() {
    float t = aT, u = 1.0 - t;
    vec3 p = u * u * uA + 2.0 * u * t * uB + t * t * uC;
    vec3 tan = 2.0 * u * (uB - uA) + 2.0 * t * (uC - uB);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vec3 tv = normalize(mat3(viewMatrix) * tan);
    vec3 side = normalize(cross(tv, vec3(0.0, 0.0, 1.0)));
    mv.xyz += side * aSide * uWidth;
    vS = t;
    vSide = aSide;
    gl_Position = projectionMatrix * mv;
  }
`
const fragment = /* glsl */ `
  uniform float uGrow, uTime;
  varying float vS, vSide;
  void main() {
    if (vS > uGrow) discard;
    float edge = 1.0 - vSide * vSide;
    float head = exp(-pow((vS - uGrow) * 18.0, 2.0)) * step(uGrow, 0.999);
    float pulse = pow(0.5 + 0.5 * sin((vS * 6.0 - uTime * 1.6) * 6.2831), 8.0);
    vec3 c = vec3(0.55, 1.1, 1.4) * (0.55 + pulse * 1.6) + vec3(1.6, 2.2, 2.6) * head * 2.0;
    gl_FragColor = vec4(c * edge, 1.0);
  }
`

function ribbon() {
  const t = new Float32Array((SEGMENTS + 1) * 2)
  const side = new Float32Array((SEGMENTS + 1) * 2)
  const index = []
  for (let i = 0; i <= SEGMENTS; i++) {
    t[i * 2] = t[i * 2 + 1] = i / SEGMENTS
    side[i * 2] = -1
    side[i * 2 + 1] = 1
    if (i < SEGMENTS) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEGMENTS + 1) * 2 * 3), 3))
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1))
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1))
  g.setIndex(index)
  return g
}

const center = new THREE.Vector3()
const d = new THREE.Vector3()
const right = new THREE.Vector3()
const up = new THREE.Vector3()

/**
 * The apps that ask. Rings hang in an arc above the card; from each one a
 * curved beam grows out of the card's edge until it touches the ring, then
 * carries pulses of light along it.
 */
export function Portals() {
  const rings = useRef([])
  const lines = useRef([])
  const labels = useRef([])

  const layout = useMemo(() => {
    const R = xp.mobile ? 2.7 : 4.6
    const geometry = ribbon()
    return PORTALS.map((name, i) => {
      const a = Math.PI * (0.1 + (i / (PORTALS.length - 1)) * 0.8)
      const pos = new THREE.Vector3(Math.cos(a) * R, CARD_Y + 1.2 + Math.sin(a) * 1.5, -0.8)
      const mat = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uA: { value: new THREE.Vector3() },
          uB: { value: new THREE.Vector3() },
          uC: { value: new THREE.Vector3() },
          uWidth: { value: 0.014 },
          uGrow: { value: 0 },
          uTime: { value: 0 },
        },
      })
      return { name, pos, geometry, mat }
    })
  }, [])

  useFrame((state) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const card = xp.card
    center.set(card.x, card.y, card.z)
    // the card always faces the screen, so its edges lie along the camera's right and up
    right.setFromMatrixColumn(state.camera.matrixWorld, 0)
    up.setFromMatrixColumn(state.camera.matrixWorld, 1)
    layout.forEach((l, i) => {
      const appear = smooth(seg(p, P.dawn + 0.05 + i * 0.01, P.everywhere - 0.05 + i * 0.006))
      const grow = smooth(seg(p, P.dawn + 0.08 + i * 0.01, P.everywhere - 0.015 + i * 0.002))
      const lit = smooth(seg(p, P.dawn + 0.11 + i * 0.01, P.everywhere + i * 0.002))
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
        if (line.visible) {
          // start where the line from the card's centre to the ring leaves the card's rectangle
          d.copy(l.pos).sub(center)
          const dr = d.dot(right)
          const du = d.dot(up)
          const k = Math.min(card.halfW / Math.max(Math.abs(dr), 1e-3), card.halfH / Math.max(Math.abs(du), 1e-3))
          const u = l.mat.uniforms
          u.uA.value.copy(center).addScaledVector(right, dr * k).addScaledVector(up, du * k)
          u.uC.value.copy(l.pos).sub(d.normalize().multiplyScalar(RING_R))
          u.uB.value.copy(u.uA.value).lerp(u.uC.value, 0.5).add(d.set(0, 0.45, 0.3))
          u.uGrow.value = grow
          u.uTime.value = t
        }
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
          <mesh ref={(el) => (lines.current[i] = el)} geometry={l.geometry} material={l.mat} visible={false} frustumCulled={false} />
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
