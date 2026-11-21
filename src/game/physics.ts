import { Rect, Vector2D, Tile } from '../types';

export const PHYSICS_CONFIG = {
  GRAVITY: 0.44,
  MAX_FALL_SPEED: 11.0,
  WALK_ACCEL: 0.42,
  WALK_MAX_SPEED: 3.8,
  SPRINT_ACCEL: 0.65,
  SPRINT_MAX_SPEED: 6.2,
  LIGHTNING_MAX_SPEED: 8.8,
  GROUND_FRICTION: 0.82,
  ICE_FRICTION: 0.96,
  AIR_ACCEL: 0.35,
  AIR_DRAG: 0.94,
  JUMP_FORCE: -10.4,
  JUMP_RELEASE_DAMP: 0.52,
  DOUBLE_JUMP_FORCE: -9.2,
  SPRING_FORCE: -14.2,
  SUPER_SPRING_FORCE: -18.5,
  GROUND_POUND_SPEED: 13.5,
  GLIDE_FALL_SPEED: 1.6,
  COYOTE_FRAMES: 8,
  JUMP_BUFFER_FRAMES: 8,
  INVULNERABILITY_FRAMES: 90, // ~1.5s
  TILE_SIZE: 32,
};

export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getOverlap(a: Rect, b: Rect): Vector2D {
  const dx1 = a.x + a.width - b.x;
  const dx2 = b.x + b.width - a.x;
  const dy1 = a.y + a.height - b.y;
  const dy2 = b.y + b.height - a.y;

  const overlapX = dx1 < dx2 ? dx1 : -dx2;
  const overlapY = dy1 < dy2 ? dy1 : -dy2;

  return { x: overlapX, y: overlapY };
}
