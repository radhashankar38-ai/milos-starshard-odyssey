import { WorldDefinition, StageDefinition, Tile, Entity, WorldId, TileType } from '../types';
import { PHYSICS_CONFIG } from './physics';

const TILE_SIZE = PHYSICS_CONFIG.TILE_SIZE;

export const WORLDS: WorldDefinition[] = [
  {
    id: 'sunmeadow',
    name: 'World 1: Sunmeadow Fields',
    subtitle: 'Verdant rolling hills and windy plains',
    description: 'Begin your quest through sunlit grasslands, ancient windmills, and subterranean flower tunnels.',
    themeColor: '#10b981',
    accentColor: '#fbbf24',
    bgGradient: ['#38bdf8', '#86efac', '#15803d'],
    icon: 'Sun',
    stages: [
      {
        id: '1-1',
        worldId: 'sunmeadow',
        stageNumber: 1,
        name: 'Breezy Meadows',
        subtitle: 'The Adventure Begins',
        targetTime: 65,
        layoutWidth: 100,
        layoutHeight: 18,
        musicTheme: 'sunmeadow',
      },
      {
        id: '1-2',
        worldId: 'sunmeadow',
        stageNumber: 2,
        name: 'Windmill Heights',
        subtitle: 'Floating platforms and gusts',
        targetTime: 85,
        layoutWidth: 120,
        layoutHeight: 22,
        musicTheme: 'sunmeadow',
      },
      {
        id: '1-3',
        worldId: 'sunmeadow',
        stageNumber: 3,
        name: 'Bramble Hollow Boss',
        subtitle: 'Bramble King Grumblethorn',
        isBossStage: true,
        bossType: 'grumblethorn',
        targetTime: 110,
        layoutWidth: 70,
        layoutHeight: 18,
        musicTheme: 'boss',
      },
    ],
  },
  {
    id: 'crystal_caverns',
    name: 'World 2: Crystal Caverns',
    subtitle: 'Subterranean glowing caves and geodes',
    description: 'Delve into luminescent depths filled with bounce crystals, stalactite perils, and sparkling riches.',
    themeColor: '#06b6d4',
    accentColor: '#c084fc',
    bgGradient: ['#0f172a', '#1e1b4b', '#3b0764'],
    icon: 'Gem',
    stages: [
      {
        id: '2-1',
        worldId: 'crystal_caverns',
        stageNumber: 1,
        name: 'Glimmering Chasm',
        subtitle: 'Crystals in the dark',
        targetTime: 75,
        layoutWidth: 110,
        layoutHeight: 20,
        musicTheme: 'crystal_caverns',
      },
      {
        id: '2-2',
        worldId: 'crystal_caverns',
        stageNumber: 2,
        name: 'Geode Depths',
        subtitle: 'High-bounce springs and vertical climbs',
        targetTime: 95,
        layoutWidth: 125,
        layoutHeight: 24,
        musicTheme: 'crystal_caverns',
      },
      {
        id: '2-3',
        worldId: 'crystal_caverns',
        stageNumber: 3,
        name: 'Crystal Grotto Boss',
        subtitle: 'Geode Goliath Awakens',
        isBossStage: true,
        bossType: 'geode_goliath',
        targetTime: 120,
        layoutWidth: 75,
        layoutHeight: 18,
        musicTheme: 'boss',
      },
    ],
  },
  {
    id: 'whispering_woods',
    name: 'World 3: Whispering Woods',
    subtitle: 'Enchanted moonlit canopy and moss stone',
    description: 'Navigate ancient hollow trees, canopy boughs, and mysterious fungal springs under shimmering starlight.',
    themeColor: '#84cc16',
    accentColor: '#34d399',
    bgGradient: ['#064e3b', '#022c22', '#065f46'],
    icon: 'Trees',
    stages: [
      {
        id: '3-1',
        worldId: 'whispering_woods',
        stageNumber: 1,
        name: 'Twilight Canopy',
        subtitle: 'High boughs and hidden paths',
        targetTime: 80,
        layoutWidth: 115,
        layoutHeight: 22,
        musicTheme: 'sunmeadow',
      },
      {
        id: '3-2',
        worldId: 'whispering_woods',
        stageNumber: 2,
        name: 'Ancient Hollow',
        subtitle: 'Spore lifts and secret chambers',
        targetTime: 90,
        layoutWidth: 120,
        layoutHeight: 24,
        musicTheme: 'sunmeadow',
      },
    ],
  },
  {
    id: 'emberpeak',
    name: 'World 4: Emberpeak Valley',
    subtitle: 'Volcanic crags and lava fountains',
    description: 'Leap across basalt spires, dodge rising cinder plumes, and harvest the mythical Ember Core.',
    themeColor: '#ef4444',
    accentColor: '#f97316',
    bgGradient: ['#450a0a', '#7f1d1d', '#991b1b'],
    icon: 'Flame',
    stages: [
      {
        id: '4-1',
        worldId: 'emberpeak',
        stageNumber: 1,
        name: 'Lava Ridge',
        subtitle: 'Basalt spires and hot vents',
        targetTime: 85,
        layoutWidth: 110,
        layoutHeight: 20,
        musicTheme: 'emberpeak',
      },
      {
        id: '4-2',
        worldId: 'emberpeak',
        stageNumber: 2,
        name: 'Magma Caldera Boss',
        subtitle: 'Magma Drake Ignis',
        isBossStage: true,
        bossType: 'ignis',
        targetTime: 120,
        layoutWidth: 70,
        layoutHeight: 18,
        musicTheme: 'boss',
      },
    ],
  },
  {
    id: 'cloudspire',
    name: 'World 5: Cloudspire Isles',
    subtitle: 'Floating celestial sky temples',
    description: 'Soar through the stratosphere with the Wind Feather, gliding across buoyant cumulus platforms.',
    themeColor: '#38bdf8',
    accentColor: '#e0f2fe',
    bgGradient: ['#0284c7', '#38bdf8', '#bae6fd'],
    icon: 'Cloud',
    stages: [
      {
        id: '5-1',
        worldId: 'cloudspire',
        stageNumber: 1,
        name: 'Stratosphere Flight',
        subtitle: 'Gliding on gentle updrafts',
        targetTime: 90,
        layoutWidth: 130,
        layoutHeight: 25,
        musicTheme: 'cloudspire',
      },
      {
        id: '5-2',
        worldId: 'cloudspire',
        stageNumber: 2,
        name: 'Thundercloud Sanctuary',
        subtitle: 'Storm currents and lightning surges',
        targetTime: 100,
        layoutWidth: 135,
        layoutHeight: 25,
        musicTheme: 'cloudspire',
      },
    ],
  },
  {
    id: 'tidal_kingdom',
    name: 'World 6: Tidal Kingdom',
    subtitle: 'Coral shores and sunken arches',
    description: 'Dash through aquamarine breakers, ride geyser jets, and uncover pearls of the deep.',
    themeColor: '#0ea5e9',
    accentColor: '#2dd4bf',
    bgGradient: ['#0369a1', '#0891b2', '#0f766e'],
    icon: 'Waves',
    stages: [
      {
        id: '6-1',
        worldId: 'tidal_kingdom',
        stageNumber: 1,
        name: 'Coral Reef Coast',
        subtitle: 'Shell springs and tidal surges',
        targetTime: 90,
        layoutWidth: 125,
        layoutHeight: 20,
        musicTheme: 'sunmeadow',
      },
      {
        id: '6-2',
        worldId: 'tidal_kingdom',
        stageNumber: 2,
        name: 'Sunken Pearl Sanctum',
        subtitle: 'Bubble lifts and aquatic ruins',
        targetTime: 105,
        layoutWidth: 130,
        layoutHeight: 22,
        musicTheme: 'sunmeadow',
      },
    ],
  },
  {
    id: 'clockwork_citadel',
    name: 'World 7: Clockwork Citadel',
    subtitle: 'Mechanical gear towers and steam pistons',
    description: 'Precision timing through rotating cog platforms, crushing steam presses, and conveyor ramps.',
    themeColor: '#d97706',
    accentColor: '#f59e0b',
    bgGradient: ['#27272a', '#451a03', '#78350f'],
    icon: 'Cog',
    stages: [
      {
        id: '7-1',
        worldId: 'clockwork_citadel',
        stageNumber: 1,
        name: 'Gearworks Ascent',
        subtitle: 'Rotating cogs and conveyor paths',
        targetTime: 95,
        layoutWidth: 120,
        layoutHeight: 24,
        musicTheme: 'emberpeak',
      },
      {
        id: '7-2',
        worldId: 'clockwork_citadel',
        stageNumber: 2,
        name: 'Piston Core',
        subtitle: 'High pressure steam gauntlet',
        targetTime: 110,
        layoutWidth: 130,
        layoutHeight: 24,
        musicTheme: 'emberpeak',
      },
    ],
  },
  {
    id: 'shadowfall',
    name: 'World 8: Shadowfall Castle',
    subtitle: 'The Dark Sovereign\'s Domain',
    description: 'Infiltrate Lord Malakor\'s dark citadel to recover the stolen Starshards and save the kingdom.',
    themeColor: '#8b5cf6',
    accentColor: '#ec4899',
    bgGradient: ['#09090b', '#18181b', '#2e1065'],
    icon: 'ShieldAlert',
    stages: [
      {
        id: '8-1',
        worldId: 'shadowfall',
        stageNumber: 1,
        name: 'Castle Bastion',
        subtitle: 'The Void Gates',
        targetTime: 100,
        layoutWidth: 130,
        layoutHeight: 22,
        musicTheme: 'boss',
      },
      {
        id: '8-2',
        worldId: 'shadowfall',
        stageNumber: 2,
        name: 'Throne of Eclipse (Final Boss)',
        subtitle: 'Lord Malakor - The Shadow Sovereign',
        isBossStage: true,
        bossType: 'malakor',
        targetTime: 150,
        layoutWidth: 80,
        layoutHeight: 18,
        musicTheme: 'boss',
      },
    ],
  },
];

export interface GeneratedLevel {
  stage: StageDefinition;
  tiles: Tile[];
  entities: Entity[];
  spawnX: number;
  spawnY: number;
  width: number;
  height: number;
}

export function mirrorGeneratedLevel(level: GeneratedLevel): GeneratedLevel {
  const width = level.width;
  const height = level.height;
  const totalPixelWidth = width * TILE_SIZE;

  // 1. Mirror Tiles horizontally
  const mirroredTiles: Tile[] = level.tiles.map((t) => ({
    ...t,
    x: width - 1 - t.x,
  }));

  // 2. Mirror Entities horizontally
  const mirroredEntities: Entity[] = level.entities.map((e) => {
    const newEnt: Entity = {
      ...e,
      x: totalPixelWidth - e.x - e.width,
      vx: -e.vx,
      facing: e.facing === 1 ? -1 : 1,
    };

    if (e.customData) {
      const cd = { ...e.customData };
      if (typeof cd.startX === 'number' && typeof cd.endX === 'number') {
        const oldStartX = cd.startX;
        const oldEndX = cd.endX;
        cd.startX = totalPixelWidth - oldEndX - e.width;
        cd.endX = totalPixelWidth - oldStartX - e.width;
      }
      if (typeof cd.dir === 'number') {
        cd.dir = -cd.dir;
      }
      newEnt.customData = cd;
    }

    return newEnt;
  });

  // 3. Mirror Milo's spawn point
  const mirroredSpawnX = totalPixelWidth - level.spawnX - 24;

  return {
    stage: level.stage,
    tiles: mirroredTiles,
    entities: mirroredEntities,
    spawnX: mirroredSpawnX,
    spawnY: level.spawnY,
    width,
    height,
  };
}

export function buildStage(stage: StageDefinition, mirrorMode: boolean = false): GeneratedLevel {
  const width = stage.layoutWidth;
  const height = stage.layoutHeight;
  const tiles: Tile[] = [];
  const entities: Entity[] = [];

  let nextEntityId = 1;
  const addEntity = (type: Entity['type'], x: number, y: number, customData: Record<string, any> = {}) => {
    let w = 24;
    let h = 24;
    let maxH = 1;

    if (type === 'starshard_common') { w = 16; h = 16; }
    else if (type.startsWith('starshard_grand')) { w = 28; h = 28; }
    else if (type.startsWith('powerup')) { w = 24; h = 24; }
    else if (type === 'heart_pickup') { w = 20; h = 20; }
    else if (type === 'checkpoint') { w = 32; h = 48; }
    else if (type === 'sky_beacon') { w = 40; h = 64; }
    else if (type === 'moving_platform') { w = 64; h = 16; }
    else if (type === 'falling_platform') { w = 48; h = 16; }
    else if (type === 'enemy_pufflet') { w = 26; h = 24; maxH = 1; }
    else if (type === 'enemy_spikeling') { w = 28; h = 22; maxH = 2; }
    else if (type === 'enemy_flutterwing') { w = 26; h = 22; maxH = 1; }
    else if (type === 'enemy_cinder_beetle') { w = 30; h = 24; maxH = 2; }
    else if (type === 'enemy_shelled_clamper') { w = 28; h = 26; maxH = 1; }
    else if (type === 'enemy_volt_drone') { w = 26; h = 26; maxH = 2; }
    else if (type === 'enemy_shadow_ghoul') { w = 30; h = 32; maxH = 3; }
    else if (type === 'boss_entity') {
      w = 64;
      h = 64;
      maxH = stage.bossType === 'malakor' ? 12 : 8;
    }

    entities.push({
      id: `ent_${nextEntityId++}`,
      type,
      x: x * TILE_SIZE,
      y: y * TILE_SIZE,
      vx: customData.vx || (type.startsWith('enemy') ? -1.2 : 0),
      vy: customData.vy || 0,
      width: w,
      height: h,
      state: 'idle',
      facing: -1,
      active: true,
      health: maxH,
      maxHealth: maxH,
      customData,
    });
  };

  const setTile = (x: number, y: number, type: TileType, variant: number = 0) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    tiles.push({ x, y, type, variant, active: true });
  };

  // 1. If Boss Arena Stage
  if (stage.isBossStage) {
    // Floor
    for (let x = 0; x < width; x++) {
      setTile(x, height - 2, 'ground');
      setTile(x, height - 1, 'solid');
      setTile(x, 0, 'solid');
    }
    // Arena side walls
    for (let y = 0; y < height; y++) {
      setTile(0, y, 'solid');
      setTile(1, y, 'solid');
      setTile(width - 2, y, 'solid');
      setTile(width - 1, y, 'solid');
    }

    // Platforms in boss room
    if (stage.bossType === 'malakor') {
      for (let x = 12; x <= 18; x++) setTile(x, height - 6, 'platform_oneway');
      for (let x = width - 19; x <= width - 13; x++) setTile(x, height - 6, 'platform_oneway');
      for (let x = Math.floor(width / 2) - 6; x <= Math.floor(width / 2) + 6; x++) {
        setTile(x, height - 10, 'platform_oneway');
      }
    } else {
      for (let x = 12; x <= 18; x++) setTile(x, height - 6, 'platform_oneway');
      for (let x = width - 19; x <= width - 13; x++) setTile(x, height - 6, 'platform_oneway');
      for (let x = Math.floor(width / 2) - 4; x <= Math.floor(width / 2) + 4; x++) {
        setTile(x, height - 9, 'platform_oneway');
      }
    }

    // Add Powerups before battle
    if (stage.worldId === 'emberpeak') {
      addEntity('powerup_ember', 8, height - 3);
    } else if (stage.worldId === 'cloudspire') {
      addEntity('powerup_feather', 8, height - 3);
    } else if (stage.worldId === 'crystal_caverns') {
      addEntity('powerup_stone', 8, height - 3);
    } else if (stage.worldId === 'sunmeadow') {
      addEntity('powerup_ember', 8, height - 3);
    } else {
      addEntity('powerup_lightning', 8, height - 3);
    }
    addEntity('heart_pickup', width - 8, height - 3);

    // Spawn Boss Entity
    addEntity('boss_entity', width - 15, height - 4, { bossType: stage.bossType });

    return {
      stage,
      tiles,
      entities,
      spawnX: 4 * TILE_SIZE,
      spawnY: (height - 4) * TILE_SIZE,
      width,
      height,
    };
  }

  // 2. Standard Handcrafted Level Layout Construction
  // Create natural varied undulating ground terrain
  let currentGroundY = height - 3;
  for (let x = 0; x < width; x++) {
    // Top boundary for high stages
    setTile(x, 0, 'solid');

    // Bottom hazard / pit zones
    const isPit = (x > 28 && x < 32) || (x > 58 && x < 62) || (x > 84 && x < 87) || (stage.stageNumber === 2 && x > 40 && x < 55);
    if (isPit) {
      if (stage.worldId === 'emberpeak') {
        setTile(x, height - 1, 'hazard_lava');
      } else if (stage.worldId === 'tidal_kingdom') {
        setTile(x, height - 1, 'hazard_water');
      } else {
        setTile(x, height - 1, 'hazard_spikes');
      }
      continue;
    }

    // Gentle terrain hill steps
    if (stage.stageNumber === 2) {
      if (x > 10 && x < 20) currentGroundY = height - 5;
      else if (x > 30 && x < 40) currentGroundY = height - 6;
      else if (x > 60 && x < 70) currentGroundY = height - 7;
      else currentGroundY = height - 3;
    } else {
      if (x > 15 && x < 25) currentGroundY = height - 4;
      else if (x > 40 && x < 52) currentGroundY = height - 5;
      else if (x > 68 && x < 78) currentGroundY = height - 4;
      else currentGroundY = height - 3;
    }

    // Fill ground column
    setTile(x, currentGroundY, 'ground');
    for (let y = currentGroundY + 1; y < height; y++) {
      setTile(x, y, 'solid');
    }
  }

  // Add Handcrafted Platforming Formations, Springs, Crates, and Collectibles
  // Section 1: Intro & Early jumping
  if (stage.stageNumber === 2) {
    for (let x = 12; x <= 16; x++) {
      setTile(x, height - 8, 'crate_wood');
      addEntity('starshard_common', x, height - 9.5);
    }
    addEntity('enemy_flutterwing', 25, height - 8, { vy: 1.5, minY: height - 12, maxY: height - 4 });
  } else {
    for (let x = 8; x <= 12; x++) {
      setTile(x, height - 6, 'crate_wood');
      addEntity('starshard_common', x, height - 7.5);
    }
    addEntity('enemy_pufflet', 18, height - 4);
    addEntity('enemy_spikeling', 24, height - 4);
  }

  // First Grand Starshard hidden above on a high floating platform
  for (let x = 20; x <= 23; x++) setTile(x, height - 7, 'platform_oneway');
  addEntity('starshard_grand_1', 21.5, height - 9);

  // Springboard over pit 1
  setTile(27, height - 4, 'spring_up');
  for (let x = 29; x <= 31; x++) {
    addEntity('starshard_common', x, height - 7);
  }
  addEntity('enemy_flutterwing', 30, height - 8, { vy: 1.0, minY: height - 10, maxY: height - 5 });

  // Section 2: Power-up discovery & Stone crates
  let powerUpType: Entity['type'] = 'powerup_ember';
  if (stage.worldId === 'crystal_caverns') powerUpType = 'powerup_stone';
  if (stage.worldId === 'cloudspire') powerUpType = 'powerup_feather';
  if (stage.worldId === 'clockwork_citadel') powerUpType = 'powerup_lightning';
  
  if (stage.stageNumber === 2) {
    addEntity(powerUpType, 36, height - 8);
    setTile(38, height - 7, 'crate_stone');
    setTile(38, height - 8, 'crate_stone');
  } else {
    addEntity(powerUpType, 36, height - 5);
    setTile(38, height - 4, 'crate_stone');
    setTile(38, height - 5, 'crate_stone');
    setTile(39, height - 4, 'crate_stone');
  }

  // Checkpoint in middle of level
  addEntity('checkpoint', 45, height - 7);

  // Moving Platforms section over pit 2
  if (stage.stageNumber === 2) {
      addEntity('moving_platform', 45, height - 5, {
        startX: 42 * TILE_SIZE,
        endX: 52 * TILE_SIZE,
        speed: 2.0,
        dir: 1,
      });
  } else {
      addEntity('moving_platform', 57, height - 6, {
        startX: 56 * TILE_SIZE,
        endX: 63 * TILE_SIZE,
        speed: 1.5,
        dir: 1,
      });
  }

  // Second Grand Starshard on alternate risky route below
  setTile(59, height - 3, 'platform_oneway');
  addEntity('starshard_grand_2', 59.5, height - 4.5);

  // Add Memory Shard for story 
  if (stage.worldId === 'sunmeadow' && stage.stageNumber === 1) {
    addEntity('memory_shard', 61, height - 7, { storyId: `memory_sunmeadow_1` });
  } else if (stage.stageNumber === 1) {
    addEntity('memory_shard', 61, height - 7, { storyId: `memory_${stage.worldId}_1` });
  } else if (stage.stageNumber === 2) {
    addEntity('memory_shard', 63, height - 6, { storyId: `memory_${stage.worldId}_2` });
  }

  // Section 3: Advanced enemies & Falling platforms
  if (stage.stageNumber === 2) {
    addEntity('falling_platform', 66, height - 8);
    addEntity('falling_platform', 69, height - 9);
    addEntity('falling_platform', 72, height - 10);
    addEntity('enemy_flutterwing', 69, height - 11, { vy: 1.2, minY: height - 14, maxY: height - 8 });
  } else {
    addEntity('falling_platform', 66, height - 6);
    addEntity('falling_platform', 69, height - 7);
    addEntity('falling_platform', 72, height - 8);
    addEntity('enemy_cinder_beetle', 75, height - 5);
  }

  addEntity('enemy_shelled_clamper', 80, height - 4);
  addEntity('enemy_volt_drone', 82, height - 7, { vy: 1.2, minY: height - 9, maxY: height - 5 });

  // High secret platform with Third Grand Starshard & Super Spring
  setTile(82, height - 4, 'spring_super');
  for (let x = 83; x <= 86; x++) setTile(x, height - 11, 'platform_oneway');
  addEntity('starshard_grand_3', 84.5, height - 13);
  addEntity('heart_pickup', 86, height - 12);

  // End of Stage Section: Sky Beacon celebration
  for (let x = width - 12; x <= width - 5; x++) {
    setTile(x, height - 3, 'ground');
    for (let y = height - 2; y < height; y++) setTile(x, y, 'solid');
  }

  // End Goal Sky Beacon
  addEntity('sky_beacon', width - 8, height - 5);

  // Level boundary walls
  for (let y = 0; y < height; y++) {
    setTile(0, y, 'solid');
    setTile(width - 1, y, 'solid');
  }

  const level: GeneratedLevel = {
    stage,
    tiles,
    entities,
    spawnX: 3 * TILE_SIZE,
    spawnY: (height - 5) * TILE_SIZE,
    width,
    height,
  };

  return mirrorMode ? mirrorGeneratedLevel(level) : level;
}
