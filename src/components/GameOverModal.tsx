import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Map, Skull } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface GameOverModalProps {
  onRetry: () => void;
  onWorldMap: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRetry, onWorldMap }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 1));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setSelectedIndex((prev) => (prev < 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        buttonRefs.current[selectedIndex]?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const getButtonClass = (index: number, baseClass: string) => {
    return `${baseClass} ${
      selectedIndex === index ? 'ring-2 ring-sky-400 scale-[1.02] bg-slate-800' : ''
    }`;
  };

  return (
    <div id="game-over-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-rose-900/50 shadow-2xl flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-1">
          <Skull className="w-8 h-8 text-rose-400" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">GAME OVER</h2>
          <p className="text-xs text-slate-400 mt-1">Milo was overwhelmed, but heroes never surrender!</p>
        </div>

        <div className="w-full flex flex-col gap-2.5">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            id="gameover-retry-btn"
            onMouseEnter={() => setSelectedIndex(0)}
            onClick={() => {
              soundEngine.playJump();
              onRetry();
            }}
            className={getButtonClass(0, "w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer")}
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            id="gameover-map-btn"
            onMouseEnter={() => setSelectedIndex(1)}
            onClick={() => {
              soundEngine.playJump();
              onWorldMap();
            }}
            className={getButtonClass(1, "w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer")}
          >
            <Map className="w-4 h-4" />
            <span>RETURN TO WORLD MAP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
