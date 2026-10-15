import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, P, seg, smooth } from '../chapters'

export const DISK_TILT = 0.32 // radians below edge-on; Interstellar-style grazing view

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
 * Disk shading, shared by the flat disk and its lensed image. `r` is the
 * normalised radius (0 inner edge, 1 outer), `a` the angle. Inner gas is
 * white-hot, cooling to amber and deep red; streaks shear because inner
 * orbits are faster; the approaching side is brighter (relativistic beaming).
 */
const DISK_COLOR = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  ${NOISE}
  vec3 diskColor(float r, float a, float beamSide) {
    float speed = 1.6 / (0.35 + r);
    vec2 q = vec2(r * 4.0, a * 3.0 - uTime * speed);
    float streaks = fbm(vec2(q.x * 3.0, q.y * 2.0)) * 0.7 + fbm(q * 6.0) * 0.45;
    float bands = 0.6 + 0.4 * sin(r * 60.0 + fbm(q * 2.0) * 6.0);
    vec3 hot = vec3(1.0, 0.95, 0.88);
    vec3 warm = vec3(1.0, 0.55, 0.18);
    vec3 cool = vec3(0.55, 0.08, 0.04);
    vec3 col = mix(hot, warm, smoothstep(0.0, 0.35, r));
    col = mix(col, cool, smoothstep(0.35, 1.0, r));
    float falloff = pow(1.0 - r, 1.6);
    float beam = 1.0 + 0.85 * beamSide;
    float edge = smoothstep(0.0, 0.06, r) * smoothstep(1.0, 0.7, r);
    return col * streaks * bands * falloff * beam * edge * uIntensity * 2.3;
  }
`

function useDiskMaterial(lensed) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 }, uInner: { value: 1.35 }, uOuter: { value: 4.4 } },
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
                ? `// lensed image: only the arcs above and below the horizon, thinner and fainter
                   float arc = smoothstep(0.15, 0.85, abs(sin(a)));
                   float top = step(0.0, vPos.y) * 1.0 + step(vPos.y, 0.0) * 0.35;
                   vec3 c = diskColor(r * 1.25, a * 0.5, cos(a)) * arc * top * 0.75;`
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
  const halo = useMemo(() => radialSprite([[0, 'rgba(255,170,90,0.32)'], [0.35, 'rgba(255,90,40,0.1)'], [1, 'rgba(0,0,0,0)']]), [])
  const photon = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uIntensity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vPos; void main(){ vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uIntensity; varying vec2 vPos;
          void main(){ float d = length(vPos); float ring = exp(-pow((d - 1.07) * 38.0, 2.0)); float rim = exp(-pow((d - 1.0) * 9.0, 2.0)) * 0.25;
          vec3 c = vec3(1.0, 0.8, 0.6) * (ring * 4.0 + rim) * uIntensity; gl_FragColor = vec4(c, 1.0); }`,
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
    const feed = 1 + 0.45 * Math.sin(Math.PI * seg(p, P.void + 0.03, P.collapse))
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
        <ringGeometry args={[1.35, 4.4, 256, 1]} />
      </mesh>
      <group ref={billboard}>
        {/* the far side of the disk, bent over and under the horizon by gravity */}
        <mesh material={lensed} position={[0, 0, -0.02]} renderOrder={0}>
          <ringGeometry args={[1.12, 2.6, 192, 1]} />
        </mesh>
        <mesh material={photon} renderOrder={3}>
          <ringGeometry args={[0.95, 1.25, 192, 1]} />
        </mesh>
        <sprite scale={[16, 16, 1]} renderOrder={-1}>
          <spriteMaterial map={halo} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </group>
  )
}
