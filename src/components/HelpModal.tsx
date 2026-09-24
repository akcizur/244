import React from 'react';
import { X, Smartphone, Monitor, ShieldCheck } from 'lucide-react';
import { playClickSound } from '../audio';
import { Theme } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  theme: Theme;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, soundEnabled, theme, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nápověda ovládání"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="rounded-3xl p-6 max-w-md w-full glass-mono-dropdown border border-white/20 text-white flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white/80" />
            <h3 className="font-bold text-lg text-white">Ovládání a minimalismus</h3>
          </div>
          <button
            onClick={() => {
              playClickSound(soundEnabled);
              onClose();
            }}
            title="Zavřít (ESC)"
            aria-label="Zavřít nápovědu"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/25 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimalist Design & Proportions */}
        <div className="p-3 rounded-xl text-xs leading-relaxed glass-mono-subtle border border-white/10 text-white/80">
          <strong className="text-white block mb-1">Materiály (BASIC & GLASS), vnitřní dutina a lom světla:</strong>
          Kostky disponují autentickou geometrií s jemným zaoblením hran, vnitřním prostorem s dutými spojovacími trubičkami a studiovými odlesky. Lze přepínat mezi <strong className="text-white">BASIC</strong> (lesklý ABS plast s čirým lakem) a <strong className="text-white">GLASS</strong> (transparentní lom světla s fyzikální transmisí), s výběrem z více než 16 odstínů.
        </div>

        {/* Desktop Keyboard & Mouse Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-white/90 font-semibold text-sm">
            <Monitor className="w-4 h-4 text-white/80" />
            <span>Počítač (Klávesnice & Myš)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl glass-mono-subtle border border-white/10 font-mono text-white/80">
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">W A S D</span> Pohyb</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">Myš</span> Tah = Pohled</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">Klik / Mezerník</span> Akce</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">ESC</span> Zpět / Zavřít</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">R</span> Otočit o 90°</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">B / E</span> Stavět / Mazat</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">Kolečko / PgUp</span> Výška</div>
            <div><span className="font-bold text-white bg-white/15 px-1.5 py-0.5 rounded border border-white/15">C / I</span> Paleta barev</div>
          </div>
        </div>

        {/* Mobile touch controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-white/90 font-semibold text-sm">
            <Smartphone className="w-4 h-4 text-white/80" />
            <span>Mobil / Dotykové ovládání</span>
          </div>
          <ul className="text-xs space-y-1 p-3 rounded-xl glass-mono-subtle border border-white/10 text-white/80">
            <li><strong className="text-white">Levá strana:</strong> Virtuální joystick pro plynulý pohyb</li>
            <li><strong className="text-white">Pravá strana:</strong> Potažením prstu se rozhlížíte</li>
            <li><strong className="text-white">Tlačítko vpravo dole:</strong> Položit / smazat blok</li>
          </ul>
        </div>

        <button
          onClick={() => {
            playClickSound(soundEnabled);
            onClose();
          }}
          className="w-full bg-white hover:bg-white/90 text-black font-semibold font-mono py-2.5 rounded-xl transition-colors shadow-md"
        >
          Rozumím
        </button>
      </div>
    </div>
  );
};
