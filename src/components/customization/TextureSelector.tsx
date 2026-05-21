import { cn } from "@/lib/utils";

interface TextureSelectorProps {
  activeTexture: "matte" | "transparent" | "frosted";
  onTextureChange: (texture: "matte" | "transparent" | "frosted") => void;
}

export function TextureSelector({
  activeTexture,
  onTextureChange,
}: TextureSelectorProps) {
  const textures = ["matte", "transparent", "frosted"] as const;

  return (
    <section>
      <h2 className="text-xs font-bold text-app-textMuted tracking-wider mb-4 uppercase">
        Texture
      </h2>
      <div className="flex bg-app-panel rounded-lg p-1 border border-app-border">
        {textures.map((texture) => (
          <button
            key={texture}
            onClick={() => onTextureChange(texture)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
              activeTexture === texture
                ? "bg-app-border text-white shadow-sm"
                : "text-app-textMuted hover:text-white"
            )}
          >
            {texture.charAt(0).toUpperCase() + texture.slice(1)}
          </button>
        ))}
      </div>
    </section>
  );
}
