"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface SplashLoaderProps {
  isLoading: boolean;
}

export function SplashLoader({ isLoading }: SplashLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Trigger fade-out animation, then unmount
      setFadeOut(true);
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div className="relative mb-8 animate-[logoEntrance_0.5s_ease-out_forwards]">
        <Image
          src="/logo-dark.png"
          alt="Prokodex"
          width={160}
          height={60}
          className="hidden dark:block"
          priority
        />
        <Image
          src="/logo-light.png"
          alt="Prokodex"
          width={160}
          height={60}
          className="block dark:hidden"
          priority
        />
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 -z-10 blur-2xl scale-150 opacity-30 bg-cyan-500 rounded-full" />
      </div>

      {/* Animated progress bar */}
      <div className="w-48 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-full animate-[progressBar_1.2s_ease-in-out_infinite]" />
      </div>

      {/* Subtitle */}
      <p className="mt-5 text-zinc-500 text-xs tracking-widest uppercase animate-pulse">
        Loading application...
      </p>

      <style>{`
        @keyframes logoEntrance {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressBar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

