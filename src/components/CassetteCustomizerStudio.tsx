import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomBar } from "@/components/layout/BottomBar";
import { RightPanel } from "@/components/customization/RightPanel";
import { CassettePreview } from "@/components/preview/CassettePreview";

type ActiveTab = "shell" | "label" | "tape" | "packaging";

interface CassettCustomizerStudioProps {
  initialPrice?: number;
}

export function CassetteCustomizerStudio({
  initialPrice = 12.90,
}: CassettCustomizerStudioProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("shell");
  const [price, setPrice] = useState(initialPrice);

  const handleSaveDesign = useCallback(() => {
    console.log("Design saved");
    // Implement save logic
  }, []);

  const handleAddToCart = useCallback(() => {
    console.log("Added to cart");
    // Implement add to cart logic
  }, []);

  const handleFlip = useCallback(() => {
    console.log("Flip cassette");
  }, []);

  const handleZoom = useCallback(() => {
    console.log("Zoom cassette");
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden h-screen w-screen bg-app-darkest text-app-text font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0 main-bg-gradient pb-[80px]">
        <Header />
        <CassettePreview onFlip={handleFlip} onZoom={handleZoom} />
      </main>

      {/* Right Customization Panel */}
      <RightPanel
        onShellColorChange={(color) => console.log("Shell color:", color)}
        onTextureChange={(texture) => console.log("Texture:", texture)}
        onRotationChange={(rotation) => console.log("Rotation:", rotation)}
        onZoomChange={(zoom) => console.log("Zoom:", zoom)}
        onBrightnessChange={(brightness) => console.log("Brightness:", brightness)}
      />

      {/* Bottom Bar */}
      <BottomBar
        price={price}
        onSave={handleSaveDesign}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

export default CassetteCustomizerStudio;
