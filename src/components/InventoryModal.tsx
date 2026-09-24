import React from 'react';
import { BRICK_TYPES, COLORS, Theme, BrickMaterialType } from '../types';
import { playClickSound } from '../audio';
import { X, Layers, Sparkles, Box } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  selectedColorIdx: number;
  selectedBrickTypeId: string;
  materialType: BrickMaterialType;
  soundEnabled: boolean;
  theme: Theme;
  onSelectColor: (idx: number) => void;
  onSelectBrickType: (id: string) => void;
  onSelectMaterialType: (mat: BrickMaterialType) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  selectedColorIdx,
  selectedBrickTypeId,
  materialType,
  soundEnabled,
  theme,
  onSelectColor,
  onSelectBrickType,
  onSelectMaterialType,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="inventory"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta a typy kostek"
      className="fixed inset-x-0 bottom-0 z-40 pb-8 pt-5 px-4 glass-mono-dropdown border-t border-white/20 transition-transform duration-200 max-h-[85vh] overflow-y-auto text-white shadow-2xl"
    >
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-white/80" />
            <h3 className="font-semibold text-lg tracking-wide text-white">
              Paleta, Materiály & Typy kostek
            </h3>
          </div>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            title="Zavřít (ESC)"
            aria-label="Zavřít paletu"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Material Type Selection (BASIC vs GLASS) - Monochromatic Glass */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-white/50 font-medium mb-2.5 block">
            Materiál kostky (Shader & Fyzika povrchu)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                playClickSound(soundEnabled);
                onSelectMaterialType('BASIC');
              }}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                materialType === 'BASIC'
                  ? 'bg-white/15 border-white text-white font-medium ring-1 ring-white/40'
                  : 'glass-mono-subtle text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="p-2 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
                <Box className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">BASIC (Plast)</span>
                <span className="text-[11px] text-white/50 mt-0.5">
                  Vysoce lesklý injection-molded ABS plast, ostré zkosené hrany a mikro-vrypy.
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                playClickSound(soundEnabled);
                onSelectMaterialType('GLASS');
              }}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                materialType === 'GLASS'
                  ? 'bg-white/15 border-white text-white font-medium ring-1 ring-white/40'
                  : 'glass-mono-subtle text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="p-2 rounded-lg bg-white/10 text-white shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">GLASS (Sklo)</span>
                <span className="text-[11px] text-white/50 mt-0.5">
                  Průhledný polykarbonát / optické sklo s vnitřní dutinou, trubičkami a transmisí.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Brick Type Selector */}
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-white/50 font-medium mb-2.5 block">
            Typ kostky se zaoblenými hranami
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BRICK_TYPES.map((type) => {
              const isSelected = type.id === selectedBrickTypeId;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    onSelectBrickType(type.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-md border-white'
                      : 'glass-mono-subtle text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-semibold">{type.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-black/70' : 'text-white/50'}`}>
                    {type.studsX}×{type.studsZ} studs ({Math.round(type.w * 100)}×{Math.round(type.l * 100)} cm)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-mono uppercase tracking-wider text-white/50 font-medium">
              Výběr barvy ({COLORS[selectedColorIdx]?.label || 'Červená'})
            </label>
            <span className="text-xs font-mono text-white/80 font-semibold">
              {COLORS[selectedColorIdx]?.css.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-3 rounded-2xl glass-mono-subtle">
            {COLORS.map((color, idx) => {
              const isActive = idx === selectedColorIdx;
              return (
                <button
                  key={color.hex}
                  onClick={() => {
                    playClickSound(soundEnabled);
                    onSelectColor(idx);
                  }}
                  title={color.label}
                  aria-label={color.label}
                  className={`aspect-square rounded-xl transition-all duration-150 cursor-pointer relative flex items-center justify-center ${
                    isActive
                      ? 'ring-4 ring-white scale-105 shadow-xl z-10'
                      : 'border border-black/30 hover:scale-105 active:scale-95 opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.css }}
                >
                  {color.isGlass && (
                    <Sparkles className="w-3.5 h-3.5 text-white/90 drop-shadow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            className="w-full sm:w-auto bg-white hover:bg-white/90 active:scale-95 text-black py-3 px-12 rounded-xl font-bold font-mono tracking-wider transition-all shadow-md"
          >
            ZAVŘÍT
          </button>
        </div>
      </div>
    </div>
  );
};
