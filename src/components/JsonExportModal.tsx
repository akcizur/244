/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrickType, BrickMaterialType, COLORS, BRICK_TYPES } from '../types';
import { generateLegoBrickJson, generateSceneLegoJson } from '../legoJsonGenerator';
import { BYLDR_BBB_1X1X1_DATA } from '../byldrMesh';
import * as THREE from 'three';

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: BrickType;
  currentColorHex: number;
  currentMaterialType: BrickMaterialType;
  bricks: THREE.Group[];
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  isOpen,
  onClose,
  currentType,
  currentColorHex,
  currentMaterialType,
  bricks,
}) => {
  const [activeTab, setActiveTab] = useState<'byldr' | '1x1' | 'selected' | 'scene'>('byldr');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let jsonDoc;
  let filename = 'bbb_1x1x1.json';

  if (activeTab === 'byldr') {
    jsonDoc = BYLDR_BBB_1X1X1_DATA;
    filename = 'bbb_1x1x1.json';
  } else if (activeTab === '1x1') {
    const type1x1 = BRICK_TYPES.find((t) => t.id === 'bb3005') || BRICK_TYPES[0];
    jsonDoc = generateLegoBrickJson(type1x1, 16711680, 'BASIC'); // Canonical 0xff0000 Red 1x1
    filename = 'lego-brick-1x1.json';
  } else if (activeTab === 'selected') {
    jsonDoc = generateLegoBrickJson(currentType, currentColorHex, currentMaterialType);
    filename = `lego-${currentType.id}.json`;
  } else {
    jsonDoc = generateSceneLegoJson(bricks);
    filename = 'lego-model-scene.json';
  }

  const jsonString = JSON.stringify(jsonDoc, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] glass-mono rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold tracking-wider uppercase text-white font-mono">
              LegoBrickJsonGenerator
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              Three.js 4.5
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Zavřít"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/5 bg-white/[0.02] overflow-x-auto">
          <button
            onClick={() => setActiveTab('byldr')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-lg whitespace-nowrap transition-all ${
              activeTab === 'byldr'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            BYLDR CAD Mesh (bbb_1x1x1)
          </button>
          <button
            onClick={() => setActiveTab('1x1')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-lg whitespace-nowrap transition-all ${
              activeTab === '1x1'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            1x1 Model (Canonical 4.5)
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-lg whitespace-nowrap transition-all ${
              activeTab === 'selected'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Vybraná kostka ({currentType.name.split(' ')[0]})
          </button>
          <button
            onClick={() => setActiveTab('scene')}
            className={`px-3 py-1.5 text-xs font-mono rounded-t-lg whitespace-nowrap transition-all ${
              activeTab === 'scene'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Celá scéna ({bricks.length})
          </button>
        </div>

        {/* JSON Code Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-black/40">
          <pre className="text-xs font-mono leading-relaxed text-white/90 selection:bg-white selection:text-black">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.02]">
          <div className="text-[11px] font-mono text-white/50">
            {activeTab === 'byldr' && 'bbb_1x1x1 | 100 vertexů, 196 trojúhelníků, 5.08mm × 7.29mm'}
            {activeTab === '1x1' && '7.8mm × 9.6mm × 7.8mm | Stud R 2.4mm, H 1.8mm'}
            {activeTab === 'selected' && `${currentType.w * 16}mm × ${currentType.h * 16}mm × ${currentType.l * 16}mm`}
            {activeTab === 'scene' && `${bricks.length} umístěných objektů v souřadném systému`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 glass-mono hover:bg-white/20 active:scale-95"
            >
              {copied ? '✓ Zkopírováno' : 'Kopírovat JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 bg-white text-black hover:bg-white/90 active:scale-95 shadow-md"
            >
              Stáhnout .json
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
