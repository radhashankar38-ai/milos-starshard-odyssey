import React, { useState, useEffect, useRef } from 'react';
import { SaveData, StageDefinition, WorldDefinition, WorldId } from '../types';
import { WORLDS } from '../game/levels';
import {
  Sun,
  Gem,
  Trees,
  Flame,
  Cloud,
  Waves,
  Cog,
  ShieldAlert,
  Star,
  Sparkles,
  Trophy,
  Play,
  ArrowLeft,
  Lock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface WorldMapProps {
  saveData: SaveData;
  mirrorMode?: boolean;
  onToggleMirrorMode?: () => void;
  onSelectStage: (worldId: WorldId, stageId: string) => void;
  onBackToTitle: () => void;
  onToggleSound: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  saveData,
  mirrorMode = false,
  onToggleMirrorMode,
  onSelectStage,
  onBackToTitle,
  onToggleSound,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>(
    (saveData.unlockedWorlds[saveData.unlockedWorlds.length - 1] as WorldId) || 'sunmeadow'
  );
  const [selectedStageId, setSelectedStageId] = useState<string>('1-1');

  // 0: World Tabs, 1: Stage Tabs, 2: Launch Button, 3: Back Button
  const [focusSection, setFocusSection] = useState<0 | 1 | 2 | 3>(2);

  const selectedWorld = WORLDS.find((w) => w.id === selectedWorldId) || WORLDS[0];
  const selectedStage = selectedWorld.stages.find((s) => s.id === selectedStageId) || selectedWorld.stages[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const worldIndex = WORLDS.findIndex((w) => w.id === selectedWorldId);
      const stageIndex = selectedWorld.stages.findIndex((s) => s.id === selectedStageId);

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (focusSection === 0) setFocusSection(1);
        else if (focusSection === 1) setFocusSection(2);
        else if (focusSection === 3) setFocusSection(0);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (focusSection === 2) setFocusSection(1);
        else if (focusSection === 1) setFocusSection(0);
        else if (focusSection === 0) setFocusSection(3);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (focusSection === 0 && worldIndex > 0) {
          const prevW = WORLDS[worldIndex - 1];
          if (isWorldUnlocked(prevW.id)) {
            setSelectedWorldId(prevW.id);
            setSelectedStageId(prevW.stages[0].id);
          }
        } else if (focusSection === 1 && stageIndex > 0) {
          const prevS = selectedWorld.stages[stageIndex - 1];
          if (isStageUnlocked(prevS.id)) {
            setSelectedStageId(prevS.id);
          }
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (focusSection === 0 && worldIndex < WORLDS.length - 1) {
          const nextW = WORLDS[worldIndex + 1];
          if (isWorldUnlocked(nextW.id)) {
            setSelectedWorldId(nextW.id);
            setSelectedStageId(nextW.stages[0].id);
          }
        } else if (focusSection === 1 && stageIndex < selectedWorld.stages.length - 1) {
          const nextS = selectedWorld.stages[stageIndex + 1];
          if (isStageUnlocked(nextS.id)) {
            setSelectedStageId(nextS.id);
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        if (focusSection === 2) {
          soundEngine.playJump();
          onSelectStage(selectedWorldId, selectedStageId);
        } else if (focusSection === 3) {
          onBackToTitle();
        } else if (focusSection === 0) {
          setFocusSection(1);
        } else if (focusSection === 1) {
          setFocusSection(2);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWorldId, selectedStageId, focusSection, selectedWorld, onSelectStage, onBackToTitle]);

  const getWorldIcon = (icon: string) => {
    switch (icon) {
      case 'Sun': return <Sun className="w-5 h-5 text-emerald-400" />;
      case 'Gem': return <Gem className="w-5 h-5 text-cyan-400" />;
      case 'Trees': return <Trees className="w-5 h-5 text-lime-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Cloud': return <Cloud className="w-5 h-5 text-sky-300" />;
      case 'Waves': return <Waves className="w-5 h-5 text-teal-300" />;
      case 'Cog': return <Cog className="w-5 h-5 text-amber-400" />;
      default: return <ShieldAlert className="w-5 h-5 text-purple-400" />;
    }
  };

  const isWorldUnlocked = (wId: WorldId) => saveData.unlockedWorlds.includes(wId);
  const isStageUnlocked = (sId: string) => saveData.unlockedStages.includes(sId);

  const getStageRecord = (sId: string) => saveData.stageRecords[sId];

  return (
    <div
      id="world-map-screen"
      className="relative w-full h-full min-h-[600px] flex flex-col justify-between p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-y-auto"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 20%, ${selectedWorld.themeColor}18, transparent 70%), linear-gradient(to bottom, #090d16, #020617)`,
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <button
            id="map-back-title-btn"
            onMouseEnter={() => setFocusSection(3)}
            onClick={onBackToTitle}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
              focusSection === 3 ? 'bg-slate-800 border-sky-400 text-white ring-2 ring-sky-400' : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Title</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>World Map</span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40">
                8 Worlds
              </span>
            </h1>
            <p className="text-xs text-slate-400">Select a kingdom stage to embark</p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-sky-400 shadow-md">
            <Sparkles className="w-4 h-4 fill-sky-400" />
            <span>{saveData.totalMemoryShards || 0}</span>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-yellow-400 shadow-md">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span>{saveData.totalStarshards}</span>
          </div>

          <button
            id="map-sound-toggle-btn"
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-all cursor-pointer"
            title="Toggle Sound"
          >
            {saveData.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Main World Selector Carousel / Grid */}
      <div className="my-6 max-w-6xl mx-auto w-full z-10 flex flex-col gap-6">
        {/* World Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {WORLDS.map((w, index) => {
            const unlocked = isWorldUnlocked(w.id);
            const isSelected = selectedWorldId === w.id;
            const isFocused = focusSection === 0 && isSelected;

            return (
              <button
                key={w.id}
                id={`world-tab-${w.id}`}
                disabled={!unlocked}
                onMouseEnter={() => {
                  if (unlocked) {
                    setSelectedWorldId(w.id);
                    setSelectedStageId(w.stages[0].id);
                    setFocusSection(0);
                  }
                }}
                onClick={() => {
                  if (unlocked) {
                    setSelectedWorldId(w.id);
                    setSelectedStageId(w.stages[0].id);
                    soundEngine.playStarshard();
                    setFocusSection(1);
                  }
                }}
                className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.3)] scale-105 z-10'
                    : unlocked
                    ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                } ${isFocused ? 'ring-2 ring-sky-400' : ''}`}
              >
                <div className="p-2 rounded-xl bg-slate-950/60 mb-1">
                  {unlocked ? getWorldIcon(w.icon) : <Lock className="w-5 h-5 text-slate-600" />}
                </div>
                <span className="text-[11px] font-bold tracking-tight line-clamp-1">W{index + 1}</span>
                <span className="text-[9px] text-slate-400 line-clamp-1">{w.name.split(':')[1]?.trim() || w.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected World Overview & Stages */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/70 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-800/80 shadow-2xl">
          {/* World Banner & Description (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
                {getWorldIcon(selectedWorld.icon)}
                <span>{selectedWorld.subtitle}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{selectedWorld.name}</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedWorld.description}</p>
            </div>

            {/* Stage Path Preview */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stage Progression</span>
              <div className="flex items-center gap-2">
                {selectedWorld.stages.map((st, i) => {
                  const unlocked = isStageUnlocked(st.id);
                  const isSel = selectedStageId === st.id;
                  const rec = getStageRecord(st.id);
                  const isFocused = focusSection === 1 && isSel;

                  return (
                    <button
                      key={st.id}
                      disabled={!unlocked}
                      onMouseEnter={() => {
                        if (unlocked) {
                          setSelectedStageId(st.id);
                          setFocusSection(1);
                        }
                      }}
                      onClick={() => {
                        if (unlocked) {
                          setSelectedStageId(st.id);
                          soundEngine.playStarshard();
                          setFocusSection(2);
                        }
                      }}
                      className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSel
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md'
                          : unlocked
                          ? 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-300'
                          : 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                      } ${isFocused ? 'ring-2 ring-sky-400 scale-[1.02]' : ''}`}
                    >
                      <span className="text-xs font-black">
                        {st.isBossStage ? 'BOSS' : `Stage ${st.stageNumber}`}
                      </span>
                      {rec?.cleared ? (
                        <span className="text-[10px] text-emerald-400 font-bold">Grade {rec.grade}</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">{unlocked ? 'Unlocked' : 'Locked'}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Stage Detail & Launch Card (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-950/80 to-slate-900/80 border border-slate-700/60">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedStage.isBossStage ? '🔥 BOSS ENCOUNTER' : `STAGE ${selectedStage.stageNumber}`}
                </span>
                <span className="text-xs font-mono text-slate-400">Target: {selectedStage.targetTime}s</span>
              </div>
              <h3 className="text-xl font-bold text-white">{selectedStage.name}</h3>
              <p className="text-xs text-slate-400">{selectedStage.subtitle}</p>

              {/* Grand Starshards & Records */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                {/* Grand Starshards Found */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Grand Shards</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {[0, 1, 2].map((idx) => {
                      const rec = getStageRecord(selectedStage.id);
                      const found = rec?.grandStarshards[idx];
                      return (
                        <Sparkles
                          key={idx}
                          className={`w-4 h-4 ${
                            found ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]' : 'text-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Best Time */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Best Speed</span>
                  <span className="text-sm font-mono font-bold text-slate-200">
                    {getStageRecord(selectedStage.id)?.bestTime ? `${getStageRecord(selectedStage.id).bestTime}s` : '--'}
                  </span>
                </div>

                {/* High Score */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">High Score</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {getStageRecord(selectedStage.id)?.highScore || 0}
                  </span>
                </div>
                
                {/* Memory Shards */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1 col-span-2 sm:col-span-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-400"/>
                      Memory Shards Found
                  </span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {getStageRecord(selectedStage.id)?.memoryShardsFound?.map((shardId) => (
                        <div key={shardId} className="px-1.5 py-0.5 rounded bg-sky-900/50 border border-sky-700/50 text-[10px] text-sky-200">
                            {shardId.replace('memory_', '').replace(/_/g, ' ').toUpperCase()}
                        </div>
                    )) || <span className="text-[10px] text-slate-600">None</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Adventure Button */}
            <button
              id="map-launch-stage-btn"
              onMouseEnter={() => setFocusSection(2)}
              onClick={() => {
                soundEngine.playJump();
                onSelectStage(selectedWorldId, selectedStageId);
              }}
              className={`w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                focusSection === 2 ? 'ring-4 ring-sky-300 scale-[1.02]' : ''
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START {selectedStage.name.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls Tip */}
      <div className="max-w-6xl mx-auto w-full text-center text-slate-500 text-[11px] z-10">
        Use Keyboard (Arrow keys/WASD + Up/Space/Z to jump) or Touch/Gamepad to control Milo. Use arrows and Enter to navigate menus.
      </div>
    </div>
  );
};
