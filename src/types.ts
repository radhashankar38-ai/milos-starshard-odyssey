export type WorldId = 
  | 'sunmeadow' 
  | 'crystal_caverns' 
  | 'whispering_woods' 
  | 'emberpeak' 
  | 'cloudspire' 
  | 'tidal_kingdom' 
  | 'clockwork_citadel' 
  | 'shadowfall';

export type PowerUpType = 'none' | 'ember_core' | 'wind_feather' | 'stone_heart' | 'lightning_bloom';

export type GameState = 'title' | 'world_map' | 'playing' | 'paused' | 'level_clear' | 'game_over' | 'world_clear' | 'cutscene' | 'dialog';

export interface PlayerStats {
  score: number;
  starshards: number;
  memoryShards: number;
  lives: number;
  health: number;
  maxHealth: number;
  activePowerUp: PowerUpType;
  powerUpTimeRemaining: number; // in seconds
  comboCount: number;
  comboMultiplier: number;
  comboTimer: number;
  comboMaxTimer: number;
  damageFlashTimer: number; // 0..1 white flash on damage
}

export interface GrandStarshardStatus {
  collected: [boolean, boolean, boolean];
}

export interface StageRecord {
  stageId: string;
  cleared: boolean;
  highScore: number;
  bestTime: number; // in seconds
  grade: 'S' | 'A' | 'B' | 'C' | '-';
  starshardsFound: number;
  totalStarshards: number;
  grandStarshards: [boolean, boolean, boolean];
  memoryShardsFound: string[]; // IDs of memory shards found
}

export interface SaveData {
  unlockedWorlds: WorldId[];
  unlockedStages: string[];
  stageRecords: Record<string, StageRecord>;
  totalStarshards: number;
  totalMemoryShards: number;
  collectedMemoryShards: string[];
  soundVolume: number;
  musicVolume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  mirrorModeUnlocked?: boolean;
  mirrorModeEnabled?: boolean;
  unlockedAbilities: {
    groundPound: boolean;
    wallSlide: boolean;
    airDash: boolean;
  };
  storyProgress: {
    seenIntro: boolean;
    metVeylor: boolean;
    discoveredTruth: boolean;
    freedHeart: boolean;
  };
}

export interface WorldDefinition {
  id: WorldId;
  name: string;
  subtitle: string;
  description: string;
  themeColor: string;
  accentColor: string;
  bgGradient: [string, string, string];
  icon: string;
  stages: StageDefinition[];
}

export interface StageDefinition {
  id: string;
  worldId: WorldId;
  stageNumber: number;
  name: string;
  subtitle: string;
  isBossStage?: boolean;
  bossType?: 'grumblethorn' | 'geode_goliath' | 'ignis' | 'malakor' | 'veylor' | 'astral_heart';
  targetTime: number; // in seconds for S-grade
  layoutWidth: number; // in tiles
  layoutHeight: number; // in tiles
  musicTheme: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export type TileType = 
  | 'empty' 
  | 'solid' 
  | 'ground' 
  | 'platform_oneway' 
  | 'crate_wood' 
  | 'crate_stone' 
  | 'hazard_spikes' 
  | 'hazard_lava' 
  | 'hazard_water' 
  | 'spring_up' 
  | 'spring_super' 
  | 'ice'
  | 'switch_block';

export interface Tile {
  type: TileType;
  x: number; // tile grid x
  y: number; // tile grid y
  variant?: number;
  active?: boolean;
}

export type EntityType = 
  | 'starshard_common'
  | 'starshard_grand_1'
  | 'starshard_grand_2'
  | 'starshard_grand_3'
  | 'memory_shard'
  | 'powerup_ember'
  | 'powerup_feather'
  | 'powerup_stone'
  | 'powerup_lightning'
  | 'heart_pickup'
  | 'checkpoint'
  | 'sky_beacon'
  | 'moving_platform'
  | 'falling_platform'
  | 'enemy_pufflet'
  | 'enemy_spikeling'
  | 'enemy_flutterwing'
  | 'enemy_cinder_beetle'
  | 'enemy_shelled_clamper'
  | 'enemy_volt_drone'
  | 'enemy_shadow_ghoul'
  | 'boss_entity'
  | 'projectile_player'
  | 'projectile_enemy'
  | 'npc'
  | 'dialog_trigger';

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  state: string;
  facing: 1 | -1;
  active: boolean;
  health?: number;
  maxHealth?: number;
  customData?: Record<string, any>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'star' | 'spark' | 'smoke' | 'feather' | 'ember' | 'ring' | 'memory_fragment';
  gravity?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export interface VisualEffect {
  x: number;
  y: number;
  text?: string;
  color?: string;
  type: 'float_text' | 'impact_shockwave' | 'star_burst' | 'smoke_ring' | 'lightning_arc' | 'memory_flash';
  life: number;
  maxLife: number;
  size?: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean; // just pressed this frame
  jumpReleased: boolean;
  sprint: boolean;
  attack: boolean;
  attackPressed: boolean;
  dash: boolean;
  dashPressed: boolean;
}

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  shakeTime: number;
  shakeIntensity: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DialogMessage {
  speaker: string;
  text: string;
  portrait?: string;
}

export interface CutsceneData {
  id: string;
  dialogs: DialogMessage[];
  onComplete?: () => void;
}
