/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BrickEngine } from './engine';
import { BuildMode, Theme, BrickMaterialType, COLORS } from './types';
import { LoaderScreen } from './components/LoaderScreen';
import { TouchJoystick } from './components/TouchJoystick';
import { TopBar } from './components/TopBar';
import { SideBar } from './components/SideBar';
import { BottomControls } from './components/BottomControls';
import { InventoryModal } from './components/InventoryModal';
import { HelpModal } from './components/HelpModal';
import { JsonExportModal } from './components/JsonExportModal';
import { BRICK_TYPES } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BrickEngine | null>(null);

  const [theme, setTheme] = useState<Theme>('dark');
  const [engineStatus, setEngineStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [statusText, setStatusText] = useState('INICIALIZACE MODELU...');
  const [mode, setMode] = useState<BuildMode>('BUILD');
  const [colorIdx, setColorIdx] = useState(0); // 0 = Red (Primary iconic LEGO color)
  const [materialType, setMaterialType] = useState<BrickMaterialType>('BASIC');
  const [rotation, setRotation] = useState(0);
  const [brickTypeId, setBrickTypeId] = useState('bb3005');
  const [brickCount, setBrickCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [jsonExportOpen, setJsonExportOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerHeight, setPlayerHeight] = useState(1.6);
  const [realisticFx, setRealisticFx] = useState(true);
  const [ssaoEnabled, setSsaoEnabled] = useState(true);
  const [sunAngle, setSunAngle] = useState(65);
  const [dynamicSunOrbit, setDynamicSunOrbit] = useState(false);
  const [cursorData, setCursorData] = useState<{
    inCanvas: boolean;
    screenX: number;
    screenY: number;
    worldPos: { x: number; y: number; z: number } | null;
    isHoveringBrick: boolean;
    activeMode: BuildMode;
  }>({
    inCanvas: false,
    screenX: 0,
    screenY: 0,
    worldPos: null,
    isHoveringBrick: false,
    activeMode: 'BUILD',
  });

  const invOpenRef = useRef(invOpen);
  const helpOpenRef = useRef(helpOpen);
  invOpenRef.current = invOpen;
  helpOpenRef.current = helpOpen;

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new BrickEngine(containerRef.current, {
      onBrickCountChange: (count) => setBrickCount(count),
      onCanUndoChange: (can) => setCanUndo(can),
      onStatusChange: (status, text) => {
        setEngineStatus(status);
        if (text) setStatusText(text);
      },
      onHeightChange: (h) => setPlayerHeight(h),
      onCursorUpdate: (data) => {
        setCursorData({
          inCanvas: data.inCanvas,
          screenX: data.screenX,
          screenY: data.screenY,
          worldPos: data.worldPos ? { x: data.worldPos.x, y: data.worldPos.y, z: data.worldPos.z } : null,
          isHoveringBrick: data.isHoveringBrick,
          activeMode: data.activeMode,
        });
      },
      onEscape: () => {
        if (helpOpenRef.current) {
          setHelpOpen(false);
          return true;
        }
        if (invOpenRef.current) {
          setInvOpen(false);
          return true;
        }
        return false;
      },
    });

    engine.setColorIdx(0);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleToggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    engineRef.current?.setTheme(nextTheme);
  };

  const handleSetMode = (m: BuildMode) => {
    setMode(m);
    engineRef.current?.setMode(m);
  };

  const handleSelectMaterialType = (mat: BrickMaterialType) => {
    setMaterialType(mat);
    engineRef.current?.setMaterialType(mat);
  };

  const handleSelectColor = (idx: number) => {
    setColorIdx(idx);
    engineRef.current?.setColorIdx(idx);
    if (COLORS[idx]?.isGlass) {
      setMaterialType('GLASS');
      engineRef.current?.setMaterialType('GLASS');
    }
  };

  const handleSelectBrickType = (id: string) => {
    setBrickTypeId(id);
    engineRef.current?.setBrickType(id);
  };

  const handleRotate = () => {
    engineRef.current?.rotate();
    if (engineRef.current) {
      setRotation(engineRef.current.rotation);
    }
  };

  const handleUndo = () => {
    engineRef.current?.undo();
  };

  const handleClearScene = () => {
    engineRef.current?.clearAll();
  };

  const handleResetCamera = () => {
    engineRef.current?.resetCamera();
  };

  const handleElevate = (delta: number) => {
    engineRef.current?.elevate(delta);
  };

  const handleLoadPreset = (name: 'tower' | 'pyramid' | 'house') => {
    engineRef.current?.loadPreset(name);
  };

  const handleAction = () => {
    engineRef.current?.performAction();
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.soundEnabled = next;
      }
      return next;
    });
  };

  const handleToggleRealisticFx = () => {
    setRealisticFx((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setRealisticFx(next);
      }
      return next;
    });
  };

  const handleToggleSSAO = () => {
    setSsaoEnabled((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setSSAOEnabled(next);
      }
      return next;
    });
  };

  const handleSetSunAngle = (angle: number) => {
    setSunAngle(angle);
    if (engineRef.current) {
      engineRef.current.setSunAngle(angle);
    }
  };

  const handleToggleDynamicSunOrbit = () => {
    setDynamicSunOrbit((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setDynamicSunOrbit(next);
      }
      return next;
    });
  };

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden select-none touch-none ${
        theme === 'dark' ? 'bg-[#0a0e17]' : 'bg-[#e2e8f0]'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair"
      />

      {/* Cinematic Studio Vignette */}
      {realisticFx && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            theme === 'dark'
              ? 'bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.48)_100%)]'
              : 'bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(71,85,105,0.16)_100%)]'
          }`}
        />
      )}

      {/* Auto Cursor & Reticle */}
      {engineStatus === 'ready' && (
        <>
          {cursorData.inCanvas ? (
            <div
              className="auto-cursor-reticle"
              style={{
                left: cursorData.screenX,
                top: cursorData.screenY,
              }}
            >
              <div
                className={`auto-cursor-ring ${
                  cursorData.activeMode === 'ERASE' ? 'erase-mode' : ''
                }`}
              >
                <div className="auto-cursor-dot" />
              </div>

              {cursorData.worldPos && (
                <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg glass-mono-subtle text-[10px] font-mono tracking-tight text-white/90 shadow-xl">
                  [{cursorData.worldPos.x.toFixed(1)}, {cursorData.worldPos.y.toFixed(1)}, {cursorData.worldPos.z.toFixed(1)}]
                </div>
              )}
            </div>
          ) : (
            <div className="crosshair" />
          )}
        </>
      )}

      {/* Loading Screen */}
      {engineStatus === 'loading' && (
        <LoaderScreen statusText={statusText} subText="Autentické LEGO kostky & studiové osvětlení" />
      )}

      {/* In-Game Minimal UI Overlay */}
      {engineStatus === 'ready' && (
        <div id="ui" className="absolute inset-0 pointer-events-none">
          {/* Virtual Joystick for Touch */}
          <TouchJoystick engine={engineRef.current} />

          {/* Top Panel Controls */}
          <TopBar
            canUndo={canUndo}
            brickCount={brickCount}
            rotation={rotation}
            soundEnabled={soundEnabled}
            playerHeight={playerHeight}
            theme={theme}
            realisticFx={realisticFx}
            ssaoEnabled={ssaoEnabled}
            sunAngle={sunAngle}
            dynamicSunOrbit={dynamicSunOrbit}
            onUndo={handleUndo}
            onRotate={handleRotate}
            onToggleTheme={handleToggleTheme}
            onToggleSound={handleToggleSound}
            onToggleRealisticFx={handleToggleRealisticFx}
            onToggleSSAO={handleToggleSSAO}
            onSetSunAngle={handleSetSunAngle}
            onToggleDynamicSunOrbit={handleToggleDynamicSunOrbit}
            onResetCamera={handleResetCamera}
            onClearScene={handleClearScene}
            onOpenHelp={() => setHelpOpen(true)}
            onOpenJsonExport={() => setJsonExportOpen(true)}
            onElevate={handleElevate}
            onLoadPreset={handleLoadPreset}
          />

          {/* Side Mode Selector */}
          <SideBar
            mode={mode}
            soundEnabled={soundEnabled}
            theme={theme}
            onSetMode={handleSetMode}
          />

          {/* Bottom Right Action & Color Pill */}
          <BottomControls
            mode={mode}
            colorIdx={colorIdx}
            materialType={materialType}
            soundEnabled={soundEnabled}
            theme={theme}
            onAction={handleAction}
            onSelectColor={handleSelectColor}
            onSelectMaterialType={handleSelectMaterialType}
            onToggleInventory={() => setInvOpen((prev) => !prev)}
          />

          {/* Inventory & Color Palette Drawer */}
          <InventoryModal
            isOpen={invOpen}
            selectedColorIdx={colorIdx}
            selectedBrickTypeId={brickTypeId}
            materialType={materialType}
            soundEnabled={soundEnabled}
            theme={theme}
            onSelectColor={handleSelectColor}
            onSelectBrickType={handleSelectBrickType}
            onSelectMaterialType={handleSelectMaterialType}
            onClose={() => setInvOpen(false)}
          />

          {/* Help / Controls modal */}
          <HelpModal
            isOpen={helpOpen}
            soundEnabled={soundEnabled}
            theme={theme}
            onClose={() => setHelpOpen(false)}
          />

          {/* Lego JSON Model Export Modal */}
          <JsonExportModal
            isOpen={jsonExportOpen}
            onClose={() => setJsonExportOpen(false)}
            currentType={BRICK_TYPES.find((b) => b.id === brickTypeId) || BRICK_TYPES[0]}
            currentColorHex={COLORS[colorIdx]?.hex ?? 0xde1a24}
            currentMaterialType={materialType}
            bricks={engineRef.current ? engineRef.current.getBricks() : []}
          />
        </div>
      )}
    </main>
  );
}
