import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { StageDefinition, WorldDefinition } from '../types';
import { Star, Sparkles, Trophy, Clock, ArrowRight, RotateCcw, Map } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface LevelClearModalProps {
  world: WorldDefinition;
  stage: StageDefinition;
  stats: {
    time: number;
    shards: number;
    grandShards: [boolean, boolean, boolean];
    score: number;
  };
  grade: 'S' | 'A' | 'B' | 'C';
  onNextStage: () => void;
  onReplay: () => void;
  onWorldMap: () => void;
}

export const LevelClearModal: React.FC<LevelClearModalProps> = ({
  world,
  stage,
  stats,
  grade,
  onNextStage,
  onReplay,
  onWorldMap,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Confetti fanfare blast
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'],
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 2));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setSelectedIndex((prev) => (prev < 2 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (selectedIndex === 2) setSelectedIndex(1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (selectedIndex === 1) setSelectedIndex(2);
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        buttonRefs.current[selectedIndex]?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'S': return 'text-amber-300 border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.4)]';
      case 'A': return 'text-sky-300 border-sky-400 bg-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.3)]';
      case 'B': return 'text-emerald-300 border-emerald-400 bg-emerald-500/20';
      default: return 'text-slate-300 border-slate-500 bg-slate-500/20';
    }
  };

  const getButtonClass = (index: number, baseClass: string) => {
    return `${baseClass} ${
      selectedIndex === index ? 'ring-2 ring-sky-400 scale-[1.02] bg-slate-800' : ''
    }`;
  };

  return (
    <div id="level-clear-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col items-center text-center gap-5">
        {/* Victory Ribbon & Header */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-1">
            <Trophy className="w-7 h-7 text-slate-950" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">STAGE COMPLETE!</span>
          <h2 className="text-2xl font-black text-white">{stage.name}</h2>
          <span className="text-xs text-slate-400">{world.name}</span>
        </div>

        {/* Grade Badge */}
        <div className={`px-6 py-2 rounded-2xl border-2 font-black text-3xl ${getGradeColor(grade)} flex items-center gap-2`}>
          <span className="text-xs font-bold uppercase text-slate-300">Grade</span>
          <span>{grade}</span>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          {/* Time */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <Clock className="w-3 h-3" />
              <span>Time</span>
            </div>
            <span className="text-sm font-mono font-bold text-slate-200 mt-1">{stats.time}s</span>
          </div>

          {/* Starshards */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <Star className="w-3 h-3 text-yellow-400" />
              <span>Shards</span>
            </div>
            <span className="text-sm font-mono font-bold text-yellow-300 mt-1">{stats.shards}</span>
          </div>

          {/* Grand Shards */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Grand</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {stats.grandShards.map((found, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    found ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            id="clear-next-stage-btn"
            onMouseEnter={() => setSelectedIndex(0)}
            onClick={() => {
              soundEngine.playJump();
              onNextStage();
            }}
            className={getButtonClass(0, "w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer")}
          >
            <span>CONTINUE ADVENTURE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              ref={(el) => (buttonRefs.current[1] = el)}
              id="clear-replay-btn"
              onMouseEnter={() => setSelectedIndex(1)}
              onClick={() => {
                soundEngine.playJump();
                onReplay();
              }}
              className={getButtonClass(1, "py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>

            <button
              ref={(el) => (buttonRefs.current[2] = el)}
              id="clear-world-map-btn"
              onMouseEnter={() => setSelectedIndex(2)}
              onClick={() => {
                soundEngine.playJump();
                onWorldMap();
              }}
              className={getButtonClass(2, "py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer")}
            >
              <Map className="w-3.5 h-3.5" />
              <span>World Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
