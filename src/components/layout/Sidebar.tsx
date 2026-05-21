import { Play, Pen, Disc, Box, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: "shell" | "label" | "tape" | "packaging";
  onTabChange: (tab: "shell" | "label" | "tape" | "packaging") => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "shell", label: "Shell", icon: Play },
    { id: "label", label: "Label", icon: Pen },
    { id: "tape", label: "Tape", icon: Disc },
    { id: "packaging", label: "Packaging", icon: Box },
  ] as const;

  return (
    <nav className="w-20 bg-app-dark border-r border-app-border flex flex-col items-center py-6 flex-shrink-0 relative z-20">
      {/* Logo */}
      <div className="mb-8 w-10 h-10 rounded-xl bg-app-panel flex items-center justify-center text-app-primary">
        <Play className="w-5 h-5" />
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-6 w-full px-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all relative group",
              activeTab === id
                ? "bg-app-panel bg-opacity-80 text-app-primary border border-app-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "text-app-textMuted hover:text-app-text hover:bg-app-panel"
            )}
          >
            {activeTab === id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-app-primary rounded-r-md" />
            )}
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-auto mb-4 w-full px-2">
        <button className="flex items-center justify-center w-full py-3 rounded-lg text-app-textMuted hover:text-app-text hover:bg-app-panel transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
