import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresetDesign {
  id: string;
  name: string;
  shellColor: string;
  texture: "matte" | "transparent" | "frosted";
  thumbnail?: string;
}

interface PresetsGridProps {
  presets?: PresetDesign[];
  onPresetSelect?: (preset: PresetDesign) => void;
  selectedPreset?: string;
}

export function PresetsGrid({
  presets,
  onPresetSelect,
  selectedPreset,
}: PresetsGridProps) {
  const defaultPresets: PresetDesign[] = [
    { id: "classic-black", name: "Classic Black", shellColor: "#000000", texture: "matte" },
    { id: "pristine-white", name: "Pristine White", shellColor: "#FFFFFF", texture: "matte" },
    { id: "vibrant-pink", name: "Vibrant Pink", shellColor: "#EC4899", texture: "transparent" },
    { id: "sunset-orange", name: "Sunset Orange", shellColor: "#F97316", texture: "matte" },
    { id: "mint-green", name: "Mint Green", shellColor: "#22C55E", texture: "frosted" },
    { id: "sky-blue", name: "Sky Blue", shellColor: "#0EA5E9", texture: "transparent" },
  ];

  const displayPresets = presets && presets.length > 0 ? presets : defaultPresets;

  return (
    <section>
      <h2 className="text-xs font-bold text-app-textMuted tracking-wider mb-4 uppercase">
        Design Presets
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {displayPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetSelect?.(preset)}
            className={cn(
              "relative group h-20 rounded-lg border border-app-border transition-all overflow-hidden",
              selectedPreset === preset.id && "border-app-primary ring-2 ring-app-primary/30"
            )}
            style={{ backgroundColor: preset.shellColor }}
          >
            {/* Texture overlay */}
            <div
              className={cn(
                "absolute inset-0",
                preset.texture === "matte" && "bg-gradient-to-br from-black/10 to-white/10",
                preset.texture === "transparent" && "bg-gradient-to-br from-white/20 to-transparent opacity-50",
                preset.texture === "frosted" && "bg-noise opacity-30"
              )}
            />

            {/* Checkmark for selected */}
            {selectedPreset === preset.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Label on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm">
              <span className="text-xs font-semibold text-white text-center px-2">
                {preset.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
