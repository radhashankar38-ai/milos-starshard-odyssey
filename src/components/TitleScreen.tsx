import React, { useState, useEffect, useRef } from 'react';
import { Play, Map, BookOpen, Volume2, VolumeX, Sparkles, Star, Flame, Feather, Shield, Zap } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenWorldMap: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenWorldMap,
  soundEnabled,
  onToggleSound,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (showHowToPlay) return; // Disable keyboard nav when modal is open

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'w' || e.key === 'a' || e.key === 'W' || e.key === 'A') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 2));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 's' || e.key === 'd' || e.key === 'S' || e.key === 'D') {
        setSelectedIndex((prev) => (prev < 2 ? prev + 1 : 0));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        buttonRefs.current[selectedIndex]?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, showHowToPlay]);

  const getButtonClass = (index: number, baseClass: string) => {
    return `${baseClass} ${
      selectedIndex === index && !showHowToPlay ? 'ring-4 ring-sky-400 scale-[1.02] z-10' : ''
    }`;
  };

  return (
    <div
      id="title-screen"
      className="relative w-full h-full min-h-[600px] flex flex-col justify-between items-center p-6 bg-slate-950 text-white overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 30%, #0369a1 0%, #0c4a6e 25%, #082f49 50%, #020617 100%)`,
      }}
    >
      {/* Background Animated Floating Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/5 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-yellow-300 opacity-60 animate-ping"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${(i * 19) % 90}%`,
              left: `${(i * 29) % 95}%`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* Top Controls Bar */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-bold text-sky-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Original 3D Action-Adventure Platformer</span>
        </div>

        <button
          id="title-sound-toggle-btn"
          onClick={onToggleSound}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          <span>{soundEnabled ? 'Music On' : 'Muted'}</span>
        </button>
      </div>

      {/* Center Hero & Logo */}
      <div className="flex flex-col items-center text-center z-10 max-w-2xl my-auto">
        {/* Milo Hero Graphic Badge */}
        <div className="relative mb-4 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-sky-600 via-blue-500 to-amber-400 p-1 shadow-2xl shadow-sky-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Milo Avatar Silhouette Art */}
              <div className="w-12 h-12 rounded-full bg-amber-300 relative flex items-center justify-center shadow-md">
                <div className="absolute -top-1 w-14 h-4 bg-orange-600 rounded-t-full" />
                <div className="absolute top-2 w-14 h-2 bg-sky-400" />
                <div className="w-2 h-2 rounded-full bg-slate-900 mx-1 translate-y-1" />
                <div className="w-2 h-2 rounded-full bg-slate-900 mx-1 translate-y-1" />
              </div>
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest mt-1">MILO</span>
            </div>
          </div>
          <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md">
            <Star className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Title Logo */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-amber-200 to-yellow-400 drop-shadow-sm">
          MILO: STARSHARD
        </h1>
        <div className="text-xl sm:text-2xl font-black tracking-[0.25em] text-sky-400 uppercase mt-1">
          KINGDOM
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-lg leading-relaxed">
          Journey across 8 fantastical kingdoms, master momentum-based acrobatics, collect celestial Starshards, and rescue the realm from Lord Malakor!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 w-full sm:w-auto">
          <button
            ref={(el) => (buttonRefs.current[0] = el)}
            id="title-start-game-btn"
            onMouseEnter={() => setSelectedIndex(0)}
            onClick={() => {
              soundEngine.playJump();
              onStartGame();
            }}
            className={getButtonClass(0, "w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base tracking-wide shadow-xl shadow-sky-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer")}
          >
            <Play className="w-5 h-5 fill-white" />
            <span>PLAY ADVENTURE</span>
          </button>

          <button
            ref={(el) => (buttonRefs.current[1] = el)}
            id="title-world-map-btn"
            onMouseEnter={() => setSelectedIndex(1)}
            onClick={() => {
              soundEngine.playStarshard();
              onOpenWorldMap();
            }}
            className={getButtonClass(1, "w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer")}
          >
            <Map className="w-4 h-4 text-sky-400" />
            <span>WORLD MAP</span>
          </button>

          <button
            ref={(el) => (buttonRefs.current[2] = el)}
            id="title-how-to-play-btn"
            onMouseEnter={() => setSelectedIndex(2)}
            onClick={() => {
              soundEngine.playStarshard();
              setShowHowToPlay(true);
            }}
            className={getButtonClass(2, "w-full sm:w-auto px-4 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer")}
            title="Guide & Moves"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="sm:hidden">GUIDE</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500 z-10">
        <span>Three.js 3D WebGL Engine • Dynamic 3D Camera Angles (Key C)</span>
        <span>Keyboard, Touch & Gamepad Ready</span>
      </div>

      {/* How to Play & Abilities Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Milo's 3D Moves & Abilities</span>
              </h2>
              <button
                id="guide-close-btn"
                onClick={() => setShowHowToPlay(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Controls Overview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">🏃 Movement</span>
                <p className="text-slate-300 font-mono">Arrows or A / D</p>
                <p className="text-slate-500 mt-1 text-[11px]">Momentum-based acceleration with ground friction.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">🦘 Variable Jump</span>
                <p className="text-slate-300 font-mono">Up / W / Space / Z</p>
                <p className="text-slate-500 mt-1 text-[11px]">Hold longer for max jump height. Double jump with wings!</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">⚡ Sprint & Dash</span>
                <p className="text-slate-300 font-mono">Shift or J</p>
                <p className="text-slate-500 mt-1 text-[11px]">Boosts speed across gaps and launches high leaps.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-sky-400 block mb-1">💥 Ground Pound</span>
                <p className="text-slate-300 font-mono">Down / S (in air)</p>
                <p className="text-slate-500 mt-1 text-[11px]">Slam downward to smash crates and stomp enemies.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2">
                <span className="font-bold text-indigo-400 block mb-1">🎥 3D Camera Modes</span>
                <p className="text-slate-300 font-mono">Press C (or HUD Button)</p>
                <p className="text-slate-500 mt-1 text-[11px]">Switch between 3D Action Follow Cam, 3D Isometric Diorama Cam, and 2.5D Classic Cam!</p>
              </div>
            </div>

            {/* Original Power-Ups */}
            <div>
              <h3 className="text-sm font-bold text-slate-200 mb-2">Original Power-Ups</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-2.5">
                  <Flame className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-orange-300 block">Ember Core</span>
                    <span className="text-slate-400 text-[11px]">Press X / F to launch fireballs that defeat enemies and break crates.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-2.5">
                  <Feather className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300 block">Wind Feather</span>
                    <span className="text-slate-400 text-[11px]">Grants a double jump and lets Milo glide softly across long chasms.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/30 flex items-start gap-2.5">
                  <Shield className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-300 block">Stone Heart</span>
                    <span className="text-slate-400 text-[11px]">Immunity to spike hazards and smashes through stone crates effortlessly.</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2.5">
                  <Zap className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-yellow-300 block">Lightning Bloom</span>
                    <span className="text-slate-400 text-[11px]">Electrifying speed boost and magnetic starshard collection.</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              id="guide-got-it-btn"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer"
            >
              LET'S GO!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
