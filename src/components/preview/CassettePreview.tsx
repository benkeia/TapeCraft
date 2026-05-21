import { Copy, ZoomIn } from "lucide-react";

interface CassettePreviewProps {
  imageUrl?: string;
  onFlip?: () => void;
  onZoom?: () => void;
}

export function CassettePreview({
  imageUrl = "https://lh3.googleusercontent.com/aida/ADBb0uhhsD-FTKAPNcB3LvpmwdK8rZqbyO1Es2LOD00XEuW19VN6TkJzQ7WRlWzS72K_nHRKzJgYnWARMKcPBJrDUABquU5QXWxR1sOKjcqEqnN0tctf8nJLpW7JsTdINb0bFHnfAk1x4hMh30OTcqgWeOseGoSoIw329qNCc9Dw_ZvlhUfv8Y7tExPpDkkK6ngxh1__KZoLCIokgJcrYnl-yMSDw_jCzO4nj4u9uANeFeGW0iQ8KpWP-GtAVQ",
  onFlip,
  onZoom,
}: CassettePreviewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative px-8 pb-12">
      {/* Cassette Display Area */}
      <div className="relative w-full max-w-3xl aspect-[16/9] flex items-center justify-center drop-shadow-2xl">
        <img
          alt="Cassette Preview"
          src={imageUrl}
          className="max-w-full max-h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg"
        />
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 flex items-center bg-app-dark border border-app-border rounded-xl px-2 py-1 shadow-lg">
        <button
          onClick={onFlip}
          className="flex items-center gap-2 px-4 py-2 text-sm text-app-textMuted hover:text-white transition-colors border-r border-app-border"
        >
          <Copy className="w-4 h-4" />
          Flip Side
        </button>
        <button
          onClick={onZoom}
          className="flex items-center gap-2 px-4 py-2 text-sm text-app-textMuted hover:text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
          Zoom
        </button>
      </div>
    </div>
  );
}
