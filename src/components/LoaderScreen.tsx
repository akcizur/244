import React from 'react';

interface LoaderScreenProps {
  statusText?: string;
  subText?: string;
}

export const LoaderScreen: React.FC<LoaderScreenProps> = ({
  statusText = 'INICIALIZACE...',
  subText = 'Autentické LEGO kostky & studiové osvětlení',
}) => {
  return (
    <div
      id="loader-screen"
      className="fixed inset-0 bg-[#07090e] z-50 flex flex-col items-center justify-center select-none"
    >
      <div className="relative mb-8 flex items-center justify-center">
        {/* Monochromatic glass blur spinner */}
        <div className="w-16 h-16 rounded-2xl glass-mono flex items-center justify-center shadow-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-white/80 animate-spin border-t-transparent" />
        </div>
      </div>

      <h2
        id="load-status"
        className="text-white font-mono tracking-[0.2em] text-sm sm:text-base uppercase text-center px-4"
      >
        {statusText}
      </h2>
      <p className="text-white/50 text-xs font-mono mt-2 tracking-wider">
        {subText}
      </p>

      <div className="mt-8 flex items-center gap-2 text-white/40 text-xs font-mono tracking-widest uppercase">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Byldr Studio
      </div>
    </div>
  );
};
