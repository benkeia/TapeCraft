interface AdvancedControlsProps {
  rotation?: number;
  onRotationChange?: (rotation: number) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  brightness?: number;
  onBrightnessChange?: (brightness: number) => void;
}

export function AdvancedControls({
  rotation = 0,
  onRotationChange,
  zoom = 1,
  onZoomChange,
  brightness = 1,
  onBrightnessChange,
}: AdvancedControlsProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-xs font-bold text-app-textMuted tracking-wider uppercase">
        Advanced Controls
      </h2>

      {/* Rotation Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-app-textMuted font-medium">
            Rotation
          </label>
          <span className="text-xs text-app-text font-semibold">
            {rotation}°
          </span>
        </div>
        <input
          type="range"
          value={rotation}
          onChange={(e) => onRotationChange?.(Number(e.target.value))}
          min={0}
          max={360}
          step={1}
          className="w-full"
        />
      </div>

      {/* Zoom Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-app-textMuted font-medium">Zoom</label>
          <span className="text-xs text-app-text font-semibold">
            {(zoom * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          value={zoom}
          onChange={(e) => onZoomChange?.(Number(e.target.value))}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Brightness Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-app-textMuted font-medium">
            Brightness
          </label>
          <span className="text-xs text-app-text font-semibold">
            {(brightness * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          value={brightness}
          onChange={(e) => onBrightnessChange?.(Number(e.target.value))}
          min={0.3}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>
    </section>
  );
}
