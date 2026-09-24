import React from 'react';
import { BuildMode, COLORS, Theme, BrickMaterialType } from '../types';
import { playClickSound } from '../audio';
import { Plus, Trash2, Palette, Sparkles, Box } from 'lucide-react';

interface BottomControlsProps {
  mode: BuildMode;
  colorIdx: number;
  materialType: BrickMaterialType;
  soundEnabled: boolean;
  theme: Theme;
  onAction: () => void;
  onSelectColor: (idx: number) => void;
  onSelectMaterialType: (mat: BrickMaterialType) => void;
  onToggleInventory: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  mode,
  colorIdx,
  materialType,
  soundEnabled,
  theme,
  onAction,
  onSelectColor,
  onSelectMaterialType,
  onToggleInventory,
}) => {
  const activeColor = COLORS[colorIdx]?.css || '#de1a24';

  // Primary 4 Iconic LEGO colors
  const primary4Colors = COLORS.slice(0, 4);

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
      {/* Material Selector Pill: BASIC vs GLASS (Glass Blur Monochromatic) */}
      <div className="p-1 rounded-2xl flex items-center gap-1 pointer-events-auto glass-mono transition-all">
        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onSelectMaterialType('BASIC');
          }}
          title="Materiál: Základní ABS Plast (vysoký lesk, reálné mikroškrábance)"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            materialType === 'BASIC'
              ? 'bg-white text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>BASIC</span>
        </button>

        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onSelectMaterialType('GLASS');
          }}
          title="Materiál: Průhledné Sklo / Glass (fyzikální lom světla, vnitřní dutina)"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            materialType === 'GLASS'
              ? 'bg-white text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>GLASS</span>
        </button>
      </div>

      {/* Main Action (Build / Erase) & Direct 4 Colors Bar */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* 4 Quick LEGO Colors & Palette Opener in Glass Blur Monochromatic Container */}
        <div className="p-1.5 sm:p-2 rounded-2xl flex items-center gap-1.5 glass-mono transition-all">
          {/* Direct 4 Colors Quick Picks */}
          <div className="flex items-center gap-1.5 pr-1.5 border-r border-white/15">
            {primary4Colors.map((col, idx) => {
              const isSelected = idx === colorIdx;
              return (
                <button
                  key={col.hex}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    onSelectColor(idx);
                  }}
                  title={`Vybrat barvu: ${col.label}`}
                  style={{ backgroundColor: col.css }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 shadow-lg'
                      : 'opacity-80 hover:opacity-100 hover:scale-105 active:scale-95'
                  }`}
                />
              );
            })}
          </div>

          {/* Active Color Preview & Full Palette Drawer */}
          <button
            id="btn-inventory"
            onClick={() => {
              playClickSound(soundEnabled);
              onToggleInventory();
            }}
            title="Otevřít celou paletu (16+ barev a typy kostek)"
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-all active:scale-95"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-inner"
              style={{ backgroundColor: activeColor }}
            />
            <Palette className="w-3.5 h-3.5 hidden sm:inline text-white/80" />
            <span className="text-[11px] font-mono font-bold tracking-tight">16+ BARVY</span>
          </button>
        </div>

        {/* Big Action Button (POLOŽIT / SMAZAT) - Glass Monochromatic */}
        <button
          id="btn-action"
          onClick={() => {
            onAction();
          }}
          title={
            mode === 'BUILD'
              ? 'Položit kostku (Mezerník / Kliknutí myší)'
              : 'Smazat zaměřenou kostku (Mezerník / Kliknutí myší)'
          }
          aria-label={mode === 'BUILD' ? 'Položit kostku' : 'Smazat kostku'}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shadow-2xl transition-all transform active:scale-95 cursor-pointer ${
            mode === 'BUILD'
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-white/20 text-white border border-white/40 backdrop-blur-xl hover:bg-white/30'
          }`}
        >
          {mode === 'BUILD' ? (
            <>
              <Plus className="w-7 h-7 stroke-[3]" />
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase">POLOŽIT</span>
            </>
          ) : (
            <>
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase">SMAZAT</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
