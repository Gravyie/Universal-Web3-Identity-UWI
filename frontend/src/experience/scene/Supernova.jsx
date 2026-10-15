import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, seg, smooth } from '../chapters'

const EJECTA = 1400
const PALETTE = ['#ff5fb0', '#7f6bff', '#4fe0ff', '#ffc061', '#ffffff'].map((c) => new THREE.Color(c))

const SHELL = /* glsl */ `
  uniform float uTime, uFade, uSeed; uniform vec3 uA, uB;
  varying vec3 vN; varying vec3 vView;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
  float noise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.1; a*=0.5; } return v; }
  void main(){
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 1.6);
    float n = fbm(vN * 2.6 + uSeed + uTime * 0.15);
    float filaments = smoothstep(0.42, 0.78, n);
    vec3 col = mix(uB, uA, n) * (0.35 + filaments * 1.6) + vec3(1.0, 0.9, 0.95) * pow(filaments, 4.0) * 0.6;
    gl_FragColor = vec4(col * rim * uFade * 1.8, 1.0);
  }`

function shellMaterial(a, b, seed) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uSeed: { value: seed }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) } },
    vertexShader: `varying vec3 vN; varying vec3 vView;
      void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vView = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: SHELL,
  })
}

/**
 * The rebound. A white-hot core flashes, then two shells of glowing gas tear
 * outward with filamentary structure, two shock rings sweep past at
 * different tilts, and coloured ejecta decelerate into the nebula, which is
 * literally the remnant of this blast.
 */
export function Supernova() {
  const core = useRef()
  const shells = useRef([])
  const rings = useRef([])
  const points = useRef()
  const shellMats = useMemo(() => [shellMaterial('#ff6fbf', '#6a4bff', 1.7), shellMaterial('#4fe0ff', '#ff8a5c', 6.3)], [])
  const ringMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uFade: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uFade; varying vec2 vUv;
          void main(){ float d = length(vUv - 0.5) * 2.0;
            vec3 c = vec3(0.6,0.75,1.0) * exp(-pow((d - 0.94) * 30.0, 2.0)) * 2.4
                   + vec3(1.0,0.45,0.75) * exp(-pow((d - 0.98) * 34.0, 2.0)) * 1.6
                   + vec3(1.0,0.85,0.6) * exp(-pow((d - 0.9) * 24.0, 2.0)) * 0.8;
            gl_FragColor = vec4(c * uFade, 1.0); }`,
      }),
    [],
  )
  const { positions, colors, dirs } = useMemo(() => {
    const dirs = new Float32Array(EJECTA * 3)
    const colors = new Float32Array(EJECTA * 3)
    for (let i = 0; i < EJECTA; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.4 + Math.pow(Math.random(), 0.5))
      dirs.set([v.x, v.y * 0.7, v.z], i * 3)
      const c = PALETTE[i % PALETTE.length].clone().multiplyScalar(1.6)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    return { positions: new Float32Array(EJECTA * 3), colors, dirs }
  }, [])

  useFrame((state) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const boom = seg(p, NOVA - 0.004, NOVA + 0.06)
    const on = boom > 0 && boom < 1
    core.current.visible = points.current.visible = on
    shells.current.forEach((s) => s && (s.visible = on))
    rings.current.forEach((r) => r && (r.visible = on))
    if (!on) return

    // core: an instant flash that decays fast
    const flash = Math.exp(-boom * 9) * smooth(seg(boom, 0, 0.04))
    core.current.scale.setScalar(0.3 + boom * 3)
    core.current.material.opacity = flash

    // shells expand like a blast wave (r ~ t^0.4, Sedov-Taylor)
    shellMats.forEach((m, i) => {
      const s = shells.current[i]
      if (!s) return
      s.scale.setScalar(0.2 + Math.pow(boom, 0.4) * (i ? 9 : 12))
      s.rotation.set(t * 0.05, t * 0.07 * (i ? -1 : 1), 0)
      m.uniforms.uTime.value = t
      m.uniforms.uFade.value = smooth(seg(boom, 0.01, 0.12)) * (1 - smooth(seg(boom, 0.45, 1)))
    })
    rings.current.forEach((r, i) => {
      if (!r) return
      r.scale.setScalar(0.1 + Math.pow(boom, 0.5) * (i ? 20 : 30))
    })
    ringMat.uniforms.uFade.value = 1 - smooth(seg(boom, 0.15, 0.8))

    // ejecta: launched fast, slowed by the surrounding medium
    const travel = 1 - Math.pow(1 - boom, 3)
    for (let i = 0; i < EJECTA * 3; i++) positions[i] = dirs[i] * travel * 16
    points.current.geometry.attributes.position.needsUpdate = true
    points.current.material.opacity = 1 - smooth(seg(boom, 0.35, 1))
  })

  return (
    <group>
      <mesh ref={core} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={[8, 7.5, 9]} toneMapped={false} transparent depthWrite={false} />
      </mesh>
      {shellMats.map((m, i) => (
        <mesh key={i} ref={(el) => (shells.current[i] = el)} material={m} visible={false}>
          <icosahedronGeometry args={[1, 24]} />
        </mesh>
      ))}
      {[
        [Math.PI / 2 - 0.25, 0, 0],
        [Math.PI / 2 + 0.5, 0.6, 0],
      ].map((rot, i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} rotation={rot} material={ringMat} visible={false}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
      <points ref={points} visible={false} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={EJECTA} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={EJECTA} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}
