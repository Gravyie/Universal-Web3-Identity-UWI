import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { novaTime, xp } from '../store'
import { NOVA, P, seg } from '../chapters'

const SIZE = 30 // world units covered by the billboard

/*
 * A core-collapse supernova, in the order it really happens, drawn in one
 * pass on a camera-facing quad. tau runs 0..1 across the event.
 *
 *  1. Shock breakout: the shock reaches the surface and a brief blue-white
 *     flash escapes from a point.
 *  2. Fireball: the photosphere swells and cools along the blackbody curve,
 *     blue-white to gold to deep orange, limb-darkened like any star.
 *  3. Ejecta: a shell expanding at a few percent of c (r ~ t^0.75, slowing as
 *     it sweeps up gas). It is limb-brightened because sight lines graze it,
 *     and Rayleigh-Taylor instabilities break it into filaments that glow in
 *     the remnant's emission lines: hydrogen-alpha red and oxygen-III teal.
 *  4. The remnant's heart: the credential condenses out of its glow as the
 *     fireball fades.
 */
const fragment = /* glsl */ `
  uniform float uTau, uTime, uCard;
  varying vec2 vPos;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }

  vec3 blackbody(float k) {
    float t = clamp(k, 1000.0, 40000.0) / 100.0;
    float r = t <= 66.0 ? 1.0 : 1.2929 * pow(t - 60.0, -0.1332);
    float g = t <= 66.0 ? 0.3901 * log(t) - 0.6318 : 1.1299 * pow(t - 60.0, -0.0755);
    float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : 0.5432 * log(t - 10.0) - 1.1963);
    return clamp(vec3(r, g, b), 0.0, 1.0);
  }

  void main() {
    float tau = uTau;
    float rho = length(vPos);
    vec3 col = vec3(0.0);

    // 1. shock breakout
    float flash = exp(-tau * 45.0) * smoothstep(0.0, 0.006, tau);
    col += blackbody(30000.0) * flash * (exp(-rho * rho / 0.05) * 14.0 + exp(-rho / 2.2) * 2.4);

    // 2. fireball photosphere
    float Rf = 0.1 + 1.7 * pow(tau, 0.5);
    float x = rho / Rf;
    float mu = sqrt(max(1.0 - x * x, 0.0));
    float limb = 0.35 + 0.65 * mu;
    float gran = 0.85 + 0.3 * fbm(vec3(vPos / Rf * 3.0, uTime * 0.4));
    float L = smoothstep(0.0, 0.02, tau) * (1.0 - smoothstep(0.06, 0.36, tau));
    float temp = mix(26000.0, 3200.0, smoothstep(0.0, 0.45, tau));
    col += blackbody(temp) * limb * gran * smoothstep(1.02, 0.9, x) * L * 1.6;

    // 3. ejecta shell with Rayleigh-Taylor filaments
    float Rs = 0.3 + 12.5 * pow(tau, 0.72);
    vec3 n = vec3(vPos, sqrt(max(Rs * Rs - rho * rho, 0.0))) / Rs;
    float rt = fbm(n * 3.2 + 1.7);
    float Rout = Rs * (1.0 + 0.16 * (rt - 0.5));
    float Rin = Rout * 0.86;
    float through = sqrt(max(Rout * Rout - rho * rho, 0.0)) - sqrt(max(Rin * Rin - rho * rho, 0.0));
    float column = through / (Rout - Rin) / 4.0; // ~1 at the limb
    // ridged noise: thin filaments, not clouds
    float fil = fbm(n * 5.0 + vec3(0.0, 0.0, tau * 2.0));
    float ridge = pow(1.0 - abs(fil * 2.0 - 1.0), 7.0);
    float fine = pow(1.0 - abs(fbm(n * 13.0 + 3.0) * 2.0 - 1.0), 9.0);
    float lines = fbm(n * 2.2 + 11.0);
    vec3 halpha = vec3(1.0, 0.22, 0.42);
    vec3 oiii = vec3(0.2, 0.85, 0.95);
    vec3 emission = mix(halpha, oiii, smoothstep(0.35, 0.65, lines));
    vec3 shellCol = mix(blackbody(mix(14000.0, 6000.0, tau)) * 1.2, emission, smoothstep(0.08, 0.4, tau));
    float shellOn = smoothstep(0.015, 0.08, tau) * (1.0 - smoothstep(0.5, 0.95, tau)) * (1.0 - uCard * 0.5);
    float edgeSoft = smoothstep(Rout * 1.01, Rout * 0.97, rho);
    col += shellCol * pow(column, 1.4) * (0.06 + ridge * 1.5 + fine * 0.8) * edgeSoft * shellOn * 1.5;

    // 4. the remnant's heart: a soft glow that the credential condenses out of
    col += vec3(0.75, 0.82, 1.0) * exp(-rho * rho / 0.6) * 0.35 * smoothstep(0.1, 0.3, tau) * (1.0 - uCard);

    float e = max(abs(vPos.x), abs(vPos.y)) / ${(SIZE / 2).toFixed(1)};
    col *= 1.0 - smoothstep(0.75, 1.0, e);
    gl_FragColor = vec4(col, 1.0);
  }
`

export function Supernova() {
  const mesh = useRef()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTau: { value: 0 }, uTime: { value: 0 }, uCard: { value: 0 } },
        vertexShader: `varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state) => {
    const p = xp.progress
    // runs on its own clock once triggered, so it always plays out in full
    const t0 = novaTime()
    const tau = Math.min(1, t0 / 3.6)
    const on = p >= NOVA && t0 > 0 && tau < 1
    mesh.current.visible = on
    if (!on) return
    mesh.current.quaternion.copy(state.camera.quaternion)
    material.uniforms.uTau.value = tau
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uCard.value = seg(t0, 0.9, 2.4)
  })

  return (
    <mesh ref={mesh} material={material} visible={false} frustumCulled={false}>
      <planeGeometry args={[SIZE, SIZE]} />
    </mesh>
  )
}
