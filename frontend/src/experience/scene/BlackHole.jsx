import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'

export const DISK_TILT = 0.2 // radians below edge-on; Interstellar-style grazing view

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
`

/*
 * Disk shading, shared by the disk and its lensed image. r is normalised
 * radius (0 = inner edge at the ISCO, 1 = outer edge), a the azimuth.
 * Gas orbits at Keplerian speed (omega ~ r^-1.5), so turbulence shears into
 * spiral streaks. Relativistic beaming brightens and blue-shifts the side
 * moving toward us and dims and reddens the receding side.
 */
const DISK_COLOR = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  ${NOISE}
  vec3 diskColor(float r, float a, float approach) {
    float rr = 0.35 + r * 1.9;
    float omega = 1.6 * pow(rr, -1.5);
    float ang = a - uTime * omega;
    vec2 q = vec2(log(rr) * 5.0, ang * 2.0);
    float gas = fbm(q * vec2(1.0, 1.0) + vec2(0.0, log(rr) * 3.0));
    float fil = fbm(q * vec2(3.0, 6.0) + gas * 1.5);
    float density = smoothstep(0.25, 0.85, gas * 0.55 + fil * 0.6);
    float temp = pow(1.0 - r, 1.15);
    vec3 hot = vec3(1.0, 0.94, 0.86);
    vec3 warm = vec3(1.0, 0.6, 0.24);
    vec3 cool = vec3(0.62, 0.16, 0.05);
    vec3 col = mix(cool, warm, smoothstep(0.05, 0.55, temp));
    col = mix(col, hot, smoothstep(0.55, 0.95, temp));
    float beta = 0.55 * approach;
    float doppler = pow(1.0 + beta, 3.0) / pow(1.0 + 0.55, 3.0) * 2.2 + 0.08;
    col = mix(col, col * vec3(0.8, 0.95, 1.25), clamp(beta, 0.0, 1.0)); // blueshift
    col = mix(col, col * vec3(1.15, 0.8, 0.6), clamp(-beta, 0.0, 1.0)); // redshift
    float edge = smoothstep(0.0, 0.03, r) * smoothstep(1.0, 0.55, r);
    return col * density * temp * doppler * edge * uIntensity * 1.5;
  }
`

function useDiskMaterial(lensed) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 }, uInner: { value: lensed ? 1.04 : 1.55 }, uOuter: { value: lensed ? 1.85 : 5.6 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vPos;
          void main() { vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uInner, uOuter;
          varying vec2 vPos;
          ${DISK_COLOR}
          void main() {
            float d = length(vPos);
            float r = clamp((d - uInner) / (uOuter - uInner), 0.0, 1.0);
            float a = atan(vPos.y, vPos.x);
            ${
              lensed
                ? `// far side of the disk, bent over the top and under the bottom of the shadow:
                   // a thin band hugging the photon ring, brightest closest to it
                   float arc = pow(abs(sin(a)), 0.6);
                   float side = vPos.y > 0.0 ? 1.0 : 0.45;
                   float hug = exp(-r * 3.2);
                   vec3 c = diskColor(r * 0.6, a * 0.5 + 1.0, cos(a)) * arc * side * hug * 2.4;`
                : `vec3 c = diskColor(r, a, -sin(a));`
            }
            gl_FragColor = vec4(c, 1.0);
          }
        `,
      }),
    [lensed],
  )
}

function radialSprite(stops) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  stops.forEach(([o, col]) => grad.addColorStop(o, col))
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

/**
 * The black hole. Grows in as the swarm turns into a threat, eats it, then
 * implodes into the supernova. Everything is procedural and drawn in a
 * handful of draw calls so it holds 60fps on laptops.
 */
export function BlackHole() {
  const root = useRef()
  const billboard = useRef()
  const disk = useDiskMaterial(false)
  const lensed = useDiskMaterial(true)
  const halo = useMemo(() => radialSprite([[0, 'rgba(255,160,90,0.16)'], [0.35, 'rgba(255,90,40,0.05)'], [1, 'rgba(0,0,0,0)']]), [])
  const photon = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uIntensity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uIntensity; varying vec2 vPos;
          void main(){ float d = length(vPos); float ring = exp(-pow((d - 1.025) * 90.0, 2.0)); float rim = exp(-pow((d - 1.06) * 20.0, 2.0)) * 0.35;
          vec3 c = vec3(1.0, 0.86, 0.7) * (ring * 3.2 + rim) * uIntensity; gl_FragColor = vec4(c, 1.0); }`,
      }),
    [],
  )

  useFrame((state, dt) => {
    const p = xp.progress
    const t = state.clock.elapsedTime
    const g = root.current
    if (!g) return
    const grow = smooth(seg(p, P.farmed + 0.02, P.void))
    const implode = smooth(seg(p, NOVA - 0.035, NOVA))
    const s = grow * (1 + 0.15 * smooth(seg(p, P.void, P.collapse))) * (1 - implode)
    g.visible = s > 0.002
    g.scale.setScalar(Math.max(0.0001, s))
    // feeding makes the disk flare
    const feed = 1 + 0.3 * Math.sin(Math.PI * seg(p, P.void + 0.03, P.collapse))
    disk.uniforms.uTime.value = t
    lensed.uniforms.uTime.value = t
    disk.uniforms.uIntensity.value = feed * (1 + implode * 3)
    lensed.uniforms.uIntensity.value = feed * (1 + implode * 3)
    photon.uniforms.uIntensity.value = 1 + implode * 4
    // lensed arcs and photon ring always face the camera
    billboard.current.quaternion.copy(state.camera.quaternion)
    if (!xp.reduced) g.rotation.z = THREE.MathUtils.damp(g.rotation.z, xp.pointer.x * 0.04, 2, dt)
  })

  return (
    <group ref={root}>
      {/* event horizon: pure black, writes depth so everything behind is hidden */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="black" />
      </mesh>
      {/* the flat accretion disk, tilted so we graze it */}
      <mesh rotation={[-Math.PI / 2 + DISK_TILT, 0, 0]} material={disk} renderOrder={2}>
        <ringGeometry args={[1.55, 5.6, 320, 1]} />
      </mesh>
      <group ref={billboard}>
        {/* the far side of the disk, bent over and under the horizon by gravity */}
        <mesh material={lensed} position={[0, 0, -0.02]} renderOrder={0}>
          <ringGeometry args={[1.04, 1.85, 256, 1]} />
        </mesh>
        <mesh material={photon} renderOrder={3}>
          <ringGeometry args={[0.98, 1.15, 256, 1]} />
        </mesh>
        <sprite scale={[16, 16, 1]} renderOrder={-1}>
          <spriteMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </group>
  )
}
