import { Suspense, useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, useProgress } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import {
  colors,
  borderRadius,
  typography,
  lightingPresets,
} from "@/lib/design-tokens";
import { useMobile } from "@/lib/responsive";

interface CustomWindow extends Window {
  cassetteScene?: THREE.Group;
}

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Menu, ChevronUp } from "lucide-react";

// Type Definitions
interface CassetteProps {
  stickerColor: string;
  scale: number;
  texture?: string | null;
  cassetteColor: string;
  labelRotation: number;
  labelOffsetX: number;
  labelOffsetY: number;
  labelScaleX: number;
  labelScaleY: number;
  labelMirrorX: boolean;
  labelMirrorY: boolean;
}

interface CameraLightboxProps {
  intensity?: number;
  color?: string;
  distance?: number;
}

interface SidebarProps {
  stickerColor: string;
  setStickerColor: (color: string) => void;
  cassetteColor: string;
  setCassetteColor: (color: string) => void;
  cassetteTexture: string | null;
  setCassetteTexture: (texture: string | null) => void;
}

function Loader() {
  const { progress } = useProgress();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${progress}%`,
        duration: 0.5,
        ease: "power3.out",
      });
    }
  }, [progress]);

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div
          style={{
            width: "240px",
            height: "3px",
            backgroundColor: colors.hairline,
            borderRadius: borderRadius.full,
            overflow: "hidden",
            boxShadow: `0 0 16px rgba(124, 58, 237, 0.1)`,
          }}
        >
          <div
            ref={barRef}
            style={{
              width: "0%",
              height: "100%",
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryDeep})`,
              borderRadius: borderRadius.full,
              transition: "width 0.3s ease-out",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "13px",
            color: colors.slate,
            fontWeight: 500,
            fontFamily: typography.fontFamily.primary,
          }}
        >
          Chargement... {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

const DynamicLighting = ({
  lighting,
}: {
  lighting: typeof lightingPresets.appleStudio;
}) => {
  const keyPos = lighting.key.position as [number, number, number];
  const fillPos = lighting.fill.position as [number, number, number];
  const rimPos = lighting.rim.position as [number, number, number];

  return (
    <>
      {/* Ambient Light - Soft & Subtle */}
      <ambientLight
        intensity={lighting.ambient.intensity}
        color={lighting.ambient.color}
      />

      {/* Key Light - Main Fill */}
      <directionalLight
        position={keyPos}
        intensity={lighting.key.intensity}
        color={lighting.key.color}
        castShadow={false}
      />

      {/* Fill Light - Shadow Detail */}
      <directionalLight
        position={fillPos}
        intensity={lighting.fill.intensity}
        color={lighting.fill.color}
        castShadow={false}
      />

      {/* Rim Light - Edge Definition */}
      <directionalLight
        position={rimPos}
        intensity={lighting.rim.intensity}
        color={lighting.rim.color}
        castShadow={false}
      />

      {/* Spot Light - Accent */}
      <spotLight
        position={[0, 5, 5]}
        angle={Math.PI / 6}
        penumbra={0.3}
        intensity={1}
        color="#fffaf0"
        castShadow={false}
        target-position={[0, 0, 0]}
        decay={2}
        distance={10}
      />
    </>
  );
};

// Environnement 3D sphérique avec shader dégradé - Design System Aligned
const Environment3D = () => {
  const sphereRef = useRef<THREE.Mesh>(null);

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    
    // Simplex Noise Function
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
      // Gradient based on world Y position
      float gradientFactor = (vWorldPosition.y + 25.0) / 50.0;
      gradientFactor = clamp(gradientFactor, 0.0, 1.0);
      
      // Design System Colors - Clean & Modern
      vec3 topColor = vec3(0.973, 0.973, 0.976);    // Light gray
      vec3 middleColor = vec3(0.988, 0.992, 0.992); // Almost white
      vec3 bottomColor = vec3(0.953, 0.976, 0.984); // Subtle sky tint
      
      // Main gradient
      vec3 baseGradient;
      if (gradientFactor > 0.6) {
        float t = (gradientFactor - 0.6) / 0.4;
        baseGradient = mix(middleColor, topColor, pow(t, 1.5));
      } else {
        float t = gradientFactor / 0.6;
        baseGradient = mix(bottomColor, middleColor, pow(t, 0.8));
      }
      
      // Subtle noise variations
      vec2 noiseUV = vUv * 4.0 + uTime * 0.005;
      float noise1 = snoise(noiseUV) * 0.002;
      float noise2 = snoise(noiseUV * 2.5 - uTime * 0.004) * 0.0015;
      
      vec3 finalColor = baseGradient + noise1 + noise2;
      
      // Horizontal variation
      float horizontalVar = sin(vWorldPosition.x * 0.1) * cos(vWorldPosition.z * 0.1) * 0.005;
      finalColor += horizontalVar;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const uniforms = useRef({
    uTime: { value: 0 },
  });

  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.elapsedTime;
  });

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
  );
};

// Floating Particles - Subtle Atmosphere
const FloatingParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 30;

  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    scales[i] = Math.random() * 0.3 + 0.05;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      particlesRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.005) * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color={colors.primary}
        transparent
        opacity={0.15}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Ombre diffuse améliorée

function Cassette({
  stickerColor,
  scale,
  texture,
  cassetteColor,
  labelRotation,
  labelOffsetX,
  labelOffsetY,
  labelScaleX,
  labelScaleY,
  labelMirrorX,
  labelMirrorY,
}: CassetteProps) {
  const { scene, nodes } = useGLTF("/models/cassette.glb");
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null);
  const [textureAspect, setTextureAspect] = useState(1);
  const [stickerUvBounds, setStickerUvBounds] = useState<{
    minU: number;
    maxU: number;
    minV: number;
    maxV: number;
  } | null>(null);
  const [isTransparent, setIsTransparent] = useState(false);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Contrôles Leva pour le matériau de transmission
  const materialProps = useControls("Transmission Material", {
    thickness: { value: 0.5, min: 0, max: 3, step: 0.05 },
    roughness: { value: 0.1, min: 0, max: 1, step: 0.1 },
    transmission: { value: 0.8, min: 0, max: 1, step: 0.1 },
    ior: { value: 1.4, min: 0, max: 3, step: 0.1 },
    chromaticAberration: { value: 0.03, min: 0, max: 1, step: 0.01 },
    backside: { value: true },
  });

  interface CustomWindow extends Window {
    cassetteScene?: THREE.Group;
  }

  // ...

  // Exposer la scène pour l'extraction de la texture
  useEffect(() => {
    (window as CustomWindow).cassetteScene = scene;
  }, [scene]);

  useEffect(() => {
    const stickerMesh = scene.getObjectByName("Sticker") as THREE.Mesh | null;

    if (!stickerMesh?.isMesh) {
      setStickerUvBounds(null);
      return;
    }

    const geometry = stickerMesh.geometry as THREE.BufferGeometry;
    const uvAttribute = geometry.attributes.uv as
      | THREE.BufferAttribute
      | undefined;

    if (!uvAttribute) {
      setStickerUvBounds(null);
      return;
    }

    // On met en cache les limites UV d'origine pour éviter la boucle infinie
    if (!geometry.userData.originalBounds) {
      let minU = Infinity;
      let maxU = -Infinity;
      let minV = Infinity;
      let maxV = -Infinity;

      for (let i = 0; i < uvAttribute.count; i += 1) {
        const u = uvAttribute.getX(i);
        const v = uvAttribute.getY(i);
        minU = Math.min(minU, u);
        maxU = Math.max(maxU, u);
        minV = Math.min(minV, v);
        maxV = Math.max(maxV, v);
      }

      geometry.userData.originalBounds = { minU, maxU, minV, maxV };
    }

    const { minU, maxU, minV, maxV } = geometry.userData.originalBounds;
    const midU = (minU + maxU) / 2;

    if (!geometry.userData.uvsFolded) {
      for (let i = 0; i < uvAttribute.count; i += 1) {
        const u = uvAttribute.getX(i);
        const v = uvAttribute.getY(i);

        if (u > midU) {
          const newU = minU + (maxU - u);
          const newV = minV + (maxV - v);
          uvAttribute.setXY(i, newU, newV);
        }
      }
      uvAttribute.needsUpdate = true;
      geometry.userData.uvsFolded = true;
    }

    setStickerUvBounds({ minU, maxU: midU, minV, maxV });
  }, [scene]);

  // Charger la texture si fournie
  useEffect(() => {
    if (texture) {
      const loader = new THREE.TextureLoader();
      loader.load(
        texture,
        (loadedTexture) => {
          // Utiliser RepeatWrapping pour afficher l'image proprement sur les deux faces
          // au lieu d'étirer les pixels des bords (ClampToEdgeWrapping)
          loadedTexture.wrapS = THREE.RepeatWrapping;
          loadedTexture.wrapT = THREE.RepeatWrapping;
          loadedTexture.flipY = false;
          loadedTexture.needsUpdate = true;
          const image = loadedTexture.image as
            | { width?: number; height?: number }
            | undefined;
          if (image?.width && image?.height) {
            setTextureAspect(image.width / image.height);
          }
          setTextureMap(loadedTexture);
        },
        undefined,
        (error) => {
          console.error("Erreur lors du chargement de la texture :", error);
          setTextureMap(null);
        },
      );
    } else {
      setTextureMap(null);
    }
  }, [texture]);

  // Vérifier si la couleur correspond à "transparent" (dernière option)
  useEffect(() => {
    setIsTransparent(cassetteColor === "transparent");
  }, [cassetteColor]);

  useEffect(() => {
    if (!textureMap || !stickerUvBounds) {
      return;
    }

    const uvWidth = Math.max(
      stickerUvBounds.maxU - stickerUvBounds.minU,
      0.0001,
    );
    const uvHeight = Math.max(
      stickerUvBounds.maxV - stickerUvBounds.minV,
      0.0001,
    );
    const targetAspect = uvWidth / uvHeight;
    const rotationRadians = THREE.MathUtils.degToRad(labelRotation);
    const mirrorScaleX = labelMirrorX ? -1 : 1;
    const mirrorScaleY = labelMirrorY ? -1 : 1;

    let fitRepeatX = 1;
    let fitRepeatY = 1;
    let fitOffsetX = 0;
    let fitOffsetY = 0;

    const isRotated = labelRotation % 180 !== 0;
    const effectiveTextureAspect = isRotated
      ? 1 / textureAspect
      : textureAspect;

    if (effectiveTextureAspect > targetAspect) {
      fitRepeatX = targetAspect / effectiveTextureAspect;
      fitOffsetX = (1 - fitRepeatX) / 2;
    } else {
      fitRepeatY = effectiveTextureAspect / targetAspect;
      fitOffsetY = (1 - fitRepeatY) / 2;
    }

    const normalizeMatrix = new THREE.Matrix3().setUvTransform(
      -stickerUvBounds.minU,
      -stickerUvBounds.minV,
      1 / uvWidth,
      1 / uvHeight,
      0,
      0,
      0,
    );

    const userMatrix = new THREE.Matrix3().setUvTransform(
      labelOffsetX,
      labelOffsetY,
      labelScaleX * mirrorScaleX,
      labelScaleY * mirrorScaleY,
      rotationRadians,
      0.5,
      0.5,
    );

    const fitMatrix = new THREE.Matrix3().setUvTransform(
      fitOffsetX,
      fitOffsetY,
      fitRepeatX,
      fitRepeatY,
      0,
      0,
      0,
    );

    textureMap.wrapS = THREE.RepeatWrapping;
    textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.matrixAutoUpdate = false;
    textureMap.matrix
      .copy(userMatrix)
      .multiply(fitMatrix)
      .multiply(normalizeMatrix);
    textureMap.needsUpdate = true;
  }, [
    textureMap,
    stickerUvBounds,
    textureAspect,
    labelRotation,
    labelOffsetX,
    labelOffsetY,
    labelScaleX,
    labelScaleY,
    labelMirrorX,
    labelMirrorY,
  ]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (material) {
          // Object_2 (id 54): Plastique transparent, jamais affecté par la coloration
          if (mesh.name === "Object_2") {
            mesh.material = new THREE.MeshPhysicalMaterial({
              ...materialProps,
              transmission: 0.9,
              roughness: 0.05,
              thickness: 0,
              ior: 1.0,
              color: new THREE.Color("#ffffff"),
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 1,
            });
          }
          // Object_3: Toujours #120e0c, jamais changé
          else if (mesh.name === "Object_3") {
            mesh.material = material.clone();
            const newMaterial = mesh.material as THREE.MeshStandardMaterial;
            newMaterial.color = new THREE.Color("#3A2014");
            newMaterial.map = null;
            newMaterial.needsUpdate = true;
          }
          // Object_4: Seul shell coloré avec la couleur sélectionnée
          else if (mesh.name === "Object_4") {
            if (isTransparent) {
              mesh.material = new THREE.MeshPhysicalMaterial({
                ...materialProps,
                transmission: 1,
                transparent: true,
                opacity: 1,
                roughness: materialProps.roughness,
                thickness: materialProps.thickness,
                ior: materialProps.ior,
                color: "#ffffff",
                side: THREE.DoubleSide,
              });
            } else {
              // Garder le matériau original avec sa texture
              mesh.material = material.clone();
              const newMaterial = mesh.material as THREE.MeshStandardMaterial;

              const colorValue =
                cassetteColor === "transparent" ? "#ffffff" : cassetteColor;
              newMaterial.roughness = 0.4;
              newMaterial.metalness = 0.2;
              newMaterial.normalScale = new THREE.Vector2(0.2, 0.2);

              // Si une texture map est présente, créer une texture modifiée avec le masque noir
              if (newMaterial.map && newMaterial.map.image) {
                // On sauvegarde l'image d'origine au premier passage
                if (!originalImageRef.current) {
                  originalImageRef.current = newMaterial.map
                    .image as HTMLImageElement;
                }

                // On utilise toujours notre sauvegarde comme source de vérité
                const sourceImage = originalImageRef.current;

                const canvas = document.createElement("canvas");
                canvas.width = sourceImage.width;
                canvas.height = sourceImage.height;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                  // Dessiner l'image originale
                  ctx.drawImage(sourceImage, 0, 0);

                  // Récupérer les données de pixels
                  const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                  );
                  const data = imageData.data;

                  // Convertir la couleur choisie en RGB
                  const tempColor = new THREE.Color(colorValue);
                  const r = Math.round(tempColor.r * 255);
                  const g = Math.round(tempColor.g * 255);
                  const b = Math.round(tempColor.b * 255);

                  // Boucler sur les pixels et remplacer les noirs
                  for (let i = 0; i < data.length; i += 4) {
                    const pixelR = data[i];
                    const pixelG = data[i + 1];
                    const pixelB = data[i + 2];

                    // Déterminer si le pixel est noir (tous les canaux < 50)
                    if (pixelR < 50 && pixelG < 50 && pixelB < 50) {
                      data[i] = r; // R
                      data[i + 1] = g; // G
                      data[i + 2] = b; // B
                      // data[i + 3] reste inchangé (alpha)
                    }
                  }

                  // Écrire les données modifiées
                  ctx.putImageData(imageData, 0, 0);

                  // Créer une nouvelle texture à partir du canvas
                  const newTexture = new THREE.CanvasTexture(canvas);
                  newTexture.wrapS = THREE.ClampToEdgeWrapping;
                  newTexture.wrapT = THREE.ClampToEdgeWrapping;
                  newTexture.flipY = false;

                  newMaterial.map = newTexture;
                }
              }

              newMaterial.needsUpdate = true;
            }
          }
          // Sticker: Appliquer la texture ou stickerColor
          else if (mesh.name === "Sticker") {
            mesh.material = material.clone();
            const newMaterial = mesh.material as THREE.MeshStandardMaterial;
            if (textureMap) {
              newMaterial.map = textureMap;
              newMaterial.color = new THREE.Color("#ffffff");
              newMaterial.onBeforeCompile = () => {};
            } else {
              newMaterial.map = null;
              newMaterial.color = new THREE.Color(stickerColor);
              newMaterial.onBeforeCompile = () => {};
            }
            newMaterial.side = THREE.FrontSide;
            newMaterial.needsUpdate = true;
          }
          // Autres meshes: Ne pas les colorer, garder leur apparence d'origine
          // (Pas de modification)
        }
      }
    });
  }, [
    stickerColor,
    nodes,
    textureMap,
    cassetteColor,
    isTransparent,
    materialProps,
    scene,
  ]);

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  });

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
  );
}

// Camera Lightbox - Clean & Production Ready
function CameraLightbox({
  intensity = 0.4,
  color = "#ffffff",
  distance = 2.5,
}: CameraLightboxProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Relative positions around camera
  const offsets: Array<[number, number, number]> = [
    [0, 0.5, 0], // top
    [0, -0.5, 0], // bottom
    [-0.5, 0, 0], // left
    [0.5, 0, 0], // right
    [0, 0, 0.5], // front
    [0, 0, -0.5], // back
  ];

  useFrame(() => {
    if (groupRef.current && camera) {
      groupRef.current.position.copy(camera.position);
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group ref={groupRef}>
      {offsets.map((offset, i) => {
        const pos: [number, number, number] = [
          offset[0] * distance,
          offset[1] * distance,
          offset[2] * distance,
        ];
        return (
          <pointLight
            key={i}
            position={pos}
            intensity={intensity}
            color={color}
            distance={distance * 2.5}
            decay={2}
          />
        );
      })}
    </group>
  );
}

// Apple Studio Lighting Preset
const appleLighting = lightingPresets.appleStudio;

// Sidebar Content Component (used by both desktop and mobile)
const SidebarContent = ({
  stickerColor,
  setStickerColor,
  cassetteColor,
  setCassetteColor,
  cassetteTexture,
  textureInputRef,
  calculatePrice,
  handleTextureUpload,
  removeTexture,
  extractStickerTexture,
  downloadBaseTexture,
  isMobile,
}: SidebarProps & {
  textureInputRef: React.RefObject<HTMLInputElement>;
  calculatePrice: () => number;
  handleTextureUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeTexture: () => void;
  extractStickerTexture: () => void;
  downloadBaseTexture: () => Promise<void>;
  isMobile?: boolean;
}) => {
  const colorPresets = [
    { color: colors.inkDeep, label: "Black" },
    { color: colors.canvas, label: "White" },
    { color: colors.brandPink, label: "Pink" },
    { color: colors.brandOrange, label: "Orange" },
    { color: colors.brandGreen, label: "Green" },
    { color: colors.brandTeal, label: "Teal" },
    { color: colors.primary, label: "Purple" },
    { color: colors.charcoal, label: "Charcoal" },
    { color: colors.cardTintYellowBold, label: "Yellow" },
    { color: colors.brandBrown, label: "Brown" },
    { color: "#e8e8e8", label: "Gray" },
    { color: "transparent", label: "Clear" },
  ];

  return (
    <div className={isMobile ? "space-y-6" : "space-y-8"}>
      {/* Cassette Color Section */}
      <section className="space-y-4">
        <div
          style={{
            fontSize: typography.sizes.bodySmMedium.fontSize,
            fontWeight: 600,
            color: colors.ink,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Cassette Shell
        </div>

        <div
          className={
            isMobile ? "grid grid-cols-5 gap-2" : "grid grid-cols-6 gap-2"
          }
        >
          {colorPresets.map((preset) => (
            <button
              key={preset.color}
              onClick={() => setCassetteColor(preset.color)}
              className="transition-all duration-200 hover:scale-110 relative"
              style={{
                width: isMobile ? "36px" : "40px",
                height: isMobile ? "36px" : "40px",
                borderRadius: borderRadius.md,
                backgroundColor:
                  preset.color === "transparent"
                    ? colors.cardTintSky
                    : preset.color,
                border: `2px solid ${cassetteColor === preset.color ? colors.primary : colors.hairline}`,
                boxShadow:
                  cassetteColor === preset.color
                    ? `0 0 0 2px ${colors.canvas}, 0 0 8px ${colors.primary}40`
                    : "none",
                cursor: "pointer",
              }}
              title={preset.label}
            >
              {preset.color === "transparent" && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: colors.primary,
                  }}
                >
                  T
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom Color Input */}
        <div className="space-y-2">
          <div style={{ display: "flex", gap: "8px" }}>
            <div
              style={{
                width: isMobile ? "40px" : "48px",
                height: isMobile ? "40px" : "48px",
                borderRadius: borderRadius.md,
                backgroundColor:
                  cassetteColor === "transparent"
                    ? colors.cardTintSky
                    : cassetteColor,
                border: `1px solid ${colors.hairline}`,
                flexShrink: 0,
              }}
            />
            <Input
              type="text"
              value={cassetteColor}
              onChange={(e) => setCassetteColor(e.target.value)}
              className="flex-1"
              placeholder="#HEX"
              style={{
                fontSize: "12px",
                fontFamily: "monospace",
                padding: "8px 12px",
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.hairline}`,
                color: colors.ink,
              }}
            />
          </div>
        </div>
      </section>

      {/* Label Section */}
      <section className="space-y-4">
        <div
          style={{
            fontSize: typography.sizes.bodySmMedium.fontSize,
            fontWeight: 600,
            color: colors.ink,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Label Design
        </div>

        {!cassetteTexture ? (
          <div className="space-y-3">
            {/* Color Picker for Label */}
            <div>
              <Label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: colors.slate,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Label Color
              </Label>
              <div
                className={
                  isMobile
                    ? "grid grid-cols-6 gap-1"
                    : "grid grid-cols-8 gap-1.5"
                }
              >
                {colorPresets.slice(0, 8).map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => setStickerColor(preset.color)}
                    className="transition-all"
                    style={{
                      width: isMobile ? "24px" : "28px",
                      height: isMobile ? "24px" : "28px",
                      borderRadius: borderRadius.sm,
                      backgroundColor:
                        preset.color === "transparent"
                          ? colors.cardTintSky
                          : preset.color,
                      border:
                        stickerColor === preset.color
                          ? `2px solid ${colors.primary}`
                          : `1px solid ${colors.hairline}`,
                      cursor: "pointer",
                      boxShadow:
                        stickerColor === preset.color
                          ? `0 0 0 1px ${colors.canvas}, 0 0 6px ${colors.primary}40`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Upload Button */}
            <Button
              variant="outline"
              onClick={() => textureInputRef.current?.click()}
              className="w-full"
              style={{
                borderStyle: "dashed",
                borderWidth: "2px",
                borderColor: colors.hairlineStrong,
                backgroundColor: colors.surface,
                color: colors.charcoal,
                padding: isMobile ? "16px" : "20px",
                borderRadius: borderRadius.md,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div className="text-center">
                <div style={{ fontSize: "18px", marginBottom: "4px" }}>↑</div>
                <p>Upload Label</p>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Texture Preview */}
            <div
              style={{
                position: "relative",
                height: isMobile ? "60px" : "80px",
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.hairline}`,
                overflow: "hidden",
                backgroundColor: colors.surface,
              }}
            >
              <img
                src={cassetteTexture}
                alt="Label"
                className="w-full h-full object-contain"
                style={{ aspectRatio: "3.5 / 1.6562" }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => textureInputRef.current?.click()}
                style={{
                  flex: 1,
                  fontSize: "12px",
                  fontWeight: 600,
                  borderColor: colors.hairline,
                  color: colors.ink,
                }}
              >
                Change
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeTexture}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  borderColor: colors.semanticError,
                  color: colors.semanticError,
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Utility Buttons */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={extractStickerTexture}
            style={{
              flex: 1,
              fontSize: "11px",
              fontWeight: 600,
              borderColor: colors.hairline,
              color: colors.slate,
              borderWidth: "1px",
              borderRadius: borderRadius.md,
            }}
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadBaseTexture}
            style={{
              flex: 1,
              fontSize: "11px",
              fontWeight: 600,
              borderColor: colors.hairline,
              color: colors.slate,
              borderWidth: "1px",
              borderRadius: borderRadius.md,
            }}
          >
            Template
          </Button>
        </div>

        <input
          ref={textureInputRef}
          type="file"
          accept="image/*"
          onChange={handleTextureUpload}
          className="hidden"
        />
      </section>

      {/* Pricing Section */}
      <div
        style={{
          backgroundColor: colors.surface,
          padding: "16px",
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.hairline}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: typography.sizes.bodySmMedium.fontSize,
              fontWeight: 600,
              color: colors.slate,
              textTransform: "uppercase",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: colors.primary,
              fontFamily: "monospace",
            }}
          >
            {calculatePrice().toFixed(2)}€
          </span>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: colors.slate,
            lineHeight: 1.4,
          }}
        >
          Base: 12.90€ {cassetteTexture && "+ Label: 3.00€"}
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        className="w-full"
        style={{
          backgroundColor: colors.primary,
          color: colors.onDark,
          height: isMobile ? "40px" : "44px",
          fontSize: typography.sizes.buttonMd.fontSize,
          fontWeight: 700,
          borderRadius: borderRadius.md,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: `0 0 0 1px ${colors.primary}20`,
        }}
      >
        + Add to Cart
      </Button>

      {/* Shipping Info */}
      <p
        style={{
          fontSize: "11px",
          textAlign: "center",
          color: colors.slate,
          fontFamily: "monospace",
        }}
      >
        Ships in 3–5 days
      </p>
    </div>
  );
};

// Modern Production-Ready Desktop Sidebar
const Sidebar = ({
  stickerColor,
  setStickerColor,
  cassetteColor,
  setCassetteColor,
  cassetteTexture,
  setCassetteTexture,
}: SidebarProps) => {
  const textureInputRef = useRef<HTMLInputElement>(null);

  const calculatePrice = () => 12.9 + (cassetteTexture ? 3.0 : 0);

  const handleTextureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCassetteTexture(result);
    };
    reader.readAsDataURL(file);
  };

  const removeTexture = () => {
    setCassetteTexture(null);
    if (textureInputRef.current) {
      textureInputRef.current.value = "";
    }
  };

  const extractStickerTexture = () => {
    try {
      const scene = (window as CustomWindow).cassetteScene;
      if (!scene) {
        throw new Error("3D scene not available");
      }

      let stickerMesh: THREE.Mesh | null = null;
      scene.traverse((child: THREE.Object3D) => {
        if (child.name === "Sticker" && (child as THREE.Mesh).isMesh) {
          stickerMesh = child as THREE.Mesh;
        }
      });

      if (!stickerMesh || !(stickerMesh as THREE.Mesh).material) {
        throw new Error("Sticker mesh not found");
      }

      const material = (stickerMesh as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      if (!material.map || !material.map.image) {
        throw new Error("No texture found on sticker");
      }

      const img = material.map.image as HTMLImageElement;
      const width = img.width || 512;
      const height = img.height || 512;
      const canvas = document.createElement("canvas");
      const renderer = new THREE.WebGLRenderer({
        canvas,
        preserveDrawingBuffer: true,
      });

      canvas.width = width;
      canvas.height = height;
      renderer.setSize(width, height);

      const tempScene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2);
      const tempMaterial = new THREE.MeshBasicMaterial({ map: material.map });
      tempScene.add(new THREE.Mesh(geometry, tempMaterial));

      renderer.render(tempScene, camera);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "sticker-texture.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        renderer.dispose();
        geometry.dispose();
        tempMaterial.dispose();
      }, "image/png");
    } catch (error) {
      console.error("Error extracting texture:", error);
      downloadBaseTexture();
    }
  };

  const downloadBaseTexture = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 3500;
      canvas.height = 1656;
      const ctx = canvas.getContext("2d");
      const scaleX = canvas.width / 512;
      const scaleY = canvas.height / 256;
      const sx = (value: number) => value * scaleX;
      const sy = (value: number) => value * scaleY;

      if (!ctx) {
        return;
      }

      ctx.fillStyle = colors.canvas;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = colors.hairline;
      ctx.lineWidth = Math.max(2, Math.round(scaleX));
      ctx.strokeRect(sx(5), sy(5), sx(502), sy(246));

      ctx.fillStyle = colors.surface;
      ctx.beginPath();
      ctx.roundRect(sx(30), sy(40), sx(452), sy(60), Math.max(8, sx(8)));
      ctx.fill();

      ctx.fillStyle = colors.charcoal;
      ctx.font = `bold ${Math.max(24, Math.round(24 * scaleY))}px ${typography.fontFamily.primary}`;
      ctx.textAlign = "center";
      ctx.fillText("ALBUM TITLE", sx(256), sy(75));

      ctx.fillStyle = colors.surface;
      ctx.beginPath();
      ctx.roundRect(sx(30), sy(120), sx(452), sy(40), Math.max(6, sx(6)));
      ctx.fill();

      ctx.fillStyle = colors.slate;
      ctx.font = `${Math.max(18, Math.round(18 * scaleY))}px ${typography.fontFamily.primary}`;
      ctx.fillText("Artist Name", sx(256), sy(145));

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cassette-template.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Error generating template:", error);
    }
  };

  return (
    <div
      className="hidden lg:fixed lg:flex right-0 top-0 h-full bg-white border-l flex-col z-10"
      style={{
        width: "320px",
        borderLeftColor: colors.hairline,
        borderLeftWidth: "1px",
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 p-6 border-b"
        style={{
          backgroundColor: colors.primary,
          borderBottomColor: colors.hairline,
          borderBottomWidth: "1px",
          zIndex: 20,
        }}
      >
        <h1
          style={{
            fontSize: typography.sizes.heading3.fontSize,
            fontWeight: 600,
            color: colors.onDark,
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          TAPE CRAFT
        </h1>
        <p
          style={{
            fontSize: "12px",
            color: colors.onDarkMuted,
            fontWeight: 500,
            margin: "4px 0 0 0",
          }}
        >
          Studio • Customizer
        </p>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1">
        <SidebarContent
          stickerColor={stickerColor}
          setStickerColor={setStickerColor}
          cassetteColor={cassetteColor}
          setCassetteColor={setCassetteColor}
          cassetteTexture={cassetteTexture}
          setCassetteTexture={setCassetteTexture}
          textureInputRef={textureInputRef}
          calculatePrice={calculatePrice}
          handleTextureUpload={handleTextureUpload}
          removeTexture={removeTexture}
          extractStickerTexture={extractStickerTexture}
          downloadBaseTexture={downloadBaseTexture}
          isMobile={false}
        />
      </div>
    </div>
  );
};

// Mobile Sidebar Bottom Sheet
const MobileSidebar = ({
  stickerColor,
  setStickerColor,
  cassetteColor,
  setCassetteColor,
  cassetteTexture,
  setCassetteTexture,
  isOpen,
  onClose,
}: SidebarProps & { isOpen: boolean; onClose: () => void }) => {
  const textureInputRef = useRef<HTMLInputElement>(null);

  const calculatePrice = () => 12.9 + (cassetteTexture ? 3.0 : 0);

  const handleTextureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCassetteTexture(result);
    };
    reader.readAsDataURL(file);
  };

  const removeTexture = () => {
    setCassetteTexture(null);
    if (textureInputRef.current) {
      textureInputRef.current.value = "";
    }
  };

  const extractStickerTexture = () => {
    try {
      const scene = (window as CustomWindow).cassetteScene;
      if (!scene) {
        throw new Error("3D scene not available");
      }

      let stickerMesh: THREE.Mesh | null = null;
      scene.traverse((child: THREE.Object3D) => {
        if (child.name === "Sticker" && (child as THREE.Mesh).isMesh) {
          stickerMesh = child as THREE.Mesh;
        }
      });

      if (!stickerMesh || !(stickerMesh as THREE.Mesh).material) {
        throw new Error("Sticker mesh not found");
      }

      const material = (stickerMesh as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      if (!material.map || !material.map.image) {
        throw new Error("No texture found on sticker");
      }

      const img = material.map.image as HTMLImageElement;
      const width = img.width || 512;
      const height = img.height || 512;
      const canvas = document.createElement("canvas");
      const renderer = new THREE.WebGLRenderer({
        canvas,
        preserveDrawingBuffer: true,
      });

      canvas.width = width;
      canvas.height = height;
      renderer.setSize(width, height);

      const tempScene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const geometry = new THREE.PlaneGeometry(2, 2);
      const tempMaterial = new THREE.MeshBasicMaterial({ map: material.map });
      tempScene.add(new THREE.Mesh(geometry, tempMaterial));

      renderer.render(tempScene, camera);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "sticker-texture.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        renderer.dispose();
        geometry.dispose();
        tempMaterial.dispose();
      }, "image/png");
    } catch (error) {
      console.error("Error extracting texture:", error);
      downloadBaseTexture();
    }
  };

  const downloadBaseTexture = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 3500;
      canvas.height = 1656;
      const ctx = canvas.getContext("2d");
      const scaleX = canvas.width / 512;
      const scaleY = canvas.height / 256;
      const sx = (value: number) => value * scaleX;
      const sy = (value: number) => value * scaleY;

      if (!ctx) {
        return;
      }

      ctx.fillStyle = colors.canvas;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = colors.hairline;
      ctx.lineWidth = Math.max(2, Math.round(scaleX));
      ctx.strokeRect(sx(5), sy(5), sx(502), sy(246));

      ctx.fillStyle = colors.surface;
      ctx.beginPath();
      ctx.roundRect(sx(30), sy(40), sx(452), sy(60), Math.max(8, sx(8)));
      ctx.fill();

      ctx.fillStyle = colors.charcoal;
      ctx.font = `bold ${Math.max(24, Math.round(24 * scaleY))}px ${typography.fontFamily.primary}`;
      ctx.textAlign = "center";
      ctx.fillText("ALBUM TITLE", sx(256), sy(75));

      ctx.fillStyle = colors.surface;
      ctx.beginPath();
      ctx.roundRect(sx(30), sy(120), sx(452), sy(40), Math.max(6, sx(6)));
      ctx.fill();

      ctx.fillStyle = colors.slate;
      ctx.font = `${Math.max(18, Math.round(18 * scaleY))}px ${typography.fontFamily.primary}`;
      ctx.fillText("Artist Name", sx(256), sy(145));

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cassette-template.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Error generating template:", error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 30,
            animation: "fadeIn 0.2s ease-out",
          }}
        />
      )}

      {/* Bottom Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.canvas,
          borderTopLeftRadius: borderRadius.lg,
          borderTopRightRadius: borderRadius.lg,
          boxShadow: `0 -4px 12px rgba(0, 0, 0, 0.1)`,
          zIndex: 40,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s ease-out",
          fontFamily: typography.fontFamily.primary,
        }}
      >
        {/* Header Handle */}
        <div
          style={{
            padding: "12px",
            display: "flex",
            justifyContent: "center",
            borderBottomWidth: "1px",
            borderBottomColor: colors.hairline,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              backgroundColor: colors.hairline,
              borderRadius: borderRadius.full,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            padding: "16px",
            backgroundColor: colors.primary,
            color: colors.onDark,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              TAPE CRAFT
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: colors.onDarkMuted,
                margin: "4px 0 0 0",
                fontWeight: 500,
              }}
            >
              Studio • Customizer
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: colors.onDark,
              display: "flex",
            }}
          >
            <ChevronUp size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <SidebarContent
            stickerColor={stickerColor}
            setStickerColor={setStickerColor}
            cassetteColor={cassetteColor}
            setCassetteColor={setCassetteColor}
            cassetteTexture={cassetteTexture}
            setCassetteTexture={setCassetteTexture}
            textureInputRef={textureInputRef}
            calculatePrice={calculatePrice}
            handleTextureUpload={handleTextureUpload}
            removeTexture={removeTexture}
            extractStickerTexture={extractStickerTexture}
            downloadBaseTexture={downloadBaseTexture}
            isMobile={true}
          />
        </div>
      </div>
    </>
  );
};

export default function App() {
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stickerColor, setStickerColor] = useState(colors.canvas);
  const [cassetteColor, setCassetteColor] = useState(colors.canvas);
  const [cassetteTexture, setCassetteTexture] = useState<string | null>(null);

  const labelRotation = 90;
  const labelOffsetX = 0;
  const labelOffsetY = 0;
  const labelScaleX = 1;
  const labelScaleY = 1;
  const labelMirrorX = false;
  const labelMirrorY = true;
  const scale = 1;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        height: "100vh",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <Leva hidden />

      {/* Mobile Header */}
      {isMobile && (
        <div
          style={{
            backgroundColor: colors.primary,
            color: colors.onDark,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${colors.hairline}`,
            zIndex: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              TAPE CRAFT
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: colors.onDark,
              display: "flex",
              alignItems: "center",
              fontSize: "24px",
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Canvas Container */}
      <Canvas
        shadows={false}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          width: isMobile ? "100%" : "calc(100vw - 320px)",
        }}
      >
        {/* 3D Environment */}
        <Environment3D />

        {/* Apple Studio Lighting */}
        <DynamicLighting lighting={appleLighting} />

        {/* Camera Lightbox */}
        <CameraLightbox intensity={0.35} color={colors.canvas} distance={2.2} />

        {/* Floating Particles */}
        <FloatingParticles />

        <Suspense fallback={<Loader />}>
          <Cassette
            stickerColor={stickerColor}
            scale={scale}
            texture={cassetteTexture}
            cassetteColor={cassetteColor}
            labelRotation={labelRotation}
            labelOffsetX={labelOffsetX}
            labelOffsetY={labelOffsetY}
            labelScaleX={labelScaleX}
            labelScaleY={labelScaleY}
            labelMirrorX={labelMirrorX}
            labelMirrorY={labelMirrorY}
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

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          stickerColor={stickerColor}
          setStickerColor={setStickerColor}
          cassetteColor={cassetteColor}
          setCassetteColor={setCassetteColor}
          cassetteTexture={cassetteTexture}
          setCassetteTexture={setCassetteTexture}
        />
      )}

      {/* Mobile Sidebar (Bottom Sheet) */}
      {isMobile && (
        <MobileSidebar
          stickerColor={stickerColor}
          setStickerColor={setStickerColor}
          cassetteColor={cassetteColor}
          setCassetteColor={setCassetteColor}
          cassetteTexture={cassetteTexture}
          setCassetteTexture={setCassetteTexture}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
