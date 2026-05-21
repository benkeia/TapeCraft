import { ShoppingCart } from "lucide-react";

interface BottomBarProps {
  price?: number;
  onSave?: () => void;
  onAddToCart?: () => void;
}

export function BottomBar({ 
  price = 12.90, 
  onSave, 
  onAddToCart 
}: BottomBarProps) {
  return (
    <div className="absolute bottom-0 left-20 right-0 h-[80px] bg-app-darkest border-t border-app-border flex items-center justify-between px-6 z-30">
      <div className="text-3xl font-bold text-white tracking-tight">
        TOTAL: {price.toFixed(2)}€
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onSave}
          className="px-6 py-3 rounded-lg border border-app-border text-sm font-semibold text-white hover:bg-app-panel transition-colors"
        >
          SAVE DESIGN
        </button>
        <button
          onClick={onAddToCart}
          className="px-8 py-3 rounded-lg bg-app-primary text-white text-sm font-semibold flex items-center gap-2 hover:bg-app-primaryHover transition-colors shadow-lg shadow-app-primary/20"
        >
          <ShoppingCart className="w-4 h-4" />
          ADD TO CART
        </button>
      </div>
    </div>
  );
}
