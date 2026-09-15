import { TILE, TILE_SIZE, MAP_COLS, MAP_ROWS } from './constants';
import { NPC, ZoneColorStatus, EmotionType } from '../types/game';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'down' | 'up' | 'left' | 'right';
  animFrame: number;
  isMoving: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tickCount: number = 0;
  private particles: Particle[] = [];
  private destinationTarget: { x: number; y: number; anim: number } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not create 2D context');
    this.ctx = context;
    // Crisp pixel rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  public setDestination(x: number, y: number) {
    this.destinationTarget = { x, y, anim: 0 };
  }

  public clearDestination() {
    this.destinationTarget = null;
  }

  public addSparkle(x: number, y: number, color: string = '#fef08a', count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 0,
        maxLife: 20 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  public render(
    map: number[][],
    player: Player,
    npcs: NPC[],
    zoneColorStatus: ZoneColorStatus,
    isCompassActive: boolean,
    cameraX: number,
    cameraY: number,
    viewportW: number,
    viewportH: number
  ) {
    this.tickCount++;
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, viewportW, viewportH);

    // Camera translation
    ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY));

    // Determine tile bounds to render
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
    const endCol = Math.min(MAP_COLS - 1, Math.ceil((cameraX + viewportW) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 1);
    const endRow = Math.min(MAP_ROWS - 1, Math.ceil((cameraY + viewportH) / TILE_SIZE) + 1);

    // 1. Draw Map Tiles
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = map[r]?.[c] ?? TILE.GRASS;
        const screenX = c * TILE_SIZE;
        const screenY = r * TILE_SIZE;

        // Is this zone restored to color?
        const isRestored = this.isZoneColored(c, r, zoneColorStatus);

        this.drawTile(tile, screenX, screenY, isRestored);
      }
    }

    // 2. Draw Decorative Bridge Details & Water Ripple
    this.drawWaterCurrents(cameraX, cameraY, viewportW, viewportH, zoneColorStatus.bridge);

    // 3. Draw NPCs
    npcs.forEach((npc) => {
      this.drawNPC(npc, isCompassActive);
    });

    // Destination target marker on floor
    this.drawDestinationMarker();

    // 4. Draw Player
    this.drawPlayer(player);

    // 5. Draw Secret sparkle over Holy Tree if not yet inspected
    this.drawSecretSparkles(isCompassActive);

    // 6. Draw Compass Resonance Aura overlay if active
    if (isCompassActive) {
      this.drawResonanceAuras(player, npcs);
    }

    // 7. Update and draw particles (bloom sparks, healing dust)
    this.updateAndDrawParticles();

    // 8. Draw Fog of gray mist over uncolored zones
    this.drawAtmosphericMist(zoneColorStatus, viewportW, viewportH, cameraX, cameraY);

    ctx.restore();
  }

  // Check which zone a coordinate belongs to
  private isZoneColored(c: number, r: number, status: ZoneColorStatus): boolean {
    if (c >= 25 && r <= 12) return status.tower;
    if (c >= 20 && (r >= 12 && r <= 20)) return status.bridge;
    if (c <= 16 && r <= 10) return status.forest;
    return status.plaza;
  }

  // Draw procedural pixel tile
  private drawTile(tile: number, x: number, y: number, isColored: boolean) {
    const ctx = this.ctx;

    // If not colored, shift to grayscale/cool muted tones
    switch (tile) {
      case TILE.GRASS:
        ctx.fillStyle = isColored ? '#386641' : '#334155';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Grass blade detail
        ctx.fillStyle = isColored ? '#6a994e' : '#475569';
        ctx.fillRect(x + 4, y + 6, 2, 4);
        ctx.fillRect(x + 20, y + 18, 2, 4);
        break;

      case TILE.GRASS_FLOWERS:
        ctx.fillStyle = isColored ? '#386641' : '#334155';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Small flowers
        ctx.fillStyle = isColored ? '#f43f5e' : '#64748b';
        ctx.fillRect(x + 8, y + 8, 3, 3);
        ctx.fillStyle = isColored ? '#eab308' : '#94a3b8';
        ctx.fillRect(x + 22, y + 16, 3, 3);
        break;

      case TILE.PATH_STONE:
        ctx.fillStyle = isColored ? '#94a3b8' : '#475569';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Paver edges
        ctx.fillStyle = isColored ? '#cbd5e1' : '#64748b';
        ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.fillRect(x + 16, y + 2, 14, 12);
        ctx.fillRect(x + 2, y + 16, 14, 14);
        ctx.fillRect(x + 18, y + 16, 12, 14);
        break;

      case TILE.WATER:
      case TILE.WATER_DEEP:
        ctx.fillStyle = isColored ? '#0284c7' : '#1e293b';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Gentle wave
        const waveShift = Math.floor((this.tickCount / 12 + x / 16) % 4);
        ctx.fillStyle = isColored ? '#38bdf8' : '#334155';
        ctx.fillRect(x + waveShift * 4, y + 12, 8, 2);
        ctx.fillRect(x + 16 - waveShift * 2, y + 24, 6, 2);
        break;

      case TILE.WOOD_BRIDGE:
        ctx.fillStyle = isColored ? '#854d0e' : '#334155';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Planks
        ctx.fillStyle = isColored ? '#a16207' : '#475569';
        ctx.fillRect(x, y + 2, TILE_SIZE, 6);
        ctx.fillRect(x, y + 10, TILE_SIZE, 6);
        ctx.fillRect(x, y + 18, TILE_SIZE, 6);
        ctx.fillRect(x, y + 26, TILE_SIZE, 5);
        // Planks nails
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 2, y + 4, 2, 2);
        ctx.fillRect(x + TILE_SIZE - 4, y + 4, 2, 2);
        break;

      case TILE.TREE_TRUNK:
        // Forest tree
        ctx.fillStyle = isColored ? '#386641' : '#334155';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Trunk
        ctx.fillStyle = isColored ? '#78350f' : '#1e293b';
        ctx.fillRect(x + 10, y + 12, 12, 20);
        // Canopy foliage
        ctx.fillStyle = isColored ? '#15803d' : '#475569';
        ctx.beginPath();
        ctx.arc(x + 16, y + 8, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isColored ? '#22c55e' : '#64748b';
        ctx.beginPath();
        ctx.arc(x + 13, y + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case TILE.FOUNTAIN:
        // Central village fountain
        ctx.fillStyle = isColored ? '#94a3b8' : '#475569';
        ctx.fillRect(x - 16, y - 16, TILE_SIZE + 32, TILE_SIZE + 32);
        ctx.fillStyle = isColored ? '#0284c7' : '#334155';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 22, 0, Math.PI * 2);
        ctx.fill();

        if (isColored) {
          // Water jets bubbling!
          const fountainPulse = Math.sin(this.tickCount * 0.1) * 3;
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(x + 14, y + 6 - fountainPulse, 4, 16 + fountainPulse);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(x + 16, y + 6 - fountainPulse, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Frozen gray fountain
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x + 14, y + 10, 4, 12);
        }
        break;

      case TILE.SECRET_TREE:
        // Ancient Sacred Tree
        ctx.fillStyle = isColored ? '#386641' : '#334155';
        ctx.fillRect(x - 16, y - 16, TILE_SIZE + 32, TILE_SIZE + 32);
        // Golden trunk
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 8, y + 12, 16, 24);
        // Massive majestic canopy
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(x + 16, y + 4, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(x + 12, y - 2, 16, 0, Math.PI * 2);
        ctx.fill();
        break;

      case TILE.HOUSE_WALL:
      case TILE.TOWER_WALL:
        ctx.fillStyle = isColored ? '#e2e8f0' : '#475569';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Stone brick pattern
        ctx.fillStyle = isColored ? '#cbd5e1' : '#334155';
        ctx.fillRect(x, y + 14, TILE_SIZE, 2);
        ctx.fillRect(x + 16, y, 2, 14);
        ctx.fillRect(x + 8, y + 16, 2, 16);
        break;

      case TILE.HOUSE_ROOF:
        ctx.fillStyle = isColored ? '#b91c1c' : '#1e293b';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        // Shingles
        ctx.fillStyle = isColored ? '#ef4444' : '#334155';
        ctx.fillRect(x + 2, y + 4, TILE_SIZE - 4, 6);
        ctx.fillRect(x + 4, y + 16, TILE_SIZE - 8, 6);
        break;

      case TILE.FLOWER_BED:
        ctx.fillStyle = isColored ? '#4d7c0f' : '#334155';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        if (isColored) {
          // Vivid flower blossoms
          const colors = ['#f43f5e', '#ec4899', '#eab308', '#a855f7'];
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(x + 6 + (i % 2) * 12, y + 6 + Math.floor(i / 2) * 12, 6, 6);
          }
        }
        break;

      case TILE.CLIFF:
      default:
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        break;
    }
  }

  // Draw player sprite with walking frames & scarf
  private drawPlayer(player: Player) {
    const ctx = this.ctx;
    const px = Math.floor(player.x);
    const py = Math.floor(player.y);
    const bob = player.isMoving ? Math.sin(this.tickCount * 0.3) * 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 29, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Shirt: Emerald/Teal)
    ctx.fillStyle = '#059669';
    ctx.fillRect(px + 8, py + 14 + bob, 16, 12);

    // Red Scarf (Signature Adventurer item)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px + 9, py + 12 + bob, 14, 4);
    if (player.facing === 'right') {
      ctx.fillRect(px + 6, py + 14 + bob, 4, 6);
    } else if (player.facing === 'left') {
      ctx.fillRect(px + 22, py + 14 + bob, 4, 6);
    }

    // Head (Skin tone)
    ctx.fillStyle = '#fde047';
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 9, py + 4 + bob, 14, 10);

    // Hair (Brown adventurer messy cut)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 8, py + 2 + bob, 16, 5);
    ctx.fillRect(px + 8, py + 4 + bob, 3, 5);
    ctx.fillRect(px + 21, py + 4 + bob, 3, 5);

    // Eyes
    ctx.fillStyle = '#1e293b';
    if (player.facing === 'down') {
      ctx.fillRect(px + 11, py + 8 + bob, 2, 3);
      ctx.fillRect(px + 19, py + 8 + bob, 2, 3);
    } else if (player.facing === 'left') {
      ctx.fillRect(px + 10, py + 8 + bob, 2, 3);
    } else if (player.facing === 'right') {
      ctx.fillRect(px + 20, py + 8 + bob, 2, 3);
    }

    // Legs / Shoes
    ctx.fillStyle = '#1e293b';
    const legOffset = player.isMoving ? Math.sin(this.tickCount * 0.3) * 3 : 0;
    ctx.fillRect(px + 10, py + 26 + legOffset, 4, 5);
    ctx.fillRect(px + 18, py + 26 - legOffset, 4, 5);

    // Golden compass attached to belt, glowing
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(px + 14, py + 22 + bob, 4, 4);
  }

  // Draw unique NPCs with distinct expressive sprites
  private drawNPC(npc: NPC, isCompassActive: boolean) {
    const ctx = this.ctx;
    const nx = Math.floor(npc.x * TILE_SIZE);
    const ny = Math.floor(npc.y * TILE_SIZE);
    const idleBob = Math.sin(this.tickCount * 0.08 + npc.x) * 1.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(nx + 16, ny + 28, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (npc.sprite) {
      case 'squirrel': // Kiki the Squirrel
        ctx.fillStyle = '#d97706'; // Fur
        ctx.fillRect(nx + 10, ny + 10 + idleBob, 12, 14);
        // Fluffy tail
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(nx + 6, ny + 12 + idleBob, 8, 0, Math.PI * 2);
        ctx.fill();
        // White belly
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(nx + 12, ny + 14 + idleBob, 8, 8);
        // Ears
        ctx.fillStyle = '#92400e';
        ctx.fillRect(nx + 10, ny + 6 + idleBob, 3, 5);
        ctx.fillRect(nx + 19, ny + 6 + idleBob, 3, 5);
        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(nx + 13, ny + 11 + idleBob, 2, 2);
        ctx.fillRect(nx + 18, ny + 11 + idleBob, 2, 2);
        // Mail pouch
        ctx.fillStyle = '#78350f';
        ctx.fillRect(nx + 14, ny + 18 + idleBob, 6, 5);
        break;

      case 'old_man': // Kakek Ranu
        // Blue dungarees / shirt
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(nx + 8, ny + 14 + idleBob, 16, 12);
        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(nx + 9, ny + 6 + idleBob, 14, 10);
        // White bald fringe & bushy mustache
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(nx + 8, ny + 6 + idleBob, 16, 3);
        ctx.fillRect(nx + 10, ny + 13 + idleBob, 12, 3); // Mustache
        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(nx + 11, ny + 9 + idleBob, 2, 2);
        ctx.fillRect(nx + 19, ny + 9 + idleBob, 2, 2);
        // Carpenter Hammer in hand
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(nx + 25, ny + 10 + idleBob, 4, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(nx + 26, ny + 14 + idleBob, 2, 10);
        break;

      case 'boy_glasses': // Bimo
        // Yellow sweater
        ctx.fillStyle = '#eab308';
        ctx.fillRect(nx + 8, ny + 14 + idleBob, 16, 12);
        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(nx + 9, ny + 6 + idleBob, 14, 10);
        // Curly dark hair
        ctx.fillStyle = '#3b2f2f';
        ctx.fillRect(nx + 8, ny + 4 + idleBob, 16, 4);
        ctx.fillRect(nx + 7, ny + 7 + idleBob, 3, 4);
        // Huge round teal spectacles!
        ctx.fillStyle = '#06b6d4';
        ctx.strokeRect(nx + 10, ny + 9 + idleBob, 5, 4);
        ctx.strokeRect(nx + 17, ny + 9 + idleBob, 5, 4);
        ctx.fillRect(nx + 15, ny + 10 + idleBob, 2, 1);
        break;

      case 'chicken_glasses': // Profesor Kotek
        // White chicken body
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(nx + 10, ny + 12 + idleBob, 12, 12);
        // Red comb
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(nx + 13, ny + 7 + idleBob, 6, 4);
        // Yellow beak
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(nx + 19, ny + 14 + idleBob, 4, 3);
        // Round professor monocle!
        ctx.fillStyle = '#eab308';
        ctx.strokeRect(nx + 15, ny + 12 + idleBob, 4, 4);
        // Tiny feet
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(nx + 12, ny + 24, 2, 4);
        ctx.fillRect(nx + 18, ny + 24, 2, 4);
        break;

      case 'spirit_elder': // Nenek Wilis / Sosok Kabut
      default:
        if (npc.isResolved) {
          // Revealed Nenek Wilis in peaceful batik
          ctx.fillStyle = '#831843'; // Selendang
          ctx.fillRect(nx + 8, ny + 12 + idleBob, 16, 14);
          ctx.fillStyle = '#fed7aa'; // Face
          ctx.fillRect(nx + 10, ny + 5 + idleBob, 12, 9);
          ctx.fillStyle = '#94a3b8'; // White hair bun
          ctx.fillRect(nx + 11, ny + 2 + idleBob, 10, 4);
        } else {
          // Enigmatic swirling mist spirit
          const mistWobble = Math.sin(this.tickCount * 0.15) * 3;
          ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
          ctx.beginPath();
          ctx.arc(nx + 16 + mistWobble, ny + 14 + idleBob, 14, 0, Math.PI * 2);
          ctx.fill();
          // Mysterious glowing lavender eyes
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(nx + 12 + mistWobble, ny + 12 + idleBob, 3, 2);
          ctx.fillRect(nx + 18 + mistWobble, ny + 12 + idleBob, 3, 2);
        }
        break;
    }

    // Name badge / interaction prompt floating above NPC
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    const textW = ctx.measureText(npc.name).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(nx + 16 - textW / 2 - 4, ny - 10 + idleBob, textW + 8, 12);
    ctx.fillStyle = npc.isResolved ? '#4ade80' : '#fef08a';
    ctx.fillText(npc.name, nx + 16, ny - 1 + idleBob);
  }

  // Draw the Resonance Compass Auras & Deep Emotions
  private drawResonanceAuras(player: Player, npcs: NPC[]) {
    const ctx = this.ctx;
    const px = player.x + 16;
    const py = player.y + 16;

    // Expanding resonance pulse rings
    const pulseRadius = (this.tickCount * 2) % 180;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Scan NPCs within resonance radius
    npcs.forEach((npc) => {
      const nx = npc.x * TILE_SIZE + 16;
      const ny = npc.y * TILE_SIZE + 16;
      const dist = Math.hypot(nx - px, ny - py);

      if (dist < 260) {
        // Draw emotional spectrum aura
        const auraColor = this.getEmotionColor(npc.emotionProfile.surfaceEmotion);
        const deepColor = this.getEmotionColor(npc.emotionProfile.deepEmotion);

        // Flashing aura halo
        const auraAlpha = 0.4 + Math.sin(this.tickCount * 0.1) * 0.2;
        ctx.fillStyle = auraColor.replace('1)', `${auraAlpha})`);
        ctx.beginPath();
        ctx.arc(nx, ny - 4, 22, 0, Math.PI * 2);
        ctx.fill();

        // Emotional iceberg indicator above NPC
        ctx.font = '8px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';

        const surfaceLabel = `Luar: ${npc.emotionProfile.surfaceEmotion.toUpperCase()}`;
        const deepLabel = `Hati: ${npc.emotionProfile.deepEmotion.toUpperCase()}`;

        // Tag background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.roundRect?.(nx - 55, ny - 45, 110, 28, 4);
        ctx.fill();

        // Surface emotion
        ctx.fillStyle = auraColor;
        ctx.fillText(surfaceLabel, nx, ny - 34);

        // Deep hidden emotion
        ctx.fillStyle = deepColor;
        ctx.fillText(deepLabel, nx, ny - 22);
      }
    });
  }

  private getEmotionColor(emotion: EmotionType): string {
    switch (emotion) {
      case 'marah': return 'rgba(239, 68, 68, 1)';   // Red
      case 'cemas': return 'rgba(234, 179, 8, 1)';   // Amber/Yellow
      case 'sedih': return 'rgba(59, 130, 246, 1)';  // Blue
      case 'takut': return 'rgba(168, 85, 247, 1)';  // Purple
      case 'kecewa': return 'rgba(14, 165, 233, 1)'; // Cyan
      case 'tenang': return 'rgba(34, 197, 94, 1)';  // Green
      case 'gembira': return 'rgba(249, 115, 22, 1)';// Orange
      case 'haru': return 'rgba(236, 72, 153, 1)';   // Pink
      default: return 'rgba(255, 255, 255, 1)';
    }
  }

  // Draw secret sparkles over ancient tree
  private drawSecretSparkles(isCompassActive: boolean) {
    if (isCompassActive) {
      const ctx = this.ctx;
      const tx = 4 * TILE_SIZE + 16;
      const ty = 4 * TILE_SIZE + 16;
      const pulse = Math.sin(this.tickCount * 0.1) * 4;

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(tx, ty - pulse, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private updateAndDrawParticles() {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const progress = p.life / p.maxLife;
      const alpha = 1 - progress;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1.0;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Draw gray mist overlay over unrecovered areas
  private drawAtmosphericMist(
    status: ZoneColorStatus,
    w: number,
    h: number,
    camX: number,
    camY: number
  ) {
    const ctx = this.ctx;
    if (status.plaza && status.bridge && status.forest && status.tower) {
      // All zones restored: golden sunshine particles!
      return;
    }

    // Gentle swirling gray fog bands across the screen
    ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
    const offset = (this.tickCount * 0.5) % 80;
    ctx.fillRect(camX, camY + offset, w, 40);
    ctx.fillRect(camX, camY + offset + 140, w, 30);
  }

  // Draw visual feedback marker when clicking on the floor to walk
  private drawDestinationMarker() {
    if (!this.destinationTarget) return;
    this.destinationTarget.anim += 1;
    const { x, y, anim } = this.destinationTarget;
    const ctx = this.ctx;
    ctx.save();

    // Subtle pulsing ground ring
    const pulse = Math.sin(anim * 0.15);
    const radius = 9 + pulse * 2;

    // Glowing ground disc
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer cyan dash ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -anim * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Expanding beacon ripple
    const rippleProgress = (anim % 40) / 40;
    const rippleRadius = 6 + rippleProgress * 18;
    const rippleAlpha = 0.65 * (1 - rippleProgress);
    ctx.strokeStyle = `rgba(103, 232, 249, ${rippleAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, rippleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright center dot
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawWaterCurrents(camX: number, camY: number, w: number, h: number, isBridgeClear: boolean) {
    // Extra visual polish on water flow
    const ctx = this.ctx;
    if (isBridgeClear) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      const waveX = 22 * TILE_SIZE + Math.sin(this.tickCount * 0.05) * 8;
      ctx.fillRect(waveX, 10 * TILE_SIZE, 6, 40);
      ctx.fillRect(waveX + 10, 18 * TILE_SIZE, 8, 30);
    }
  }
}
