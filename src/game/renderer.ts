import { Camera, Entity, Particle, PlayerStats, PowerUpType, Tile, VisualEffect, WorldDefinition } from '../types';
import { PHYSICS_CONFIG } from './physics';

const TILE_SIZE = PHYSICS_CONFIG.TILE_SIZE;

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public setSize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // --- PARALLAX BACKGROUND RENDERING ---
  public renderBackground(
    world: WorldDefinition,
    camera: Camera,
    time: number,
    levelWidth: number,
    levelHeight: number
  ) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, world.bgGradient[0]);
    skyGrad.addColorStop(0.5, world.bgGradient[1]);
    skyGrad.addColorStop(1, world.bgGradient[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Celestial Object (Sun / Moon / Eclipse)
    ctx.save();
    const celestialX = w * 0.75 - camera.x * 0.03;
    const celestialY = 90;
    if (world.id === 'shadowfall') {
      // Dark Eclipse with purple corona
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (world.id === 'crystal_caverns' || world.id === 'whispering_woods') {
      // Shimmering Moon
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 34, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Warm Radiant Sun
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 35;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 38, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Far Silhouette Mountains / Horizon (Parallax Factor 0.12)
    ctx.save();
    ctx.fillStyle = world.id === 'emberpeak' ? '#450a0a' : world.id === 'crystal_caverns' ? '#1e1b4b' : '#047857';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(0, h);
    const farOffset = (camera.x * 0.12) % 300;
    for (let x = -300; x < w + 300; x += 150) {
      const peakX = x - farOffset;
      const peakH = h - 180 + Math.sin((x + 100) * 0.02) * 50;
      ctx.lineTo(peakX, peakH);
      ctx.lineTo(peakX + 75, h - 120);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Midground Hills / Canopies (Parallax Factor 0.28)
    ctx.save();
    ctx.fillStyle = world.id === 'emberpeak' ? '#7f1d1d' : world.id === 'crystal_caverns' ? '#312e81' : '#065f46';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(0, h);
    const midOffset = (camera.x * 0.28) % 240;
    for (let x = -240; x < w + 240; x += 120) {
      const hillX = x - midOffset;
      const hillY = h - 120 + Math.sin(x * 0.03 + time * 0.5) * 35;
      ctx.quadraticCurveTo(hillX + 60, hillY - 45, hillX + 120, hillY);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Floating Ambient Environment Weather / Motes
    ctx.save();
    ctx.fillStyle = world.accentColor;
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 18; i++) {
      const px = ((i * 113 + time * 25) % (w + 100)) - 50;
      const py = ((i * 73 + Math.sin(time + i) * 30 + camera.y * 0.1) % (h + 50));
      ctx.beginPath();
      ctx.arc(px, py, (i % 3) + 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- TILEMAP RENDERING ---
  public renderTiles(tiles: Tile[], camera: Camera, world: WorldDefinition, time: number) {
    const ctx = this.ctx;
    const viewLeft = camera.x;
    const viewRight = camera.x + camera.width;
    const viewTop = camera.y;
    const viewBottom = camera.y + camera.height;

    for (const tile of tiles) {
      const rx = tile.x * TILE_SIZE - camera.x;
      const ry = tile.y * TILE_SIZE - camera.y;

      // Frustum culling
      if (
        tile.x * TILE_SIZE + TILE_SIZE < viewLeft ||
        tile.x * TILE_SIZE > viewRight ||
        tile.y * TILE_SIZE + TILE_SIZE < viewTop ||
        tile.y * TILE_SIZE > viewBottom
      ) {
        continue;
      }

      ctx.save();

      switch (tile.type) {
        case 'ground': {
          // Top terrain with lush biome grass / crystal cap
          const topColor = world.id === 'emberpeak' ? '#78350f' : world.id === 'crystal_caverns' ? '#0284c7' : '#15803d';
          const subColor = world.id === 'emberpeak' ? '#451a03' : world.id === 'crystal_caverns' ? '#0f172a' : '#78350f';

          // Body block
          ctx.fillStyle = subColor;
          ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);

          // Top grass trim
          ctx.fillStyle = topColor;
          ctx.fillRect(rx, ry, TILE_SIZE, 8);

          // Decorative grass fringe drops
          ctx.beginPath();
          ctx.moveTo(rx, ry + 8);
          ctx.lineTo(rx + 6, ry + 13);
          ctx.lineTo(rx + 12, ry + 8);
          ctx.lineTo(rx + 20, ry + 14);
          ctx.lineTo(rx + 26, ry + 8);
          ctx.lineTo(rx + 32, ry + 12);
          ctx.lineTo(rx + 32, ry + 8);
          ctx.closePath();
          ctx.fill();

          // Subtle stone highlight speckles
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.15;
          ctx.fillRect(rx + 4, ry + 16, 4, 4);
          ctx.fillRect(rx + 20, ry + 22, 5, 3);
          break;
        }

        case 'solid': {
          ctx.fillStyle = world.id === 'emberpeak' ? '#292524' : world.id === 'crystal_caverns' ? '#0f172a' : '#573010';
          ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = 0.2;
          ctx.strokeRect(rx + 0.5, ry + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          break;
        }

        case 'platform_oneway': {
          // Wooden / Stone stylized floating bridge
          ctx.fillStyle = world.id === 'crystal_caverns' ? '#38bdf8' : '#d97706';
          ctx.fillRect(rx, ry, TILE_SIZE, 10);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(rx, ry + 10, TILE_SIZE, 4);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx, ry, TILE_SIZE, 14);
          break;
        }

        case 'crate_wood': {
          // Wooden breakable crate
          ctx.fillStyle = '#b45309';
          ctx.fillRect(rx + 1, ry + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.strokeRect(rx + 2, ry + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          // X-brace
          ctx.beginPath();
          ctx.moveTo(rx + 4, ry + 4);
          ctx.lineTo(rx + TILE_SIZE - 4, ry + TILE_SIZE - 4);
          ctx.moveTo(rx + TILE_SIZE - 4, ry + 4);
          ctx.lineTo(rx + 4, ry + TILE_SIZE - 4);
          ctx.stroke();
          break;
        }

        case 'crate_stone': {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(rx + 1, ry + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.strokeRect(rx + 2, ry + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          // Diamond carved rune
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(rx + 16, ry + 6);
          ctx.lineTo(rx + 26, ry + 16);
          ctx.lineTo(rx + 16, ry + 26);
          ctx.lineTo(rx + 6, ry + 16);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'spring_up':
        case 'spring_super': {
          const isSuper = tile.type === 'spring_super';
          const bounceOffset = Math.sin(time * 6) * 1.5;
          // Base
          ctx.fillStyle = isSuper ? '#7e22ce' : '#b91c1c';
          ctx.fillRect(rx + 2, ry + 24, TILE_SIZE - 4, 8);
          // Spring coil
          ctx.strokeStyle = isSuper ? '#e879f9' : '#fbbf24';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(rx + 8, ry + 24);
          ctx.lineTo(rx + 24, ry + 18 + bounceOffset);
          ctx.lineTo(rx + 8, ry + 12 + bounceOffset);
          ctx.lineTo(rx + 24, ry + 6 + bounceOffset);
          ctx.stroke();
          // Top Plate
          ctx.fillStyle = isSuper ? '#ec4899' : '#f59e0b';
          ctx.fillRect(rx + 2, ry + 2 + bounceOffset, TILE_SIZE - 4, 6);
          break;
        }

        case 'hazard_spikes': {
          ctx.fillStyle = '#cbd5e1';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 4; i++) {
            const sx = rx + i * 8;
            ctx.beginPath();
            ctx.moveTo(sx, ry + TILE_SIZE);
            ctx.lineTo(sx + 4, ry + 6);
            ctx.lineTo(sx + 8, ry + TILE_SIZE);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          break;
        }

        case 'hazard_lava': {
          const lavaWave = Math.sin(time * 4 + tile.x) * 3;
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(rx, ry + 4 + lavaWave, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(rx, ry + 2 + lavaWave, TILE_SIZE, 4);
          break;
        }

        case 'hazard_water': {
          const waterWave = Math.sin(time * 3 + tile.x) * 2;
          ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
          ctx.fillRect(rx, ry + 4 + waterWave, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(rx, ry + 2 + waterWave, TILE_SIZE, 3);
          break;
        }
      }

      ctx.restore();
    }
  }

  // --- MILO HERO CHARACTER RENDERING ---
  public renderMilo(
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      width: number;
      height: number;
      isGrounded: boolean;
      facing: 1 | -1;
      isCrouching: boolean;
      isSprinting: boolean;
      invulnerableTimer: number;
      isGroundPounding: boolean;
    },
    stats: PlayerStats,
    camera: Camera,
    time: number
  ) {
    const ctx = this.ctx;
    const px = player.x - camera.x;
    const py = player.y - camera.y;

    // Flash when invulnerable
    if (player.invulnerableTimer > 0 && Math.floor(time * 25) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(px + player.width / 2, py + player.height);

    // Direction flip
    if (player.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Squash and stretch calculations
    let scaleX = 1;
    let scaleY = 1;
    if (!player.isGrounded) {
      if (player.vy < -2) {
        // Jumping up (stretch vertical)
        scaleX = 0.88;
        scaleY = 1.15;
      } else if (player.vy > 2) {
        // Falling (elongate)
        scaleX = 0.92;
        scaleY = 1.1;
      }
    } else if (player.isCrouching) {
      scaleX = 1.25;
      scaleY = 0.65;
    } else if (Math.abs(player.vx) > 0.5) {
      // Running stride bounce
      const runBounce = Math.sin(time * 14 * (player.isSprinting ? 1.5 : 1)) * 0.08;
      scaleX = 1 - runBounce;
      scaleY = 1 + runBounce;
    }

    ctx.scale(scaleX, scaleY);

    // Power-up visual aura & accessories
    if (stats.activePowerUp === 'ember_core') {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 16;
    } else if (stats.activePowerUp === 'wind_feather') {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
    } else if (stats.activePowerUp === 'stone_heart') {
      ctx.shadowColor = '#94a3b8';
      ctx.shadowBlur = 12;
    } else if (stats.activePowerUp === 'lightning_bloom') {
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 18;
    }

    // 1. Milo's Backpack
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-14, -26, 8, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#fbbf24'; // Buckle
    ctx.fillRect(-12, -20, 4, 3);

    // 2. Legs / Boots
    const legWalkAngle = player.isGrounded && Math.abs(player.vx) > 0.3 ? Math.sin(time * 14) * 6 : 0;
    // Left Boot
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(-8 + legWalkAngle, -8, 6, 8, 2);
    ctx.fill();
    // Right Boot
    ctx.beginPath();
    ctx.roundRect(2 - legWalkAngle, -8, 6, 8, 2);
    ctx.fill();

    // 3. Adventure Outfit / Tunic
    let tunicColor = '#0284c7'; // Azure default
    if (stats.activePowerUp === 'ember_core') tunicColor = '#dc2626';
    else if (stats.activePowerUp === 'wind_feather') tunicColor = '#059669';
    else if (stats.activePowerUp === 'stone_heart') tunicColor = '#475569';
    else if (stats.activePowerUp === 'lightning_bloom') tunicColor = '#eab308';

    ctx.fillStyle = tunicColor;
    ctx.beginPath();
    ctx.roundRect(-9, -24, 18, 17, 4);
    ctx.fill();

    // Belt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-9, -13, 18, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-3, -13, 6, 4);

    // 4. Arms & Gloves
    ctx.fillStyle = '#f8fafc'; // White adventurer gloves
    ctx.beginPath();
    ctx.arc(8 - legWalkAngle * 0.8, -14, 4, 0, Math.PI * 2);
    ctx.arc(-8 + legWalkAngle * 0.8, -14, 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Milo's Head & Expressive Face
    ctx.fillStyle = '#fde047'; // Skin warm tone
    ctx.beginPath();
    ctx.arc(0, -31, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    if (player.isGroundPounding) {
      // Fierce slant eyes
      ctx.fillRect(1, -33, 4, 2);
    } else {
      ctx.beginPath();
      ctx.arc(3, -32, 2, 0, Math.PI * 2);
      ctx.arc(6, -32, 2, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -33, 1, 1);
      ctx.fillRect(7, -33, 1, 1);
    }

    // Cheerful Smile
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(4, -28, 3, 0.1, Math.PI * 0.9);
    ctx.stroke();

    // 6. Milo's Tousled Auburn Hair
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, -34, 10, Math.PI, Math.PI * 2);
    ctx.lineTo(8, -32);
    ctx.lineTo(11, -38);
    ctx.lineTo(5, -42);
    ctx.lineTo(-2, -43);
    ctx.lineTo(-8, -40);
    ctx.lineTo(-10, -32);
    ctx.closePath();
    ctx.fill();

    // 7. Signature Adventurer Headband with Fluttering Tails
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-10, -36, 20, 3);
    // Headband fluttering tail behind head
    const tailFlutter = Math.sin(time * 12) * 4 - (player.vx * 2);
    ctx.beginPath();
    ctx.moveTo(-10, -36);
    ctx.lineTo(-18, -34 + tailFlutter);
    ctx.lineTo(-10, -33);
    ctx.closePath();
    ctx.fill();

    // 8. Power-up Wings (Wind Feather)
    if (stats.activePowerUp === 'wind_feather') {
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.quadraticCurveTo(-22, -32 + Math.sin(time * 8) * 4, -18, -12);
      ctx.closePath();
      ctx.fill();
    }

    // 9. Air Dash Radial Cooldown Ring (Around Milo's center)
    const dashCooldown = (player as any).dashCooldown || 0;
    if (dashCooldown > 0) {
      const progress = Math.min(1.0, Math.max(0.0, 1.0 - dashCooldown / 0.48));
      ctx.save();
      ctx.lineWidth = 3;
      // Track
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.arc(0, -20, 18, 0, Math.PI * 2);
      ctx.stroke();
      // Arc
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -20, 18, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // --- ENTITIES & OBJECTS RENDERING ---
  public renderEntities(entities: Entity[], camera: Camera, time: number) {
    const ctx = this.ctx;

    for (const ent of entities) {
      if (!ent.active) continue;

      const ex = ent.x - camera.x;
      const ey = ent.y - camera.y;

      if (ex + ent.width < 0 || ex > camera.width || ey + ent.height < 0 || ey > camera.height) {
        continue;
      }

      ctx.save();

      switch (ent.type) {
        case 'starshard_common': {
          // 5-pointed rotating sparkling star
          const hoverY = ey + Math.sin(time * 5 + ent.x) * 3;
          ctx.translate(ex + ent.width / 2, hoverY + ent.height / 2);
          ctx.rotate(time * 2);
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          this.drawStar(ctx, 0, 0, 5, 8, 4);
          ctx.fill();
          break;
        }

        case 'starshard_grand_1':
        case 'starshard_grand_2':
        case 'starshard_grand_3': {
          // Large Grand Starshard with prismatic halo
          const hoverY = ey + Math.sin(time * 4 + ent.x) * 4;
          ctx.translate(ex + ent.width / 2, hoverY + ent.height / 2);
          ctx.rotate(time * 1.5);
          ctx.fillStyle = ent.type.endsWith('1') ? '#67e8f9' : ent.type.endsWith('2') ? '#c084fc' : '#facc15';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 20;
          this.drawStar(ctx, 0, 0, 6, 14, 7);
          ctx.fill();
          // Inner core star
          ctx.fillStyle = '#ffffff';
          this.drawStar(ctx, 0, 0, 6, 6, 3);
          ctx.fill();
          break;
        }

        case 'memory_shard': {
          // A crystal shard shape, pulsing with deep blue story energy
          const hoverY = ey + Math.sin(time * 3 + ent.x) * 5;
          ctx.translate(ex + ent.width / 2, hoverY + ent.height / 2);
          ctx.rotate(Math.sin(time * 2) * 0.2); // slight sway
          
          ctx.fillStyle = '#38bdf8'; // Sky blue
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 15 + Math.sin(time * 5) * 5;
          
          ctx.beginPath();
          ctx.moveTo(0, -14); // Top point
          ctx.lineTo(8, 0);   // Right point
          ctx.lineTo(0, 14);  // Bottom point
          ctx.lineTo(-8, 0);  // Left point
          ctx.closePath();
          ctx.fill();

          // Inner core
          ctx.fillStyle = '#bae6fd';
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(4, 0);
          ctx.lineTo(0, 8);
          ctx.lineTo(-4, 0);
          ctx.closePath();
          ctx.fill();
          break;
        }

        case 'powerup_ember':
        case 'powerup_feather':
        case 'powerup_stone':
        case 'powerup_lightning': {
          const hoverY = ey + Math.sin(time * 4 + ent.x) * 4;
          ctx.translate(ex + ent.width / 2, hoverY + ent.height / 2);
          // Orb sphere
          let orbColor = '#ef4444';
          if (ent.type === 'powerup_feather') orbColor = '#06b6d4';
          if (ent.type === 'powerup_stone') orbColor = '#64748b';
          if (ent.type === 'powerup_lightning') orbColor = '#eab308';

          ctx.shadowColor = orbColor;
          ctx.shadowBlur = 16;
          ctx.fillStyle = orbColor;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();

          // Icon crest inside
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'heart_pickup': {
          const hoverY = ey + Math.sin(time * 4) * 3;
          ctx.translate(ex + ent.width / 2, hoverY + ent.height / 2);
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f87171';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, 4);
          ctx.bezierCurveTo(-7, -4, -10, -10, 0, -10);
          ctx.bezierCurveTo(10, -10, 7, -4, 0, 4);
          ctx.fill();
          break;
        }

        case 'checkpoint': {
          // Ancient glowing Runestone
          const isTriggered = ent.customData?.triggered;
          ctx.fillStyle = isTriggered ? '#1e293b' : '#334155';
          ctx.fillRect(ex + 8, ey + 10, 16, 38);
          // Runestone Head
          ctx.beginPath();
          ctx.arc(ex + 16, ey + 10, 8, Math.PI, Math.PI * 2);
          ctx.fill();

          // Glowing Core Glyph
          ctx.fillStyle = isTriggered ? '#38bdf8' : '#64748b';
          ctx.shadowColor = isTriggered ? '#0ea5e9' : 'transparent';
          ctx.shadowBlur = isTriggered ? 18 : 0;
          ctx.beginPath();
          ctx.arc(ex + 16, ey + 22, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'sky_beacon': {
          // Level End Monument / Goal
          const pulse = Math.sin(time * 4) * 0.2 + 0.8;
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 24;
          // Base pedestal
          ctx.fillRect(ex + 4, ey + 40, ent.width - 8, 24);
          // Golden Celestial Pillar
          ctx.fillRect(ex + 14, ey + 10, 12, 30);
          // Spinning celestial ring
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(ex + 20, ey + 10, 18 * pulse, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
          // Glowing star crown
          ctx.fillStyle = '#ffffff';
          this.drawStar(ctx, ex + 20, ey + 8, 5, 10, 5);
          ctx.fill();
          break;
        }

        case 'moving_platform': {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(ex, ey, ent.width, ent.height);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(ex + 1, ey + 1, ent.width - 2, ent.height - 2);
          break;
        }

        case 'falling_platform': {
          const shake = ent.state === 'shaking' ? Math.sin(time * 35) * 3 : 0;
          ctx.fillStyle = '#78716c';
          ctx.fillRect(ex + shake, ey, ent.width, ent.height);
          ctx.fillStyle = '#44403c';
          ctx.fillRect(ex + shake + 4, ey + 4, ent.width - 8, ent.height - 8);
          break;
        }

        // --- ENEMIES ---
        case 'enemy_pufflet': {
          // Bouncing seed critter
          const hop = Math.abs(Math.sin(time * 8)) * 4;
          ctx.translate(ex + ent.width / 2, ey + ent.height - hop);
          ctx.fillStyle = '#84cc16';
          ctx.beginPath();
          ctx.arc(0, -10, 11, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5 * ent.facing, -12, 3, 3);
          ctx.fillRect(1 * ent.facing, -12, 3, 3);
          // Top leaf sprout
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(0, -21, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'enemy_spikeling': {
          // Spiky armored crawler
          ctx.translate(ex + ent.width / 2, ey + ent.height);
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(0, -8, 12, Math.PI, Math.PI * 2);
          ctx.fill();
          // Spikes on shell
          ctx.fillStyle = '#ef4444';
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 5 - 2, -18);
            ctx.lineTo(i * 5, -24);
            ctx.lineTo(i * 5 + 2, -18);
            ctx.closePath();
            ctx.fill();
          }
          break;
        }

        case 'enemy_flutterwing': {
          // Swooping winged creature
          const flap = Math.sin(time * 16) * 6;
          ctx.translate(ex + ent.width / 2, ey + ent.height / 2);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          // Wings
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.ellipse(-10, flap, 8, 4, 0.4, 0, Math.PI * 2);
          ctx.ellipse(10, flap, 8, 4, -0.4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'enemy_cinder_beetle': {
          ctx.translate(ex + ent.width / 2, ey + ent.height);
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.roundRect(-12, -16, 24, 16, 4);
          ctx.fill();
          // Glowing heat vent
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, -10, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'boss_entity': {
          this.renderBoss(ent, ex, ey, time);
          break;
        }

        case 'projectile_player': {
          // Ember fireball projectile
          ctx.translate(ex + ent.width / 2, ey + ent.height / 2);
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'projectile_enemy': {
          ctx.translate(ex + ent.width / 2, ey + ent.height / 2);
          ctx.fillStyle = '#dc2626';
          ctx.shadowColor = '#991b1b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    }
  }

  private renderBoss(boss: Entity, ex: number, ey: number, time: number) {
    const ctx = this.ctx;
    const bossType = boss.customData?.bossType || 'grumblethorn';

    ctx.save();
    ctx.translate(ex + boss.width / 2, ey + boss.height);

    if (boss.facing === 1) {
      ctx.scale(-1, 1);
    }

    const hitFlash = boss.customData?.hurtFlashTimer > 0;
    if (hitFlash) {
      ctx.filter = 'brightness(2.5)';
    }

    if (bossType === 'grumblethorn') {
      // Bramble King Grumblethorn
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.roundRect(-28, -58, 56, 58, 12);
      ctx.fill();
      // Bramble Crown
      ctx.fillStyle = '#b45309';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10 - 4, -58);
        ctx.lineTo(i * 10, -74);
        ctx.lineTo(i * 10 + 4, -58);
        ctx.fill();
      }
      // Glowing Red Eyes
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 14;
      ctx.fillRect(-16, -42, 8, 6);
      ctx.fillRect(4, -42, 8, 6);
    } else if (bossType === 'geode_goliath') {
      // Geode Goliath (Crystal Titan)
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.roundRect(-30, -60, 60, 60, 14);
      ctx.fill();
      // Glowing amethyst crystals sprouting
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 16;
      this.drawStar(ctx, -14, -68, 4, 12, 5);
      ctx.fill();
      this.drawStar(ctx, 14, -68, 4, 12, 5);
      ctx.fill();
      // Glowing Cyan Eye Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-18, -44, 36, 8);
    } else if (bossType === 'ignis') {
      // Magma Drake Ignis
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.roundRect(-32, -56, 64, 56, 12);
      ctx.fill();
      // Flame Horns
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(-20, -56);
      ctx.lineTo(-30, -78);
      ctx.lineTo(-12, -56);
      ctx.moveTo(20, -56);
      ctx.lineTo(30, -78);
      ctx.lineTo(12, -56);
      ctx.fill();
      // Lava Mouth
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-14, -28, 28, 8);
    } else {
      // Lord Malakor - The Shadow Sovereign (Final Boss)
      const floatHover = Math.sin(time * 4) * 6;
      ctx.translate(0, floatHover);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-28, -64, 56, 64, 16);
      ctx.fill();
      // Purple Void Robes & Spikes
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.strokeRect(-26, -62, 52, 60);
      // Ominous Void Core
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#9333ea';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(0, -38, 12, 0, Math.PI * 2);
      ctx.fill();
      // Void Blade Orbiting
      const bladeAngle = time * 3;
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(Math.cos(bladeAngle) * 44 - 4, -40 + Math.sin(bladeAngle) * 15, 8, 24);
    }

    ctx.restore();

    // Boss Health Bar at Top Center
    const currentH = boss.health || 0;
    const maxH = boss.maxHealth || 1;
    const barW = 260;
    const barH = 14;
    const barX = (this.canvas.width - barW) / 2;
    const barY = 48;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, (currentH / maxH) * barW, barH);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS: ${bossType.toUpperCase()}`, this.canvas.width / 2, barY - 6);
  }

  // --- PARTICLES & VISUAL EFFECTS ---
  public renderParticles(particles: Particle[], camera: Camera) {
    const ctx = this.ctx;
    for (const p of particles) {
      const px = p.x - camera.x;
      const py = p.y - camera.y;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        this.drawStar(ctx, px, py, 4, p.size * 1.5, p.size * 0.7);
        ctx.fill();
      } else if (p.shape === 'smoke') {
        const growth = 0.75 + (p.life / p.maxLife) * 1.5;
        ctx.beginPath();
        ctx.arc(px, py, p.size * growth, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  public renderVisualEffects(effects: VisualEffect[], camera: Camera) {
    const ctx = this.ctx;
    for (const fx of effects) {
      const px = fx.x - camera.x;
      const py = fx.y - camera.y;
      ctx.save();
      const progress = fx.life / fx.maxLife;

      if (fx.type === 'float_text' && fx.text) {
        ctx.font = '900 18px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.max(0, 1 - progress);

        // Dark Outline
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 4;
        ctx.strokeText(fx.text, px, py - progress * 32);

        // Fill
        ctx.fillStyle = fx.color || '#facc15';
        ctx.fillText(fx.text, px, py - progress * 32);
      } else if (fx.type === 'impact_shockwave') {
        ctx.strokeStyle = fx.color || '#ffffff';
        ctx.lineWidth = 3 * (1 - progress);
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(px, py, (fx.size || 20) * progress, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  public renderSpeedLines(intensity: number, time: number) {
    if (intensity <= 0.02) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.globalAlpha = Math.min(0.7, intensity * 0.75);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    const lineCount = Math.floor(24 * intensity);
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 + Math.sin(time * 20 + i) * 0.1;
      const innerDist = Math.min(w, h) * 0.28;
      const outerDist = Math.max(w, h) * 0.75;

      const x1 = cx + Math.cos(angle) * innerDist;
      const y1 = cy + Math.sin(angle) * innerDist;
      const x2 = cx + Math.cos(angle) * outerDist;
      const y2 = cy + Math.sin(angle) * outerDist;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
}
