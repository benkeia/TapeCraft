import { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, MeshTransmissionMaterial } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, Check, Trash2, GripVertical, Music, X, Upload } from "lucide-react"
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/shadcn-io/dropzone'
import { SortableScrollList } from "@/components/sortable"

// Types pour les tailles de cassettes
type CassetteSize = 'C30' | 'C45' | 'C60' | 'C90' | 'C120'

interface CassetteSizeInfo {
  label: string
  duration: number // en minutes
  description: string
}
interface LightConfig {
  position: [number, number, number]
  intensity: number
  color: string
}

interface LightingConfig {
  ambient: { intensity: number; color: string }
  key: LightConfig
  fill: LightConfig
  rim: LightConfig
}

interface CassetteProps {
  stickerColor: string
  scale: number
  texture?: string | null
  cassetteColor: string
}

interface AudioFile extends File {
  id: string
  duration?: number
}

interface CameraLightboxProps {
  intensity?: number
  color?: string
  distance?: number
}

interface SidebarProps {
  stickerColor: string
  setStickerColor: (color: string) => void
  cassetteColor: string
  setCassetteColor: (color: string) => void
  cassetteTexture: string | null
  setCassetteTexture: (texture: string | null) => void
}

const DynamicLighting = ({ lighting }: { lighting: LightingConfig }) => (
  <>
    {/* Ambiant doux légèrement coloré */}
    <ambientLight intensity={lighting.ambient.intensity} color={lighting.ambient.color} />

    {/* Lumière principale (key light) plus forte, un peu chaude */}
    <directionalLight
      position={lighting.key.position}
      intensity={lighting.key.intensity}
      color={lighting.key.color}
      castShadow={false}
    />

    {/* Lumière de remplissage plus faible et froide */}
    <directionalLight
      position={lighting.fill.position}
      intensity={lighting.fill.intensity}
      color={lighting.fill.color}
      castShadow={false}
    />

    {/* Lumière de contour (rim) pour relief */}
    <directionalLight
      position={lighting.rim.position}
      intensity={lighting.rim.intensity}
      color={lighting.rim.color}
      castShadow={false}
    />

    {/* Spot light focalisée sur la cassette */}
    <spotLight
      position={[0, 5, 5]}
      angle={Math.PI / 6}
      penumbra={0.3}
      intensity={1.2}
      color="#fffaf0"
      castShadow={false}
      target-position={[0, 0, 0]}
      decay={2}
      distance={10}
    />
  </>
)


// Environnement 3D sphérique avec shader dégradé
const Environment3D = () => {
  const sphereRef = useRef<THREE.Mesh>(null)
  
  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  
  const fragmentShader = `
    uniform float uTime;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    // Fonction de bruit simplex
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * vec2(x12.y, x12.w);
      return 130.0 * dot(m, g);
    }
    
    void main() {
      // Utiliser la position Y du monde pour le dégradé vertical
      float gradientFactor = (vWorldPosition.y + 25.0) / 50.0;
      gradientFactor = clamp(gradientFactor, 0.0, 1.0);
      
      // Couleurs de l'image de référence
      vec3 topColor = vec3(0.75, 0.76, 0.78);      // Gris clair du haut
      vec3 middleColor = vec3(0.88, 0.90, 0.92);   // Blanc cassé du milieu
      vec3 bottomColor = vec3(0.68, 0.78, 0.82);   // Bleu-vert du bas
      
      // Dégradé principal basé sur la hauteur Y
      vec3 baseGradient;
      if (gradientFactor > 0.6) {
        // Partie haute : transition vers gris
        float t = (gradientFactor - 0.6) / 0.4;
        baseGradient = mix(middleColor, topColor, pow(t, 1.5));
      } else {
        // Partie basse : transition vers bleu-vert
        float t = gradientFactor / 0.6;
        baseGradient = mix(bottomColor, middleColor, pow(t, 0.8));
      }
      
      // Ajout de variations subtiles avec le bruit
      vec2 noiseUV = vUv * 4.0 + uTime * 0.01;
      float noise1 = snoise(noiseUV) * 0.004;
      float noise2 = snoise(noiseUV * 2.5 - uTime * 0.008) * 0.003;
      
      vec3 finalColor = baseGradient + noise1 + noise2;
      
      // Variation horizontale très subtile pour plus de réalisme
      float horizontalVar = sin(vWorldPosition.x * 0.1) * cos(vWorldPosition.z * 0.1) * 0.01;
      finalColor += horizontalVar;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
  
  const uniforms = useRef({
    uTime: { value: 0 }
  })
  
  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.elapsedTime
  })
  
  return (
    <mesh ref={sphereRef} scale={50}>
      <sphereGeometry args={[1, 64, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Particules flottantes pour l'ambiance
const FloatingParticles = () => {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 50
  
  const positions = new Float32Array(particleCount * 3)
  const scales = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10  
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
    scales[i] = Math.random() * 0.5 + 0.1
  }
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
    }
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Ombre diffuse améliorée


function Cassette({ stickerColor, scale, texture, cassetteColor }: CassetteProps) {
  const { scene, nodes } = useGLTF('/models/cassette.glb')
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null)
  const [isTransparent, setIsTransparent] = useState(false)
  
  // Contrôles Leva pour le matériau de transmission
  const materialProps = useControls('Transmission Material', {
    thickness: { value: 0.5, min: 0, max: 3, step: 0.05 },
    roughness: { value: 0.1, min: 0, max: 1, step: 0.1 },
    transmission: { value: 0.8, min: 0, max: 1, step: 0.1 },
    ior: { value: 1.4, min: 0, max: 3, step: 0.1 },
    chromaticAberration: { value: 0.03, min: 0, max: 1, step: 0.01 },
    backside: { value: true },
  })
  
  // Exposer la scène pour l'extraction de texture
  useEffect(() => {
    (window as any).cassetteScene = scene
  }, [scene])

  // Charger la texture si fournie
  useEffect(() => {
    if (texture) {
      const loader = new THREE.TextureLoader()
      loader.load(
        texture,
        (loadedTexture) => {
          loadedTexture.wrapS = THREE.RepeatWrapping
          loadedTexture.wrapT = THREE.RepeatWrapping
          loadedTexture.flipY = false
          setTextureMap(loadedTexture)
        },
        undefined,
        (error) => {
          console.error('Erreur lors du chargement de la texture:', error)
          setTextureMap(null)
        }
      )
    } else {
      setTextureMap(null)
    }
  }, [texture])

  // Vérifier si la couleur correspond à "transparent" (dernière couleur)
  useEffect(() => {
    setIsTransparent(cassetteColor === 'transparent')
  }, [cassetteColor])

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const material = mesh.material as THREE.MeshStandardMaterial
        // Cloner le matériau pour éviter les conflits
        if (material) {
          // Pour le mesh Object_4, appliquer le matériau de transmission si transparent, sinon couleur normale
          if (mesh.name === 'Object_4') {
            if (isTransparent) {
              // Remplacer le matériau par un MeshTransmissionMaterial conservant la géométrie et la transformation du mesh
              mesh.material = new (THREE as any).MeshPhysicalMaterial({
                ...materialProps,
                transmission: 1,
                transparent: true,
                opacity: 1,
                roughness: materialProps.roughness,
                thickness: materialProps.thickness,
                ior: materialProps.ior,
                color: '#ffffff',
                side: THREE.DoubleSide
              })
            } else {
              mesh.material = material.clone()
              const newMaterial = mesh.material as THREE.MeshStandardMaterial
              newMaterial.color = cassetteColor === 'transparent' ? new THREE.Color('#ffffff') : new THREE.Color(cassetteColor)
              newMaterial.needsUpdate = true
            }
          }
          // Appliquer la texture au sticker spécifiquement au mesh "Sticker"
          else if (mesh.name === 'Sticker') {
            mesh.material = material.clone()
            const newMaterial = mesh.material as THREE.MeshStandardMaterial
            if (textureMap) {
              newMaterial.map = textureMap
              newMaterial.color = new THREE.Color('#ffffff')
            } else {
              newMaterial.map = null
              newMaterial.color = new THREE.Color(stickerColor)
            }
            newMaterial.side = THREE.DoubleSide
            newMaterial.needsUpdate = true
          }
          // Pour les autres meshes, appliquer la couleur normalement
          else {
            if (!isTransparent) {
              mesh.material = material.clone()
              const newMaterial = mesh.material as THREE.MeshStandardMaterial
              newMaterial.color = cassetteColor === 'transparent' ? new THREE.Color('#ffffff') : new THREE.Color(cassetteColor)
              newMaterial.needsUpdate = true
            }
          }
        }
      }
    })
  }, [stickerColor, nodes, textureMap, cassetteColor, isTransparent, materialProps])

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = false
      mesh.receiveShadow = false
    }
  })
  
  return (
    <group
      scale={[scale, scale, scale]}
      rotation={[
        THREE.MathUtils.degToRad(80),
        THREE.MathUtils.degToRad(80),
        THREE.MathUtils.degToRad(0),
      ]}
    >
      <primitive object={scene} />
    </group>
  )
}


// Lightbox qui suit la caméra (éclairage doux et homogène)
function CameraLightbox({ intensity = 0.5, color = '#ffffff', distance = 2.5 }: CameraLightboxProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  // Positions relatives autour de la caméra (haut, bas, gauche, droite, avant)
  const offsets: [number, number, number][] = [
    [0, 0.5, 0],    // haut
    [0, -0.5, 0],   // bas
    [-0.5, 0, 0],   // gauche
    [0.5, 0, 0],    // droite
    [0, 0, 0.5],    // devant
    [0, 0, -0.5],   // derrière (léger)
  ]

  useFrame(() => {
    if (groupRef.current && camera) {
      // Place le groupe à la position de la caméra
      groupRef.current.position.copy(camera.position)
      groupRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={groupRef}>
      {offsets.map((offset, i) => (
        <pointLight
          key={i}
          position={offset.map((v) => v * distance) as [number, number, number]}
          intensity={intensity}
          color={color}
          distance={distance * 2.5}
          decay={2}
        />
      ))}
    </group>
  )
}

// Préréglage d'éclairage sophistiqué style Apple
const appleLighting: LightingConfig = {
  ambient: {
    intensity: 0.5,
    color: '#f0f0f2',
  },
  key: {
    position: [5, 8, 5],
    intensity: 0.85,
    color: '#fffbe8', // Légèrement chaud
  },
  fill: {
    position: [-3, 4, -2],
    intensity: 0.55,
    color: '#e8f4f8', // Froid
  },
  rim: {
    position: [0, 2, -6],
    intensity: 0.5,
    color: '#b8e0ff', // Bleuté
  },
}

// Données des tailles de cassettes
const cassetteSizes: Record<CassetteSize, CassetteSizeInfo> = {
  C30: { label: 'C30', duration: 30, description: '15 min par face' },
  C45: { label: 'C45', duration: 45, description: '22.5 min par face' },
  C60: { label: 'C60', duration: 60, description: '30 min par face' },
  C90: { label: 'C90', duration: 90, description: '45 min par face' },
  C120: { label: 'C120', duration: 120, description: '60 min par face' },
}

// Fonction pour calculer la taille de cassette recommandée
const getRecommendedCassetteSize = (playlistDuration: number): CassetteSize => {
  if (playlistDuration <= 30) return 'C30'
  if (playlistDuration <= 45) return 'C45'
  if (playlistDuration <= 60) return 'C60'
  if (playlistDuration <= 90) return 'C90'
  return 'C120'
}

// Fonction pour obtenir la durée d'un fichier audio
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration || 0)
    })
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve(0)
    })
    
    audio.src = url
  })
}

// Fonction pour formater le temps en minutes:secondes
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Composant PlaylistManager
const PlaylistManager = ({ 
  onDurationChange 
}: { 
  onDurationChange: (duration: number) => void 
}) => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [totalDuration, setTotalDuration] = useState(0)

  // Mettre à jour la durée totale quand les fichiers changent
  useEffect(() => {
    const total = audioFiles.reduce((sum, file) => sum + (file.duration || 0), 0)
    setTotalDuration(total)
    onDurationChange(Math.floor(total / 60)) // Convertir en minutes
  }, [audioFiles, onDurationChange])

  const handleDrop = async (files: File[]) => {
    const audioFilesWithId = files.map(file => ({
      ...file,
      id: crypto.randomUUID(),
      duration: 0
    })) as AudioFile[]

    setAudioFiles(prev => [...prev, ...audioFilesWithId])

    // Calculer la durée de chaque fichier
    for (const audioFile of audioFilesWithId) {
      try {
        const duration = await getAudioDuration(audioFile)
        setAudioFiles(prev => 
          prev.map(f => 
            f.id === audioFile.id ? { ...f, duration } : f
          )
        )
      } catch (error) {
        console.error('Erreur lors du calcul de la durée:', error)
      }
    }
  }

  const removeFile = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop2 = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newFiles = [...audioFiles]
    const draggedFile = newFiles[draggedIndex]
    newFiles.splice(draggedIndex, 1)
    newFiles.splice(dropIndex, 0, draggedFile)

    setAudioFiles(newFiles)
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <Dropzone
        maxSize={1024 * 1024 * 50} // 50MB max
        maxFiles={50}
        accept={{ 'audio/*': [] }}
        onDrop={handleDrop}
        src={audioFiles}
        onError={console.error}
        className="min-h-32"
      >
        <DropzoneEmptyState>
          <div className="text-center">
            <Music className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Glissez vos fichiers audio ici ou cliquez pour parcourir
            </p>
          </div>
        </DropzoneEmptyState>
        <DropzoneContent />
      </Dropzone>

      {audioFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Playlist ({audioFiles.length} pistes)</p>
            <p className="text-sm text-muted-foreground">
              Durée totale: {formatTime(totalDuration)}
            </p>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-1">
            {audioFiles.map((file, index) => (
              <div
                key={file.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop2(e, index)}
                className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm hover:bg-muted/80 cursor-move"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Music className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">
                    {file.name.replace(/\.[^/.]+$/, "")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.duration ? formatTime(file.duration) : 'Calcul...'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant Sidebar
const Sidebar = ({ stickerColor, setStickerColor, cassetteColor, setCassetteColor, cassetteTexture, setCassetteTexture }: SidebarProps) => {
  const [selectedSize, setSelectedSize] = useState<CassetteSize>('C60')
  const [playlistDuration, setPlaylistDuration] = useState(0)
  const [isUploadingTexture, setIsUploadingTexture] = useState(false)
  const [stickerMode, setStickerMode] = useState<'text' | 'upload'>('text')
  const [albumTitle, setAlbumTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [faceA, setFaceA] = useState('')
  const [faceB, setFaceB] = useState('')
  const textureInputRef = useRef<HTMLInputElement>(null)

  // Calculer le prix basé sur les sélections
  const calculatePrice = () => {
    const basePrice = 12.90
    const stickerPrice = cassetteTexture || albumTitle ? 3.00 : 0
    const rushPrice = playlistDuration > 60 ? 3.00 : 0
    return basePrice + stickerPrice + rushPrice
  }

  // Calculer la taille recommandée quand la durée change
  useEffect(() => {
    if (playlistDuration > 0) {
      const recommended = getRecommendedCassetteSize(playlistDuration)
      setSelectedSize(recommended)
    }
  }, [playlistDuration])

  const handleTextureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setIsUploadingTexture(true)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCassetteTexture(result)
        setIsUploadingTexture(false)
      }
      reader.onerror = () => {
        console.error('Erreur lors de la lecture du fichier')
        setIsUploadingTexture(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeTexture = () => {
    setCassetteTexture(null)
    if (textureInputRef.current) {
      textureInputRef.current.value = ''
    }
  }

  // Fonction pour extraire la texture du sticker depuis le modèle 3D
  const extractStickerTexture = () => {
    try {
      const scene = (window as any).cassetteScene
      if (!scene) {
        throw new Error('Scène 3D non disponible')
      }

      // Rechercher le mesh du sticker
      let stickerMesh: THREE.Mesh | null = null
      scene.traverse((child: THREE.Object3D) => {
        if (child.name === 'Sticker' && (child as THREE.Mesh).isMesh) {
          stickerMesh = child as THREE.Mesh
        }
      })
      
      if (stickerMesh && (stickerMesh as THREE.Mesh).material) {
        const material = (stickerMesh as THREE.Mesh).material as THREE.MeshStandardMaterial
        
        if (material.map && material.map.image) {
          // Créer un renderer temporaire pour capturer la texture
          const canvas = document.createElement('canvas')
          const renderer = new THREE.WebGLRenderer({ canvas, preserveDrawingBuffer: true })
          
          const width = material.map.image.width || 512
          const height = material.map.image.height || 512
          
          canvas.width = width
          canvas.height = height
          renderer.setSize(width, height)
          
          // Créer une scène simple avec un quad pour afficher la texture
          const tempScene = new THREE.Scene()
          const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
          
          const geometry = new THREE.PlaneGeometry(2, 2)
          const tempMaterial = new THREE.MeshBasicMaterial({ map: material.map })
          const quad = new THREE.Mesh(geometry, tempMaterial)
          tempScene.add(quad)
          
          renderer.render(tempScene, camera)
          
          // Extraire l'image du canvas
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'sticker-texture-original.png'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }
            
            // Nettoyer
            renderer.dispose()
            geometry.dispose()
            tempMaterial.dispose()
          }, 'image/png')
          
        } else {
          throw new Error('Aucune texture trouvée sur le sticker')
        }
      } else {
        throw new Error('Mesh du sticker non trouvé')
      }
    } catch (error) {
      console.error('Erreur lors de l\'extraction de la texture:', error)
      // Fallback : générer le template si l'extraction échoue
      downloadBaseTexture()
    }
  }

  // Fonction pour télécharger la texture de base
  const downloadBaseTexture = async () => {
    try {
      // Créer un canvas pour générer une texture de sticker réaliste
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 256 // Format plus approprié pour un sticker de cassette
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Fond blanc pour le sticker
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 512, 256)
        
        // Bordure du sticker
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 2
        ctx.strokeRect(5, 5, 502, 246)
        
        // Zone principale du titre (rectangle arrondi)
        ctx.fillStyle = '#f8f8f8'
        ctx.beginPath()
        ctx.roundRect(30, 40, 452, 60, 8)
        ctx.fill()
        ctx.strokeStyle = '#d0d0d0'
        ctx.stroke()
        
        // Texte principal
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('TITRE DE L\'ALBUM', 256, 75)
        
        // Zone artiste
        ctx.fillStyle = '#f0f0f0'
        ctx.beginPath()
        ctx.roundRect(30, 120, 452, 40, 6)
        ctx.fill()
        ctx.strokeStyle = '#d0d0d0'
        ctx.stroke()
        
        ctx.fillStyle = '#666666'
        ctx.font = '18px Arial'
        ctx.fillText('Nom de l\'Artiste', 256, 145)
        
        // Petites lignes pour la tracklist
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        for (let i = 0; i < 6; i++) {
          const y = 180 + (i * 10)
          ctx.beginPath()
          ctx.moveTo(50, y)
          ctx.lineTo(200, y)
          ctx.stroke()
          
          ctx.moveTo(320, y)
          ctx.lineTo(470, y)
          ctx.stroke()
        }
        
        // Marquages Face A / Face B
        ctx.fillStyle = '#999999'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('FACE A', 50, 175)
        ctx.fillText('FACE B', 320, 175)
        
        // Logos/symboles décoratifs
        ctx.fillStyle = '#cccccc'
        ctx.beginPath()
        ctx.arc(460, 30, 15, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#999999'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('♪', 460, 35)
        
        // Convertir en blob et télécharger
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'sticker-cassette-template.png'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }, 'image/png')
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la texture:', error)
    }
  }

  return (
    <div className="fixed right-0 top-0 w-80 h-full bg-background border-l-2 border-foreground p-0 overflow-y-auto z-10">
      {/* Header avec thème noir/blanc */}
      <div className="bg-foreground text-background p-4 border-b-2 border-foreground">
        <h1 className="text-lg font-black uppercase tracking-wider">
          TAPE//CRAFT
        </h1>
        <p className="text-xs font-mono opacity-80">
          Custom cassette studio
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* ① TEINTE DU SHELL */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs font-black">
              1
            </div>
            <h2 className="text-base font-black uppercase tracking-wide">
              Teinte du shell
            </h2>
          </div>
          
          {/* Grille de couleurs prédéfinies */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { color: '#1a1a1a', name: 'Noir' },
              { color: '#ffffff', name: 'Blanc' },
              { color: '#dc2626', name: 'Rouge' },
              { color: '#2563eb', name: 'Bleu' },
              { color: '#16a34a', name: 'Vert' },
              { color: '#ca8a04', name: 'Jaune' },
              { color: '#9333ea', name: 'Violet' },
              { color: '#ea580c', name: 'Orange' },
              { color: '#0891b2', name: 'Cyan' },
              { color: '#be185d', name: 'Rose' },
              { color: '#4b5563', name: 'Gris' },
              { color: 'transparent', name: 'Transparent' }
            ].map((preset) => (
              <button
                key={preset.color}
                onClick={() => setCassetteColor(preset.color)}
                className={`w-10 h-10 border-2 transition-all duration-200 hover:scale-110 relative ${
                  cassetteColor === preset.color 
                    ? 'border-foreground border-4 shadow-lg' 
                    : 'border-muted-foreground'
                } ${
                  preset.color === 'transparent' 
                    ? 'bg-sky-100 border-sky-300 hover:border-sky-400' 
                    : ''
                }`}
                style={{ 
                  backgroundColor: preset.color === 'transparent' ? '#e0f2fe' : preset.color 
                }}
                title={preset.name}
              >
                {preset.color === 'transparent' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-sky-200 opacity-80 flex items-center justify-center">
                    <span className="text-sky-600 text-xs font-bold">T</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Input hex custom */}
          <div className="flex gap-2">
            <div 
              className="w-12 h-12 border-2 border-muted-foreground relative"
              style={{ backgroundColor: cassetteColor === 'transparent' ? '#e0f2fe' : cassetteColor }}
            >
              {cassetteColor === 'transparent' && (
                <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-sky-200 opacity-80 flex items-center justify-center">
                  <span className="text-sky-600 text-xs font-bold">T</span>
                </div>
              )}
            </div>
            <Input
              type="text"
              value={cassetteColor}
              onChange={(e) => setCassetteColor(e.target.value)}
              className="font-mono text-xs"
              placeholder="#HEX ou 'transparent'"
            />
          </div>
        </section>

        {/* ② ÉTIQUETTE / STICKER */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs font-black">
              2
            </div>
            <h2 className="text-base font-black uppercase tracking-wide">
              Étiquette / Sticker
            </h2>
          </div>

          {/* Toggle Text/Upload */}
          <div className="flex border-2 border-foreground">
            <button
              onClick={() => setStickerMode('text')}
              className={`flex-1 py-2 px-4 text-xs font-black uppercase transition-colors ${
                stickerMode === 'text' 
                  ? 'bg-foreground text-background' 
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              Texte
            </button>
            <button
              onClick={() => setStickerMode('upload')}
              className={`flex-1 py-2 px-4 text-xs font-black uppercase transition-colors ${
                stickerMode === 'upload' 
                  ? 'bg-foreground text-background' 
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              Upload
            </button>
          </div>

          {stickerMode === 'text' ? (
            /* Mode texte */
            <div className="space-y-3">
              <Input
                placeholder="TITRE DE L'ALBUM"
                value={albumTitle}
                onChange={(e) => setAlbumTitle(e.target.value)}
                className="font-black uppercase text-sm"
              />
              <Input
                placeholder="Nom de l'Artiste"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Face A"
                  value={faceA}
                  onChange={(e) => setFaceA(e.target.value)}
                  className="text-xs"
                />
                <Input
                  placeholder="Face B"
                  value={faceB}
                  onChange={(e) => setFaceB(e.target.value)}
                  className="text-xs"
                />
              </div>
              
              {/* Couleur du sticker en mode texte */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase">Couleur du texte</Label>
                <div className="grid grid-cols-8 gap-1">
                  {['#000000', '#ffffff', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#ea580c'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setStickerColor(color)}
                      className={`w-6 h-6 border transition-all hover:scale-110 ${
                        stickerColor === color 
                          ? 'border-foreground border-2 shadow-lg' 
                          : 'border-muted-foreground'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode upload */
            <div className="space-y-3">
              {cassetteTexture ? (
                <div className="space-y-2">
                  <div className="relative h-20 border-2 border-foreground overflow-hidden">
                    <img 
                      src={cassetteTexture} 
                      alt="Sticker" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => textureInputRef.current?.click()}
                      className="flex-1 font-black"
                    >
                      CHANGER
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeTexture}
                      className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white font-black"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => textureInputRef.current?.click()}
                  className="w-full h-20 border-2 border-dashed border-muted-foreground hover:bg-muted font-black"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 mb-1" />
                    <p className="text-xs">UPLOAD STICKER</p>
                  </div>
                </Button>
              )}
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={extractStickerTexture}
                  className="flex-1 text-xs border border-muted-foreground hover:border-foreground"
                >
                  📤 EXTRAIRE
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadBaseTexture}
                  className="flex-1 text-xs border border-muted-foreground hover:border-foreground"
                >
                  📥 GABARIT
                </Button>
              </div>

              <input
                ref={textureInputRef}
                type="file"
                accept="image/*"
                onChange={handleTextureUpload}
                className="hidden"
              />
            </div>
          )}
        </section>

        {/* ③ PISTES À ENREGISTRER */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center text-xs font-black">
              3
            </div>
            <h2 className="text-base font-black uppercase tracking-wide">
              Pistes à enregistrer
            </h2>
          </div>

          <div className="border-2 border-foreground p-4">
            <div className="scale-90 origin-top-left w-[111%]">
              <SortableScrollList />
            </div>
          </div>

          {/* Taille de cassette recommandée */}
          {playlistDuration > 0 && (
            <div className="bg-muted border-2 border-foreground p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase">Format rec.</span>
                <span className="font-mono text-sm">
                  {cassetteSizes[getRecommendedCassetteSize(playlistDuration)].label}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ④ HABILLAGE DU BOÎTIER (grisé) */}
        <section className="space-y-4 opacity-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted-foreground text-muted flex items-center justify-center text-xs font-black">
              4
            </div>
            <h2 className="text-base font-black uppercase tracking-wide text-muted-foreground">
              Habillage du boîtier
            </h2>
          </div>
          
          <div className="border-2 border-dashed border-muted-foreground/50 p-8 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-muted-foreground/20 mx-auto rounded animate-pulse" />
              <p className="text-xs font-mono text-muted-foreground">
                BIENTÔT DISPO
              </p>
              <p className="text-xs text-muted-foreground">
                J-Card personnalisée
              </p>
            </div>
          </div>
        </section>

        {/* TOTAL ET CTA */}
        <div className="border-t-4 border-foreground pt-6 space-y-4">
          <div className="bg-foreground text-background p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-black uppercase">Total</span>
              <span className="text-xl font-black font-mono">
                {calculatePrice().toFixed(2)}€
              </span>
            </div>
            <div className="text-xs opacity-80 mt-1">
              Base: 12,90€ {(cassetteTexture || albumTitle) && "+ Sticker: 3,00€"} {playlistDuration > 60 && "+ Rush: 3,00€"}
            </div>
          </div>
          
          <Button 
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-black text-sm uppercase tracking-wider border-2 border-foreground"
            disabled={!playlistDuration}
          >
            💾 Ajouter au panier
          </Button>
          
          <p className="text-xs text-center text-muted-foreground font-mono">
            Exp. sous 3-5 jours
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [stickerColor, setStickerColor] = useState('#ffffff')
  const [cassetteColor, setCassetteColor] = useState('#1a1a1a')
  const [cassetteTexture, setCassetteTexture] = useState<string | null>(null)
  const scale = 1
  
  return (
    <div className="relative">
      <Canvas
        shadows={false}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ height: '100vh', width: 'calc(100vw - 320px)' }}
      >
        {/* Environnement 3D sphérique en arrière-plan */}
        <Environment3D />
        
        {/* Éclairage dynamique sophistiqué style Apple */}
        <DynamicLighting lighting={appleLighting} />
        
        {/* Lightbox qui suit la caméra */}
        <CameraLightbox intensity={0.35} color="#ffffff" distance={2.2} />
        
        {/* Particules flottantes */}
        <FloatingParticles />
        
        <Suspense fallback={null}>
          <Cassette 
            stickerColor={stickerColor} 
            scale={scale} 
            texture={cassetteTexture}
            cassetteColor={cassetteColor}
          />
        </Suspense>
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
          enableRotate={true}
          rotateSpeed={0.5}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
        />
      </Canvas>
      
      <Sidebar 
        stickerColor={stickerColor}
        setStickerColor={setStickerColor}
        cassetteColor={cassetteColor}
        setCassetteColor={setCassetteColor}
        cassetteTexture={cassetteTexture}
        setCassetteTexture={setCassetteTexture}
      />
    </div>
  )
}