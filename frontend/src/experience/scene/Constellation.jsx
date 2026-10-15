import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { P, seg, smooth } from '../chapters'

// The same colours as the crowd in the problem: the same people, now each counted once.
const PALETTE = ['#7fe3ff', '#b9a6ff', '#ff9ad5', '#ffd27f', '#8affc1', '#7f9bff', '#ff8f7f', '#f2f2ff'].map((c) => new THREE.Color(c))

/*
 * The finale: a spiral galaxy of verified humans around your card. Every
 * point is one person. Two log-spiral arms, densest near the core, turning
 * on a flat rotation curve (angular speed ~ 1/r) the way real galaxies do,
 * so the arms wind slowly. It forms from the centre outward, around you.
 */
const vertex = /* glsl */ `
  attribute float aR, aA, aSeed;
  attribute vec3 aColor;
  uniform float uTime, uShow, uScale, uSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = aA + uTime * 0.16 / max(aR, 0.6);
    vec3 p = vec3(cos(a) * aR, sin(a) * aR, position.z);
    float born = smoothstep(aR / 8.0, aR / 8.0 + 0.35, uShow);
    p.xy *= 0.6 + 0.4 * born;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0);
    gl_PointSize = uSize * (0.5 + aSeed * aSeed * 1.8) * uScale / -mv.z;
    vColor = aColor * twinkle;
    vAlpha = born * (0.35 + 0.65 * exp(-aR * 0.18));
  }
`
const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
  }
`

function build(count) {
  const r = new Float32Array(count)
  const a = new Float32Array(count)
  const seed = new Float32Array(count)
  const color = new Float32Array(count * 3)
  const pos = new Float32Array(count * 3)
  const pitch = Math.tan((14 * Math.PI) / 180)
  for (let i = 0; i < count; i++) {
    // radius: exponential disk, starting just outside the card
    const rr = 1.4 + -Math.log(1 - Math.random() * 0.985) * 2.3
    const arm = i % 2
    const scatter = (Math.random() - 0.5) * (0.35 + rr * 0.07) * (Math.random() < 0.2 ? 3 : 1)
    r[i] = rr
    a[i] = Math.log(rr) / pitch + arm * Math.PI + scatter
    seed[i] = Math.random()
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.25 * Math.exp(-rr * 0.2)
    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)]
    const k = 0.7 + Math.random() * 0.6
    color.set([c.r * k, c.g * k, c.b * k], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aR', new THREE.BufferAttribute(r, 1))
  g.setAttribute('aA', new THREE.BufferAttribute(a, 1))
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
  return g
}

export function Constellation() {
  const group = useRef()
  const geometry = useMemo(() => build(xp.mobile ? 2200 : 5200), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { uTime: { value: 0 }, uShow: { value: 0 }, uScale: { value: 1000 }, uSize: { value: 0.05 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame((state) => {
    const show = smooth(seg(xp.progress, P.everywhere + 0.04, P.cta))
    group.current.visible = show > 0.001
    if (!group.current.visible) return
    const u = material.uniforms
    u.uShow.value = show
    u.uTime.value = state.clock.elapsedTime
    u.uScale.value = state.size.height / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2))
  })

  return (
    <group ref={group} position={[0, 0.1, -0.6]} rotation={[-1.12, 0.12, 0.35]} visible={false}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
