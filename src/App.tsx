import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { WORLDS } from './game/levels';
import { Camera3DMode } from './game/renderer3d';
import { GameState, PlayerStats, SaveData, StageDefinition, WorldDefinition, WorldId } from './types';
import { soundEngine } from './audio/SoundEngine';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { WorldMap } from './components/WorldMap';
import { LevelClearModal } from './components/LevelClearModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseMenu } from './components/PauseMenu';
import { TouchControls } from './components/TouchControls';
import { DialogOverlay } from './components/DialogOverlay';

const SAVE_KEY = 'milo_starshard_odyssey_save_v1';

const DEFAULT_SAVE_DATA: SaveData = {
  unlockedWorlds: ['sunmeadow'],
  unlockedStages: ['1-1'],
  stageRecords: {},
  totalStarshards: 0,
  totalMemoryShards: 0,
  collectedMemoryShards: [],
  soundVolume: 0.65,
  musicVolume: 0.45,
  soundEnabled: true,
  musicEnabled: true,
  unlockedAbilities: {
    groundPound: true,
    wallSlide: false,
    airDash: false,
  },
  storyProgress: {
    seenIntro: false,
    metVeylor: false,
    discoveredTruth: false,
    freedHeart: false,
  },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App Navigation State
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentWorldId, setCurrentWorldId] = useState<WorldId>('sunmeadow');
  const [currentStageId, setCurrentStageId] = useState<string>('1-1');

  // Persistence
  const [saveData, setSaveData] = useState<SaveData>(() => {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) return { ...DEFAULT_SAVE_DATA, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Could not load save data', e);
    }
    return DEFAULT_SAVE_DATA;
  });

  // Active Gameplay HUD states
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    score: 0,
    starshards: 0,
    memoryShards: 0,
    lives: 3,
    health: 3,
    maxHealth: 3,
    activePowerUp: 'none',
    powerUpTimeRemaining: 0,
    comboCount: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    comboMaxTimer: 2.8,
    damageFlashTimer: 0,
  });

  const [grandShards, setGrandShards] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [stageTimer, setStageTimer] = useState<number>(0);
  const [levelClearStats, setLevelClearStats] = useState<{
    time: number;
    shards: number;
    grandShards: [boolean, boolean, boolean];
    score: number;
    grade: 'S' | 'A' | 'B' | 'C';
  } | null>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<Camera3DMode>('action3d');

  // Save changes helper
  const updateSaveData = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not persist save data', e);
      }
      return next;
    });
  }, []);

  // Detect touch screens
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Toggle Audio
  const toggleSound = useCallback(() => {
    updateSaveData((prev) => {
      const nextMuted = !prev.soundEnabled;
      soundEngine.setMuted(!nextMuted);
      return {
        ...prev,
        soundEnabled: nextMuted,
        musicEnabled: nextMuted,
      };
    });
  }, [updateSaveData]);

  // Stage resolution details
  const currentWorld: WorldDefinition = WORLDS.find((w) => w.id === currentWorldId) || WORLDS[0];
  const currentStage: StageDefinition = currentWorld.stages.find((s) => s.id === currentStageId) || currentWorld.stages[0];

  // Start Playing a Stage
  const startStage = useCallback((worldId: WorldId, stageId: string) => {
    setCurrentWorldId(worldId);
    setCurrentStageId(stageId);
    setGameState('playing');
    setGrandShards([false, false, false]);
    setStageTimer(0);
    setLevelClearStats(null);
  }, []);

  // Initialize Game Canvas Engine when entering 'playing' state
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'paused' && gameState !== 'dialog') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    // Only create engine if it doesn't exist
    if (engineRef.current) return;

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : 800;
    const height = parent ? parent.clientHeight : 450;

    const engine = new GameEngine(canvas, currentWorldId, currentStageId, {
      onStatsUpdate: (stats) => {
        setPlayerStats({ ...stats });
      },
      onGrandStarshardCollect: (index) => {
        setGrandShards((prev) => {
          const next: [boolean, boolean, boolean] = [prev[0], prev[1], prev[2]];
          next[index] = true;
          return next;
        });
      },
      onMemoryShardCollect: (storyId) => {
        setGameState('dialog');
        setActiveDialog(storyId);
      },
      onLevelClear: (clearData) => {
        // Calculate Grade: S, A, B, C
        const grandCount = clearData.grandShards.filter(Boolean).length;
        const beatTarget = clearData.time <= currentStage.targetTime;
        let grade: 'S' | 'A' | 'B' | 'C' = 'C';

        if (grandCount === 3 && beatTarget) {
          grade = 'S';
        } else if (grandCount >= 2 || beatTarget) {
          grade = 'A';
        } else {
          grade = 'B';
        }

        setLevelClearStats({
          ...clearData,
          grade,
        });

        // Unlock next stage & world progression
        updateSaveData((prev) => {
          const unlockedStages = new Set(prev.unlockedStages);
          unlockedStages.add(currentStageId);

          // Find index of current stage
          const currentStageIndex = currentWorld.stages.findIndex((s) => s.id === currentStageId);
          if (currentStageIndex < currentWorld.stages.length - 1) {
            const nextStage = currentWorld.stages[currentStageIndex + 1];
            unlockedStages.add(nextStage.id);
          } else {
            // World Cleared! Unlock next world
            const currentWorldIndex = WORLDS.findIndex((w) => w.id === currentWorldId);
            if (currentWorldIndex < WORLDS.length - 1) {
              const nextWorld = WORLDS[currentWorldIndex + 1];
              if (!prev.unlockedWorlds.includes(nextWorld.id)) {
                prev.unlockedWorlds.push(nextWorld.id);
              }
              unlockedStages.add(nextWorld.stages[0].id);
            }
          }

          // Update stage record
          const existingRecord = prev.stageRecords[currentStageId];
          const newBestTime = existingRecord?.bestTime
            ? Math.min(existingRecord.bestTime, clearData.time)
            : clearData.time;
          const newHighScore = Math.max(existingRecord?.highScore || 0, clearData.score);
          
          // Record memory shards (activeDialog might be null if they didn't get one *this* specific run but already had it, but actually we should just add the ones they collected during the stage which we can track in the engine stats but for now we'll just track the current active dialog or if we track it in engine we should use that)
          const newMemoryShards = new Set(prev.collectedMemoryShards || []);
          if (activeDialog) {
             newMemoryShards.add(activeDialog);
          }
          // Also check engine stats directly for any shards collected this run
          if (engineRef.current && engineRef.current.getCollectedMemoryShardId()) {
              newMemoryShards.add(engineRef.current.getCollectedMemoryShardId()!);
          }

          return {
            ...prev,
            unlockedStages: Array.from(unlockedStages),
            totalStarshards: prev.totalStarshards + clearData.shards,
            totalMemoryShards: newMemoryShards.size,
            collectedMemoryShards: Array.from(newMemoryShards),
            stageRecords: {
              ...prev.stageRecords,
              [currentStageId]: {
                stageId: currentStageId,
                cleared: true,
                highScore: newHighScore,
                bestTime: newBestTime,
                grade,
                starshardsFound: clearData.shards,
                totalStarshards: 100,
                grandStarshards: clearData.grandShards,
                memoryShardsFound: Array.from(newMemoryShards),
              },
            },
          };
        });

        setGameState('level_clear');
      },
      onGameOver: () => {
        setGameState('game_over');
      },
      onPauseToggle: () => {
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
      },
      onCameraModeChange: (mode) => {
        setCameraMode(mode);
      },
    });

    engine.resize(width, height);
    engine.start();
    engineRef.current = engine;

    // Window resize handler
    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        const p = canvasRef.current.parentElement;
        if (p) {
          engineRef.current.resize(p.clientWidth, p.clientHeight);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Sync timer
    const timerInterval = setInterval(() => {
      if (engineRef.current) {
        setStageTimer(engineRef.current.stageTimer);
      }
    }, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timerInterval);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [gameState, currentWorldId, currentStageId, currentStage, currentWorld, updateSaveData]);

  // Handle Pause
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(gameState === 'paused' || gameState === 'dialog');
    }
  }, [gameState]);

  // Navigate to Next Stage
  const handleNextStage = () => {
    const currentStageIndex = currentWorld.stages.findIndex((s) => s.id === currentStageId);
    if (currentStageIndex < currentWorld.stages.length - 1) {
      const nextStage = currentWorld.stages[currentStageIndex + 1];
      startStage(currentWorldId, nextStage.id);
    } else {
      // Go to next world or back to map
      const currentWorldIndex = WORLDS.findIndex((w) => w.id === currentWorldId);
      if (currentWorldIndex < WORLDS.length - 1) {
        const nextWorld = WORLDS[currentWorldIndex + 1];
        startStage(nextWorld.id, nextWorld.stages[0].id);
      } else {
        setGameState('world_map');
      }
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none">
      {/* 1. Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={() => startStage('sunmeadow', '1-1')}
          onOpenWorldMap={() => setGameState('world_map')}
          soundEnabled={saveData.soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {/* 2. World Map Screen */}
      {gameState === 'world_map' && (
        <WorldMap
          saveData={saveData}
          onSelectStage={(wId, sId) => startStage(wId, sId)}
          onBackToTitle={() => setGameState('title')}
          onToggleSound={toggleSound}
        />
      )}

      {/* 3. Active Playing / Canvas Stage */}
      {(gameState === 'playing' || gameState === 'paused' || gameState === 'level_clear' || gameState === 'game_over' || gameState === 'dialog') && (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* Game Canvas */}
          <canvas
            ref={canvasRef}
            id="game-viewport-canvas"
            className="w-full h-full block object-contain"
          />

          {/* HUD Overlay */}
          <HUD
            stats={playerStats}
            grandShards={grandShards}
            world={currentWorld}
            stage={currentStage}
            stageTimer={stageTimer}
            cameraMode={cameraMode}
            onToggleCamera={() => {
              if (engineRef.current) {
                const newMode = engineRef.current.cycleCameraMode();
                setCameraMode(newMode);
              }
            }}
            onPause={() => setGameState('paused')}
          />

          {/* Touch Virtual Controls */}
          {isTouchDevice && engineRef.current && (
            <TouchControls input={engineRef.current.input} />
          )}

          {/* Dialog Overlay */}
          {gameState === 'dialog' && activeDialog && (
            <DialogOverlay 
              storyId={activeDialog} 
              onComplete={() => {
                setActiveDialog(null);
                setGameState('playing');
              }} 
            />
          )}

          {/* Pause Modal */}
          {gameState === 'paused' && (
            <PauseMenu
              onResume={() => setGameState('playing')}
              onRestart={() => {
                if (engineRef.current) engineRef.current.restartStage();
                setGameState('playing');
              }}
              onWorldMap={() => setGameState('world_map')}
              soundEnabled={saveData.soundEnabled}
              onToggleSound={toggleSound}
            />
          )}

          {/* Level Clear Modal */}
          {gameState === 'level_clear' && levelClearStats && (
            <LevelClearModal
              world={currentWorld}
              stage={currentStage}
              stats={levelClearStats}
              grade={levelClearStats.grade}
              onNextStage={handleNextStage}
              onReplay={() => {
                if (engineRef.current) engineRef.current.restartStage();
                setGameState('playing');
              }}
              onWorldMap={() => setGameState('world_map')}
            />
          )}

          {/* Game Over Modal */}
          {gameState === 'game_over' && (
            <GameOverModal
              onRetry={() => {
                if (engineRef.current) engineRef.current.restartStage();
                setGameState('playing');
              }}
              onWorldMap={() => setGameState('world_map')}
            />
          )}
        </div>
      )}
    </main>
  );
}
