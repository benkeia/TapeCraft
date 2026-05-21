import { Download, Share2, Copy } from "lucide-react";
import { useState } from "react";

interface ExportPanelProps {
  designName?: string;
  onDownload?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  shareLink?: string;
}

export function ExportPanel({
  onDownload,
  onShare,
  onCopyLink,
  shareLink,
}: ExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    onCopyLink?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4 bg-app-panel/50 rounded-lg p-4 border border-app-border/50">
      <h2 className="text-xs font-bold text-app-textMuted tracking-wider uppercase">
        Export & Share
      </h2>

      <div className="flex gap-2">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-app-panel border border-app-border text-app-text hover:bg-app-border transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-app-panel border border-app-border text-app-text hover:bg-app-border transition-colors text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {shareLink && (
        <div className="flex gap-2">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="flex-1 bg-app-darkest border border-app-border rounded-lg px-3 py-2 text-xs text-app-textMuted font-mono truncate"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-lg bg-app-primary text-white hover:bg-app-primaryHover transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}

      {copied && (
        <div className="text-xs text-app-primary font-medium">Link copied!</div>
      )}
    </section>
  );
}
