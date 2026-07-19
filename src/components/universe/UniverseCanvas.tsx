import { useRef, useCallback, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { Memory } from '../../types/memory'
import Planet from './Planet'

interface UniverseCanvasProps {
  memories: Memory[]
  selectedId: string | null
  onSelectMemory: (memory: Memory) => void
}

// Arrange memories in a spiral galaxy pattern
function getGalaxyPosition(index: number, total: number): [number, number, number] {
  const angle = index * 0.8
  const radius = 3 + index * 1.2
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const y = (Math.random() - 0.5) * 3
  return [x, y, z]
}

// Pulsing core with glowing halos
function GalacticCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const halo1Ref = useRef<THREE.Mesh>(null)
  const halo2Ref = useRef<THREE.Mesh>(null)
  const halo3Ref = useRef<THREE.Mesh>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 1.2) * 0.06 + Math.sin(t * 2.1) * 0.04
    if (coreRef.current) {
      coreRef.current.scale.setScalar(pulse)
    }
    if (halo1Ref.current) {
      halo1Ref.current.scale.setScalar(1.8 + Math.sin(t * 0.8) * 0.15)
      ;(halo1Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 1.5) * 0.04
    }
    if (halo2Ref.current) {
      halo2Ref.current.scale.setScalar(2.3 + Math.cos(t * 0.7) * 0.2)
    }
    if (halo3Ref.current) {
      halo3Ref.current.scale.setScalar(3.0 + Math.sin(t * 0.5) * 0.25)
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += 0.001
      ring1Ref.current.rotation.x += 0.0005
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= 0.0008
      ring2Ref.current.rotation.y += 0.0006
    }
  })

  return (
    <group>
      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshBasicMaterial color="#FFD54F" />
      </mesh>
      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#FFF9C4" />
      </mesh>
      {/* Core point light */}
      <pointLight intensity={2.5} color="#FFB74D" distance={12} decay={2} />

      {/* Halo layers */}
      <mesh ref={halo1Ref} scale={[1.8, 1.8, 1.8]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#FFB74D" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh ref={halo2Ref} scale={[2.3, 2.3, 2.3]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#FF9800" transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <mesh ref={halo3Ref} scale={[3.0, 3.0, 3.0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#E1BEE7" transparent opacity={0.04} depthWrite={false} />
      </mesh>

      {/* Particle rings around core */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2.8, 0.3, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 200]} />
        <meshBasicMaterial color="#FFB74D" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2.2, -0.4, 0.2]}>
        <torusGeometry args={[2.8, 0.01, 16, 180]} />
        <meshBasicMaterial color="#CE93D8" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      {/* Inner thin ring */}
      <mesh rotation={[Math.PI / 3.5, 0.7, 0.1]}>
        <torusGeometry args={[1.6, 0.008, 16, 150]} />
        <meshBasicMaterial color="#FFF9C4" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Stardust near core */}
      <StardustParticles count={120} radius={5} colors={['#FFD54F', '#FFB74D', '#CE93D8', '#81D4FA', '#FFFFFF']} size={0.03} />
    </group>
  )
}

// Floating stardust particles
function StardustParticles({ count, radius, colors, size }: { count: number; radius: number; colors: string[]; size: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, colorArray } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.3 + Math.random() * 0.7)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const c = new THREE.Color(colors[Math.floor(Math.random() * colors.length)])
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return { positions: pos, colorArray: col }
  }, [count, radius, colors])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00015
      pointsRef.current.rotation.x += 0.0001
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function UniverseCanvas({ memories, selectedId, onSelectMemory }: UniverseCanvasProps) {
  const controlsRef = useRef<any>(null)

  const handleClick = useCallback((memory: Memory) => {
    onSelectMemory(memory)
  }, [onSelectMemory])

  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0a0a1a'))
      }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={0.8} color="#FFB74D" />
        <directionalLight position={[5, 8, 5]} intensity={0.25} color="#ffffff" />
        <directionalLight position={[-3, -2, -5]} intensity={0.1} color="#CE93D8" />

        {/* Rich starfield */}
        <Stars radius={60} depth={60} count={4000} factor={4} saturation={0.3} fade speed={0.4} />

        {/* Nebula fog */}
        <fog attach="fog" args={['#0a0a1a', 18, 65]} />

        {/* Galactic core */}
        <GalacticCore />

        {/* Planets */}
        {memories.map((memory, index) => (
          <Planet
            key={memory.id}
            memory={memory}
            position={getGalaxyPosition(index, memories.length)}
            onClick={handleClick}
            isSelected={memory.id === selectedId}
          />
        ))}

        {/* Empty state: colorful floating dust particles */}
        {memories.length === 0 && (
          <StardustParticles
            count={60}
            radius={8}
            colors={['#FFD54F', '#FFB74D', '#CE93D8', '#81D4FA', '#A5D6A7', '#FFFFFF']}
            size={0.06}
          />
        )}

        {/* Scattered stardust throughout the scene */}
        <StardustParticles
          count={80}
          radius={20}
          colors={['#FFD54F', '#FFB74D', '#CE93D8', '#81D4FA', '#FFFFFF']}
          size={0.025}
        />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
          autoRotate
          autoRotateSpeed={0.12}
          dampingFactor={0.05}
        />
      </Suspense>
    </Canvas>
  )
}
