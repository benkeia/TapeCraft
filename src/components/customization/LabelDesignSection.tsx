import { Upload, Bold, Italic, AlignLeft } from "lucide-react";
import { useState } from "react";

interface LabelDesignSectionProps {
  onFileUpload?: (file: File) => void;
  onTextChange?: (text: string) => void;
  onFontChange?: (font: string) => void;
  onBoldToggle?: () => void;
  onItalicToggle?: () => void;
  onAlignChange?: () => void;
}

export function LabelDesignSection({
  onFileUpload,
  onTextChange,
  onFontChange,
  onBoldToggle,
  onItalicToggle,
  onAlignChange,
}: LabelDesignSectionProps) {
  const [text, setText] = useState("");
  const [font, setFont] = useState("Inter");

  return (
    <section>
      <h2 className="text-xs font-bold text-app-textMuted tracking-wider mb-4 uppercase">
        Label Design
      </h2>

      {/* Upload Box */}
      <div
        className="border border-dashed border-app-textMuted rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-white transition-colors cursor-pointer mb-4 bg-app-panel/30"
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Upload className="w-6 h-6 text-app-textMuted" />
        <span className="text-sm text-app-textMuted">Upload Artwork</span>
      </div>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileUpload?.(file);
          }
        }}
      />

      {/* Custom Text Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Custom Text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTextChange?.(e.target.value);
          }}
          className="w-full bg-app-panel border border-app-border rounded-lg px-4 py-3 text-sm text-white placeholder-app-textMuted focus:outline-none focus:border-app-primary focus:ring-1 focus:ring-app-primary"
        />
      </div>

      {/* Font Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={font}
            onChange={(e) => {
              setFont(e.target.value);
              onFontChange?.(e.target.value);
            }}
            className="w-full appearance-none bg-app-panel border border-app-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-app-primary focus:ring-1 focus:ring-app-primary pr-10"
          >
            <option>Font</option>
            <option>Inter</option>
            <option>Roboto</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-app-textMuted">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <button
          onClick={onBoldToggle}
          className="w-12 h-[46px] flex items-center justify-center bg-app-panel border border-app-border rounded-lg text-white font-bold hover:bg-app-border transition-colors"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={onItalicToggle}
          className="w-12 h-[46px] flex items-center justify-center bg-app-panel border border-app-border rounded-lg text-white hover:bg-app-border transition-colors"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={onAlignChange}
          className="w-12 h-[46px] flex items-center justify-center bg-app-panel border border-app-border rounded-lg text-white hover:bg-app-border transition-colors"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
