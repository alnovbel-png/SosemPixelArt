import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameRenderer, Player } from './game/renderer';
import {
  generateMapLayout,
  isTileSolid,
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  INITIAL_NPCS,
  INITIAL_QUESTS,
  INITIAL_ITEMS,
} from './game/constants';
import { GAME_DIALOGUES } from './game/dialogueData';
import {
  DialogueNode,
  ChoiceOption,
  ZoneColorStatus,
  PlayerStats,
  Item,
  GameQuest,
  NPC,
} from './types/game';
import { sound } from './utils/audio';
import { DialogueBox } from './components/DialogueBox';
import { BreathingMiniGame } from './components/BreathingMiniGame';
import { CompassJournalModal } from './components/CompassJournalModal';
import { HelpModal } from './components/HelpModal';
import { EndingModal } from './components/EndingModal';
import { VirtualControls } from './components/VirtualControls';
import { MiniMap } from './components/MiniMap';
import { downloadOfflineGameHtml } from './utils/exportOfflineHtml';
import { Sparkles, Compass } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);

  // Game World State
  const [mapLayout] = useState<number[][]>(() => generateMapLayout());
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [zoneStatus, setZoneStatus] = useState<ZoneColorStatus>({
    plaza: false,
    bridge: false,
    forest: false,
    tower: false,
  });
  const [inventory, setInventory] = useState<Item[]>(INITIAL_ITEMS);
  const [quests, setQuests] = useState<GameQuest[]>(INITIAL_QUESTS);
  const [stats, setStats] = useState<PlayerStats>({
    empathyScore: 20,
    resonanceUses: 0,
    calmTechniquesMastered: 0,
    secretsFound: 0,
    unlockedBadges: [],
  });

  // Player position & movement
  const playerRef = useRef<Player>({
    x: 11 * TILE_SIZE,
    y: 15 * TILE_SIZE,
    vx: 0,
    vy: 0,
    facing: 'down',
    animFrame: 0,
    isMoving: false,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Camera tracking reference for click-to-world coordinate translation
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Destination target when clicking/tapping on the floor or an NPC
  const targetPosRef = useRef<{
    x: number;
    y: number;
    targetNPC?: NPC | null;
    targetType?: string;
  } | null>(null);

  // Active UI states
  const [isCompassActive, setIsCompassActive] = useState<boolean>(false);
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [showBreathingMiniGame, setShowBreathingMiniGame] = useState<boolean>(false);
  const [breathingTarget, setBreathingTarget] = useState<string>('Kiki');
  const [showJournal, setShowJournal] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showEnding, setShowEnding] = useState<boolean>(false);
  const [endingType, setEndingType] = useState<'perfect' | 'resilient'>('perfect');
  const [branchChoice, setBranchChoice] = useState<string>('empathy_first');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(() => window.innerWidth >= 768);
  const [questHint, setQuestHint] = useState<string>(
    'Pusaka Kompas Hati terjatuh di depanmu! Tekan [Spasi] atau tombol Kompas untuk menggunakannya.'
  );

  // Click on mini-map to auto-navigate
  const handleMiniMapNavigate = useCallback(
    (tileX: number, tileY: number) => {
      if (currentDialogue) return;
      const targetWorldX = tileX * TILE_SIZE + 16;
      const targetWorldY = tileY * TILE_SIZE + 16;
      targetPosRef.current = { x: targetWorldX, y: targetWorldY };
      rendererRef.current?.setDestination(targetWorldX, targetWorldY);
      sound.playMenuSelect();
    },
    [currentDialogue]
  );

  // Camera viewport
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle Container & Window Resize for crisp, centered canvas
  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasContainerRef.current;
      const w = container ? container.clientWidth : window.innerWidth;
      const h = container ? container.clientHeight : window.innerHeight;
      if (w > 0 && h > 0) {
        setViewportSize({ width: w, height: h });
        if (canvasRef.current) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    };

    updateDimensions();

    let ro: ResizeObserver | null = null;
    if (canvasContainerRef.current) {
      ro = new ResizeObserver(() => {
        updateDimensions();
      });
      ro.observe(canvasContainerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      ro?.disconnect();
    };
  }, []);

  // Initialize Canvas Renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current);
      // Start prologue dialogue automatically within 1 second so player is immediately hooked
      setTimeout(() => {
        setCurrentDialogue(GAME_DIALOGUES.intro_start);
        sound.playCompassChime();
      }, 500);
    }
  }, []);

  // Toggle Resonance Compass
  const handleToggleCompass = useCallback(() => {
    setIsCompassActive((prev) => {
      const next = !prev;
      if (next) {
        sound.playCompassChime();
        setStats((s) => ({ ...s, resonanceUses: s.resonanceUses + 1 }));
      }
      return next;
    });
  }, []);

  // Toggle Sound
  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Check collision against map tiles & bridge obstacle
  const checkCollision = useCallback(
    (x: number, y: number): boolean => {
      const pW = 20;
      const pH = 12;
      const feetX = x + 6;
      const feetY = y + 20;

      const corners = [
        { x: feetX, y: feetY },
        { x: feetX + pW, y: feetY },
        { x: feetX, y: feetY + pH },
        { x: feetX + pW, y: feetY + pH },
      ];

      for (const pt of corners) {
        const c = Math.floor(pt.x / TILE_SIZE);
        const r = Math.floor(pt.y / TILE_SIZE);

        if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return true;

        const tile = mapLayout[r][c];
        if (isTileSolid(tile)) {
          // Special exception: if the tile is a bridge and bridge zone is not unlocked, it is solid
          return true;
        }

        // Bridge gate check: if bridge not yet restored, prevent crossing beyond x = 20*TILE_SIZE
        if (!zoneStatus.bridge && c >= 21 && c <= 24 && r >= 14 && r <= 16) {
          return true;
        }
      }
      return false;
    },
    [mapLayout, zoneStatus.bridge]
  );

  // Main interaction trigger: Talk to nearest NPC or examine object
  const handleInteract = useCallback(() => {
    if (currentDialogue) return; // already in dialogue

    const p = playerRef.current;
    const px = p.x + 16;
    const py = p.y + 16;

    // Check Holy Tree secret interaction (north-west: c=4, r=4)
    const treeX = 4 * TILE_SIZE + 16;
    const treeY = 4 * TILE_SIZE + 16;
    const distToTree = Math.hypot(treeX - px, treeY - py);
    if (distToTree < 55) {
      sound.playSecretFound();
      setCurrentDialogue(GAME_DIALOGUES.secret_tree);
      return;
    }

    // Check nearest NPC
    let nearestNPC: NPC | null = null;
    let minDist = 65;

    for (const npc of npcs) {
      const nx = npc.x * TILE_SIZE + 16;
      const ny = npc.y * TILE_SIZE + 16;
      const dist = Math.hypot(nx - px, ny - py);
      if (dist < minDist) {
        minDist = dist;
        nearestNPC = npc;
      }
    }

    if (nearestNPC) {
      sound.playVoiceBlip();
      const dialogueKey = nearestNPC.currentDialogueId || `${nearestNPC.id}_intro`;
      const node = GAME_DIALOGUES[dialogueKey] || GAME_DIALOGUES[`${nearestNPC.id}_intro`];
      if (node) {
        setCurrentDialogue(node);
      }
    }
  }, [currentDialogue, npcs]);

  // Click / Tap on Floor or NPC to walk there automatically
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (currentDialogue) return; // In active dialogue, don't interrupt
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const worldX = screenX + cameraRef.current.x;
      const worldY = screenY + cameraRef.current.y;

      const p = playerRef.current;
      const px = p.x + 16;
      const py = p.y + 16;

      // 1. Check if clicking on the Ancient Holy Tree (c=4, r=4)
      const treeX = 4 * TILE_SIZE + 16;
      const treeY = 4 * TILE_SIZE + 16;
      if (Math.hypot(treeX - worldX, treeY - worldY) < 40) {
        if (Math.hypot(treeX - px, treeY - py) < 65) {
          // Close enough: interact immediately!
          sound.playSecretFound();
          setCurrentDialogue(GAME_DIALOGUES.secret_tree);
          targetPosRef.current = null;
          rendererRef.current?.clearDestination();
        } else {
          // Walk to tree
          targetPosRef.current = { x: treeX, y: treeY + 28, targetType: 'tree' };
          rendererRef.current?.setDestination(treeX, treeY + 28);
          rendererRef.current?.addSparkle(treeX, treeY + 28, '#fef08a', 6);
        }
        return;
      }

      // 2. Check if clicking on or near an NPC
      let clickedNPC: NPC | null = null;
      for (const npc of npcs) {
        const nx = npc.x * TILE_SIZE + 16;
        const ny = npc.y * TILE_SIZE + 16;
        if (Math.hypot(nx - worldX, ny - worldY) < 32) {
          clickedNPC = npc;
          break;
        }
      }

      if (clickedNPC) {
        const nx = clickedNPC.x * TILE_SIZE + 16;
        const ny = clickedNPC.y * TILE_SIZE + 16;
        const distToPlayer = Math.hypot(nx - px, ny - py);

        if (distToPlayer < 65) {
          // Close enough to talk immediately!
          sound.playVoiceBlip();
          const dialogueKey = clickedNPC.currentDialogueId || `${clickedNPC.id}_intro`;
          const node = GAME_DIALOGUES[dialogueKey] || GAME_DIALOGUES[`${clickedNPC.id}_intro`];
          if (node) setCurrentDialogue(node);
          targetPosRef.current = null;
          rendererRef.current?.clearDestination();
        } else {
          // Walk towards NPC, stopping at comfortable talking distance
          const angle = Math.atan2(py - ny, px - nx);
          const targetX = nx + Math.cos(angle) * 36;
          const targetY = ny + Math.sin(angle) * 36;

          targetPosRef.current = { x: targetX, y: targetY, targetNPC: clickedNPC };
          rendererRef.current?.setDestination(targetX, targetY);
          rendererRef.current?.addSparkle(targetX, targetY, '#67e8f9', 6);
        }
        return;
      }

      // 3. Floor Click -> Walk directly to clicked tile coordinates
      const clampedX = Math.max(16, Math.min(MAP_COLS * TILE_SIZE - 16, worldX));
      const clampedY = Math.max(16, Math.min(MAP_ROWS * TILE_SIZE - 16, worldY));

      targetPosRef.current = { x: clampedX, y: clampedY };
      rendererRef.current?.setDestination(clampedX, clampedY);
      rendererRef.current?.addSparkle(clampedX, clampedY, '#38bdf8', 5);
    },
    [currentDialogue, npcs]
  );

  // Dialogue choice selection
  const handleChoiceSelect = useCallback(
    (choice: ChoiceOption) => {
      sound.playVoiceBlip();

      // Update empathy points
      setStats((s) => ({
        ...s,
        empathyScore: Math.max(0, s.empathyScore + choice.impactScore),
      }));

      // Record branching tag
      if (choice.branchTag) {
        setBranchChoice(choice.branchTag);
      }

      // Check item rewards
      if (choice.givesItem) {
        addItemReward(choice.givesItem);
      }

      // Next dialogue node
      const nextNode = GAME_DIALOGUES[choice.resultDialogueId];
      if (nextNode) {
        processDialogueTriggers(nextNode);
        setCurrentDialogue(nextNode);
      } else {
        setCurrentDialogue(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Add Item to bag
  const addItemReward = (itemId: string) => {
    const itemMap: Record<string, Item> = {
      item_letter: {
        id: 'item_letter',
        name: 'Surat Permintaan Maaf',
        icon: '✉️',
        description: 'Surat Kiki yang diisi harapan agar warga saling memaafkan.',
        foundLocation: 'Alun-alun Desa',
      },
      item_secret_key: {
        id: 'item_secret_key',
        name: 'Kunci Kuno Gudang Arsip',
        icon: '🗝️',
        description: 'Pemberian Kakek Ranu atas validasi rasa kesepiannya.',
        foundLocation: 'Jembatan Kayu',
      },
      item_bridge_pass: {
        id: 'item_bridge_pass',
        name: 'Izin Jembatan Bersama',
        icon: '📜',
        description: 'Kesepakatan Kakek Ranu untuk mendukung Bimo belajar dari kesalahan.',
        foundLocation: 'Jembatan Kayu',
      },
      item_gold_gear: {
        id: 'item_gold_gear',
        name: 'Roda Gigi Emas Pusaka',
        icon: '⚙️',
        description: 'Roda penggerak Menara Jam desa yang diselamatkan Bimo.',
        foundLocation: 'Hutan Sunyi',
      },
      item_egg_badge: {
        id: 'item_egg_badge',
        name: 'Lencana Telur Ceria',
        icon: '🥚',
        description: 'Hadiah Profesor Kotek. Simbol humor sehat yang meredakan hormon stres!',
        foundLocation: 'Kandang Ayam Desa',
      },
      item_friendship_capsule: {
        id: 'item_friendship_capsule',
        name: 'Kapsul Waktu Tahun 1950',
        icon: '🏺',
        description: 'Pesan bijak dari pendiri desa tentang 3 kata ajaib pertemanan.',
        foundLocation: 'Pohon Sahabat Purba',
      },
    };

    const newItem = itemMap[itemId];
    if (newItem) {
      setInventory((prev) => {
        if (prev.some((i) => i.id === newItem.id)) return prev;
        sound.playSecretFound();
        return [...prev, newItem];
      });
    }
  };

  // Process triggers attached to dialogue nodes (restoring zones, breathing game)
  const processDialogueTriggers = useCallback((node: DialogueNode) => {
    // 1. Zone restoration
    if (node.triggerColorRestoreZone) {
      const zoneKey = node.triggerColorRestoreZone as keyof ZoneColorStatus;
      setZoneStatus((zs) => {
        if (zs[zoneKey]) return zs;
        sound.playColorRestore();
        rendererRef.current?.addSparkle(
          playerRef.current.x + 16,
          playerRef.current.y + 16,
          '#67e8f9',
          25
        );
        return { ...zs, [zoneKey]: true };
      });
    }

    // 2. Breathing mini-game
    if (node.triggerBreathing) {
      setBreathingTarget(node.speaker);
      setShowBreathingMiniGame(true);
    }

    // 3. Quest completion
    if (node.triggerQuestProgress) {
      setQuests((prev) =>
        prev.map((q) =>
          q.id === node.triggerQuestProgress ? { ...q, isCompleted: true } : q
        )
      );
    }

    // 3b. Item reward
    if (node.givesItem) {
      addItemReward(node.givesItem);
    }

    // 4. Climax ending trigger
    if (node.id === 'ending_summary_perfect' || node.id === 'ending_summary_resilient') {
      setEndingType(node.id === 'ending_summary_perfect' ? 'perfect' : 'resilient');
      setTimeout(() => {
        setShowEnding(true);
        sound.playSuccessFanfare();
      }, 2500);
    }
  }, []);

  // Advance dialogue when pressing Next or Spacebar
  const handleDialogueNext = useCallback(() => {
    if (!currentDialogue) return;

    if (currentDialogue.nextId && GAME_DIALOGUES[currentDialogue.nextId]) {
      const nextNode = GAME_DIALOGUES[currentDialogue.nextId];
      processDialogueTriggers(nextNode);
      setCurrentDialogue(nextNode);
    } else {
      setCurrentDialogue(null);
    }
  }, [currentDialogue, processDialogueTriggers]);

  // Handle directional virtual pad inputs
  const handleDirectionPress = (
    dir: 'up' | 'down' | 'left' | 'right',
    pressed: boolean
  ) => {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    };
    keysPressed.current[keyMap[dir]] = pressed;
    if (pressed && targetPosRef.current) {
      targetPosRef.current = null;
      rendererRef.current?.clearDestination();
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      keysPressed.current[e.code] = true;

      // Cancel floor click target if manual keys are pressed
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)
      ) {
        if (targetPosRef.current) {
          targetPosRef.current = null;
          rendererRef.current?.clearDestination();
        }
      }

      // Toggle Compass
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleCompass();
      }

      // Interact / Talk
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (!currentDialogue) {
          handleInteract();
        }
      }

      // Open Journal
      if (e.key === 'j' || e.key === 'J') {
        setShowJournal((prev) => !prev);
      }

      // Toggle Mini-Map
      if (e.key === 'm' || e.key === 'M') {
        setShowMiniMap((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentDialogue, handleInteract, handleToggleCompass]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      const p = playerRef.current;
      const speed = 2.8;

      let dx = 0;
      let dy = 0;

      if (
        keysPressed.current['ArrowUp'] ||
        keysPressed.current['KeyW'] ||
        keysPressed.current['w'] ||
        keysPressed.current['W']
      ) {
        dy -= speed;
        p.facing = 'up';
      }
      if (
        keysPressed.current['ArrowDown'] ||
        keysPressed.current['KeyS'] ||
        keysPressed.current['s'] ||
        keysPressed.current['S']
      ) {
        dy += speed;
        p.facing = 'down';
      }
      if (
        keysPressed.current['ArrowLeft'] ||
        keysPressed.current['KeyA'] ||
        keysPressed.current['a'] ||
        keysPressed.current['A']
      ) {
        dx -= speed;
        p.facing = 'left';
      }
      if (
        keysPressed.current['ArrowRight'] ||
        keysPressed.current['KeyD'] ||
        keysPressed.current['d'] ||
        keysPressed.current['D']
      ) {
        dx += speed;
        p.facing = 'right';
      }

      // Normalize diagonal movement speed
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Movement & collision resolution
      const isManualMoving = dx !== 0 || dy !== 0;

      if (isManualMoving) {
        // Manual input cancels any active floor click target
        if (targetPosRef.current) {
          targetPosRef.current = null;
          rendererRef.current?.clearDestination();
        }

        p.isMoving = true;
        if (Math.random() < 0.08) {
          sound.playStep();
        }

        // Horizontal movement
        if (dx !== 0 && !checkCollision(p.x + dx, p.y)) {
          p.x += dx;
        }
        // Vertical movement
        if (dy !== 0 && !checkCollision(p.x, p.y + dy)) {
          p.y += dy;
        }
      } else if (targetPosRef.current) {
        // Point-and-click / tap-to-move pathing
        const target = targetPosRef.current;
        const pCenterX = p.x + 16;
        const pCenterY = p.y + 16;
        const distX = target.x - pCenterX;
        const distY = target.y - pCenterY;
        const dist = Math.hypot(distX, distY);

        if (dist <= 4) {
          // Destination reached!
          const reachedTarget = target;
          targetPosRef.current = null;
          rendererRef.current?.clearDestination();
          p.isMoving = false;

          // If walking towards an NPC or secret, initiate interaction
          if (reachedTarget.targetNPC) {
            sound.playVoiceBlip();
            const dialogueKey =
              reachedTarget.targetNPC.currentDialogueId ||
              `${reachedTarget.targetNPC.id}_intro`;
            const node =
              GAME_DIALOGUES[dialogueKey] ||
              GAME_DIALOGUES[`${reachedTarget.targetNPC.id}_intro`];
            if (node) setCurrentDialogue(node);
          } else if (reachedTarget.targetType === 'tree') {
            sound.playSecretFound();
            setCurrentDialogue(GAME_DIALOGUES.secret_tree);
          }
        } else {
          const moveStep = Math.min(speed, dist);
          const angle = Math.atan2(distY, distX);
          const stepX = Math.cos(angle) * moveStep;
          const stepY = Math.sin(angle) * moveStep;

          // Update facing direction based on primary movement axis
          if (Math.abs(distX) > Math.abs(distY)) {
            p.facing = distX > 0 ? 'right' : 'left';
          } else {
            p.facing = distY > 0 ? 'down' : 'up';
          }

          let moved = false;
          // 1. Try moving directly along angle
          if (!checkCollision(p.x + stepX, p.y + stepY)) {
            p.x += stepX;
            p.y += stepY;
            moved = true;
          } else {
            // 2. Try sliding horizontally
            if (Math.abs(stepX) > 0.1 && !checkCollision(p.x + stepX, p.y)) {
              p.x += stepX;
              moved = true;
            }
            // 3. Try sliding vertically
            if (Math.abs(stepY) > 0.1 && !checkCollision(p.x, p.y + stepY)) {
              p.y += stepY;
              moved = true;
            }
          }

          if (moved) {
            p.isMoving = true;
            if (Math.random() < 0.08) {
              sound.playStep();
            }
          } else {
            // Blocked by obstacle (e.g. wall/unopened bridge), stop moving
            targetPosRef.current = null;
            rendererRef.current?.clearDestination();
            p.isMoving = false;
          }
        }
      } else {
        p.isMoving = false;
      }

      // Camera positioning (centers on player with clamping, or centers map if viewport is larger)
      const mapTotalW = MAP_COLS * TILE_SIZE;
      const mapTotalH = MAP_ROWS * TILE_SIZE;

      let camX: number;
      if (viewportSize.width >= mapTotalW) {
        camX = -(viewportSize.width - mapTotalW) / 2;
      } else {
        camX = Math.max(
          0,
          Math.min(
            p.x - viewportSize.width / 2 + 16,
            mapTotalW - viewportSize.width
          )
        );
      }

      let camY: number;
      if (viewportSize.height >= mapTotalH) {
        camY = -(viewportSize.height - mapTotalH) / 2;
      } else {
        camY = Math.max(
          0,
          Math.min(
            p.y - viewportSize.height / 2 + 16,
            mapTotalH - viewportSize.height
          )
        );
      }

      // Keep cameraRef synchronized for click-to-world conversion
      cameraRef.current = { x: camX, y: camY };

      // Render Frame
      if (rendererRef.current) {
        rendererRef.current.render(
          mapLayout,
          p,
          npcs,
          zoneStatus,
          isCompassActive,
          camX,
          camY,
          viewportSize.width,
          viewportSize.height
        );
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mapLayout, npcs, zoneStatus, isCompassActive, viewportSize, checkCollision]);

  // Restart game for replayability
  const handleRestart = () => {
    setZoneStatus({
      plaza: false,
      bridge: false,
      forest: false,
      tower: false,
    });
    setInventory([]);
    setQuests(INITIAL_QUESTS);
    setStats({
      empathyScore: 20,
      resonanceUses: 0,
      calmTechniquesMastered: 0,
      secretsFound: 0,
      unlockedBadges: [],
    });
    playerRef.current.x = 11 * TILE_SIZE;
    playerRef.current.y = 15 * TILE_SIZE;
    targetPosRef.current = null;
    rendererRef.current?.clearDestination();
    setNpcs(INITIAL_NPCS);
    setShowEnding(false);
    setCurrentDialogue(GAME_DIALOGUES.intro_start);
  };

  // Dynamic quest hint banner
  useEffect(() => {
    if (!zoneStatus.plaza) {
      setQuestHint('Misi 1: Dekati Kiki si tupai di barat air mancur. Gunakan [Spasi] Kompas Hati.');
    } else if (!zoneStatus.bridge) {
      setQuestHint('Misi 2: Pergi ke timur menuju Jembatan Kayu. Bicara dengan Kakek Ranu.');
    } else if (!zoneStatus.forest) {
      setQuestHint('Misi 3: Cari Bimo di Hutan Sunyi (barat laut). Bantu ia mengatasi rasa malu.');
    } else if (!zoneStatus.tower) {
      setQuestHint('Misi 4: Bawa Roda Gigi Emas ke Menara Jam di timur laut!');
    } else {
      setQuestHint('Harmoni Lembah Pulih Sepenuhnya! Bicaralah pada warga untuk merayakan!');
    }
  }, [zoneStatus]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans flex items-center justify-center">
      {/* 2D Pixel Canvas Viewport Container - Centered on Desktop with Arcade/Handheld Frame */}
      <main className="relative w-full h-full flex items-center justify-center p-0 md:p-3 lg:p-5 select-none overflow-hidden">
        <div
          ref={canvasContainerRef}
          className="relative w-full h-full md:max-w-5xl lg:max-w-6xl md:max-h-[85vh] lg:max-h-[88vh] md:rounded-2xl md:border-2 md:border-slate-800 md:shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-slate-900 overflow-hidden flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            id="main-pixel-canvas"
            className="block w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
            title="Klik di lantai untuk berjalan atau mendekati karakter"
          />
        </div>
      </main>

      {/* Dynamic Quest Tracker Banner - Dedicated Tier 2 (Below Header, No More Stacking on Mobile/Tablet) */}
      <div className="fixed top-13 sm:top-15 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-[94%] max-w-lg">
        <div className="bg-slate-950/95 border border-amber-500/60 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-2xl backdrop-blur-md flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 rounded px-1.5 py-0.5 text-amber-300 font-pixel text-[8px] sm:text-[9px] shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>MISI</span>
          </div>
          <p className="text-amber-100 text-[11px] sm:text-xs font-medium leading-snug line-clamp-2 sm:line-clamp-none flex-1 text-left sm:text-center">
            {questHint}
          </p>
        </div>
      </div>

      {/* Virtual Controls for Mobile & Desktop Toolbar */}
      <VirtualControls
        onDirectionPress={handleDirectionPress}
        onActionPress={handleInteract}
        onCompassToggle={handleToggleCompass}
        isCompassActive={isCompassActive}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenJournal={() => setShowJournal(true)}
        onOpenHelp={() => setShowHelp(true)}
        onExportOffline={downloadOfflineGameHtml}
        isDialogueOpen={!!currentDialogue}
        onToggleMiniMap={() => setShowMiniMap((prev) => !prev)}
        isMiniMapOpen={showMiniMap}
      />

      {/* Toggleable Mini-Map Overlay in the Corner */}
      <MiniMap
        isOpen={showMiniMap}
        onToggle={() => setShowMiniMap((prev) => !prev)}
        playerRef={playerRef}
        npcs={npcs}
        zoneStatus={zoneStatus}
        mapLayout={mapLayout}
        onNavigateToTile={handleMiniMapNavigate}
      />

      {/* Dialogue System Box */}
      {currentDialogue && (
        <DialogueBox
          dialogue={currentDialogue}
          onChoiceSelect={handleChoiceSelect}
          onNext={handleDialogueNext}
          isCompassActive={isCompassActive}
        />
      )}

      {/* Breathing 4-4-4 Self-Regulation Mini-Game */}
      {showBreathingMiniGame && (
        <BreathingMiniGame
          targetName={breathingTarget}
          onComplete={() => {
            setShowBreathingMiniGame(false);
            setStats((s) => ({
              ...s,
              calmTechniquesMastered: s.calmTechniquesMastered + 1,
              empathyScore: s.empathyScore + 25,
            }));
            const afterBreathe = GAME_DIALOGUES.kiki_after_breathe;
            if (afterBreathe) {
              processDialogueTriggers(afterBreathe);
              setCurrentDialogue(afterBreathe);
            }
          }}
        />
      )}

      {/* Compass Journal & PSE Dictionary Modal */}
      <CompassJournalModal
        isOpen={showJournal}
        onClose={() => setShowJournal(false)}
        items={inventory}
        zoneStatus={zoneStatus}
        stats={stats}
      />

      {/* Help & PSE Science Guidelines Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onExportOffline={downloadOfflineGameHtml}
      />

      {/* Ending Celebration & Certificate Modal */}
      <EndingModal
        isOpen={showEnding}
        onRestart={handleRestart}
        stats={stats}
        branchTag={branchChoice}
        endingType={endingType}
      />
    </div>
  );
}
