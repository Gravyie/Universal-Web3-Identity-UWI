import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { xp } from '../store'
import { NOVA, seg, smooth } from '../chapters'

const EJECTA = 900

/**
 * The implosion's rebound: a blinding core, a shockwave ring with a
 * chromatic edge and a spray of glowing ejecta. It hides the cut from space
 * to the landscape.
 */
export function Supernova() {
  const core = useRef()
  const shock = useRef()
  const points = useRef()

  const shockMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uFade: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uFade; varying vec2 vUv;
          void main(){
            float d = length(vUv - 0.5) * 2.0;
            float edge = exp(-pow((d - 0.92) * 22.0, 2.0));
            float inner = smoothstep(0.92, 0.2, d) * 0.12;
            vec3 c = vec3(edge * 1.4, edge * 1.9 + inner, edge * 3.0 + inner * 2.0);
            c.r += exp(-pow((d - 0.96) * 28.0, 2.0)) * 1.5; // red fringe outside
            gl_FragColor = vec4(c * uFade * 2.2, 1.0);
          }`,
      }),
    [],
  )

  const { positions, dirs } = useMemo(() => {
    const dirs = new Float32Array(EJECTA * 3)
    for (let i = 0; i < EJECTA; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.5 + Math.random())
      v.y *= 0.55
      dirs.set([v.x, v.y, v.z], i * 3)
    }
    return { positions: new Float32Array(EJECTA * 3), dirs }
  }, [])

  useFrame((state) => {
    const p = xp.progress
    const boom = seg(p, NOVA - 0.01, NOVA + 0.045)
    const visible = boom > 0 && boom < 1
    core.current.visible = shock.current.visible = points.current.visible = visible
    if (!visible) return

    const flash = Math.sin(Math.PI * smooth(seg(boom, 0, 0.6)))
    core.current.scale.setScalar(0.2 + smooth(boom) * 5)
    core.current.material.opacity = flash

    shock.current.quaternion.copy(state.camera.quaternion)
    shock.current.scale.setScalar(0.1 + smooth(boom) * 34)
    shockMat.uniforms.uFade.value = 1 - smooth(seg(boom, 0.3, 1))

    const travel = 1 - Math.pow(1 - boom, 2.4)
    for (let i = 0; i < EJECTA; i++) {
      positions[i * 3] = dirs[i * 3] * travel * 18
      positions[i * 3 + 1] = dirs[i * 3 + 1] * travel * 18
      positions[i * 3 + 2] = dirs[i * 3 + 2] * travel * 18
    }
    points.current.geometry.attributes.position.needsUpdate = true
    points.current.material.opacity = 1 - smooth(seg(boom, 0.4, 1))
  })

  return (
    <group>
      <mesh ref={core} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={[6, 7, 9]} toneMapped={false} transparent depthWrite={false} />
      </mesh>
      <mesh ref={shock} material={shockMat} visible={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <points ref={points} visible={false} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={EJECTA} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.07} color={[3, 2.2, 1.6]} toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}
