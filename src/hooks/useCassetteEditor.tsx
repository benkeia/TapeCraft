import { useCallback } from "react";
import * as THREE from "three";
import { useScene } from "@/sceneContext";
import { colors, typography } from "@/lib/design-tokens";

export function useCassetteEditor(
  cassetteTexture: string | null,
  setCassetteTexture: (v: string | null) => void,
) {
  const { scene } = useScene();

  const calculatePrice = useCallback(
    () => 12.9 + (cassetteTexture ? 3.0 : 0),
    [cassetteTexture],
  );

  const handleTextureUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCassetteTexture(result);
      };
      reader.readAsDataURL(file);
    },
    [setCassetteTexture],
  );

  const removeTexture = useCallback(() => {
    setCassetteTexture(null);
  }, [setCassetteTexture]);

  const extractStickerTexture = useCallback(() => {
    try {
      if (!scene) throw new Error("3D scene not available");
      let stickerMesh: THREE.Mesh | null = null;
      scene.traverse((child) => {
        if (child.name === "Sticker" && (child as THREE.Mesh).isMesh) {
          stickerMesh = child as THREE.Mesh;
        }
      });

      if (!stickerMesh || !(stickerMesh as THREE.Mesh).material)
        throw new Error("Sticker mesh not found");

      const material = stickerMesh.material as THREE.MeshStandardMaterial;
      if (!material.map || !material.map.image)
        throw new Error("No texture found on sticker");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  const downloadBaseTexture = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 3500;
      canvas.height = 1656;
      const ctx = canvas.getContext("2d");
      const scaleX = canvas.width / 512;
      const scaleY = canvas.height / 256;
      const sx = (value: number) => value * scaleX;
      const sy = (value: number) => value * scaleY;

      if (!ctx) return;

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
  }, []);

  return {
    calculatePrice,
    handleTextureUpload,
    removeTexture,
    extractStickerTexture,
    downloadBaseTexture,
  };
}

export default useCassetteEditor;
