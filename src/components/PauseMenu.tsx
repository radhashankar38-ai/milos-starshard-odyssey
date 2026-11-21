import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Map, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onWorldMap: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onWorldMap,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 3));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setSelectedIndex((prev) => (prev < 3 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        buttonRefs.current[selectedIndex]?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // Add focus styles dynamically based on selectedIndex
  const getButtonClass = (index: number, baseClass: string) => {
    return `${baseClass} ${
      selectedIndex === index ? 'ring-2 ring-sky-400 scale-[1.02] bg-slate-800' : ''
    }`;
  };

  return (
    <div id="pause-menu-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col items-center text-center gap-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">GAME PAUSED</h2>
          <p className="text-xs text-slate-400 mt-1">Take a breath, adventurer</p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            id="pause-resume-btn"
            onMouseEnter={() => setSelectedIndex(0)}
            onClick={() => {
              soundEngine.playJump();
              onResume();
            }}
            className={getButtonClass(0, "w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer")}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>

          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            id="pause-restart-btn"
            onMouseEnter={() => setSelectedIndex(1)}
            onClick={() => {
              soundEngine.playJump();
              onRestart();
            }}
            className={getButtonClass(1, "w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer")}
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART STAGE</span>
          </button>

          <button
            ref={(el) => (buttonRefs.current[2] = el)}
            id="pause-sound-btn"
            onMouseEnter={() => setSelectedIndex(2)}
            onClick={onToggleSound}
            className={getButtonClass(2, "w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer")}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            <span>AUDIO: {soundEnabled ? 'ENABLED' : 'MUTED'}</span>
          </button>

          <button
            ref={(el) => (buttonRefs.current[3] = el)}
            id="pause-map-btn"
            onMouseEnter={() => setSelectedIndex(3)}
            onClick={() => {
              soundEngine.playJump();
              onWorldMap();
            }}
            className={getButtonClass(3, "w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer")}
          >
            <Map className="w-4 h-4" />
            <span>EXIT TO WORLD MAP</span>
          </button>
        </div>

        {/* Quick Controls Reference */}
        <div className="w-full p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1 text-left">
          <div className="flex justify-between">
            <span>Move:</span>
            <span className="font-mono text-slate-200">Arrows / WASD</span>
          </div>
          <div className="flex justify-between">
            <span>Jump:</span>
            <span className="font-mono text-slate-200">Up / W / Space / Z</span>
          </div>
          <div className="flex justify-between">
            <span>Air Dash / Sprint:</span>
            <span className="font-mono text-slate-200">Shift / E / J / L</span>
          </div>
          <div className="flex justify-between">
            <span>Attack / Shoot:</span>
            <span className="font-mono text-slate-200">X / F</span>
          </div>
          <div className="flex justify-between">
            <span>Ground Pound:</span>
            <span className="font-mono text-slate-200">Down (in air)</span>
          </div>
          <div className="flex justify-between">
            <span>Cycle 3D Camera:</span>
            <span className="font-mono text-cyan-300">C</span>
          </div>
        </div>
      </div>
    </div>
  );
};
