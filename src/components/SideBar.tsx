import React from 'react';
import { BuildMode, Theme } from '../types';
import { playClickSound } from '../audio';
import { Hammer, Eraser } from 'lucide-react';

interface SideBarProps {
  mode: BuildMode;
  soundEnabled: boolean;
  theme: Theme;
  onSetMode: (mode: BuildMode) => void;
}

export const SideBar: React.FC<SideBarProps> = ({ mode, soundEnabled, theme, onSetMode }) => {
  return (
    <aside
      aria-label="Režim stavění nebo mazání"
      className="fixed left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
    >
      <div className="p-1.5 rounded-2xl flex flex-col gap-2 pointer-events-auto glass-mono transition-all">
        {/* Build Mode Button with Monochromatic Active Inversion */}
        <button
          id="mode-build"
          onClick={() => {
            playClickSound(soundEnabled);
            onSetMode('BUILD');
          }}
          title="Režim stavění (Klávesa B)"
          aria-label="Režim stavění"
          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
            mode === 'BUILD'
              ? 'bg-white text-black font-bold shadow-md'
              : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Hammer className="w-5 h-5" />
          <span className="text-[9px] font-mono leading-none mt-0.5">STAVĚT</span>
        </button>

        {/* Erase Mode Button with Monochromatic Contrast */}
        <button
          id="mode-erase"
          onClick={() => {
            playClickSound(soundEnabled);
            onSetMode('ERASE');
          }}
          title="Režim mazání (Klávesa E nebo X)"
          aria-label="Režim mazání"
          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
            mode === 'ERASE'
              ? 'bg-white text-black font-bold shadow-md'
              : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Eraser className="w-5 h-5" />
          <span className="text-[9px] font-mono leading-none mt-0.5">SMAZAT</span>
        </button>
      </div>
    </aside>
  );
};
