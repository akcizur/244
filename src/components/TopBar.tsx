import React, { useState } from 'react';
import {
  RotateCw,
  Undo2,
  Sun,
  Moon,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Eye,
  Trash2,
  HelpCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Layers,
  Orbit,
  Code2,
} from 'lucide-react';
import { playClickSound } from '../audio';
import { Theme } from '../types';

interface TopBarProps {
  canUndo: boolean;
  brickCount: number;
  rotation: number;
  soundEnabled: boolean;
  playerHeight: number;
  theme: Theme;
  realisticFx: boolean;
  ssaoEnabled?: boolean;
  sunAngle?: number;
  dynamicSunOrbit?: boolean;
  onUndo: () => void;
  onRotate: () => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onToggleRealisticFx: () => void;
  onToggleSSAO?: () => void;
  onSetSunAngle?: (angle: number) => void;
  onToggleDynamicSunOrbit?: () => void;
  onResetCamera: () => void;
  onClearScene: () => void;
  onOpenHelp: () => void;
  onOpenJsonExport?: () => void;
  onElevate: (delta: number) => void;
  onLoadPreset: (name: 'tower' | 'pyramid' | 'house') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  canUndo,
  brickCount,
  rotation,
  soundEnabled,
  playerHeight,
  theme,
  realisticFx,
  ssaoEnabled = true,
  sunAngle = 65,
  dynamicSunOrbit = false,
  onUndo,
  onRotate,
  onToggleTheme,
  onToggleSound,
  onToggleRealisticFx,
  onToggleSSAO,
  onSetSunAngle,
  onToggleDynamicSunOrbit,
  onResetCamera,
  onClearScene,
  onOpenHelp,
  onOpenJsonExport,
  onElevate,
  onLoadPreset,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [presetSubmenu, setPresetSubmenu] = useState(false);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
      {/* Glass Blur Monochromatic Main Bar */}
      <nav
        aria-label="Hlavní panel"
        className="px-2.5 py-1.5 rounded-2xl flex items-center gap-1.5 pointer-events-auto glass-mono transition-all"
      >
        {/* Undo button with ESC indicator */}
        <button
          id="btn-undo"
          onClick={() => {
            playClickSound(soundEnabled);
            onUndo();
          }}
          disabled={!canUndo}
          title="Zpět (Klávesa ESC nebo Z)"
          aria-label="Krok zpět"
          className={`h-9 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-all ${
            canUndo
              ? 'bg-white/10 hover:bg-white/20 active:bg-white/25 text-white active:scale-95'
              : 'opacity-25 cursor-not-allowed text-white/40'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Zpět</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 font-mono text-white/70">ESC</span>
        </button>

        {/* Rotate button */}
        <button
          id="btn-rotate"
          onClick={() => {
            onRotate();
          }}
          title={`Otočit model (R) - ${rotation * 90}°`}
          aria-label="Otočit model"
          className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-all active:scale-95"
        >
          <RotateCw className="w-4 h-4 text-white/80" />
          <span className="font-mono text-white font-semibold">{rotation * 90}°</span>
        </button>

        <div className="w-[1px] h-5 bg-white/15 mx-0.5" />

        {/* Brick count badge */}
        <div
          title="Počet položených kostek"
          className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-medium bg-white/5 border border-white/10 text-white/90"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{brickCount} <span className="hidden sm:inline font-normal text-white/60">kostek</span></span>
        </div>

        {/* Height Elevation Stepper */}
        <div
          className="flex items-center h-9 px-1 rounded-xl glass-mono-subtle"
        >
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onElevate(-0.3);
            }}
            title="Snížit výšku pohledu (PageDown / Kolečko dolů)"
            aria-label="Snížit výšku"
            className="p-1 rounded-lg hover:bg-white/15 active:scale-90 text-white/60 hover:text-white"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono whitespace-nowrap text-white/90" title="Výška pohledu">
            {playerHeight.toFixed(1)}m
          </span>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onElevate(0.3);
            }}
            title="Zvýšit výšku pohledu (PageUp / Kolečko nahoru)"
            aria-label="Zvýšit výšku"
            className="p-1 rounded-lg hover:bg-white/15 active:scale-90 text-white/60 hover:text-white"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-white/15 mx-0.5" />

        {/* Quick Sunlight Angle button */}
        {realisticFx && (
          <button
            id="btn-sun-angle"
            onClick={() => {
              playClickSound(soundEnabled);
              const nextAngles = [45, 120, 230, 315];
              const curAngle = sunAngle;
              const nextAngle = nextAngles.find((a) => a > curAngle + 15) ?? nextAngles[0];
              onSetSunAngle?.(nextAngle);
            }}
            title={`Úhel slunce & stínů: ${Math.round(sunAngle)}° (Kliknutím přepnete úhel)`}
            aria-label="Úhel slunce"
            className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-mono bg-white/10 hover:bg-white/20 active:bg-white/25 text-white transition-all active:scale-95"
          >
            <Sun className="w-3.5 h-3.5 text-white/80" />
            <span className="text-[11px] font-semibold">{Math.round(sunAngle)}°</span>
          </button>
        )}

        {/* Menu & Settings Dropdown Toggle */}
        <div className="relative">
          <button
            id="btn-menu-toggle"
            onClick={() => {
              playClickSound(soundEnabled);
              setMenuOpen((prev) => !prev);
              setPresetSubmenu(false);
            }}
            title="Další možnosti a nastavení"
            aria-label="Menu"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              menuOpen
                ? 'bg-white text-black shadow-md'
                : 'bg-white/10 hover:bg-white/20 active:bg-white/25 text-white active:scale-95'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Glass Blur Monochromatic Settings Dropdown */}
          {menuOpen && (
            <div
              className="absolute top-12 right-0 w-64 rounded-2xl p-2 glass-mono-dropdown flex flex-col gap-1 z-30 pointer-events-auto animate-fade-scale"
            >
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                Možnosti & Nástroje
              </div>

              {/* Presets Button */}
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  setPresetSubmenu((p) => !p);
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                  presetSubmenu
                    ? 'bg-white/15 text-white'
                    : 'hover:bg-white/10 text-white/85'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span>Vzory staveb</span>
                </div>
                <span className="text-[10px] font-mono text-white/50">3 vzory</span>
              </button>

              {/* Presets Submenu */}
              {presetSubmenu && (
                <div className="p-1.5 rounded-xl flex flex-col gap-1 glass-mono-subtle">
                  <button
                    onClick={() => {
                      playClickSound(soundEnabled);
                      onLoadPreset('tower');
                      setMenuOpen(false);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 hover:bg-white/15 text-white/90"
                  >
                    <span>🏰</span>
                    <span className="font-medium">Hradní věž (2.4m)</span>
                  </button>
                  <button
                    onClick={() => {
                      playClickSound(soundEnabled);
                      onLoadPreset('pyramid');
                      setMenuOpen(false);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 hover:bg-white/15 text-white/90"
                  >
                    <span>🔺</span>
                    <span className="font-medium">Pyramida (3 stupně)</span>
                  </button>
                  <button
                    onClick={() => {
                      playClickSound(soundEnabled);
                      onLoadPreset('house');
                      setMenuOpen(false);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 hover:bg-white/15 text-white/90"
                  >
                    <span>🏠</span>
                    <span className="font-medium">Domek se střechou</span>
                  </button>
                </div>
              )}

              {/* Realistic Scene FX Toggle */}
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onToggleRealisticFx();
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-white/10 text-white/90 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/80" />
                  <span>Realistické Scene FX</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-white/70">
                  {realisticFx ? 'ZAP' : 'VYP'}
                </span>
              </button>

              {/* SSAO Crevice Shadows & Dynamic Sunlight Controls */}
              {realisticFx && (
                <div className="p-2 rounded-xl glass-mono-subtle flex flex-col gap-2">
                  <button
                    onClick={() => {
                      playClickSound(soundEnabled);
                      onToggleSSAO?.();
                    }}
                    title="Screen Space Ambient Occlusion - zvýrazňuje spáry a záhyby mezi kostkami"
                    className="w-full text-left text-xs flex items-center justify-between hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-white/80" />
                      <div>
                        <div className="font-medium text-white/90">SSAO Okluze štěrbin</div>
                        <div className="text-[10px] text-white/50">Hloubka ve spojích & spárách</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-white/70">
                      {ssaoEnabled ? 'ZAP' : 'VYP'}
                    </span>
                  </button>

                  <div className="w-full h-[1px] bg-white/10" />

                  {/* Dynamic Sunlight & Soft Shadows */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-white/90">
                        <Sun className="w-3.5 h-3.5 text-white/80" />
                        <span className="font-medium">Úhel slunce</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-white">{Math.round(sunAngle)}°</span>
                    </div>

                    {/* Angle Presets */}
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: '45°', angle: 45, title: 'Ráno' },
                        { label: '120°', angle: 120, title: 'Poledne' },
                        { label: '230°', angle: 230, title: 'Západ' },
                        { label: '315°', angle: 315, title: 'Soumrak' },
                      ].map((item) => (
                        <button
                          key={item.angle}
                          onClick={() => {
                            playClickSound(soundEnabled);
                            onSetSunAngle?.(item.angle);
                          }}
                          title={item.title}
                          className={`py-1 text-[10px] font-mono rounded-lg border transition-all ${
                            Math.abs(sunAngle - item.angle) < 15
                              ? 'bg-white text-black font-bold border-white shadow-sm'
                              : 'bg-white/5 border-white/10 hover:bg-white/15 text-white/80'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Sunlight Slider */}
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={sunAngle}
                      onChange={(e) => onSetSunAngle?.(Number(e.target.value))}
                      aria-label="Nastavení úhlu slunce"
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white my-1"
                    />

                    {/* Dynamic Sun Orbit Toggle */}
                    <button
                      onClick={() => {
                        playClickSound(soundEnabled);
                        onToggleDynamicSunOrbit?.();
                      }}
                      title="Plynulý pohyb slunce vrhající živé rotující stíny"
                      className={`w-full py-1 px-2 rounded-lg text-[11px] flex items-center justify-between border transition-colors ${
                        dynamicSunOrbit
                          ? 'bg-white/20 border-white/40 text-white font-medium'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Orbit className={`w-3.5 h-3.5 ${dynamicSunOrbit ? 'text-white animate-spin' : 'text-white/60'}`} />
                        <span>Dynamický oběh slunce</span>
                      </div>
                      <span className="font-mono font-semibold text-[10px]">{dynamicSunOrbit ? 'ZAP' : 'VYP'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  onToggleSound();
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-white/10 text-white/90 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-white/80" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/40" />
                  )}
                  <span>Zvukové efekty</span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-white/70">
                  {soundEnabled ? 'ZAP' : 'VYP'}
                </span>
              </button>

              {/* Reset Camera */}
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onResetCamera();
                  setMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <Eye className="w-4 h-4 text-white/60" />
                <span>Resetovat kameru</span>
              </button>

              {/* Lego JSON Model Export (LegoBrickJsonGenerator) */}
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onOpenJsonExport?.();
                  setMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-white/10 text-white/90 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-white/70" />
                  <span>Model LEGO (JSON)</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                  Three.js 4.5
                </span>
              </button>

              {/* Help Modal */}
              <button
                onClick={() => {
                  playClickSound(soundEnabled);
                  onOpenHelp();
                  setMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs flex items-center gap-2 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
                <span>Nápověda & Zkratky</span>
              </button>

              {/* Clear Scene */}
              {brickCount > 0 && (
                <>
                  <div className="w-full h-[1px] bg-white/10 my-1" />
                  <button
                    onClick={() => {
                      playClickSound(soundEnabled);
                      if (window.confirm('Opravdu chcete vyčistit všechny položené kostky?')) {
                        onClearScene();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-white/75 hover:text-white hover:bg-white/15 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white/60" />
                    <span>Smazat všechny kostky</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
