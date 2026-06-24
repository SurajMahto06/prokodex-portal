"use client";

import * as React from "react";
import { Moon, Sun, Monitor, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" className="w-[110px] justify-between border border-transparent" disabled><span className="sr-only">Toggle theme</span></Button>;
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        className="w-10 md:w-[110px] px-0 md:px-4 justify-center md:justify-between text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900 focus:ring-1 focus:ring-cyan-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center capitalize">
          {theme === 'light' ? <Sun className="h-4 w-4 md:mr-2" /> : theme === 'dark' ? <Moon className="h-4 w-4 md:mr-2" /> : <Monitor className="h-4 w-4 md:mr-2" />}
          <span className="hidden md:inline">{theme}</span>
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 ml-2 hidden md:inline" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-32 rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <button onClick={() => { setTheme('light'); setIsOpen(false); }} className="w-full flex items-center px-4 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer">
              <Sun className="h-4 w-4 mr-2" /> Light
            </button>
            <button onClick={() => { setTheme('dark'); setIsOpen(false); }} className="w-full flex items-center px-4 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer">
              <Moon className="h-4 w-4 mr-2" /> Dark
            </button>
            <button onClick={() => { setTheme('system'); setIsOpen(false); }} className="w-full flex items-center px-4 py-2.5 text-[13px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer">
              <Monitor className="h-4 w-4 mr-2" /> System
            </button>
          </div>
        </>
      )}
    </div>
  );
}
