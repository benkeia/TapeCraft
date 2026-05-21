import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: string;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  isCustom?: boolean;
  isClear?: boolean;
}

export function ColorSwatch({
  color,
  label,
  isActive = false,
  onClick,
  isCustom = false,
  isClear = false,
}: ColorSwatchProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          "w-8 h-8 rounded-full border transition-all flex items-center justify-center",
          isActive && "shadow-[0_0_0_2px_#1C1C24,0_0_0_4px_#E2E8F0]",
          !isActive && !isClear && "border-gray-700 hover:border-app-text",
          isClear && "border-app-border"
        )}
        style={!isClear && !isCustom ? { backgroundColor: color } : undefined}
      >
        {isClear && (
          <div className="absolute w-full h-[1px] bg-app-border transform -rotate-45" />
        )}
        {isCustom && (
          <span className="text-xs font-semibold text-app-textMuted">T</span>
        )}
      </button>
      {label && (
        <span
          className={cn(
            "text-[10px]",
            isActive ? "text-white" : "text-app-textMuted"
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
