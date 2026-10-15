import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'

export const GROUND = -2.4
const SUN_DIR = new THREE.Vector3(0.18, 0.07, -1).normalize()

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; } return v; }
  float ridged(vec2 p) { float v = 0.0, a = 0.55; for (int i = 0; i < 5; i++) { float n = 1.0 - abs(noise(p) * 2.0 - 1.0); v += a * n * n; p *= 2.1; a *= 0.5; } return v; }
`

const SKY = {
  zenith: new THREE.Color('#060a22'),
  upper: new THREE.Color('#23194d'),
  horizon: new THREE.Color('#ff8a5c'),
  glow: new THREE.Color('#ffd6a0'),
  below: new THREE.Color('#120a24'),
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uSun: { value: SUN_DIR },
          uZenith: { value: SKY.zenith },
          uUpper: { value: SKY.upper },
          uHorizon: { value: SKY.horizon },
          uGlow: { value: SKY.glow },
          uBelow: { value: SKY.below },
          uTime: { value: 0 },
          uFade: { value: 0 },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uSun, uZenith, uUpper, uHorizon, uGlow, uBelow; uniform float uTime, uFade;
          varying vec3 vDir;
          float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
          void main(){
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 col = mix(uHorizon, uUpper, smoothstep(0.0, 0.28, h));
            col = mix(col, uZenith, smoothstep(0.25, 0.85, h));
            col = mix(uBelow, col, smoothstep(-0.12, 0.0, h));
            float sunAmt = max(dot(d, uSun), 0.0);
            col += uGlow * pow(sunAmt, 9.0) * 0.9 + uGlow * pow(sunAmt, 120.0) * 2.6;
            col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9994, 0.9998, sunAmt) * 6.0; // the disc itself
            // stars, fading toward the dawn side
            vec3 cell = floor(d * 380.0);
            float s = step(0.9975, hash(cell)) * smoothstep(0.12, 0.6, h) * (1.0 - smoothstep(0.2, 0.9, sunAmt));
            col += vec3(s) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(cell) * 40.0));
            gl_FragColor = vec4(col * uFade, 1.0);
          }`,
      }),
    [],
  )
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh material={mat} name="sky" renderOrder={-10}>
      <sphereGeometry args={[60, 48, 24]} />
    </mesh>
  )
}

function Terrain() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSun: { value: SUN_DIR },
          uFog: { value: new THREE.Color('#3a2350') },
          uHorizon: { value: SKY.horizon },
          uTime: { value: 0 },
          uFade: { value: 0 },
        },
        vertexShader: /* glsl */ `
          ${NOISE}
          varying vec3 vWorld; varying vec3 vNormal; varying float vH;
          float height(vec2 p){
            float d = length(p * vec2(1.0, 0.75));
            float valley = smoothstep(5.5, 20.0, d);
            float far = smoothstep(10.0, 42.0, -p.y);
            float h = ridged(p * 0.055) * (6.0 + far * 10.0) * valley;
            h += fbm(p * 0.25) * 0.55;
            return h - 0.4 - (1.0 - valley) * 0.7;
          }
          void main(){
            vec3 pos = position;
            vec2 xz = (modelMatrix * vec4(pos, 1.0)).xz;
            float h = height(xz);
            float e = 0.25;
            float hx = height(xz + vec2(e, 0.0)), hz = height(xz + vec2(0.0, e));
            vNormal = normalize(vec3(h - hx, e, h - hz));
            vH = h;
            vec4 world = modelMatrix * vec4(pos.x, pos.y, pos.z, 1.0);
            world.y += h;
            vWorld = world.xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uSun, uFog, uHorizon; uniform float uTime, uFade;
          varying vec3 vWorld; varying vec3 vNormal; varying float vH;
          void main(){
            vec3 n = normalize(vNormal);
            float lit = max(dot(n, normalize(uSun + vec3(0.0, 0.25, 0.0))), 0.0);
            vec3 base = mix(vec3(0.05, 0.035, 0.09), vec3(0.16, 0.09, 0.2), smoothstep(-0.5, 6.0, vH));
            vec3 col = base + vec3(1.0, 0.55, 0.32) * pow(lit, 3.0) * 0.55;
            // snow-lit ridges catch the dawn
            col += vec3(1.0, 0.75, 0.6) * smoothstep(7.0, 13.0, vH) * pow(lit, 2.0) * 0.6;
            // faint topographic lines: the identity layer under the world
            float c = abs(fract(vH * 1.4) - 0.5);
            float line = smoothstep(0.03, 0.0, c) * (1.0 - smoothstep(6.0, 26.0, length(vWorld.xz)));
            col += vec3(0.35, 0.8, 1.0) * line * 0.35;
            float dist = length(cameraPosition - vWorld);
            float fog = smoothstep(8.0, 52.0, dist);
            col = mix(col, mix(uFog, uHorizon, 0.35), fog);
            gl_FragColor = vec4(col * uFade, 1.0);
          }`,
      }),
    [],
  )
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND, -8]} name="terrain">
      <planeGeometry args={[110, 90, 280, 240]} />
    </mesh>
  )
}

function Lake() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: { uSun: { value: SUN_DIR }, uTime: { value: 0 }, uFade: { value: 0 }, uHorizon: { value: SKY.horizon }, uUpper: { value: SKY.upper } },
        vertexShader: `varying vec3 vWorld; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uSun, uHorizon, uUpper; uniform float uTime, uFade;
          varying vec3 vWorld;
          ${NOISE}
          void main(){
            vec3 v = normalize(vWorld - cameraPosition);
            vec2 q = vWorld.xz * 0.9 + vec2(0.0, uTime * 0.15);
            vec3 n = normalize(vec3((fbm(q) - 0.5) * 0.18, 1.0, (fbm(q + 7.0) - 0.5) * 0.18));
            vec3 r = reflect(v, n);
            float up = clamp(r.y, 0.0, 1.0);
            vec3 sky = mix(uHorizon, uUpper, smoothstep(0.0, 0.35, up));
            float glint = pow(max(dot(r, normalize(uSun)), 0.0), 220.0) * 5.0;
            float fres = pow(1.0 - max(dot(-v, n), 0.0), 3.0);
            vec3 col = mix(vec3(0.02, 0.02, 0.06), sky, 0.25 + fres * 0.6) + vec3(1.0, 0.8, 0.6) * glint;
            float edge = smoothstep(14.0, 9.0, length(vWorld.xz * vec2(1.0, 1.25)));
            gl_FragColor = vec4(col * uFade, edge * uFade);
          }`,
      }),
    [],
  )
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND - 0.18, 0]} name="lake">
      <circleGeometry args={[15, 96]} />
    </mesh>
  )
}

/**
 * The world after the supernova. Fades up from white as the shockwave
 * passes; everything is procedural, so it costs no downloads.
 */
export function Landscape() {
  const root = useRef()
  useFrame((state) => {
    const p = xp.progress
    const on = p > NOVA + 0.004
    root.current.visible = on
    if (!on) return
    const fade = smooth(seg(p, NOVA + 0.004, P.dawn - 0.02))
    root.current.traverse((o) => {
      if (o.material?.uniforms?.uFade) o.material.uniforms.uFade.value = fade
      if (o.material?.uniforms?.uTime) o.material.uniforms.uTime.value = state.clock.elapsedTime
    })
  })
  return (
    <group ref={root} visible={false}>
      <Sky />
      <Terrain />
      <Lake />
      <Sparkles count={xp.mobile ? 60 : 160} scale={[26, 6, 26]} position={[0, GROUND + 2.6, -2]} size={3} speed={0.35} opacity={0.7} color="#ffcf9e" />
    </group>
  )
}
