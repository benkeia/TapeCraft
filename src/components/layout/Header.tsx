import { Settings } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Premium Cassette Customizer Studio" }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-6 w-full">
      <h1 className="text-2xl font-semibold text-white tracking-wide">{title}</h1>
      <button className="w-10 h-10 rounded-xl bg-app-panel border border-app-border flex items-center justify-center text-app-textMuted hover:text-white transition-colors">
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
}
