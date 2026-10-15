import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'

export const DISK_TILT = 0.17 // radians above edge-on: the grazing view that shows the lensed far side
// World units per Schwarzschild radius. The shadow of a Schwarzschild hole is
// 2.6 Rs across in radius, so this puts the shadow edge at 1 world unit.
const RS = 1 / 2.6
const BOUND = 18 // Rs: rays are traced inside this sphere, straight lines outside it

/*
 * A ray-traced Schwarzschild black hole. Each pixel's light ray is integrated
 * backwards from the camera through the curved spacetime around the hole
 * (the photon orbit equation, a = -1.5 h^2 r / |r|^5 in Rs units). Nothing is
 * painted on: the shadow, the thin photon ring, and the far side of the disk
 * arching over and under the hole all fall out of the ray bending.
 *
 * The accretion disk is a thin Novikov-Thorne-style disk from the innermost
 * stable orbit (3 Rs) outward. Its temperature follows T ~ r^-3/4 (1 - sqrt(3/r))^1/4,
 * gas orbits at Keplerian speed so turbulence shears into spirals, and each
 * crossing is Doppler- and gravitationally shifted: the approaching side is
 * brighter and bluer, the receding side dimmer and redder.
 */
const fragment = (steps) => /* glsl */ `
  uniform mat4 uInv;
  uniform vec3 uCam;
  uniform float uTime, uIntensity, uDrain;
  varying vec3 vWorld;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.07 + 17.0; a *= 0.5; }
    return v;
  }

  // Blackbody colour for a temperature in kelvin (Tanner Helland's fit).
  vec3 blackbody(float k) {
    float t = clamp(k, 1000.0, 40000.0) / 100.0;
    float r = t <= 66.0 ? 1.0 : 1.2929 * pow(t - 60.0, -0.1332);
    float g = t <= 66.0 ? 0.3901 * log(t) - 0.6318 : 1.1299 * pow(t - 60.0, -0.0755);
    float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : 0.5432 * log(t - 10.0) - 1.1963);
    return clamp(vec3(r, g, b), 0.0, 1.0);
  }

  // Emission and opacity where a ray crosses the disk plane at q, travelling along v.
  vec4 disk(vec3 q, vec3 v) {
    float r = length(q.xy);
    if (r < 3.0 || r > 15.0) return vec4(0.0);
    // Keplerian angular speed, sped up for the screen. The pattern is rebuilt
    // every few orbits (two phases crossfaded) so the shear never winds into noise.
    float omega = 2.2 * pow(r, -1.5);
    float phi = atan(q.y, q.x);
    float cycle = uTime * 0.12;
    float f1 = fract(cycle), f2 = fract(cycle + 0.5);
    vec2 base = vec2(log(r) * 7.0, 0.0);
    float a1 = phi - omega * (f1 - 0.5) * 8.0 * 3.14159;
    float a2 = phi - omega * (f2 - 0.5) * 8.0 * 3.14159;
    float n1 = fbm(base + vec2(0.0, 0.0) + vec2(sin(a1), cos(a1)) * r * 0.9 + floor(cycle) * 3.1);
    float n2 = fbm(base + vec2(5.2, 1.3) + vec2(sin(a2), cos(a2)) * r * 0.9 + floor(cycle + 0.5) * 3.1);
    float w = abs(f1 - 0.5) * 2.0;
    float gas = mix(n1, n2, w);
    float lanes = 0.5 + 0.5 * sin(log(r) * 38.0 + gas * 6.0);
    float density = smoothstep(0.25, 0.8, gas) * (0.45 + 0.55 * lanes);

    // Temperature profile, peaking just outside the inner edge.
    float temp = pow(r / 3.0, -0.75) * pow(max(1.0 - sqrt(3.0 / r), 0.0), 0.25) / 0.488;
    // Orbital speed (fraction of c) and the redshift factor g seen by the camera.
    float beta = sqrt(0.5 / (r - 1.0));
    float gamma = inversesqrt(1.0 - beta * beta);
    vec3 u = normalize(vec3(-q.y, q.x, 0.0));
    float D = 1.0 / (gamma * (1.0 + beta * dot(u, normalize(v))));
    float g = D * sqrt(1.0 - 1.0 / r);
    vec3 col = blackbody(4300.0 * temp * g) * pow(g, 3.0) * temp * temp;

    // as the hole swallows its last meal the disk drains inward from the outside
    float edge = smoothstep(3.0, 3.2, r) * (1.0 - smoothstep(6.5 * (1.0 - 0.5 * uDrain), 13.0 * (1.0 - 0.68 * uDrain), r));
    float alpha = clamp(density * edge * 1.15, 0.0, 1.0);
    return vec4(col * density * edge * 1.25, alpha);
  }

  void main() {
    vec3 ro = uCam;
    vec3 rd = normalize((uInv * vec4(vWorld, 1.0)).xyz - uCam);

    // Straight line until the ray enters the bounding sphere.
    float b = dot(ro, rd);
    float c = dot(ro, ro) - ${BOUND.toFixed(1)} * ${BOUND.toFixed(1)};
    float hd = b * b - c;
    if (hd < 0.0) discard;
    vec3 p = ro + rd * max(-b - sqrt(hd), 0.0);
    vec3 v = rd;
    vec3 L = cross(p, v);
    float h2 = dot(L, L);

    vec3 col = vec3(0.0);
    float alpha = 0.0;
    bool escaped = false;
    for (int i = 0; i < ${steps}; i++) {
      float r = length(p);
      if (r < 1.0) { alpha = 1.0; break; }
      float dt = clamp(0.065 * r, 0.02, 0.9);
      vec3 acc = -1.5 * h2 * p / pow(r, 5.0);
      vec3 vn = v + acc * dt;
      vec3 pn = p + vn * dt;
      if (p.z * pn.z < 0.0) {
        vec3 q = mix(p, pn, p.z / (p.z - pn.z));
        vec4 d = disk(q, vn);
        col += (1.0 - alpha) * d.rgb;
        alpha += (1.0 - alpha) * d.a;
        if (alpha > 0.98) break;
      }
      p = pn;
      v = vn;
      if (r > ${(BOUND + 0.5).toFixed(1)} && dot(p, v) > 0.0) { escaped = true; break; }
    }

    // Background stars seen through the lens: an Einstein ring of smeared starlight.
    vec2 e = abs(vUv - 0.5) * 2.0;
    float fade = 1.0 - smoothstep(0.7, 1.0, max(e.x, e.y));
    vec3 stars = vec3(0.0);
    if (escaped) {
      vec3 dir = normalize(v) * 140.0;
      vec3 cell = floor(dir);
      float s = hash3(cell);
      float d = length(fract(dir) - 0.5);
      stars = vec3(0.85, 0.9, 1.0) * step(0.985, s) * smoothstep(0.35, 0.0, d) * 0.9;
    }
    col *= uIntensity;
    gl_FragColor = vec4(col + (1.0 - alpha) * stars * fade, alpha * fade);
  }
`

const vertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

function radialSprite(stops) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  stops.forEach(([o, col]) => grad.addColorStop(o, col))
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

const inv = new THREE.Matrix4()

const cam = new THREE.Vector3()

/**
 * The black hole. Grows in as the swarm turns into a threat, swallows it,
 * then implodes into the supernova.
 */
export function BlackHole() {
  const root = useRef()
  const frame = useRef()
  const billboard = useRef()
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uInv: { value: new THREE.Matrix4() }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uIntensity: { value: 1 }, uDrain: { value: 0 } },
        vertexShader: vertex,
        fragmentShader: fragment(xp.mobile ? 76 : 170),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        // the shader outputs premultiplied colour
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
      }),
    [],
  )
  const halo = useMemo(() => radialSprite([[0, 'rgba(255,170,110,0.06)'], [0.4, 'rgba(255,110,60,0.015)'], [1, 'rgba(0,0,0,0)']]), [])

  useFrame((state, dt) => {
    const p = xp.progress
    const g = root.current
    if (!g) return
    const grow = smooth(seg(p, P.problem + 0.03, P.void))
    const implode = smooth(seg(p, NOVA - 0.035, NOVA))
    const s = grow * (1 + 0.15 * smooth(seg(p, P.void, P.collapse))) * (1 - implode)
    g.visible = s > 0.002
    xp.bhScale = g.visible ? s : 0
    if (!g.visible) return
    g.scale.setScalar(s)
    if (!xp.reduced) g.rotation.z = THREE.MathUtils.damp(g.rotation.z, xp.pointer.x * 0.04, 2, dt)

    // feeding makes the disk flare; then the disk drains in and the hole implodes
    const feed = 1 + 0.35 * Math.sin(Math.PI * seg(p, P.void + 0.03, P.collapse))
    const drain = smooth(seg(p, P.collapse + 0.005, NOVA - 0.008))
    material.uniforms.uIntensity.value = feed * (1 + drain * 1.6 + implode * 3)
    material.uniforms.uDrain.value = drain
    material.uniforms.uTime.value = state.clock.elapsedTime
    billboard.current.quaternion.copy(state.camera.quaternion)
    frame.current.updateWorldMatrix(true, false)
    inv.copy(frame.current.matrixWorld).invert()
    material.uniforms.uInv.value.copy(inv)
    material.uniforms.uCam.value.copy(cam.copy(state.camera.position).applyMatrix4(inv))
  })

  return (
    <group ref={root}>
      {/* the frame the shader traces in: Rs units, disk in the local XY plane */}
      <group ref={frame} rotation={[-Math.PI / 2 + DISK_TILT, 0, 0]} scale={RS} />
      {/* the shadow writes depth so wallets behind the hole are hidden */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[0.96, 48, 48]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <group ref={billboard}>
        <mesh material={material} renderOrder={2} frustumCulled={false}>
          <planeGeometry args={[BOUND * RS * 2.1, BOUND * RS * 2.1]} />
        </mesh>
        <sprite scale={[18, 18, 1]} renderOrder={-1}>
          <spriteMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </group>
  )
}
