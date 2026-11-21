import { soundEngine } from '../audio/SoundEngine';
import { Camera, Entity, InputState, Particle, PlayerStats, Rect, StageDefinition, Tile, VisualEffect, WorldDefinition } from '../types';
import { WORLDS, buildStage, GeneratedLevel } from './levels';
import { PHYSICS_CONFIG, checkAABB } from './physics';
import { GameRenderer3D, Camera3DMode, BlobShadowData } from './renderer3d';

const TILE_SIZE = PHYSICS_CONFIG.TILE_SIZE;

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onGrandStarshardCollect: (index: number) => void;
  onMemoryShardCollect?: (storyId: string) => void;
  onLevelClear: (stats: { time: number; shards: number; grandShards: [boolean, boolean, boolean]; score: number }) => void;
  onGameOver: () => void;
  onPauseToggle: () => void;
  onCameraModeChange?: (mode: Camera3DMode) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private renderer3d: GameRenderer3D;
  private callbacks: GameEngineCallbacks;

  // Level & World State
  public currentWorld: WorldDefinition;
  public currentStage: StageDefinition;
  private levelData: GeneratedLevel;
  private tiles: Tile[] = [];
  private entities: Entity[] = [];

  // Player State
  public player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 22,
    height: 30,
    isGrounded: false,
    facing: 1 as 1 | -1,
    isCrouching: false,
    isSprinting: false,
    isGliding: false,
    isGroundPounding: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    canDoubleJump: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    invulnerableTimer: 0,
    respawnX: 0,
    respawnY: 0,
  };

  public stats: PlayerStats = {
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
  };

  public grandShardsCollected: [boolean, boolean, boolean] = [false, false, false];
  public stageTimer: number = 0;
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isCleared: boolean = false;

  // Input
  public input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    jumpReleased: false,
    sprint: false,
    attack: false,
    attackPressed: false,
    dash: false,
    dashPressed: false,
  };

  // Particles & Visual FX
  private particles: Particle[] = [];
  private visualEffects: VisualEffect[] = [];

  // Camera
  private camera: Camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    width: 800,
    height: 450,
    shakeTime: 0,
    shakeIntensity: 0,
    minX: 0,
    maxX: 2000,
    minY: 0,
    maxY: 450,
  };

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private gameTime: number = 0;
  private collectedMemoryShardId: string | null = null;
  public mirrorMode: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    worldId: string,
    stageId: string,
    callbacks: GameEngineCallbacks,
    mirrorMode: boolean = false
  ) {
    this.canvas = canvas;
    this.renderer3d = new GameRenderer3D(canvas);
    this.callbacks = callbacks;
    this.mirrorMode = mirrorMode;
    this.renderer3d.mirrorMode = mirrorMode;

    const w = WORLDS.find((w) => w.id === worldId) || WORLDS[0];
    const s = w.stages.find((st) => st.id === stageId) || w.stages[0];

    this.currentWorld = w;
    this.currentStage = s;
    this.levelData = buildStage(s, mirrorMode);

    this.setupLevel();
    this.setupEventListeners();
  }

  private setupLevel() {
    this.tiles = [...this.levelData.tiles];
    this.entities = JSON.parse(JSON.stringify(this.levelData.entities));
    this.player.x = this.levelData.spawnX;
    this.player.y = this.levelData.spawnY;
    this.player.respawnX = this.levelData.spawnX;
    this.player.respawnY = this.levelData.spawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.grandShardsCollected = [false, false, false];
    this.stageTimer = 0;
    this.isCleared = false;
    this.collectedMemoryShardId = null;

    this.camera.maxX = this.levelData.width * TILE_SIZE - this.canvas.width;
    this.camera.maxY = this.levelData.height * TILE_SIZE - this.canvas.height;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.width = width;
    this.camera.height = height;
    this.camera.maxX = Math.max(0, this.levelData.width * TILE_SIZE - width);
    this.camera.maxY = Math.max(0, this.levelData.height * TILE_SIZE - height);
    this.renderer3d.setSize(width, height);
  }

  public cycleCameraMode(): Camera3DMode {
    const newMode = this.renderer3d.cycleCameraMode();
    if (this.callbacks.onCameraModeChange) {
      this.callbacks.onCameraModeChange(newMode);
    }
    soundEngine.playStarshard();
    return newMode;
  }

  public getCameraMode(): Camera3DMode {
    return this.renderer3d.cameraMode;
  }

  public setCameraMode(mode: Camera3DMode) {
    this.renderer3d.cameraMode = mode;
    if (this.callbacks.onCameraModeChange) {
      this.callbacks.onCameraModeChange(mode);
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundEngine.playMusic(this.currentStage.isBossStage ? 'boss' : this.currentStage.musicTheme);
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundEngine.stopMusic();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public getCollectedMemoryShardId() {
      return this.collectedMemoryShardId;
  }

  public setMirrorMode(enabled: boolean) {
    this.mirrorMode = enabled;
    this.renderer3d.mirrorMode = enabled;
    this.levelData = buildStage(this.currentStage, enabled);
    this.setupLevel();
  }

  public restartStage() {
    this.stats.health = this.stats.maxHealth;
    this.levelData = buildStage(this.currentStage, this.mirrorMode);
    this.setupLevel();
    soundEngine.playMusic(this.currentStage.isBossStage ? 'boss' : this.currentStage.musicTheme);
  }

  // --- INPUT LISTENERS ---
  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.renderer3d.destroy();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    soundEngine.enableAudio();

    if (e.code === 'KeyP' || e.code === 'Escape') {
      this.callbacks.onPauseToggle();
      return;
    }

    if (e.code === 'KeyC') {
      this.cycleCameraMode();
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.input.up = true;
      if (!this.input.jump) {
        this.input.jumpPressed = true;
      }
      this.input.jump = true;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = true;

    if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyK') {
      if (!this.input.jump) {
        this.input.jumpPressed = true;
      }
      this.input.jump = true;
    }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ' || e.code === 'KeyE' || e.code === 'KeyL') {
      this.input.sprint = true;
      if (!this.input.dash) {
        this.input.dashPressed = true;
      }
      this.input.dash = true;
    }

    if (e.code === 'KeyX' || e.code === 'KeyF') {
      if (!this.input.attack) {
        this.input.attackPressed = true;
      }
      this.input.attack = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.input.up = false;
      this.input.jump = false;
      this.input.jumpReleased = true;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = false;

    if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyK') {
      this.input.jump = false;
      this.input.jumpReleased = true;
    }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ' || e.code === 'KeyE' || e.code === 'KeyL') {
      this.input.sprint = false;
      this.input.dash = false;
    }

    if (e.code === 'KeyX' || e.code === 'KeyF') {
      this.input.attack = false;
    }
  };

  // --- MAIN ENGINE LOOP ---
  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.gameTime += dt;

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();

    // Reset single-frame triggers
    this.input.jumpPressed = false;
    this.input.jumpReleased = false;
    this.input.attackPressed = false;
    this.input.dashPressed = false;

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // --- UPDATE SIMULATION ---
  private update(dt: number) {
    if (!this.isCleared) {
      this.stageTimer += dt;
    }

    // Power-up duration countdown
    if (this.stats.activePowerUp !== 'none') {
      this.stats.powerUpTimeRemaining -= dt;
      if (this.stats.powerUpTimeRemaining <= 0) {
        this.stats.activePowerUp = 'none';
        this.callbacks.onStatsUpdate(this.stats);
      }
    }

    // Update Combo Timer & Damage Flash
    if (this.stats.damageFlashTimer > 0) {
      this.stats.damageFlashTimer = Math.max(0, this.stats.damageFlashTimer - dt * 3.5);
    }

    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        if (this.stats.comboCount >= 3) {
          const bonus = this.stats.comboCount * 120;
          this.stats.score += bonus;
          this.addVisualEffect(this.player.x + 10, this.player.y - 12, `COMBO BONUS! +${bonus}`, '#4ade80');
          soundEngine.playCheckpoint();
        }
        this.stats.comboCount = 0;
        this.stats.comboMultiplier = 1;
        this.callbacks.onStatsUpdate(this.stats);
      }
    }

    // Invulnerability timer
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer--;
    }

    // 1. Player Movement & Physics
    this.updatePlayerMovement();

    // 2. Resolve Environment Tile Collisions
    this.resolveTileCollisions();

    // 3. Update Entities (Enemies, Collectibles, Hazards, Bosses)
    this.updateEntities(dt);

    // 4. Update Particles & Visual Effects
    this.updateParticles(dt);
    this.updateWindParticles(dt);

    // 5. Update Camera
    this.updateCamera();

    // Check Fall Death
    if (this.player.y > this.levelData.height * TILE_SIZE + 40) {
      this.handlePlayerDamage(3);
    }
  }

  private updatePlayerMovement() {
    const p = this.player;
    const isLightning = this.stats.activePowerUp === 'lightning_bloom';

    // Horizontal Acceleration
    const maxSpeed = isLightning
      ? PHYSICS_CONFIG.LIGHTNING_MAX_SPEED
      : this.input.sprint
      ? PHYSICS_CONFIG.SPRINT_MAX_SPEED
      : PHYSICS_CONFIG.WALK_MAX_SPEED;

    const accel = p.isGrounded
      ? this.input.sprint
        ? PHYSICS_CONFIG.SPRINT_ACCEL
        : PHYSICS_CONFIG.WALK_ACCEL
      : PHYSICS_CONFIG.AIR_ACCEL;

    p.isCrouching = this.input.down && p.isGrounded;
    p.height = p.isCrouching ? 18 : 30;

    if (this.input.left && !p.isCrouching) {
      p.vx -= accel;
      p.facing = -1;
    } else if (this.input.right && !p.isCrouching) {
      p.vx += accel;
      p.facing = 1;
    } else {
      // Friction
      p.vx *= p.isGrounded ? PHYSICS_CONFIG.GROUND_FRICTION : PHYSICS_CONFIG.AIR_DRAG;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    // Clamp horizontal speed
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    // Gravity & Ground Pound / Glide
    if (!p.isGrounded) {
      // Check Ground Pound (Down + in air)
      if (this.input.down && !p.isGroundPounding) {
        p.isGroundPounding = true;
        p.vy = PHYSICS_CONFIG.GROUND_POUND_SPEED;
        soundEngine.playJump();
      }

      // Check Wind Feather Glide
      if (this.stats.activePowerUp === 'wind_feather' && this.input.jump && p.vy > 0) {
        p.isGliding = true;
        p.vy = Math.min(p.vy, PHYSICS_CONFIG.GLIDE_FALL_SPEED);
      } else {
        p.isGliding = false;
        p.vy += PHYSICS_CONFIG.GRAVITY;
      }
    } else {
      p.isGroundPounding = false;
      p.isGliding = false;
    }

    // Clamp vertical velocity
    p.vy = Math.min(PHYSICS_CONFIG.MAX_FALL_SPEED, p.vy);

    // Coyote Time & Jump Buffering
    if (p.isGrounded) {
      p.coyoteTimer = PHYSICS_CONFIG.COYOTE_FRAMES;
      p.canDoubleJump = true;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    if (this.input.jumpPressed) {
      p.jumpBufferTimer = PHYSICS_CONFIG.JUMP_BUFFER_FRAMES;
    } else if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer--;
    }

    // Jump Execution
    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
      p.vy = PHYSICS_CONFIG.JUMP_FORCE;
      p.isGrounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      soundEngine.playJump();
      this.spawnJumpDust(p.x + p.width / 2, p.y + p.height);
      this.triggerComboAction('JUMP', 15);
    } else if (
      p.jumpBufferTimer > 0 &&
      !p.isGrounded &&
      p.canDoubleJump &&
      this.stats.activePowerUp === 'wind_feather'
    ) {
      // Wind Feather Double Jump
      p.vy = PHYSICS_CONFIG.DOUBLE_JUMP_FORCE;
      p.canDoubleJump = false;
      p.jumpBufferTimer = 0;
      soundEngine.playDoubleJump();
      this.spawnSparkles(p.x + p.width / 2, p.y + p.height, '#38bdf8');
      this.spawnJumpDust(p.x + p.width / 2, p.y + p.height);
      this.triggerComboAction('AIR JUMP', 25);
    }

    // Variable Jump Height Damping
    if (this.input.jumpReleased && p.vy < 0) {
      p.vy *= PHYSICS_CONFIG.JUMP_RELEASE_DAMP;
    }

    // Dash / Air Dash Mechanics
    if (p.dashCooldown > 0) {
      p.dashCooldown -= 1 / 60;
    }

    if (p.dashTimer > 0) {
      p.dashTimer -= 1 / 60;
      p.vx = p.facing * (isLightning ? 14.5 : 12.0);
      p.vy = 0; // maintain horizontal glide trajectory during dash
      p.isDashing = true;
      if (Math.random() < 0.75) {
        this.spawnSparkles(p.x + p.width / 2, p.y + p.height / 2, isLightning ? '#facc15' : '#38bdf8');
      }
      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      p.isDashing = false;
    }

    if (this.input.dashPressed && p.dashCooldown <= 0) {
      p.isDashing = true;
      p.dashTimer = 0.22;
      p.dashCooldown = 0.48;
      p.vx = p.facing * (isLightning ? 14.5 : 12.0);
      p.vy = 0;
      soundEngine.playDoubleJump();
      this.triggerCameraShake(0.12, 4.0);
      this.spawnDashDust(p.x + p.width / 2, p.y + p.height / 2, p.facing);
      this.spawnSparkles(p.x + p.width / 2, p.y + p.height / 2, '#38bdf8');
      this.triggerComboAction('DASH', 30);
    }

    // Player Projectile Attack (Ember Core)
    if (this.input.attackPressed && this.stats.activePowerUp === 'ember_core') {
      soundEngine.playShoot();
      this.entities.push({
        id: `proj_${Date.now()}`,
        type: 'projectile_player',
        x: p.x + (p.facing === 1 ? p.width + 2 : -16),
        y: p.y + 10,
        vx: p.facing * 7.5,
        vy: 0,
        width: 14,
        height: 14,
        state: 'flying',
        facing: p.facing,
        active: true,
      });
    }

    // Apply movement
    p.x += p.vx;
    p.y += p.vy;

    // Running dust spawn
    if (p.isGrounded && Math.abs(p.vx) > 3.0 && Math.random() < 0.25) {
      this.spawnDust(p.x + p.width / 2, p.y + p.height);
    }
  }

  // --- TILE COLLISION RESOLUTION ---
  private resolveTileCollisions() {
    const p = this.player;
    const wasInAir = !p.isGrounded;
    const preImpactVy = p.vy;
    const isDashing = p.isDashing;
    p.isGrounded = false;

    const startX = Math.floor((p.x - 16) / TILE_SIZE);
    const endX = Math.ceil((p.x + p.width + 16) / TILE_SIZE);
    const startY = Math.floor((p.y - 16) / TILE_SIZE);
    const endY = Math.ceil((p.y + p.height + 16) / TILE_SIZE);

    for (const tile of this.tiles) {
      if (!tile.active || tile.type === 'empty') continue;
      if (tile.x < startX || tile.x > endX || tile.y < startY || tile.y > endY) continue;

      const tileRect: Rect = {
        x: tile.x * TILE_SIZE,
        y: tile.y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
      };

      const playerRect: Rect = {
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      };

      if (!checkAABB(playerRect, tileRect)) continue;

      // 1. One-Way Floating Platform
      if (tile.type === 'platform_oneway') {
        const prevBottom = p.y - p.vy + p.height;
        if (prevBottom <= tileRect.y + 6 && p.vy >= 0 && !(this.input.down && this.input.jumpPressed)) {
          p.y = tileRect.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          if (wasInAir && preImpactVy > 3.0) {
            this.spawnLandingDust(p.x + p.width / 2, p.y + p.height, preImpactVy);
          }
        }
        continue;
      }

      // 2. Springboards
      if (tile.type === 'spring_up' || tile.type === 'spring_super') {
        const isSuper = tile.type === 'spring_super';
        p.vy = isSuper ? PHYSICS_CONFIG.SUPER_SPRING_FORCE : PHYSICS_CONFIG.SPRING_FORCE;
        p.isGrounded = false;
        soundEngine.playSpring();
        this.triggerCameraShake(0.15, isSuper ? 5.5 : 3.5);
        this.spawnSparkles(tileRect.x + 16, tileRect.y + 8, '#facc15');
        this.spawnJumpDust(tileRect.x + 16, tileRect.y + 16);
        this.triggerComboAction(isSuper ? 'SUPER BOUNCE' : 'SPRING BOUNCE', isSuper ? 80 : 40);
        continue;
      }

      // 3. Environmental Hazards (Spikes / Lava)
      if (tile.type === 'hazard_spikes' || tile.type === 'hazard_lava') {
        if (this.stats.activePowerUp !== 'stone_heart') {
          this.handlePlayerDamage(1);
        }
        continue;
      }

      // 4. Breakable Wooden / Stone Crates
      if (tile.type === 'crate_wood' || tile.type === 'crate_stone') {
        // Can be broken by ground pounding, dashing, or Stone Heart running into it
        if (p.isGroundPounding || isDashing || (tile.type === 'crate_wood' && p.vy > 4) || this.stats.activePowerUp === 'stone_heart') {
          tile.active = false;
          soundEngine.playBlockBreak();
          this.triggerCameraShake(0.18, 5.5);
          this.spawnDebris(tileRect.x + 16, tileRect.y + 16, tile.type === 'crate_wood' ? '#b45309' : '#64748b');
          this.spawnSparkles(tileRect.x + 16, tileRect.y + 16, '#facc15');
          this.triggerComboAction('CRATE SMASH', 50);
          continue;
        }
      }

      // 5. Solid / Ground Block Collisions
      const prevX = p.x - p.vx;
      const prevY = p.y - p.vy;

      // Vertical Landing
      if (prevY + p.height <= tileRect.y && p.vy >= 0) {
        p.y = tileRect.y - p.height;
        p.vy = 0;
        p.isGrounded = true;

        if (wasInAir) {
          if (preImpactVy > 8.0) {
            // High height landing impact!
            this.triggerCameraShake(0.22, Math.min(8.0, preImpactVy * 0.75));
            this.spawnLandingDust(p.x + p.width / 2, p.y + p.height, preImpactVy);
            soundEngine.playLand();
          } else if (preImpactVy > 3.0) {
            this.spawnLandingDust(p.x + p.width / 2, p.y + p.height, preImpactVy);
          }
        }
      }
      // Vertical Ceiling Hit
      else if (prevY >= tileRect.y + tileRect.height && p.vy <= 0) {
        p.y = tileRect.y + tileRect.height;
        p.vy = 0;
      }
      // Horizontal Wall Hit
      else if (prevX + p.width <= tileRect.x) {
        p.x = tileRect.x - p.width;
        p.vx = 0;
        if (isDashing) {
          // Dash into wall impact!
          p.isDashing = false;
          p.dashTimer = 0;
          this.triggerCameraShake(0.18, 6.0);
          soundEngine.playBlockBreak();
          this.spawnSparkles(p.x + p.width, p.y + p.height / 2, '#38bdf8');
          this.spawnDust(p.x + p.width, p.y + p.height);
        }
      } else if (prevX >= tileRect.x + tileRect.width) {
        p.x = tileRect.x + tileRect.width;
        p.vx = 0;
        if (isDashing) {
          // Dash into wall impact!
          p.isDashing = false;
          p.dashTimer = 0;
          this.triggerCameraShake(0.18, 6.0);
          soundEngine.playBlockBreak();
          this.spawnSparkles(p.x, p.y + p.height / 2, '#38bdf8');
          this.spawnDust(p.x, p.y + p.height);
        }
      }
    }
  }

  // --- ENTITY INTERACTIONS & UPDATES ---
  private updateEntities(dt: number) {
    const p = this.player;
    const playerRect: Rect = { x: p.x, y: p.y, width: p.width, height: p.height };

    // Starshard Magnetism (Lightning Bloom)
    const isMagnetic = this.stats.activePowerUp === 'lightning_bloom';

    for (const ent of this.entities) {
      if (!ent.active) continue;

      // 1. Moving Platform
      if (ent.type === 'moving_platform') {
        ent.x += ent.vx;
        if (ent.x > ent.customData?.endX || ent.x < ent.customData?.startX) {
          ent.vx *= -1;
        }
        // Check if player standing on top
        if (
          p.x + p.width > ent.x &&
          p.x < ent.x + ent.width &&
          p.y + p.height >= ent.y - 2 &&
          p.y + p.height <= ent.y + 8 &&
          p.vy >= 0
        ) {
          p.y = ent.y - p.height;
          p.vy = 0;
          p.x += ent.vx;
          p.isGrounded = true;
        }
        continue;
      }

      // 2. Falling Platform
      if (ent.type === 'falling_platform') {
        if (ent.state === 'falling') {
          ent.y += 3.5;
        } else if (
          p.x + p.width > ent.x &&
          p.x < ent.x + ent.width &&
          p.y + p.height >= ent.y - 2 &&
          p.y + p.height <= ent.y + 8 &&
          p.vy >= 0
        ) {
          p.y = ent.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          ent.state = 'shaking';
          setTimeout(() => {
            ent.state = 'falling';
          }, 450);
        }
        continue;
      }

      // 3. Starshard Magnetism
      if (isMagnetic && ent.type.startsWith('starshard')) {
        const dx = p.x + p.width / 2 - (ent.x + ent.width / 2);
        const dy = p.y + p.height / 2 - (ent.y + ent.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < 160 && dist > 1) {
          ent.x += (dx / dist) * 5.0;
          ent.y += (dy / dist) * 5.0;
        }
      }

      const entRect: Rect = { x: ent.x, y: ent.y, width: ent.width, height: ent.height };

      // 4. Projectile movement
      if (ent.type === 'projectile_player') {
        ent.x += ent.vx;
        // Collision with solid tiles
        const tileX = Math.floor((ent.x + ent.width / 2) / TILE_SIZE);
        const tileY = Math.floor((ent.y + ent.height / 2) / TILE_SIZE);
        const hitTile = this.tiles.find((t) => t.active && t.x === tileX && t.y === tileY && t.type !== 'empty');
        if (hitTile) {
          ent.active = false;
          soundEngine.playBlockBreak();
          if (hitTile.type === 'crate_wood') {
            hitTile.active = false;
            this.spawnDebris(hitTile.x * TILE_SIZE + 16, hitTile.y * TILE_SIZE + 16, '#b45309');
          }
        }
        // Collision with enemies
        for (const target of this.entities) {
          if (target.active && (target.type.startsWith('enemy') || target.type === 'boss_entity')) {
            if (checkAABB(entRect, { x: target.x, y: target.y, width: target.width, height: target.height })) {
              ent.active = false;
              this.damageEnemy(target, 2);
              break;
            }
          }
        }
        continue;
      }

      // 5. Boss AI & Attacks
      if (ent.type === 'boss_entity') {
        this.updateBoss(ent, dt);
      }

      // Check Player Collision with Entity
      if (!checkAABB(playerRect, entRect)) continue;

      // Handle Collectibles & Pickups
      if (ent.type === 'starshard_common') {
        ent.active = false;
        this.stats.starshards += 1;
        if (this.stats.starshards >= 100) {
          this.stats.starshards -= 100;
          this.stats.lives += 1;
          this.addVisualEffect(ent.x + 8, ent.y - 12, '1-UP!', '#4ade80');
        }
        soundEngine.playStarshard();
        this.spawnSparkleBurst(ent.x + 8, ent.y + 8, '#facc15', 14);
        this.triggerComboAction('STARSHARD', 100);
      } else if (ent.type.startsWith('starshard_grand')) {
        ent.active = false;
        const gIdx = ent.type.endsWith('1') ? 0 : ent.type.endsWith('2') ? 1 : 2;
        this.grandShardsCollected[gIdx] = true;
        soundEngine.playGrandStarshard();
        const shardColor = ent.type.endsWith('1') ? '#67e8f9' : ent.type.endsWith('2') ? '#c084fc' : '#facc15';
        this.spawnSparkleBurst(ent.x + 14, ent.y + 14, shardColor, 26);
        this.triggerCameraShake(0.22, 5.5);
        this.triggerComboAction('GRAND SHARD', 1000);
        this.callbacks.onGrandStarshardCollect(gIdx);
      } else if (ent.type === 'memory_shard') {
        ent.active = false;
        this.stats.memoryShards += 1;
        soundEngine.playGrandStarshard();
        this.spawnSparkleBurst(ent.x + 14, ent.y + 14, '#38bdf8', 20);
        this.triggerCameraShake(0.18, 4.5);
        this.triggerComboAction('MEMORY SHARD', 500);
        
        // Let the wrapper know to show the dialog
        if (ent.customData?.storyId) {
            this.collectedMemoryShardId = ent.customData.storyId;
            if (this.callbacks.onMemoryShardCollect) {
              this.callbacks.onMemoryShardCollect(ent.customData.storyId);
            }
        }
      } else if (ent.type.startsWith('powerup')) {
        ent.active = false;
        let pType: PlayerStats['activePowerUp'] = 'ember_core';
        if (ent.type === 'powerup_feather') pType = 'wind_feather';
        if (ent.type === 'powerup_stone') pType = 'stone_heart';
        if (ent.type === 'powerup_lightning') pType = 'lightning_bloom';

        this.stats.activePowerUp = pType;
        this.stats.powerUpTimeRemaining = 25; // 25 seconds of power
        soundEngine.playPowerup();
        this.spawnSparkleBurst(ent.x + 12, ent.y + 12, '#fbbf24', 18);
        this.triggerCameraShake(0.16, 4.0);
        this.triggerComboAction(pType.toUpperCase().replace('_', ' '), 250);
      } else if (ent.type === 'heart_pickup') {
        ent.active = false;
        if (this.stats.health < this.stats.maxHealth) {
          this.stats.health++;
        }
        soundEngine.playPowerup();
        this.spawnSparkleBurst(ent.x + 8, ent.y + 8, '#f43f5e', 12);
        this.triggerComboAction('HEART PICKUP', 150);
      } else if (ent.type === 'checkpoint') {
        if (!ent.customData?.triggered) {
          ent.customData = { triggered: true };
          p.respawnX = ent.x;
          p.respawnY = ent.y;
          soundEngine.playCheckpoint();
          this.spawnSparkleBurst(ent.x + 16, ent.y + 20, '#38bdf8', 22);
          this.triggerCameraShake(0.15, 3.5);
          this.addVisualEffect(ent.x + 16, ent.y, 'CHECKPOINT!', '#38bdf8');
        }
      } else if (ent.type === 'sky_beacon') {
        if (!this.isCleared) {
          this.isCleared = true;
          soundEngine.playBeaconCelebration();
          this.spawnSparkleBurst(ent.x + ent.width / 2, ent.y + 20, '#facc15', 30);
          this.triggerCameraShake(0.35, 8.0);
          this.addVisualEffect(ent.x + ent.width / 2, ent.y, 'STAGE CLEAR!', '#fbbf24');
          this.triggerLevelClear();
        }
      }

      // Handle Enemy Stomp or Hurt
      else if (ent.type.startsWith('enemy') || ent.type === 'boss_entity') {
        // Stomp from above
        const isStomping = p.vy > 0 && p.y + p.height <= ent.y + 12;
        if (isStomping) {
          p.vy = PHYSICS_CONFIG.JUMP_FORCE * 0.9;
          this.damageEnemy(ent, 1);
        } else if (this.stats.activePowerUp === 'lightning_bloom') {
          // Lightning dash annihilates enemies
          this.damageEnemy(ent, 3);
        } else {
          this.handlePlayerDamage(1);
        }
      }
    }
  }

  private updateBoss(boss: Entity, dt: number) {
    const p = this.player;
    if (!boss.customData) boss.customData = {};

    boss.customData.attackTimer = (boss.customData.attackTimer || 0) + dt;
    if (boss.customData.hurtFlashTimer > 0) {
      boss.customData.hurtFlashTimer -= dt;
    }

    // Boss patrol movement
    boss.x += (boss.facing || -1) * 1.8;
    if (boss.x < 14 * TILE_SIZE) {
      boss.facing = 1;
    } else if (boss.x > (this.levelData.width - 16) * TILE_SIZE) {
      boss.facing = -1;
    }

    // Boss Attack pattern every 3 seconds
    if (boss.customData.attackTimer > 3.2) {
      boss.customData.attackTimer = 0;
      soundEngine.playBossRoar();
      this.triggerCameraShake(0.3, 6);

      // Spawn projectile or shockwave
      this.entities.push({
        id: `boss_proj_${Date.now()}`,
        type: 'projectile_enemy',
        x: boss.x + (boss.facing === 1 ? boss.width : -12),
        y: boss.y + 20,
        vx: (boss.facing || -1) * 4.5,
        vy: 0,
        width: 16,
        height: 16,
        state: 'active',
        facing: boss.facing || -1,
        active: true,
      });
    }
  }

  private damageEnemy(enemy: Entity, amount: number) {
    if (enemy.health !== undefined) {
      enemy.health -= amount;
      if (enemy.customData) {
        enemy.customData.hurtFlashTimer = 0.25;
      }
      soundEngine.playEnemyHit();
      if (enemy.type === 'boss_entity') {
        this.triggerCameraShake(0.2, 6.0);
      }

      if (enemy.health <= 0) {
        enemy.active = false;
        soundEngine.playEnemyDefeat();
        this.spawnSparkleBurst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#fbbf24', 16);
        this.triggerComboAction('ENEMY DEFEAT', 300);

        // If Boss defeated, spawn Sky Beacon
        if (enemy.type === 'boss_entity') {
          soundEngine.playBeaconCelebration();
          this.triggerCameraShake(0.45, 10.0);
          this.triggerComboAction('BOSS DEFEATED', 5000);
          this.entities.push({
            id: `beacon_boss_clear`,
            type: 'sky_beacon',
            x: enemy.x,
            y: enemy.y,
            vx: 0,
            vy: 0,
            width: 40,
            height: 64,
            state: 'active',
            facing: 1,
            active: true,
          });
        }
      }
    }
  }

  private handlePlayerDamage(amount: number) {
    const p = this.player;
    if (p.invulnerableTimer > 0) return;

    this.stats.health -= amount;
    this.stats.damageFlashTimer = 1.0;
    // Reset combo on taking damage
    this.stats.comboCount = 0;
    this.stats.comboMultiplier = 1;
    this.stats.comboTimer = 0;

    p.invulnerableTimer = PHYSICS_CONFIG.INVULNERABILITY_FRAMES;
    this.triggerCameraShake(0.28, 8.5);
    soundEngine.playPlayerHurt();
    this.callbacks.onStatsUpdate(this.stats);

    if (this.stats.health <= 0) {
      this.stats.lives--;
      if (this.stats.lives <= 0) {
        this.callbacks.onGameOver();
      } else {
        // Respawn at checkpoint
        this.stats.health = this.stats.maxHealth;
        p.x = p.respawnX;
        p.y = p.respawnY;
        p.vx = 0;
        p.vy = 0;
        this.callbacks.onStatsUpdate(this.stats);
      }
    }
  }

  // --- COMBO SYSTEM ---
  public triggerComboAction(actionName: string, basePoints: number) {
    this.stats.comboCount += 1;
    // Multiplier scales from x1 up to x10 based on combo size
    const mult = Math.min(10, 1 + Math.floor((this.stats.comboCount - 1) / 2));
    this.stats.comboMultiplier = mult;
    this.stats.comboTimer = this.stats.comboMaxTimer;

    const totalPoints = basePoints * mult;
    this.stats.score += totalPoints;

    if (this.stats.comboCount >= 2) {
      const tierColors = ['#fde047', '#38bdf8', '#c084fc', '#f472b6', '#fb923c', '#ef4444'];
      const color = tierColors[Math.min(tierColors.length - 1, mult - 1)];
      this.addVisualEffect(
        this.player.x + 12,
        this.player.y - 8,
        `+${totalPoints} [x${mult} COMBO!]`,
        color
      );
    } else {
      this.addVisualEffect(this.player.x + 12, this.player.y - 8, `+${totalPoints}`, '#fde047');
    }
    this.callbacks.onStatsUpdate(this.stats);
  }

  // --- ENVIRONMENTAL WIND PARTICLES ---
  private windSpawnTimer: number = 0;

  private updateWindParticles(dt: number) {
    this.windSpawnTimer += dt;
    if (this.windSpawnTimer > 0.1) {
      this.windSpawnTimer = 0;

      // Determine particle color and shape based on world archetype
      let pColor = '#ffffff';
      let pShape: Particle['shape'] = 'smoke';
      let pSize = Math.random() * 3 + 2;

      if (this.currentWorld.id === 'sunmeadow') {
        pColor = Math.random() < 0.6 ? '#93c5fd' : '#fef08a';
        pShape = 'star';
        pSize = Math.random() * 3 + 2;
      } else if (this.currentWorld.id === 'whispering_woods') {
        pColor = Math.random() < 0.5 ? '#86efac' : '#4ade80';
        pShape = 'smoke';
        pSize = Math.random() * 4 + 2;
      } else if (this.currentWorld.id === 'crystal_caverns') {
        pColor = Math.random() < 0.5 ? '#67e8f9' : '#c084fc';
        pShape = 'spark';
        pSize = Math.random() * 3 + 2;
      } else if (this.currentWorld.id === 'emberpeak') {
        pColor = Math.random() < 0.6 ? '#f97316' : '#ef4444';
        pShape = 'spark';
        pSize = Math.random() * 3 + 2;
      } else if (this.currentWorld.id === 'cloudspire') {
        pColor = '#bae6fd';
        pShape = 'smoke';
        pSize = Math.random() * 5 + 3;
      } else if (this.currentWorld.id === 'tidal_kingdom') {
        pColor = Math.random() < 0.5 ? '#38bdf8' : '#06b6d4';
        pShape = 'spark';
        pSize = Math.random() * 3 + 2;
      } else if (this.currentWorld.id === 'clockwork_citadel') {
        pColor = '#facc15';
        pShape = 'spark';
        pSize = Math.random() * 3 + 2;
      } else if (this.currentWorld.id === 'shadowfall') {
        pColor = '#a855f7';
        pShape = 'spark';
        pSize = Math.random() * 3 + 2;
      }

      // Spawn drifting wind particle in camera view
      const camX = this.camera.x;
      const camY = this.camera.y;
      const spawnX = camX + Math.random() * (this.camera.width + 120) - 60;
      const spawnY = camY + Math.random() * (this.camera.height + 60) - 30;

      const baseWindX = 1.8 + Math.sin(this.gameTime * 1.5) * 0.8;
      const baseWindY = -0.5 + Math.cos(this.gameTime * 2.0) * 0.4;

      this.particles.push({
        x: spawnX,
        y: spawnY,
        vx: baseWindX + (Math.random() - 0.5) * 0.8,
        vy: baseWindY + (Math.random() - 0.5) * 0.6,
        size: pSize,
        color: pColor,
        alpha: 0.7,
        life: 0,
        maxLife: 2.2 + Math.random() * 1.0,
        shape: pShape,
      });
    }
  }

  // --- BLOB SHADOWS GENERATION ---
  public getBlobShadows(): BlobShadowData[] {
    const shadows: BlobShadowData[] = [];

    // 1. Milo's dynamic blob shadow
    const miloFloorY = this.findFloorBeneath(this.player.x + this.player.width / 2, this.player.y + this.player.height);
    if (miloFloorY !== null) {
      const altitude = miloFloorY - (this.player.y + this.player.height);
      shadows.push({
        id: 'milo_shadow',
        x: this.player.x + this.player.width / 2,
        floorY: miloFloorY,
        altitude: Math.max(0, altitude),
        baseWidth: 26,
      });
    }

    // 2. Active Enemies & Boss Blob Shadows
    for (const ent of this.entities) {
      if (!ent.active) continue;
      if (ent.type.startsWith('enemy') || ent.type === 'boss_entity') {
        const floorY = this.findFloorBeneath(ent.x + ent.width / 2, ent.y + ent.height);
        if (floorY !== null) {
          const altitude = floorY - (ent.y + ent.height);
          shadows.push({
            id: `shadow_${ent.id}`,
            x: ent.x + ent.width / 2,
            floorY,
            altitude: Math.max(0, altitude),
            baseWidth: ent.type === 'boss_entity' ? 54 : 26,
          });
        }
      }
    }

    return shadows;
  }

  private findFloorBeneath(x: number, y: number): number | null {
    let closestFloorY: number | null = null;
    let minDistance = 260; // Max vertical projection distance

    // Check solid tiles beneath
    const tileCol = Math.floor(x / TILE_SIZE);
    const startRow = Math.floor(y / TILE_SIZE);
    const endRow = Math.min(this.levelData.height, startRow + 9);

    for (const tile of this.tiles) {
      if (!tile.active || tile.type === 'empty') continue;
      if (tile.x === tileCol && tile.y >= startRow && tile.y <= endRow) {
        const tileTopY = tile.y * TILE_SIZE;
        const dist = tileTopY - y;
        if (dist >= -4 && dist < minDistance) {
          minDistance = dist;
          closestFloorY = tileTopY;
        }
      }
    }

    // Check moving / one-way platforms
    for (const ent of this.entities) {
      if (!ent.active) continue;
      if (ent.type === 'moving_platform' || ent.type === 'falling_platform') {
        if (x >= ent.x && x <= ent.x + ent.width) {
          const dist = ent.y - y;
          if (dist >= -4 && dist < minDistance) {
            minDistance = dist;
            closestFloorY = ent.y;
          }
        }
      }
    }

    return closestFloorY;
  }

  private triggerLevelClear() {
    this.callbacks.onLevelClear({
      time: Math.floor(this.stageTimer),
      shards: this.stats.starshards,
      grandShards: this.grandShardsCollected,
      score: this.stats.score,
    });
  }

  public addScore(pts: number) {
    this.stats.score += pts;
    this.callbacks.onStatsUpdate(this.stats);
  }

  // --- CAMERA UPDATE ---
  private updateCamera() {
    const p = this.player;
    // Smooth look-ahead in facing direction
    const lookAhead = p.facing * 60;
    this.camera.targetX = p.x - this.camera.width / 2 + lookAhead;
    this.camera.targetY = p.y - this.camera.height / 2;

    // Smooth lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.08;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.08;

    // Clamp camera within stage bounds
    this.camera.x = Math.max(0, Math.min(this.camera.maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.camera.maxY, this.camera.y));

    // Screen Shake
    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= 0.016;
      this.camera.x += (Math.random() - 0.5) * this.camera.shakeIntensity;
      this.camera.y += (Math.random() - 0.5) * this.camera.shakeIntensity;
    }
  }

  public triggerCameraShake(duration: number, intensity: number) {
    this.camera.shakeTime = duration;
    this.camera.shakeIntensity = intensity;
  }

  // --- PARTICLES & FX ---
  private spawnDust(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        size: Math.random() * 3 + 2,
        color: '#e2e8f0',
        alpha: 0.75,
        life: 0,
        maxLife: 0.35,
        shape: 'smoke',
      });
    }
  }

  private spawnJumpDust(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const dir = (i % 2 === 0 ? 1 : -1) * (Math.random() * 2.5 + 1.0);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 1,
        vx: dir,
        vy: -Math.random() * 1.4 - 0.3,
        size: Math.random() * 4 + 3,
        color: '#e2e8f0',
        alpha: 0.85,
        life: 0,
        maxLife: 0.36,
        shape: 'smoke',
      });
    }
  }

  private spawnLandingDust(x: number, y: number, impact: number) {
    const count = Math.min(14, Math.floor(impact * 1.4) + 6);
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const speed = (Math.random() * 3.2 + 1.5) * Math.min(2.0, impact / 6);
      this.particles.push({
        x: x + side * (Math.random() * 6),
        y: y - 1,
        vx: side * speed,
        vy: -Math.random() * 1.8 - 0.2,
        size: Math.random() * 5 + 4,
        color: '#cbd5e1',
        alpha: 0.9,
        life: 0,
        maxLife: 0.45,
        shape: 'smoke',
      });
    }
  }

  private spawnDashDust(x: number, y: number, facing: 1 | -1) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x - facing * (Math.random() * 10),
        y: y + (Math.random() - 0.5) * 12,
        vx: -facing * (Math.random() * 5 + 2),
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 5 + 3,
        color: '#e2e8f0',
        alpha: 0.85,
        life: 0,
        maxLife: 0.4,
        shape: 'smoke',
      });
      if (i % 2 === 0) {
        this.particles.push({
          x,
          y: y + (Math.random() - 0.5) * 10,
          vx: -facing * (Math.random() * 6 + 3),
          vy: (Math.random() - 0.5) * 3,
          size: Math.random() * 3 + 2,
          color: '#38bdf8',
          alpha: 1,
          life: 0,
          maxLife: 0.35,
          shape: 'spark',
        });
      }
    }
  }

  private spawnSparkles(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
        shape: 'star',
      });
    }
  }

  private spawnSparkleBurst(x: number, y: number, color: string, count: number = 14) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 4.5 + 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.55,
        shape: 'star',
      });
    }
  }

  private spawnDebris(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 4 - 2,
        size: Math.random() * 4 + 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.6,
        shape: 'square',
        gravity: 0.3,
      });
    }
  }

  public addVisualEffect(x: number, y: number, text: string, color: string) {
    this.visualEffects.push({
      x,
      y,
      text,
      color,
      type: 'float_text',
      life: 0,
      maxLife: 1.0,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.visualEffects.length - 1; i >= 0; i--) {
      const fx = this.visualEffects[i];
      fx.life += dt;
      if (fx.life >= fx.maxLife) {
        this.visualEffects.splice(i, 1);
      }
    }
  }

  // --- RENDER CALL ---
  private render() {
    this.renderer3d.updateBackground(
      this.currentWorld,
      this.camera,
      this.gameTime,
      this.levelData.width,
      this.levelData.height
    );
    this.renderer3d.updateTerrain(this.tiles, this.currentWorld);
    this.renderer3d.updateBlobShadows(this.getBlobShadows());
    this.renderer3d.updateEntities(this.entities, this.gameTime);
    this.renderer3d.updateMilo(this.player, this.stats, this.gameTime);
    this.renderer3d.updateCamera(this.camera, this.player);
    this.renderer3d.updateParticles(this.particles);
    this.renderer3d.updateVisualEffects(this.visualEffects);
    this.renderer3d.updateMotionBlur(this.player, this.stats, this.gameTime);
    this.renderer3d.render();
  }
}
