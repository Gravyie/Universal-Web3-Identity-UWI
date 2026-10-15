import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { novaTime, xp } from '../store'
import { P, seg, smooth } from '../chapters'

// Gas clouds left by the supernova: domain-warped noise on camera-facing
// planes at different depths, so the camera moves through real parallax.
const CLOUDS = [
  { pos: [0, 0.4, -9], size: 26, a: '#ff4fa3', b: '#5b3cff', seed: 1.3 },
  { pos: [-7, 2.5, -6], size: 16, a: '#ffb347', b: '#ff4f7a', seed: 4.1 },
  { pos: [7, -1.5, -5], size: 15, a: '#3fd9ff', b: '#6a4bff', seed: 7.7 },
  { pos: [-3, -3, -3], size: 11, a: '#7f5bff', b: '#2fc4ff', seed: 2.9 },
  { pos: [4, 3.2, -2], size: 10, a: '#ff7ac6', b: '#ffcf7a', seed: 9.2 },
  { pos: [0, 0, -1.5], size: 9, a: '#9fe8ff', b: '#ff9ad5', seed: 5.5 },
]

// ── Phones: the same clouds, computed once into small textures ───────────────
// The live shader costs ~15 noise samples per pixel per cloud, every frame, on
// overlapping full-screen planes; on a phone GPU that is the heaviest thing in
// the story. These are the same formulas, run once on the CPU at load.
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x, y) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}
function fbm(x, y) {
  let v = 0
  let a = 0.5
  for (let i = 0; i < 5; i++) {
    v += a * noise(x, y)
    x *= 2.03
    y *= 2.03
    a *= 0.5
  }
  return v
}
const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
function bakeCloud(c, size = 112) {
  const A = new THREE.Color(c.a)
  const B = new THREE.Color(c.b)
  const data = new Uint8Array(size * size * 4)
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = i / (size - 1)
      const v = j / (size - 1)
      const px = (u - 0.5) * 3 + c.seed
      const py = (v - 0.5) * 3 + c.seed
      const qx = fbm(px, py)
      const qy = fbm(px + 5.2, py + 1.3)
      const n = fbm(px + 2.5 * qx, py + 2.5 * qy)
      const d = Math.hypot(u - 0.5, v - 0.5) * 2
      const mask = smoothstep(1, 0.15, d) * smoothstep(0.35, 0.85, n)
      const k = smoothstep(0.4, 0.9, n + qx * 0.4)
      const glow = Math.pow(smoothstep(0.75, 1, n), 3) * 0.8
      const o = (j * size + i) * 4
      data[o] = Math.min(255, ((B.r + (A.r - B.r) * k + glow) * mask * 0.9 * 255) | 0)
      data[o + 1] = Math.min(255, ((B.g + (A.g - B.g) * k + glow * 0.9) * mask * 0.9 * 255) | 0)
      data[o + 2] = Math.min(255, ((B.b + (A.b - B.b) * k + glow * 0.95) * mask * 0.9 * 255) | 0)
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

/** A baked cloud: the texture drawn as-is (no colour conversion), like the live shader. */
function BakedCloud({ c }) {
  const ref = useRef()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uMap: { value: bakeCloud(c) }, uFade: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform sampler2D uMap; uniform float uFade; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(uMap, vUv).rgb * uFade, 1.0); }`,
      }),
    [c],
  )
  useFrame((state) => {
    ref.current.quaternion.copy(state.camera.quaternion)
    // a slow turn stands in for the live shader's drift
    ref.current.rotateZ(state.clock.elapsedTime * 0.006 * (c.seed > 5 ? 1 : -1))
  })
  return (
    <mesh ref={ref} position={c.pos} material={mat}>
      <planeGeometry args={[c.size, c.size]} />
    </mesh>
  )
}

function Cloud({ c }) {
  const ref = useRef()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uA: { value: new THREE.Color(c.a) }, uB: { value: new THREE.Color(c.b) }, uSeed: { value: c.seed } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFade, uSeed; uniform vec3 uA, uB; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
          float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
          void main(){
            vec2 p = (vUv - 0.5) * 3.0 + uSeed;
            float t = uTime * 0.03;
            vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
            float n = fbm(p + 2.5 * q);
            float d = length(vUv - 0.5) * 2.0;
            float mask = smoothstep(1.0, 0.15, d) * smoothstep(0.35, 0.85, n);
            vec3 col = mix(uB, uA, smoothstep(0.4, 0.9, n + q.x * 0.4));
            col += vec3(1.0, 0.9, 0.95) * pow(smoothstep(0.75, 1.0, n), 3.0) * 0.8;
            gl_FragColor = vec4(col * mask * uFade * 0.9, 1.0);
          }`,
      }),
    [c],
  )
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    ref.current.quaternion.copy(state.camera.quaternion)
  })
  return (
    <mesh ref={ref} position={c.pos} material={mat}>
      <planeGeometry args={[c.size, c.size]} />
    </mesh>
  )
}

export function Nebula() {
  const root = useRef()
  useFrame(() => {
    const on = novaTime() > 0
    root.current.visible = on
    if (!on) return
    // the nebula recedes in the finale so the galaxy of people stands out
    const fade = smooth(seg(novaTime(), 0.5, 3.4)) * (1 - 0.65 * smooth(seg(xp.progress, P.everywhere + 0.04, P.cta)))
    root.current.traverse((o) => o.material?.uniforms?.uFade && (o.material.uniforms.uFade.value = fade))
  })
  return (
    <group ref={root} visible={false}>
      {CLOUDS.map((c) => (xp.mobile ? <BakedCloud key={c.seed} c={c} /> : <Cloud key={c.seed} c={c} />))}
      <Sparkles count={xp.mobile ? 200 : 500} scale={[30, 18, 20]} position={[0, 0, -4]} size={2.4} speed={0.2} opacity={0.9} color="#ffe6f6" />
    </group>
  )
}
