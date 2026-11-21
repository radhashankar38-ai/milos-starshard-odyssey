import React from 'react';
import { PlayerStats, StageDefinition, WorldDefinition } from '../types';
import { Heart, Star, Sparkles, Flame, Feather, Shield, Zap, Pause, Clock, Video } from 'lucide-react';
import { Camera3DMode } from '../game/renderer3d';

interface HUDProps {
  stats: PlayerStats;
  grandShards: [boolean, boolean, boolean];
  world: WorldDefinition;
  stage: StageDefinition;
  stageTimer: number;
  cameraMode?: Camera3DMode;
  mirrorMode?: boolean;
  onToggleCamera?: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  grandShards,
  world,
  stage,
  stageTimer,
  cameraMode = 'action3d',
  mirrorMode = false,
  onToggleCamera,
  onPause,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPowerUpBadge = () => {
    if (stats.activePowerUp === 'none') return null;

    let icon = <Flame className="w-4 h-4 text-orange-400" />;
    let label = 'Ember Core';
    let color = 'bg-orange-500/20 border-orange-500 text-orange-300';

    if (stats.activePowerUp === 'wind_feather') {
      icon = <Feather className="w-4 h-4 text-cyan-400" />;
      label = 'Wind Feather';
      color = 'bg-cyan-500/20 border-cyan-500 text-cyan-300';
    } else if (stats.activePowerUp === 'stone_heart') {
      icon = <Shield className="w-4 h-4 text-slate-300" />;
      label = 'Stone Heart';
      color = 'bg-slate-500/20 border-slate-400 text-slate-200';
    } else if (stats.activePowerUp === 'lightning_bloom') {
      icon = <Zap className="w-4 h-4 text-yellow-400" />;
      label = 'Lightning Bloom';
      color = 'bg-yellow-500/20 border-yellow-400 text-yellow-300';
    }

    return (
      <div id="hud-powerup-badge" className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md ${color} animate-pulse`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono bg-black/40 px-1.5 py-0.5 rounded">
          {Math.ceil(stats.powerUpTimeRemaining)}s
        </span>
      </div>
    );
  };

  return (
    <div id="game-hud" className="absolute top-0 left-0 right-0 p-3 sm:p-4 pointer-events-none flex flex-col gap-2 z-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        {/* Left: Milo Health & Lives */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-lg pointer-events-auto">
          {/* Milo Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-amber-400 flex items-center justify-center font-bold text-white text-xs border border-white/20 shadow-inner">
            M
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-1">
            {Array.from({ length: stats.maxHealth }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-all ${
                  i < stats.health
                    ? 'text-rose-500 fill-rose-500 scale-100 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    : 'text-slate-600 fill-slate-800 scale-90 opacity-40'
                }`}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Lives */}
          <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
            <span>x</span>
            <span className="text-sm font-mono">{stats.lives}</span>
          </div>
        </div>

        {/* Center: Power-up Badge / Stage info / Mirror Mode */}
        <div className="flex items-center gap-2">
          {renderPowerUpBadge()}
          {mirrorMode && (
            <div
              id="hud-mirror-mode-badge"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-cyan-600/90 border border-pink-400/60 shadow-[0_0_12px_rgba(236,72,153,0.45)] text-white text-[11px] font-black tracking-wider animate-pulse"
              title="Mirror Mode Active: Level & Camera Flipped"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>🪞 MIRROR</span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-semibold text-slate-200">
            <span className="text-amber-400">{world.name.split(':')[0]}</span>
            <span>•</span>
            <span>{stage.name}</span>
          </div>
        </div>

        {/* Right: Starshards, Grand Shards, Time & Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Memory Shards */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-lg" title="Memory Shards">
            <Sparkles className="w-4 h-4 text-sky-400 fill-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            <span className="text-sky-300 font-mono font-bold text-sm">
              {stats.memoryShards}
            </span>
          </div>

          {/* Common Starshards */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-lg">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-spin-slow" />
            <span className="text-yellow-300 font-mono font-bold text-sm">
              {stats.starshards.toString().padStart(2, '0')}
            </span>
          </div>

          {/* 3 Grand Starshards Slots */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-2 rounded-2xl border border-slate-700/60 shadow-lg">
            {grandShards.map((collected, i) => (
              <Sparkles
                key={i}
                className={`w-4 h-4 transition-all ${
                  collected
                    ? 'text-cyan-300 fill-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)] scale-110'
                    : 'text-slate-600 opacity-30'
                }`}
              />
            ))}
          </div>

          {/* Time & Score */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-lg text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(stageTimer)}</span>
            <span className="text-slate-600 font-sans">•</span>
            <span className="text-amber-300 font-bold">{stats.score.toLocaleString()}</span>
          </div>

          {/* 3D Camera Mode Toggle Button */}
          {onToggleCamera && (
            <button
              id="hud-camera-toggle-btn"
              onClick={onToggleCamera}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-500/40 shadow-lg transition-all active:scale-95 cursor-pointer text-xs font-bold"
              title="Toggle 3D Camera View (Key C)"
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline uppercase">
                {cameraMode === 'action3d' ? '3D Action' : cameraMode === 'diorama3d' ? '3D Iso' : '2.5D'}
              </span>
            </button>
          )}

          {/* Pause Button */}
          <button
            id="hud-pause-button"
            onClick={onPause}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Combo Score Counter */}
      {stats.comboCount && stats.comboCount >= 2 && stats.comboTimer && stats.comboTimer > 0 ? (
        <div
          id="hud-combo-counter"
          className="self-end mr-2 sm:mr-8 mt-1 flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-bounce"
        >
          {/* Multiplier Badge */}
          <div
            className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-sm sm:text-base tracking-wider drop-shadow shadow-inner transform transition-transform"
            style={{
              transform: `scale(${Math.min(1.4, 1 + (stats.comboMultiplier || 1) * 0.08)})`,
            }}
          >
            x{stats.comboMultiplier || 1}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-black text-xs sm:text-sm tracking-wide uppercase">
                {stats.comboCount} HITS COMBO!
              </span>
            </div>

            {/* Drain Progress Bar */}
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-75 ease-linear rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, (stats.comboTimer / (stats.comboMaxTimer || 2.8)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
