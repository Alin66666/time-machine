import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Memory } from '../../types/memory'
import { emotions } from '../../constants/emotions'

interface PlanetProps {
  memory: Memory
  position: [number, number, number]
  onClick: (memory: Memory) => void
  isSelected: boolean
  isHighlighted: boolean
}

// Calculate how "complete" a memory is
function getCompleteness(memory: Memory): number {
  const d = memory.dimensions
  let score = 0
  if (d.subjectiveFeelings.primaryEmotion || d.subjectiveFeelings.moodDescription || d.subjectiveFeelings.emotionalTags.length > 0) score++
  if (d.visual.photos.length > 0 || d.visual.visualDescription || d.visual.dominantColors.length > 0) score++
  if (d.auditory.sounds.length > 0 || d.auditory.music || d.auditory.audioDescription) score++
  if (d.taste.flavors.length > 0 || d.taste.foodAndDrinks.length > 0 || d.taste.tasteDescription) score++
  if (d.smell.scents.length > 0 || d.smell.smellDescription) score++
  if (d.touch.textures.length > 0 || d.touch.temperature || d.touch.touchDescription) score++
  if (d.environment.location || d.environment.weather || d.environment.environmentDescription) score++
  if (d.objects.items.length > 0 || d.objects.objectsDescription) score++
  if (d.relationships.people.length > 0 || d.relationships.relationshipDescription) score++
  return score / 9
}

function getEmotionColor(memory: Memory): string {
  const emotionId = memory.dimensions.subjectiveFeelings.primaryEmotion
  const emotionDef = emotions.find((e) => e.id === emotionId)
  return emotionDef?.color || '#666666'
}

// Generate gradient texture for planet surface
function createGradientTexture(baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width / 2)
  const c = new THREE.Color(baseColor)
  const bright = c.clone().multiplyScalar(2.0)
  // Clamp to valid range
  const clamp = (v: number) => Math.min(1, v)
  gradient.addColorStop(0, `rgb(${Math.floor(clamp(bright.r) * 255)}, ${Math.floor(clamp(bright.g) * 255)}, ${Math.floor(clamp(bright.b) * 255)})`)
  gradient.addColorStop(0.5, baseColor)
  gradient.addColorStop(1, `rgb(${Math.floor(c.r * 0.4 * 255)}, ${Math.floor(c.g * 0.4 * 255)}, ${Math.floor(c.b * 0.4 * 255)})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Generate bump/noise texture
function createBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 40 + 108) // subtle variation around a mid-grey
    imageData.data[i] = v
    imageData.data[i + 1] = v
    imageData.data[i + 2] = v
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)

  // Add some larger noise patches
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = Math.random() * 30 + 8
    const shade = Math.floor(Math.random() * 40 + 100)
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture
}

// Orbit dot ring
function DotRing({
  baseSize,
  color,
  tiltX,
  tiltY,
  speed,
  dotCount,
}: {
  baseSize: number
  color: string
  tiltX: number
  tiltY: number
  speed: number
  dotCount: number
}) {
  const ref = useRef<THREE.Points>(null)

  const { positions } = useMemo(() => {
    const radius = baseSize * 1.6
    const pos = new Float32Array(dotCount * 3)
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return { positions: pos }
  }, [baseSize, dotCount])

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += speed * 0.01
    }
  })

  return (
    <points ref={ref} rotation={[tiltX, tiltY, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.6} depthWrite={false} />
    </points>
  )
}

export default function Planet({ memory, position, onClick, isSelected, isHighlighted }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const selectionRingRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const completeness = useMemo(() => getCompleteness(memory), [memory])
  const emotionColor = useMemo(() => getEmotionColor(memory), [memory])
  const baseSize = 0.6 + completeness * 0.6
  const scale = hovered ? baseSize * 1.2 : isSelected ? baseSize * 1.3 : baseSize

  const planetColor = useMemo(() => {
    if (completeness < 0.2) return new THREE.Color('#2a2a2a')
    if (completeness < 0.5) return new THREE.Color('#555555')
    return new THREE.Color(emotionColor)
  }, [completeness, emotionColor])

  const glowIntensity = useMemo(() => {
    if (completeness < 0.2) return 0
    return completeness * 0.8
  }, [completeness])

  const showRing = completeness >= 0.6
  const hasPerspectives = memory.perspectives && memory.perspectives.length > 0

  // Textures
  const gradientTex = useMemo(() => {
    if (completeness < 0.2) return undefined
    return createGradientTexture(planetColor.getStyle())
  }, [completeness, planetColor])

  const bumpTex = useMemo(() => {
    if (completeness < 0.3) return undefined
    return createBumpTexture()
  }, [completeness])

  const titleLabel = memory.title || '未命名记忆'

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(t * 0.5 + position[0]) * 0.0005
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002 + completeness * 0.003
    }
    // Atmosphere glow pulse on hover
    if (glowRef.current) {
      const target = hovered ? 1.6 : 1.4
      const current = glowRef.current.scale.x
      glowRef.current.scale.setScalar(current + (target - current) * 0.05)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      const targetOpacity = hovered ? glowIntensity * 0.3 : glowIntensity * 0.15
      mat.opacity += (targetOpacity - mat.opacity) * 0.05
    }
    // Selection ring pulse
    if (selectionRingRef.current && isSelected) {
      const pulse = 1 + Math.sin(t * 3) * 0.06
      selectionRingRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Atmosphere glow */}
      {(completeness >= 0.2 || hovered) && (
        <mesh ref={glowRef} scale={[1.4, 1.4, 1.4]}>
          <sphereGeometry args={[baseSize, 32, 32]} />
          <meshBasicMaterial
            color={planetColor}
            transparent
            opacity={glowIntensity * 0.15}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Fresnel outer glow (edge-bright) - visible for complete planets */}
      {completeness >= 0.4 && (
        <mesh scale={[1.3, 1.3, 1.3]}>
          <sphereGeometry args={[baseSize, 32, 32]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            uniforms={{
              uColor: { value: planetColor },
              uOpacity: { value: glowIntensity * 0.25 },
            }}
            vertexShader={`
              varying vec3 vNormal;
              varying vec3 vPosition;
              void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vPosition = worldPos.xyz;
                vNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec3 vNormal;
              varying vec3 vPosition;
              uniform vec3 uColor;
              uniform float uOpacity;
              void main() {
                vec3 viewDir = normalize(cameraPosition - vPosition);
                float fresnel = 1.0 - abs(dot(viewDir, vNormal));
                fresnel = pow(fresnel, 3.0);
                float alpha = fresnel * uOpacity;
                gl_FragColor = vec4(uColor, alpha);
              }
            `}
          />
        </mesh>
      )}

      {/* Main planet */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick(memory)
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={[scale, scale, scale]}
      >
        <sphereGeometry args={[baseSize, 64, 64]} />
        <meshStandardMaterial
          color={completeness < 0.2 ? '#2a2a2a' : completeness < 0.5 ? '#555555' : planetColor}
          roughness={0.55}
          metalness={0.15}
          emissive={planetColor}
          emissiveIntensity={glowIntensity * 0.35}
          map={gradientTex}
          bumpMap={bumpTex}
          bumpScale={0.04}
        />
      </mesh>

      {/* Orbit ring for complete planets */}
      {showRing && (
        <group>
          {/* Solid torus ring */}
          <mesh rotation={[Math.PI / 2.5, 0.2, 0]}>
            <torusGeometry args={[baseSize * 1.55, 0.025, 16, 120]} />
            <meshBasicMaterial color={emotionColor} transparent opacity={0.4} depthWrite={false} />
          </mesh>
          {/* Dot particle ring */}
          <DotRing baseSize={baseSize} color={emotionColor} tiltX={Math.PI / 2.5} tiltY={0.2} speed={-1.5} dotCount={60} />
        </group>
      )}

      {/* Shared memory golden ring */}
      {hasPerspectives && (
        <group>
          <mesh rotation={[Math.PI / 2.2, 0.5, 0.1]}>
            <torusGeometry args={[baseSize * 1.7, 0.02, 16, 150]} />
            <meshBasicMaterial color="#FFD54F" transparent opacity={0.5} depthWrite={false} />
          </mesh>
          <DotRing baseSize={baseSize} color="#FFD54F" tiltX={Math.PI / 2.2} tiltY={0.5} speed={1.2} dotCount={40} />
        </group>
      )}

      {/* Title label */}
      {isSelected && (
        <Text
          position={[0, baseSize + 0.5, 0]}
          fontSize={0.3}
          color="#F5F0EB"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {titleLabel}
        </Text>
      )}

      {/* Echo-highlighted ring — golden pulse for memory chain planets */}
      {isHighlighted && !isSelected && (
        <mesh>
          <ringGeometry args={[baseSize * 1.65, baseSize * 1.75, 120]} />
          <meshBasicMaterial color="#FFD54F" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}

      {/* Selection indicator ring with pulse */}
      {isSelected && (
        <mesh ref={selectionRingRef}>
          <ringGeometry args={[baseSize * 1.8, baseSize * 1.9, 100]} />
          <meshBasicMaterial color="#FFB74D" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
