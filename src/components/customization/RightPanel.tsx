import { Separator } from "@/components/ui/separator";
import { ColorSwatch } from "./ColorSwatch";
import { TextureSelector } from "./TextureSelector";
import { LabelDesignSection } from "./LabelDesignSection";
import { AdvancedControls } from "./AdvancedControls";
import { useState } from "react";

import { PresetsGrid } from "./PresetsGrid";
import { ExportPanel } from "./ExportPanel";

interface RightPanelProps {
  onShellColorChange?: (color: string) => void;
  onTextureChange?: (texture: string) => void;
  onRotationChange?: (rotation: number) => void;
  onZoomChange?: (zoom: number) => void;
  onBrightnessChange?: (brightness: number) => void;
}

export function RightPanel({
  onShellColorChange,
  onTextureChange,
  onRotationChange,
  onZoomChange,
  onBrightnessChange,
}: RightPanelProps) {
  const [selectedShellColor, setSelectedShellColor] = useState("#FEF3C7");
  const [selectedTexture, setSelectedTexture] = useState<
    "matte" | "transparent" | "frosted"
  >("matte");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(1);

  const [selectedPreset, setSelectedPreset] = useState<string>();
  const [shareLink, setShareLink] = useState<string>();

  const shellColors = [
    { color: "#000000", label: null },
    { color: "#FFFFFF", label: null },
    { color: "#EC4899", label: null },
    { color: "#F97316", label: null },
    { color: "#22C55E", label: null },
    { color: "#0EA5E9", label: null },
    { color: "#8B5CF6", label: "Purple" },
    { color: "#475569", label: "Grey" },
    { color: "#FEF3C7", label: "Cream" },
    { color: "#92400E", label: "Brown" },
    { color: "transparent", label: "Clear", isClear: true },
    { color: null, label: "Custom", isCustom: true },
  ];

  const handleColorSelect = (color: string) => {
    setSelectedShellColor(color);
    onShellColorChange?.(color);
    setSelectedPreset(undefined); // Clear preset when manually selecting
  };

  const handleRotation = (rotation: number) => {
    setRotation(rotation);
    onRotationChange?.(rotation);
  };

  const handleZoom = (zoom: number) => {
    setZoom(zoom);
    onZoomChange?.(zoom);
  };

  const handleBrightness = (brightness: number) => {
    setBrightness(brightness);
    onBrightnessChange?.(brightness);
  };

  return (
    <aside className="w-[360px] bg-app-dark border-l border-app-border flex flex-col flex-shrink-0 z-20 pb-[80px]">
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 flex flex-col gap-8">
        {/* Section: Customize Shell */}
        <section>
          <h2 className="text-xs font-bold text-app-textMuted tracking-wider mb-4 uppercase">
            Customize Shell
          </h2>
          <div className="grid grid-cols-6 gap-y-4 gap-x-2">
            {shellColors.map((item, index) => (
              <ColorSwatch
                key={index}
                color={item.color || ""}
                label={item.label || undefined}
                isActive={selectedShellColor === item.color}
                onClick={() => handleColorSelect(item.color || "")}
                isClear={item.isClear}
                isCustom={item.isCustom}
              />
            ))}
          </div>
        </section>

        <Separator className="bg-app-border" />

        <PresetsGrid
          selectedPreset={selectedPreset}
          onPresetSelect={(preset) => {
            setSelectedPreset(preset.id);
            handleColorSelect(preset.shellColor);
            onTextureChange?.(preset.texture);
          }}
        />

        <Separator className="bg-app-border" />


        {/* Section: Texture */}
        <TextureSelector
          activeTexture={selectedTexture}
          onTextureChange={(texture) => {
            setSelectedTexture(texture);
            onTextureChange?.(texture);
          }}
        />

        <Separator className="bg-app-border" />

        {/* Section: Label Design */}
        <LabelDesignSection onFileUpload={(_file) => {}} />

        <Separator className="bg-app-border" />

        {/* Section: Advanced Controls */}
        <AdvancedControls
          rotation={rotation}
          onRotationChange={handleRotation}
          zoom={zoom}
          onZoomChange={handleZoom}
          brightness={brightness}
          onBrightnessChange={handleBrightness}
        />

        <Separator className="bg-app-border" />

        {/* Section: Export & Share */}
        <ExportPanel
          onDownload={() => console.log("Download triggered")}
          onShare={() => {
            const link = `${window.location.origin}/designs/shared-${Date.now()}`;
            setShareLink(link);
          }}
          onCopyLink={() => {
            if (shareLink) navigator.clipboard.writeText(shareLink);
          }}
          shareLink={shareLink}
        />
      </div>
    </aside>
  );
}
