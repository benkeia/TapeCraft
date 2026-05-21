import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import gsap from "gsap";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { useGLTF, Html, useProgress, Environment } from "@react-three/drei";
import { Leva, useControls } from "leva";
import * as THREE from "three";
import {
  colors,
  borderRadius,
  typography,
  lightingPresets,
} from "@/lib/design-tokens";

interface CustomWindow extends Window {
  cassetteScene?: THREE.Group;
}

// UI Components
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  X,
  Menu,
  Settings,
  Play,
  Pen,
  Disc,
  Box,
  LogOut,
  ArrowLeftRight,
  ZoomIn,
  ShoppingCart,
} from "lucide-react";

// Type Definitions
type ViewMode = "tilted" | "flat";
type ShellFinish = "matte" | "chrome";

interface CassetteProps {
  stickerColor: string;
  scale: number;
  texture?: string | null;
  cassetteColor: string;
  shellFinish: ShellFinish;
  labelRotation: number;
  labelOffsetX: number;
  labelOffsetY: number;
  labelScaleX: number;
  labelScaleY: number;
  labelMirrorX: boolean;
  labelMirrorY: boolean;
  viewMode: ViewMode;
  flipCount?: number;
}

interface CameraLightboxProps {
  intensity?: number;
  color?: string;
  distance?: number;
}

interface SidebarProps {
  activeTab: "shell" | "label" | "tape" | "packaging";
  stickerColor: string;
  setStickerColor: (color: string) => void;
  cassetteColor: string;
  setCassetteColor: (color: string) => void;
  shellFinish: ShellFinish;
  setShellFinish: (finish: ShellFinish) => void;
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

      <directionalLight
        position={[0, 1.2, -8]}
        intensity={0.08}
        color="#8b5cf6"
        castShadow={false}
      />

      {/* Spot Light - Accent */}
      <spotLight
        position={[0, 5, 5]}
        angle={Math.PI / 6}
        penumbra={0.3}
        intensity={0.18}
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
      
      // Dark premium background with violet halo
      vec3 topColor = vec3(0.082, 0.082, 0.098);      // #151419
      vec3 middleColor = vec3(0.074, 0.075, 0.090);   // #131318
      vec3 bottomColor = vec3(0.051, 0.051, 0.063);   // near black
      
      // Main gradient
      vec3 baseGradient;
      if (gradientFactor > 0.6) {
        float t = (gradientFactor - 0.6) / 0.4;
        baseGradient = mix(middleColor, topColor, pow(t, 1.5));
      } else {
        float t = gradientFactor / 0.6;
        baseGradient = mix(bottomColor, middleColor, pow(t, 0.8));
      }

      // Violet halo around the center of the scene
      float radial = length(vWorldPosition.xz) * 0.08;
      float halo = exp(-pow(radial, 1.7) * 8.0);
      vec3 haloColor = vec3(0.545, 0.361, 0.961) * halo * 0.18;
      
      // Subtle noise variations
      vec2 noiseUV = vUv * 4.0 + uTime * 0.005;
      float noise1 = snoise(noiseUV) * 0.002;
      float noise2 = snoise(noiseUV * 2.5 - uTime * 0.004) * 0.0015;
      
      vec3 finalColor = baseGradient + haloColor + noise1 + noise2;
      
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

const CassetteHalo = () => {
  const haloTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const baseGradient = ctx.createRadialGradient(256, 270, 18, 256, 270, 240);
    baseGradient.addColorStop(0, "rgba(139, 92, 246, 0.55)");
    baseGradient.addColorStop(0.28, "rgba(139, 92, 246, 0.28)");
    baseGradient.addColorStop(0.58, "rgba(139, 92, 246, 0.10)");
    baseGradient.addColorStop(1, "rgba(139, 92, 246, 0)");

    const innerGlow = ctx.createRadialGradient(256, 256, 0, 256, 256, 130);
    innerGlow.addColorStop(0, "rgba(196, 181, 253, 0.22)");
    innerGlow.addColorStop(0.45, "rgba(139, 92, 246, 0.12)");
    innerGlow.addColorStop(1, "rgba(139, 92, 246, 0)");

    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = innerGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  if (!haloTexture) {
    return null;
  }

  return (
    <mesh position={[0, 0, -1.7]} scale={[6.8, 4.2, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={haloTexture}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

const CassetteRig = ({
  stickerColor,
  scale,
  texture,
  cassetteColor,
  shellFinish,
  labelRotation,
  labelOffsetX,
  labelOffsetY,
  labelScaleX,
  labelScaleY,
  labelMirrorX,
  labelMirrorY,
  viewMode,
  flipCount = 0,
}: CassetteProps) => {
  const rigRef = useRef<THREE.Group>(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const rotationTargetRef = useRef({ x: 0.02, y: 0.35, z: 0 });
  const rotationCurrentRef = useRef({ x: 0.02, y: 0.35, z: 0 });
  const previousFlipCountRef = useRef(flipCount);
  const rigYOffsetTargetRef = useRef(viewMode === "flat" ? 0.14 : 0.08);
  const rigYOffsetCurrentRef = useRef(rigYOffsetTargetRef.current);

  useEffect(() => {
    const nextRotation =
      viewMode === "flat"
        ? { x: 0.0, y: 0.0, z: -Math.PI / 2 }
        : { x: 0.02, y: 0.35, z: 0 };
    const nextYOffset = viewMode === "flat" ? 0.14 : 0.08;

    gsap.to(rotationTargetRef.current, {
      x: nextRotation.x,
      y: nextRotation.y,
      z: nextRotation.z,
      duration: 1.2,
      ease: "power3.inOut",
    });

    gsap.to(rigYOffsetTargetRef, {
      current: nextYOffset,
      duration: 1.2,
      ease: "power3.inOut",
    });
  }, [viewMode]);

  useEffect(() => {
    if (previousFlipCountRef.current === flipCount) {
      return;
    }

    previousFlipCountRef.current = flipCount;

    const nextRotation = {
      x: rotationTargetRef.current.x,
      y: rotationTargetRef.current.y + Math.PI,
      z: rotationTargetRef.current.z,
    };

    gsap.to(rotationTargetRef.current, {
      x: nextRotation.x,
      y: nextRotation.y,
      z: nextRotation.z,
      duration: 1.2,
      ease: "power3.inOut",
    });
  }, [flipCount]);

  const handleWindowPointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current) {
      return;
    }

    const deltaX = event.clientX - lastPointerRef.current.x;
    const deltaY = event.clientY - lastPointerRef.current.y;

    lastPointerRef.current = { x: event.clientX, y: event.clientY };

    rotationTargetRef.current.y += deltaX * 0.008;
    rotationTargetRef.current.x = THREE.MathUtils.clamp(
      rotationTargetRef.current.x + deltaY * 0.006,
      -0.28,
      0.28,
    );
  }, []);

  const stopDragging = useCallback(() => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", stopDragging);
  }, [handleWindowPointerMove]);

  useFrame((state, delta) => {
    if (!rigRef.current) {
      return;
    }

    void state;

    const smoothing = 1 - Math.exp(-8 * delta);

    rotationCurrentRef.current.x = THREE.MathUtils.lerp(
      rotationCurrentRef.current.x,
      rotationTargetRef.current.x,
      smoothing,
    );
    rotationCurrentRef.current.y = THREE.MathUtils.lerp(
      rotationCurrentRef.current.y,
      rotationTargetRef.current.y,
      smoothing,
    );
    rotationCurrentRef.current.z = THREE.MathUtils.lerp(
      rotationCurrentRef.current.z,
      rotationTargetRef.current.z,
      smoothing,
    );

    rigYOffsetCurrentRef.current = THREE.MathUtils.lerp(
      rigYOffsetCurrentRef.current,
      rigYOffsetTargetRef.current,
      smoothing,
    );

    rigRef.current.rotation.x = rotationCurrentRef.current.x;
    rigRef.current.rotation.y = rotationCurrentRef.current.y;
    rigRef.current.rotation.z = rotationCurrentRef.current.z;
    rigRef.current.position.y = rigYOffsetCurrentRef.current;
  });

  useEffect(() => {
    return () => {
      stopDragging();
    };
  }, [stopDragging]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    draggingRef.current = true;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
  };

  return (
    <>
      <SceneDragSurface
        onDragStart={handlePointerDown}
        onDragEnd={stopDragging}
      />
      <group ref={rigRef} position={[0, rigYOffsetCurrentRef.current, 0]}>
        <Cassette
          stickerColor={stickerColor}
          scale={scale}
          texture={texture}
          cassetteColor={cassetteColor}
          shellFinish={shellFinish}
          labelRotation={labelRotation}
          labelOffsetX={labelOffsetX}
          labelOffsetY={labelOffsetY}
          labelScaleX={labelScaleX}
          labelScaleY={labelScaleY}
          labelMirrorX={labelMirrorX}
          labelMirrorY={labelMirrorY}
          viewMode={viewMode}
        />
      </group>
    </>
  );
};

const SceneDragSurface = ({
  onDragStart,
  onDragEnd,
}: {
  onDragStart: (event: ThreeEvent<PointerEvent>) => void;
  onDragEnd: () => void;
}) => {
  return (
    <mesh
      position={[0, 0, 0]}
      onPointerDown={onDragStart}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
    >
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

const ResponsiveCamera = ({ isZoomed = false }: { isZoomed?: boolean }) => {
  const { camera, size } = useThree();

  useEffect(() => {
    const shortestSide = Math.min(size.width, size.height);
    let distance =
      shortestSide < 360
        ? 5.05
        : shortestSide < 520
          ? 4.65
          : shortestSide < 760
            ? 4.1
            : 3.6;

    if (isZoomed) {
      distance -= 1.0;
    }

    distance -= 0.25;

    gsap.to(camera.position, {
      z: distance,
      duration: 1.2,
      ease: "power3.inOut",
      onUpdate: () => camera.updateProjectionMatrix(),
    });
  }, [camera, size.width, size.height, isZoomed]);

  return null;
};

// Ombre diffuse améliorée

function Cassette({
  stickerColor,
  scale,
  texture,
  cassetteColor,
  shellFinish,
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
  const originalShellMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

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
    if (originalShellMaterialRef.current) {
      return;
    }

    const shellMesh = scene.getObjectByName("Object_4") as THREE.Mesh | null;
    if (!shellMesh?.isMesh) {
      return;
    }

    const shellMaterial = shellMesh.material;
    if (
      shellMaterial instanceof THREE.MeshStandardMaterial ||
      shellMaterial instanceof THREE.MeshPhysicalMaterial
    ) {
      originalShellMaterialRef.current = shellMaterial.clone();

      if (!originalImageRef.current && shellMaterial.map?.image) {
        originalImageRef.current = shellMaterial.map.image as HTMLImageElement;
      }
    }
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
            const colorValue =
              cassetteColor === "transparent" ? "#ffffff" : cassetteColor;

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
            } else if (shellFinish === "chrome") {
              const sourceMaterial = originalShellMaterialRef.current ?? material;

              // Dark mirrored plastic look: reflective and cheap-looking, not pure metal.
              const chromeMaterial = new THREE.MeshPhysicalMaterial({
                // Keep the albedo bright so the mask pattern remains readable,
                // while reflections + roughness create the dark cheap mirror feel.
                color: new THREE.Color("#d6d6da"),
                metalness: 0.38,
                roughness: 0.16,
                clearcoat: 1,
                clearcoatRoughness: 0.06,
                envMapIntensity: 0.72,
                ior: 1.5,
                reflectivity: 1,
                side: THREE.DoubleSide,
              });

              if (!originalImageRef.current && sourceMaterial.map?.image) {
                originalImageRef.current = sourceMaterial.map.image as HTMLImageElement;
              }

              const sourceImage = originalImageRef.current;
              if (sourceImage) {
                const canvas = document.createElement("canvas");
                canvas.width = sourceImage.width;
                canvas.height = sourceImage.height;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(sourceImage, 0, 0);

                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;

                  const tempColor = new THREE.Color(colorValue);
                  const r = Math.round(tempColor.r * 255);
                  const g = Math.round(tempColor.g * 255);
                  const b = Math.round(tempColor.b * 255);

                  for (let i = 0; i < data.length; i += 4) {
                    const pixelR = data[i];
                    const pixelG = data[i + 1];
                    const pixelB = data[i + 2];

                    if (pixelR < 50 && pixelG < 50 && pixelB < 50) {
                      data[i] = r;
                      data[i + 1] = g;
                      data[i + 2] = b;
                    }
                  }

                  ctx.putImageData(imageData, 0, 0);

                  const chromeMaskTexture = new THREE.CanvasTexture(canvas);
                  chromeMaskTexture.wrapS = THREE.ClampToEdgeWrapping;
                  chromeMaskTexture.wrapT = THREE.ClampToEdgeWrapping;
                  chromeMaskTexture.flipY = false;
                  chromeMaskTexture.colorSpace = THREE.SRGBColorSpace;
                  chromeMaskTexture.needsUpdate = true;
                  chromeMaterial.map = chromeMaskTexture;
                }
              }

              chromeMaterial.normalMap = sourceMaterial.normalMap ?? null;
              chromeMaterial.normalScale = new THREE.Vector2(0.012, 0.012);
              chromeMaterial.emissive = new THREE.Color("#000000");
              chromeMaterial.emissiveIntensity = 0;
              chromeMaterial.needsUpdate = true;

              mesh.material = chromeMaterial;
            } else {
              const sourceMaterial = originalShellMaterialRef.current ?? material;

              // Garder le matériau original avec sa texture
              mesh.material = sourceMaterial.clone();
              const newMaterial = mesh.material as THREE.MeshStandardMaterial;
              // Conserver les paramètres matière d'origine (roughness, normalMap, etc.)
              // et ne modifier que le masque de couleur.
              newMaterial.color = new THREE.Color("#ffffff");
              newMaterial.envMapIntensity = Math.min(
                newMaterial.envMapIntensity ?? 1,
                0.04,
              );

              // Rebuild the matte mask from the original source image so it
              // remains available even after switching from chrome mode.
              if (!originalImageRef.current && material.map?.image) {
                originalImageRef.current = material.map.image as HTMLImageElement;
              }

              const sourceImage = originalImageRef.current;
              if (sourceImage) {

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
                  newTexture.colorSpace = THREE.SRGBColorSpace;

                  newMaterial.map = newTexture;
                }
              } else {
                // Fallback: if no mask source is available, still apply selected color.
                newMaterial.color = new THREE.Color(colorValue);
              }

              newMaterial.needsUpdate = true;
            }
          }
          // Sticker: Appliquer la texture ou stickerColor
          else if (mesh.name === "Sticker") {
            const newMaterial = new THREE.MeshStandardMaterial({
              map: textureMap ?? null,
              color: textureMap ? new THREE.Color("#b0b0b0") : new THREE.Color(stickerColor),
              roughness: 1,
              metalness: 0,
              envMapIntensity: 0,
              side: THREE.FrontSide,
            });
            if (textureMap) {
              newMaterial.onBeforeCompile = () => {};
            } else {
              newMaterial.onBeforeCompile = () => {};
            }
            newMaterial.emissive = new THREE.Color("#000000");
            newMaterial.emissiveIntensity = 0;
            mesh.material = newMaterial;
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
    shellFinish,
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
        THREE.MathUtils.degToRad(90),
        THREE.MathUtils.degToRad(90),
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
  activeTab,
  stickerColor,
  setStickerColor,
  cassetteColor,
  setCassetteColor,
  shellFinish,
  setShellFinish,
  cassetteTexture,
  textureInputRef,
  handleTextureUpload,
  removeTexture,
  extractStickerTexture,
  downloadBaseTexture,
  isMobile,
}: SidebarProps & {
  activeTab: "shell" | "label" | "tape" | "packaging";
  textureInputRef: React.RefObject<HTMLInputElement>;
  handleTextureUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeTexture: () => void;
  extractStickerTexture: () => void;
  downloadBaseTexture: () => Promise<void>;
  isMobile?: boolean;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contentElement = contentRef.current;
    const titleElement = titleRef.current;

    if (!contentElement || !titleElement) {
      return;
    }

    gsap.killTweensOf([contentElement, titleElement]);

    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    timeline.fromTo(
      titleElement,
      { autoAlpha: 0, y: 8, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.28 },
    );

    timeline.fromTo(
      contentElement,
      { autoAlpha: 0, y: 16, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.42 },
      "-=0.08",
    );

    return () => {
      timeline.kill();
    };
  }, [activeTab, isMobile]);

  const colorPresets = [
    { color: colors.inkDeep, label: "Black" },
    { color: colors.canvas, label: "White" },
    { color: "#f5f5f5", label: "Pearl" },
    { color: "#d4d4d8", label: "Mist" },
    { color: "#a1a1aa", label: "Stone" },
    { color: "#52525b", label: "Graphite" },
    { color: colors.brandPink, label: "Pink" },
    { color: "#ec4899", label: "Magenta" },
    { color: "#db2777", label: "Fuchsia" },
    { color: colors.brandOrange, label: "Orange" },
    { color: "#f97316", label: "Tangerine" },
    { color: "#ea580c", label: "Burnt Orange" },
    { color: "#facc15", label: "Gold" },
    { color: colors.brandGreen, label: "Green" },
    { color: "#22c55e", label: "Lime" },
    { color: "#15803d", label: "Forest" },
    { color: colors.brandTeal, label: "Teal" },
    { color: "#0d9488", label: "Turquoise" },
    { color: "#0891b2", label: "Cyan" },
    { color: "#38bdf8", label: "Sky" },
    { color: "#2563eb", label: "Blue" },
    { color: "#1d4ed8", label: "Royal Blue" },
    { color: colors.primary, label: "Purple" },
    { color: "#7c3aed", label: "Violet" },
    { color: "#4c1d95", label: "Deep Purple" },
    { color: colors.charcoal, label: "Charcoal" },
    { color: colors.cardTintYellowBold, label: "Yellow" },
    { color: colors.brandBrown, label: "Brown" },
    { color: "#7f1d1d", label: "Bordeaux" },
    { color: "#be123c", label: "Ruby" },
    { color: "#e8e8e8", label: "Gray" },
    { color: "transparent", label: "Clear" },
  ];

  return (
    <div
      className={isMobile ? "space-y-6" : "space-y-8"}
      style={{ color: colors.onDark }}
    >
      <div ref={titleRef}>
        {activeTab === "shell" ? (
          <section className="space-y-4">
            <div
              style={{
                fontSize: typography.sizes.bodySmMedium.fontSize,
                fontWeight: 600,
                color: colors.onDark,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Cassette Shell
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "matte" as const, label: "Matte" },
                { id: "chrome" as const, label: "Chrome" },
              ].map((finish) => {
                const active = shellFinish === finish.id;
                return (
                  <button
                    key={finish.id}
                    type="button"
                    onClick={() => setShellFinish(finish.id)}
                    className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
                    style={{
                      border: `1px solid ${active ? colors.primary : colors.hairline}`,
                      backgroundColor: active
                        ? "rgba(124, 58, 237, 0.2)"
                        : colors.brandNavyDeep,
                      color: active ? colors.onDark : colors.onDarkMuted,
                    }}
                  >
                    {finish.label}
                  </button>
                );
              })}
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

            <div
              style={{
                fontSize: "11px",
                color: colors.onDarkMuted,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              30 couleurs disponibles
            </div>
          </section>
        ) : activeTab === "label" ? (
          <section className="space-y-4">
            <div
              style={{
                fontSize: typography.sizes.bodySmMedium.fontSize,
                fontWeight: 600,
                color: colors.onDark,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Label Design
            </div>

            {!cassetteTexture ? (
              <div className="space-y-3">
                <div>
                  <Label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: colors.onDarkMuted,
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

                <Button
                  variant="outline"
                  onClick={() => textureInputRef.current?.click()}
                  className="w-full"
                  style={{
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    borderColor: colors.hairline,
                    backgroundColor: colors.brandNavyMid,
                    color: colors.onDarkMuted,
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
                <div
                  style={{
                    position: "relative",
                    height: isMobile ? "60px" : "80px",
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${colors.hairline}`,
                    overflow: "hidden",
                    backgroundColor: colors.brandNavyMid,
                  }}
                >
                  <img
                    src={cassetteTexture}
                    alt="Label"
                    className="w-full h-full object-contain"
                    style={{ aspectRatio: "3.5 / 1.6562" }}
                  />
                </div>

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
                      color: colors.onDark,
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

            <input
              ref={textureInputRef}
              type="file"
              accept="image/*"
              onChange={handleTextureUpload}
              className="hidden"
            />

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
                  color: colors.onDarkMuted,
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
                  color: colors.onDarkMuted,
                  borderWidth: "1px",
                  borderRadius: borderRadius.md,
                }}
              >
                Template
              </Button>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#334155] bg-[#252530] px-4 py-6 text-sm text-[#94A3B8]">
            This section is coming next.
          </div>
        )}
      </div>

      <div ref={contentRef} />
    </div>
  );
};

// Modern Production-Ready Desktop Sidebar
const Sidebar = ({
  activeTab,
  stickerColor,
  setStickerColor,
  cassetteColor,
  setCassetteColor,
  shellFinish,
  setShellFinish,
  cassetteTexture,
  setCassetteTexture,
}: SidebarProps) => {
  const textureInputRef = useRef<HTMLInputElement>(null);

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
      className="flex h-full w-full flex-col bg-[#1C1C24] text-[#E2E8F0]"
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
          backgroundColor: colors.brandNavyDeep,
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
          {activeTab === "shell"
            ? "Shell"
            : activeTab === "label"
              ? "Label"
              : "Studio • Customizer"}
        </p>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 px-6 py-6">
        <SidebarContent
          activeTab={activeTab}
          stickerColor={stickerColor}
          setStickerColor={setStickerColor}
          cassetteColor={cassetteColor}
          setCassetteColor={setCassetteColor}
          shellFinish={shellFinish}
          setShellFinish={setShellFinish}
          cassetteTexture={cassetteTexture}
          setCassetteTexture={setCassetteTexture}
          textureInputRef={textureInputRef}
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

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stickerColor, setStickerColor] = useState(colors.canvas);
  const [cassetteColor, setCassetteColor] = useState(colors.canvas);
  const [shellFinish, setShellFinish] = useState<ShellFinish>("matte");
  const [cassetteTexture, setCassetteTexture] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "shell" | "label" | "tape" | "packaging"
  >("shell");
  const [viewMode, setViewMode] = useState<ViewMode>("tilted");
  const [flipCount, setFlipCount] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    (
      window as Window & { __tapeCraftViewMode?: ViewMode }
    ).__tapeCraftViewMode = viewMode;
  }, [viewMode]);

  const price = 12.9 + (cassetteTexture ? 3.0 : 0);

  const labelRotation = 90;
  const labelOffsetX = 0;
  const labelOffsetY = 0;
  const labelScaleX = 1;
  const labelScaleY = 1;
  const labelMirrorX = false;
  const labelMirrorY = true;
  const scale = 1;

  return (
    <div className="studio-shell flex h-screen w-screen overflow-hidden bg-[#141419] text-[#E2E8F0] flex-col md:flex-row">
      <Leva hidden />

      {/* Mobile Header - Only visible on mobile */}
      <header
        className="md:hidden fixed top-0 w-full z-40 h-16 flex items-center justify-between px-4"
        style={{
          backgroundColor: colors.primary,
          borderBottom: `1px solid ${colors.hairline}`,
        }}
      >
        <h1 className="text-base font-bold" style={{ color: colors.onDark }}>
          TAPE CRAFT
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1"
          style={{ color: colors.onDark }}
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Navigation Rail - Desktop only */}
      <nav className="hidden md:flex h-full w-20 flex-shrink-0 flex-col items-center border-r border-[#334155] bg-[#1C1C24] py-6">
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#252530] text-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <Play className="h-5 w-5" />
        </div>
        <div className="flex w-full flex-col gap-3 px-2">
          {[
            { id: "shell", label: "Shell", icon: Play },
            { id: "label", label: "Label", icon: Pen },
            { id: "tape", label: "Tape", icon: Disc },
            { id: "packaging", label: "Packaging", icon: Box },
          ].map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={
                  active
                    ? "relative flex flex-col items-center justify-center gap-1 rounded-xl border border-[#8B5CF6]/30 bg-[#252530] px-2 py-3 text-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                    : "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[#94A3B8] transition-colors hover:bg-[#252530] hover:text-[#E2E8F0]"
                }
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-md bg-[#8B5CF6]" />
                )}
                <Icon className="mb-1 h-6 w-6" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="mt-auto flex w-full items-center justify-center rounded-xl px-2 py-3 text-[#94A3B8] transition-colors hover:bg-[#252530] hover:text-[#E2E8F0]"
        >
          <LogOut className="h-6 w-6" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="relative min-w-0 flex-1 overflow-hidden bg-[#141419] pb-28 md:pb-0 flex flex-col md:flex-row">

        {/* Canvas Container */}
        <div className="relative md:h-full md:flex-1 w-full overflow-hidden main-bg-gradient">
          {/* Mobile Canvas */}
          <div className="relative md:hidden w-full aspect-square">
            <Canvas
              shadows={false}
              camera={{ position: [0, 0, 2.5], fov: 50 }}
              onCreated={({ gl }) => {
                gl.toneMappingExposure = 0.45;
              }}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "transparent",
                width: "100%",
                height: "100%",
              }}
            >
              <ResponsiveCamera isZoomed={isZoomed} />
              <Environment files="/exr/studio.exr" background={false} />
              <Environment3D />
              <DynamicLighting lighting={appleLighting} />
              <CameraLightbox
                intensity={0.06}
                color={colors.canvas}
                distance={2.2}
              />
              <FloatingParticles />
              <Suspense fallback={<Loader />}>
                <CassetteRig
                  stickerColor={stickerColor}
                  scale={scale}
                  texture={cassetteTexture}
                  cassetteColor={cassetteColor}
                  shellFinish={shellFinish}
                  labelRotation={labelRotation}
                  labelOffsetX={labelOffsetX}
                  labelOffsetY={labelOffsetY}
                  labelScaleX={labelScaleX}
                  labelScaleY={labelScaleY}
                  labelMirrorX={labelMirrorX}
                  labelMirrorY={labelMirrorY}
                  viewMode={viewMode}
                  flipCount={flipCount}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Desktop Canvas */}
          <Canvas
            shadows={false}
            camera={{ position: [0, 0, 2.5], fov: 50 }}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 0.45;
            }}
            className="hidden md:block"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "transparent",
              width: "100%",
              height: "100%",
              zIndex: 0,
            }}
          >
            <ResponsiveCamera isZoomed={isZoomed} />
            <Environment files="/exr/studio.exr" background={false} />
            <Environment3D />
            <DynamicLighting lighting={appleLighting} />
            <CameraLightbox
              intensity={0.06}
              color={colors.canvas}
              distance={2.2}
            />
            <CassetteHalo />
            <FloatingParticles />
            <Suspense fallback={<Loader />}>
              <CassetteRig
                stickerColor={stickerColor}
                scale={scale}
                texture={cassetteTexture}
                cassetteColor={cassetteColor}
                shellFinish={shellFinish}
                labelRotation={labelRotation}
                labelOffsetX={labelOffsetX}
                labelOffsetY={labelOffsetY}
                labelScaleX={labelScaleX}
                labelScaleY={labelScaleY}
                labelMirrorX={labelMirrorX}
                labelMirrorY={labelMirrorY}
                viewMode={viewMode}
                flipCount={flipCount}
              />
            </Suspense>
          </Canvas>

          {/* Desktop Floating Controls */}
          <div className="pointer-events-none absolute inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-28">
            <div className="pointer-events-auto flex w-full max-w-[780px] flex-wrap items-center justify-center overflow-hidden rounded-2xl border border-[#334155] bg-[#1C1C24]/95 px-2 py-1 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md md:w-auto md:flex-nowrap">
              <button
                type="button"
                onClick={() => setFlipCount((c) => c + 1)}
                className={`flex flex-1 items-center justify-center gap-2 border-r border-[#334155] px-3 py-2 text-xs transition-colors md:flex-none md:px-4 md:text-sm ${flipCount % 2 !== 0 ? "text-white bg-[#334155]/50" : "text-[#94A3B8] hover:text-white"}`}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Flip Side
              </button>
              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs transition-colors md:flex-none md:px-4 md:text-sm ${isZoomed ? "text-white bg-[#334155]/50" : "text-[#94A3B8] hover:text-white"}`}
              >
                <ZoomIn className="h-4 w-4" />
                Zoom
              </button>
              <button
                type="button"
                onClick={() =>
                  setViewMode((current) =>
                    current === "tilted" ? "flat" : "tilted",
                  )
                }
                className="flex w-full items-center justify-center gap-2 border-t border-[#334155] px-3 py-2 text-xs text-[#94A3B8] transition-colors hover:text-white md:w-auto md:border-l md:border-t-0 md:px-4 md:text-sm"
              >
                <Settings className="h-4 w-4" />
                {viewMode === "tilted" ? "Flat View" : "Side View"}
              </button>
            </div>
          </div>

          {/* Desktop Footer */}
          <div className="hidden md:flex pointer-events-none absolute inset-x-0 bottom-0 z-30 items-center justify-between border-t border-[#334155] bg-[#141419]/95 px-6 py-5 backdrop-blur-md">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#94A3B8]">
                Total
              </p>
              <div className="mt-1 text-3xl font-bold tracking-tight text-white">
                {price.toFixed(2)}€
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-4">
              <button className="rounded-xl border border-[#334155] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#252530]">
                SAVE DESIGN
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[#8B5CF6] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-colors hover:bg-[#7C3AED]">
                <ShoppingCart className="h-4 w-4" />
                ADD TO CART
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Customization Panel */}
        <div className="md:hidden w-full flex-1 overflow-y-auto bg-[#141419] space-y-6 px-4 py-4">
          <Sidebar
            activeTab={activeTab}
            stickerColor={stickerColor}
            setStickerColor={setStickerColor}
            cassetteColor={cassetteColor}
            setCassetteColor={setCassetteColor}
            shellFinish={shellFinish}
            setShellFinish={setShellFinish}
            cassetteTexture={cassetteTexture}
            setCassetteTexture={setCassetteTexture}
          />
        </div>

        {/* Desktop Right Panel */}
        <div className="hidden md:block h-full w-80 flex-shrink-0 bg-[#1C1C24] border-l border-[#334155] overflow-y-auto">
          <Sidebar
            activeTab={activeTab}
            stickerColor={stickerColor}
            setStickerColor={setStickerColor}
            cassetteColor={cassetteColor}
            setCassetteColor={setCassetteColor}
            shellFinish={shellFinish}
            setShellFinish={setShellFinish}
            cassetteTexture={cassetteTexture}
            setCassetteTexture={setCassetteTexture}
          />
        </div>
      </main>

      {/* Mobile Footer */}
      <footer className="md:hidden fixed bottom-20 w-full z-30 h-16 bg-[#1C1C24] backdrop-blur-md flex justify-between items-center px-4 border-t border-[#334155]">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase text-[#94A3B8]">
            Total
          </span>
          <span className="text-2xl font-bold text-[#8B5CF6]">
            {price.toFixed(2)}€
          </span>
        </div>
        <button className="bg-[#8B5CF6] text-white font-semibold rounded-lg px-6 py-3 hover:bg-[#7C3AED] transition-colors active:scale-95">
          Add to Cart
        </button>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 h-20 bg-[#1C1C24] border-t border-[#334155] flex justify-around items-center px-4 pb-2">
        {[
          { id: "shell", label: "Shell", icon: Play },
          { id: "label", label: "Label", icon: Pen },
          { id: "tape", label: "Tape", icon: Disc },
          { id: "packaging", label: "Packaging", icon: Box },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all ${
                active
                  ? "bg-[#8B5CF6] text-white"
                  : "text-[#94A3B8] hover:bg-[#252530]"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
