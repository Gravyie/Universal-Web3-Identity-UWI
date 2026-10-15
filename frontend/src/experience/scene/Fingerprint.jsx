import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { xp } from '../store'
import { P, seg, smooth } from '../chapters'
import { PRINT_HEIGHT as HEIGHT, PRINT_POS, samplePrint } from './printGeometry'
import { Reticle } from './Reticle'

const SCAN_PERIOD = 7 // seconds per verification cycle

/*
 * The hero: @you's print, the very one on the card, drawn in points of light.
 * They stream in from deep space and settle into the ridges (a thousand
 * points become one person), a heartbeat ring pulses outward through the
 * ridges, light runs along each ridge, a scan sweeps it to verify, and the
 * pointer ripples it like a surface. Scrolling on shatters it back into the
 * swarm of wallets the story starts with.
 */
const vertex = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aU, aRidge, aSeed;
  uniform float uTime, uForm, uBurst, uScale, uSize, uScan, uPulse;
  uniform vec3 uPointer;
  uniform float uPointerOn;
  varying float vGlow, vHue, vAlpha;

  void main() {
    vec3 p = position;

    // light runs along each ridge, at a speed set by the ridge
    float run = pow(0.5 + 0.5 * sin(aU * 6.2831 * 3.0 - uTime * (0.8 + aRidge * 0.6) + aRidge * 9.0), 6.0);
    // heartbeat: a ring travelling from the core outward through the ridges
    float beat = exp(-pow((aRidge - uPulse) * 9.0, 2.0));
    // verification scan: a horizontal band sweeping down the print
    float scan = exp(-pow((p.y - uScan) * 3.2, 2.0));

    // pointer ripple: points lift toward the viewer and spread out
    vec2 d = p.xy - uPointer.xy;
    float near = exp(-dot(d, d) / 0.9) * uPointerOn;
    p.xy += normalize(d + 1e-4) * near * 0.22;
    p.z += near * 0.9 + sin(length(d) * 6.0 - uTime * 5.0) * near * 0.12;

    // formation: stream in from the scatter, inner ridges first
    float f = smoothstep(aRidge * 0.45, aRidge * 0.45 + 0.55, uForm);
    f = 1.0 - pow(1.0 - f, 3.0);
    vec3 drift = vec3(sin(uTime * 0.3 + aSeed * 40.0), cos(uTime * 0.27 + aSeed * 31.0), 0.0) * 0.35;
    p = mix(aScatter + drift, p, f);
    // the burst into the swarm when the story starts
    p = mix(p, aScatter * (1.6 + aSeed), uBurst);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aSeed * 0.9) * (1.0 + beat * 0.8 + near * 1.2 + scan * 0.6);
    gl_PointSize = size * uScale / -mv.z;

    vGlow = 0.075 + run * 0.3 + beat * 0.75 + scan * 0.55 + near * 0.7;
    vHue = atan(position.y, position.x) / 6.2831 + aRidge * 0.35 + uTime * 0.03;
    vAlpha = (0.25 + 0.75 * f) * (1.0 - uBurst * 0.9);
  }
`

const fragment = /* glsl */ `
  varying float vGlow, vHue, vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    // the card's holo palette: aurora cyan, lilac, rose
    float h = fract(vHue);
    vec3 cyan = vec3(0.5, 0.89, 1.0), lilac = vec3(0.68, 0.6, 1.0), rose = vec3(1.0, 0.6, 0.84);
    vec3 col = h < 0.33 ? mix(cyan, lilac, h / 0.33) : h < 0.66 ? mix(lilac, rose, (h - 0.33) / 0.33) : mix(rose, cyan, (h - 0.66) / 0.34);
    col = mix(col, vec3(1.0), clamp(vGlow - 1.2, 0.0, 0.6));
    gl_FragColor = vec4(col * vGlow * a * vAlpha, 1.0);
  }
`

function buildPrint(count) {
  const { position, u, ridge, radius } = samplePrint(count)
  const scatter = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const v = new THREE.Vector3()
  for (let i = 0; i < count; i++) {
    v.randomDirection().multiplyScalar(5 + Math.random() * 12)
    scatter.set([v.x, v.y * 0.7, v.z - 4], i * 3)
    seed[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(position, 3))
  g.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))
  g.setAttribute('aU', new THREE.BufferAttribute(u, 1))
  g.setAttribute('aRidge', new THREE.BufferAttribute(ridge, 1))
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  g.userData.radius = radius
  return g
}

const ray = new THREE.Raycaster()
const plane = new THREE.Plane()
const hit = new THREE.Vector3()
const ndc = new THREE.Vector2()
const normal = new THREE.Vector3()

export function Fingerprint() {
  const group = useRef()
  const label = useRef()
  const ring = useRef()
  const center = useMemo(() => new THREE.Vector3(), [])
  const born = useRef(0)
  const geometry = useMemo(() => buildPrint(xp.mobile ? 12000 : 26000), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uForm: { value: 0 },
          uBurst: { value: 0 },
          uScale: { value: 1000 },
          uSize: { value: 0.036 },
          uScan: { value: 10 },
          uPulse: { value: -1 },
          uPointer: { value: new THREE.Vector3(99, 99, 0) },
          uPointerOn: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const p = xp.progress
    const burst = smooth(seg(p, 0.004, P.problem * 0.7))
    g.visible = burst < 0.999
    if (!g.visible) return
    const t = state.clock.elapsedTime
    const u = material.uniforms
    // forms once the preloader has lifted
    if (xp.revealed) born.current = xp.reduced ? 1 : Math.min(1, born.current + dt / 3.2)
    u.uTime.value = t
    u.uForm.value = born.current
    u.uBurst.value = burst
    u.uScale.value = state.size.height / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2))

    // heartbeat every 3.5s; the scan starts once the print has formed
    u.uPulse.value = xp.reduced ? -1 : ((t % 3.5) / 3.5) * 1.4 - 0.1
    const cycle = born.current < 1 ? 0 : ((t - 3.2) % SCAN_PERIOD) / SCAN_PERIOD
    const scanning = cycle > 0.05 && cycle < 0.45
    u.uScan.value = scanning ? HEIGHT / 2 - ((cycle - 0.05) / 0.4) * HEIGHT : 99

    // pointer on the print's plane, in its local space
    ndc.set(xp.pointer.x, -xp.pointer.y)
    ray.setFromCamera(ndc, state.camera)
    g.getWorldDirection(normal)
    plane.setFromNormalAndCoplanarPoint(normal, g.getWorldPosition(hit))
    if (ray.ray.intersectPlane(plane, hit)) {
      g.worldToLocal(hit)
      u.uPointer.value.lerp(hit, 1 - Math.exp(-dt * 10))
      const inside = Math.abs(hit.x) < HEIGHT * 0.5 && Math.abs(hit.y) < HEIGHT * 0.6
      u.uPointerOn.value = THREE.MathUtils.damp(u.uPointerOn.value, inside && !xp.reduced ? 1 : 0, 4, dt)
    }
    // a gentle lean toward the pointer, for depth
    if (!xp.reduced) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, xp.pointer.x * 0.16, 3, dt)
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, xp.pointer.y * 0.12, 3, dt)
    }

    // the scanner ring, sized to the print's projected height
    if (ring.current) {
      const dist = state.camera.position.distanceTo(g.getWorldPosition(center))
      const px = (geometry.userData.radius * 2.22 * state.size.height) / (2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov) / 2) * dist)
      ring.current.style.width = ring.current.style.height = `${Math.round(px)}px`
      ring.current.style.opacity = String((1 - Math.min(1, burst * 3)) * smooth(seg(born.current, 0.35, 1)))
    }
    if (label.current) {
      const done = born.current >= 1 && cycle >= 0.45
      label.current.dataset.state = born.current < 1 ? 'forming' : scanning ? 'scanning' : done ? 'verified' : 'idle'
      label.current.style.opacity = String((1 - burst) * smooth(seg(born.current, 0.7, 1)))
    }
  })

  return (
    <group ref={group} position={PRINT_POS} rotation={[0, 0, 0]}>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <Html center zIndexRange={[16, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={ring} style={{ width: 0, height: 0, opacity: 0 }}>
          <Reticle />
        </div>
      </Html>
      <Html position={[0, -HEIGHT * 0.86, 0]} center zIndexRange={[16, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} data-state="forming" className="print-label group flex max-md:!hidden items-center gap-2 font-mono text-[11px] tracking-wide whitespace-nowrap text-white/55" style={{ opacity: 0 }}>
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 rounded-full bg-[#7fe3ff] group-data-[state=scanning]:animate-ping" />
            <span className="relative size-1.5 rounded-full bg-[#7fe3ff] group-data-[state=verified]:bg-emerald-400" />
          </span>
          <span className="hidden group-data-[state=scanning]:inline">VERIFYING @you</span>
          <span className="hidden group-data-[state=verified]:inline group-data-[state=idle]:inline">
            @you · <span className="text-emerald-300">UNIQUE HUMAN</span>
          </span>
          <span className="hidden group-data-[state=forming]:inline">@you</span>
        </div>
      </Html>
    </group>
  )
}
