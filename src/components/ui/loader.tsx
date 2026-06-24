import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  className?: string;
}

export function Loader({ text = "Loading data...", className = "" }: LoaderProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
      <p className="text-zinc-400 text-sm animate-pulse">{text}</p>
    </div>
  );
}
