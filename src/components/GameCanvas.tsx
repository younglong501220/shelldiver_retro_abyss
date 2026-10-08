import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  PlayerStats,
  CargoItem,
  JellyfishEntity,
  RockEntity,
  DropItemEntity,
  FloatingText,
  Particle,
  Bubble,
  GameSettings,
  TalentNode,
} from '../types/game';
import { BIOMES, JELLY_TIERS, ROCK_TIERS, WORLD_WIDTH, WORLD_DEPTH } from '../constants/biomes';
import { audioSys } from '../audio/soundEngine';
import { Anchor, HelpCircle, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

export interface DepthMarker {
  depth: number;
  label: string;
  color: string;
  border: string;
}

interface HudState {
  depth: number;
  o2: number;
  maxO2: number;
  nearSurface: boolean;
}

export const DEPTH_MARKERS: DepthMarker[] = [
  { depth: 500, label: '500m · 黃昏沉船帶 (Twilight Wreckage)', color: '#00f5ff', border: 'rgba(0, 245, 255, 0.45)' },
  { depth: 1000, label: '1,000m · 午夜海溝 (Midnight Trench)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.45)' },
  { depth: 1500, label: '1,500m · 高壓無光海溝 (Abyssal Twilight)', color: '#c084fc', border: 'rgba(192, 132, 252, 0.45)' },
  { depth: 2000, label: '2,000m · 雙千米深核領域 (Midnight Abyss)', color: '#e879f9', border: 'rgba(232, 121, 249, 0.45)' },
  { depth: 2500, label: '2,500m · 超深淵星核 (Abyssal Star-Core)', color: '#facc15', border: 'rgba(250, 204, 21, 0.45)' },
  { depth: 3000, label: '3,000m · 深淵星核極限 (Hadal Core Deep)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.45)' },
  { depth: 3500, label: '3,500m · 無底幽界奇點 (Singularity Floor)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.45)' },
];

interface GameCanvasProps {
  pearls: number;
  crystals: number;
  cargoItems: CargoItem[];
  playerStats: PlayerStats;
  talents: TalentNode[];
  settings: GameSettings;
  mode: 'DIVE' | 'BASE';
  onEnterBase: () => void;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  onAddCargo: (item: CargoItem) => boolean;
  onAddCurrency: (pearlsDelta: number, crystalsDelta: number) => void;
  onOpenHelp: () => void;
  onToggleSound: () => void;
  onRecordMaxDepth: (depth: number) => void;
  onEmergencyRescue: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  pearls,
  crystals,
  cargoItems,
  playerStats,
  talents,
  settings,
  mode,
  onEnterBase,
  onUpdateStats,
  onAddCargo,
  onAddCurrency,
  onOpenHelp,
  onToggleSound,
  onRecordMaxDepth,
  onEmergencyRescue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable Game Entities and Physics State (held in ref for high performance 60fps loop)
  const gameStateRef = useRef({
    p: { ...playerStats },
    jellies: [] as JellyfishEntity[],
    rocks: [] as RockEntity[],
    drops: [] as DropItemEntity[],
    particles: [] as Particle[],
    bubbles: [] as Bubble[],
    floatingTexts: [] as FloatingText[],
    camera: { x: 0, y: 0 },
    mouse: { x: 0, y: 0, isDown: false, worldX: 0, worldY: 0 },
    keys: {} as Record<string, boolean>,
    animFrameId: 0,
    swimCycle: 0,
    shakeIntensity: 0,
    nextId: 1,
    lastTime: performance.now(),
  });

  // Real-time HUD React state (driven at 10Hz by animation loop for smooth UI updates)
  const lastHudUpdateRef = useRef(0);
  const [liveHud, setLiveHud] = useState<HudState>({
    depth: 0,
    o2: playerStats.maxO2,
    maxO2: playerStats.maxO2,
    nearSurface: true,
  });

  // Keep player stats synchronized when talents upgrade
  useEffect(() => {
    gameStateRef.current.p.maxO2 = playerStats.maxO2;
    gameStateRef.current.p.speed = playerStats.speed;
    gameStateRef.current.p.cargoMax = playerStats.cargoMax;
    gameStateRef.current.p.laserDmg = playerStats.laserDmg;
    gameStateRef.current.p.laserDist = playerStats.laserDist;
    gameStateRef.current.p.magnetDist = playerStats.magnetDist;
    gameStateRef.current.p.hasDrone = playerStats.hasDrone;
    gameStateRef.current.p.dualLaser = playerStats.dualLaser;
    gameStateRef.current.p.hasDepthRadar = playerStats.hasDepthRadar;
    gameStateRef.current.p.hasEmergencyBoost = playerStats.hasEmergencyBoost;
    setLiveHud((prev) => ({
      ...prev,
      maxO2: playerStats.maxO2,
      o2: Math.min(prev.o2, playerStats.maxO2),
    }));
  }, [playerStats]);

  // Spawn world entities
  const populateWorld = useCallback(() => {
    const s = gameStateRef.current;
    s.jellies = [];
    s.rocks = [];
    s.drops = [];
    s.bubbles = [];

    // Ambient Bubbles
    for (let i = 0; i < 75; i++) {
      s.bubbles.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_DEPTH,
        r: 1 + Math.random() * 3.5,
        speed: 0.5 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    // Jellies distributed across depths
    for (let i = 0; i < 110; i++) {
      const y = 100 + Math.random() * (WORLD_DEPTH - 220);
      const tierIndex = Math.min(3, Math.floor(y / 900));
      const config = JELLY_TIERS[tierIndex];

      s.jellies.push({
        id: s.nextId++,
        x: 60 + Math.random() * (WORLD_WIDTH - 120),
        y,
        seed: Math.random() * 1000,
        tier: tierIndex,
        name: config.name,
        color: config.color,
        glowColor: config.glowColor,
        val: config.val,
        size: config.size + Math.random() * 4,
        pulse: Math.random() * Math.PI * 2,
        hp: 1,
      });
    }

    // Mineral rocks and shipwreck fragments
    for (let i = 0; i < 130; i++) {
      const y = 140 + Math.random() * (WORLD_DEPTH - 240);
      const tierIndex = Math.min(3, Math.floor(y / 950));
      const config = ROCK_TIERS[tierIndex];

      // Custom pseudo random shape offsets for jagged rocks
      const shapeOffsets = Array.from({ length: 8 }, () => (Math.random() - 0.5) * 8);

      s.rocks.push({
        id: s.nextId++,
        x: 60 + Math.random() * (WORLD_WIDTH - 120),
        y,
        tier: tierIndex,
        name: config.name,
        maxHp: config.hp,
        hp: config.hp,
        color: config.col,
        accentColor: config.accent,
        cry: config.cry,
        val: config.val,
        w: 36 + Math.random() * 20,
        h: 30 + Math.random() * 18,
        shapeOffsets,
      });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    populateWorld();
  }, [populateWorld]);

  // When switching to DIVE mode from BASE, restore full O2 and place turtle near surface
  useEffect(() => {
    if (mode === 'DIVE') {
      const s = gameStateRef.current;
      s.p.o2 = s.p.maxO2;
      s.p.y = 55;
      s.p.vy = 0.5;
      s.p.vx = 0;
      audioSys.playSplash();
      setLiveHud({
        depth: 15,
        o2: s.p.maxO2,
        maxO2: s.p.maxO2,
        nearSurface: true,
      });
    }
  }, [mode]);

  // Add floating text
  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    gameStateRef.current.floatingTexts.push({
      id: gameStateRef.current.nextId++,
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  };

  // Keyboard and Mouse Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      audioSys.init();
      gameStateRef.current.keys[e.key.toLowerCase()] = true;
      gameStateRef.current.keys[e.code] = true;

      // Surface Dock shortcut
      if ((e.code === 'KeyE' || e.key.toLowerCase() === 'e') && mode === 'DIVE') {
        if (gameStateRef.current.p.y <= 90) {
          audioSys.playDock();
          onEnterBase();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
      gameStateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, onEnterBase]);

  // Canvas Mouse Listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    audioSys.init();
    if (e.button === 0) {
      gameStateRef.current.mouse.isDown = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      gameStateRef.current.mouse.isDown = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    gameStateRef.current.mouse.x = (e.clientX - rect.left) * scaleX;
    gameStateRef.current.mouse.y = (e.clientY - rect.top) * scaleY;
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let active = true;

    const gameLoop = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        gameStateRef.current.animFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = gameStateRef.current;
      const p = state.p;

      // Only update simulation if in DIVE mode
      if (mode === 'DIVE') {
        // 1. Water Swimming Controls with Momentum
        let ax = 0;
        let ay = 0;
        const k = state.keys;

        if (k['w'] || k['arrowup'] || k['KeyW']) ay -= 1;
        if (k['s'] || k['arrowdown'] || k['KeyS']) ay += 1;
        if (k['a'] || k['arrowleft'] || k['KeyA']) ax -= 1;
        if (k['d'] || k['arrowright'] || k['KeyD']) ax += 1;

        if (ax !== 0 && ay !== 0) {
          ax *= 0.7071;
          ay *= 0.7071;
        }

        // Emergency boost if low O2
        const isLowO2 = p.o2 / p.maxO2 <= 0.2;
        let speedMultiplier = 1;
        if (isLowO2 && p.hasEmergencyBoost) {
          speedMultiplier = 1.45;
        }

        const moveForce = p.speed * 0.18 * speedMultiplier;
        p.vx += ax * moveForce;
        p.vy += ay * moveForce;

        // Water resistance damping
        p.vx *= 0.915;
        p.vy *= 0.915;

        // Swim cycle animation for flippers
        if (Math.hypot(p.vx, p.vy) > 0.2) {
          state.swimCycle += 0.18;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Boundaries
        const margin = 26;
        if (p.x < margin) {
          p.x = margin;
          p.vx = 0;
        }
        if (p.x > WORLD_WIDTH - margin) {
          p.x = WORLD_WIDTH - margin;
          p.vx = 0;
        }
        if (p.y < 22) {
          p.y = 22;
          p.vy = 0;
        }
        if (p.y > WORLD_DEPTH) {
          p.y = WORLD_DEPTH;
          p.vy = 0;
        }

        // Rotate towards mouse cursor
        state.mouse.worldX = state.mouse.x + state.camera.x;
        state.mouse.worldY = state.mouse.y + state.camera.y;
        const targetAngle = Math.atan2(state.mouse.worldY - p.y, state.mouse.worldX - p.x);
        // Smooth rotation interpolation
        let angleDiff = targetAngle - p.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        p.angle += angleDiff * 0.2;

        // 2. Oxygen & Depth Calculations
        const currentDepth = Math.max(0, Math.floor(p.y - 40));
        onRecordMaxDepth(currentDepth);

        const pressureLvl = talents.find((t) => t.id === 'pressure_hull')?.lvl ?? 0;
        const pressureResistance = Math.max(0.25, 1 - pressureLvl * 0.25);
        const depthPenalty = 1 + (currentDepth / 1000) * pressureResistance;
        p.o2 -= (1 / 60) * depthPenalty;

        // Oxygen Warning Alarm
        if (p.o2 / p.maxO2 <= 0.25) {
          audioSys.playLowO2Warning();
          if (settings.screenShake) {
            state.shakeIntensity = Math.max(state.shakeIntensity, 3);
          }
        }

        // Oxygen Depletion: Emergency rescue!
        if (p.o2 <= 0) {
          p.o2 = 0;
          if (settings.screenShake) {
            state.shakeIntensity = 12;
          }
          onEmergencyRescue();
          onEnterBase();
          return;
        }

        // 3. Mining Laser Beam
        if (state.mouse.isDown) {
          audioSys.playLaser();

          const fireLaser = (angleOffset: number) => {
            const beamAngle = p.angle + angleOffset;
            state.rocks.forEach((rock) => {
              const dist = Math.hypot(rock.x - p.x, rock.y - p.y);
              if (dist < p.laserDist) {
                const angleToRock = Math.atan2(rock.y - p.y, rock.x - p.x);
                let diff = Math.abs(beamAngle - angleToRock);
                if (diff > Math.PI) diff = 2 * Math.PI - diff;

                if (diff < 0.24) {
                  // Hit rock!
                  const dmg = p.laserDmg / 60;
                  rock.hp -= dmg;

                  // Screen micro-rumble on laser hit
                  if (settings.screenShake && Math.random() < 0.25) {
                    state.shakeIntensity = Math.max(state.shakeIntensity, 1.2);
                  }

                  // Sparks
                  if (Math.random() < 0.6) {
                    state.particles.push({
                      x: rock.x + (Math.random() - 0.5) * rock.w * 0.6,
                      y: rock.y + (Math.random() - 0.5) * rock.h * 0.6,
                      vx: (Math.random() - 0.5) * 4,
                      vy: (Math.random() - 0.5) * 4,
                      life: 14,
                      maxLife: 14,
                      color: Math.random() < 0.5 ? '#ff1744' : '#ffea00',
                      size: 2.5,
                    });
                  }
                }
              }
            });
          };

          fireLaser(0);
          if (p.dualLaser) {
            fireLaser(-0.1);
            fireLaser(0.1);
          }
        }

        // 4. Drone Mining Support
        if (p.hasDrone) {
          p.dronePos.x += (p.x - 38 - p.dronePos.x) * 0.06;
          p.dronePos.y += (p.y - 28 - p.dronePos.y) * 0.06;

          // Target nearest rock within 190px
          const targetRock = state.rocks.find(
            (r) => Math.hypot(r.x - p.dronePos.x, r.y - p.dronePos.y) < 190
          );
          if (targetRock) {
            targetRock.hp -= 26 / 60;
            if (Math.random() < 0.25) {
              state.particles.push({
                x: targetRock.x + (Math.random() - 0.5) * 10,
                y: targetRock.y + (Math.random() - 0.5) * 10,
                vx: 0,
                vy: -1.5,
                life: 10,
                maxLife: 10,
                color: '#00f0ff',
                size: 2,
              });
            }
          }
        }

        // 5. Rock Destruction & Loot Generation
        for (let i = state.rocks.length - 1; i >= 0; i--) {
          const r = state.rocks[i];
          if (r.hp <= 0) {
            audioSys.playMineBreak();
            if (settings.screenShake) {
              const tierShakes = [7, 10, 14, 18];
              state.shakeIntensity = Math.max(state.shakeIntensity, tierShakes[r.tier] || 7);
            }

            const disintegrateLvl = talents.find((t) => t.id === 'disintegrate')?.lvl ?? 0;
            const extraCrystalChance = disintegrateLvl * 0.35;

            // Spawn pearls drop
            state.drops.push({
              id: state.nextId++,
              x: r.x,
              y: r.y,
              type: 'val',
              val: r.val,
              cry: 0,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2.5,
              color: '#ffd700',
              pulse: 0,
            });

            // Crystals drop
            if (r.cry > 0 || Math.random() < extraCrystalChance) {
              state.drops.push({
                id: state.nextId++,
                x: r.x + 8,
                y: r.y - 8,
                type: 'crystal',
                val: 0,
                cry: r.cry > 0 ? r.cry : 1,
                vx: (Math.random() - 0.5) * 2.5,
                vy: -Math.random() * 3,
                color: '#e056fd',
                pulse: 0,
              });
            }

            addFloatingText(r.x, r.y - 12, `拆解成功!`, '#4ef2bb');

            state.rocks.splice(i, 1);

            // Respawn rock after 12s
            setTimeout(() => {
              if (!active) return;
              const y = 140 + Math.random() * (WORLD_DEPTH - 240);
              const tier = Math.min(3, Math.floor(y / 950));
              const cfg = ROCK_TIERS[tier];
              gameStateRef.current.rocks.push({
                id: gameStateRef.current.nextId++,
                x: 60 + Math.random() * (WORLD_WIDTH - 120),
                y,
                tier,
                name: cfg.name,
                maxHp: cfg.hp,
                hp: cfg.hp,
                color: cfg.col,
                accentColor: cfg.accent,
                cry: cfg.cry,
                val: cfg.val,
                w: 36 + Math.random() * 20,
                h: 30 + Math.random() * 18,
                shapeOffsets: Array.from({ length: 8 }, () => (Math.random() - 0.5) * 8),
              });
            }, 12000);
          }
        }

        // 6. Jellyfish Catching
        for (let i = state.jellies.length - 1; i >= 0; i--) {
          const j = state.jellies[i];
          j.pulse += 0.05;
          j.y += Math.sin(j.pulse + j.seed) * 0.65 - 0.15;
          j.x += Math.cos(j.pulse * 0.4 + j.seed) * 0.4;

          const dist = Math.hypot(j.x - p.x, j.y - p.y);
          if (dist < 30) {
            // Check inventory capacity
            if (cargoItems.length < p.cargoMax) {
              const alchemyLvl = talents.find((t) => t.id === 'pearl_alchemy')?.lvl ?? 0;
              const sellValue = Math.floor(j.val * (1 + alchemyLvl * 0.35));

              const item: CargoItem = {
                id: `jelly-${Date.now()}-${Math.random()}`,
                name: j.name,
                type: 'jelly',
                val: sellValue,
                cry: 0,
                color: j.color,
                tier: j.tier,
              };

              const added = onAddCargo(item);
              if (added) {
                audioSys.playCollect();
                addFloatingText(j.x, j.y - 10, `+${j.name} (${sellValue}💰)`, j.color);
                state.jellies.splice(i, 1);

                // Respawn jelly
                setTimeout(() => {
                  if (!active) return;
                  const newY = 100 + Math.random() * (WORLD_DEPTH - 220);
                  const tIdx = Math.min(3, Math.floor(newY / 900));
                  const cfg = JELLY_TIERS[tIdx];
                  gameStateRef.current.jellies.push({
                    id: gameStateRef.current.nextId++,
                    x: 60 + Math.random() * (WORLD_WIDTH - 120),
                    y: newY,
                    seed: Math.random() * 1000,
                    tier: tIdx,
                    name: cfg.name,
                    color: cfg.color,
                    glowColor: cfg.glowColor,
                    val: cfg.val,
                    size: cfg.size + Math.random() * 4,
                    pulse: Math.random() * Math.PI * 2,
                    hp: 1,
                  });
                }, 8000);
              }
            } else {
              // Inventory full notification
              addFloatingText(p.x, p.y - 30, '⚠️ 背包已滿！', '#ff3366');
            }
          }
        }

        // 7. Drop Items & Magnet Pull
        for (let i = state.drops.length - 1; i >= 0; i--) {
          const d = state.drops[i];
          d.pulse += 0.1;
          d.x += d.vx;
          d.y += d.vy;
          d.vx *= 0.94;
          d.vy += 0.035; // Slight sinking
          d.vy *= 0.95;

          // Magnet Attraction
          if (p.magnetDist > 0) {
            const mDist = Math.hypot(d.x - p.x, d.y - p.y);
            if (mDist < p.magnetDist) {
              const pullForce = 0.09 * (1 - mDist / p.magnetDist);
              d.vx += (p.x - d.x) * pullForce;
              d.vy += (p.y - d.y) * pullForce;
            }
          }

          // Pickup collision
          const pickupDist = Math.hypot(d.x - p.x, d.y - p.y);
          if (pickupDist < 28) {
            if (d.type === 'crystal') {
              audioSys.playCrystal();
              onAddCurrency(0, d.cry);
              addFloatingText(d.x, d.y - 12, `+${d.cry} 💠 星石!`, '#e056fd');
              state.drops.splice(i, 1);
            } else {
              // Pearls mineral item
              if (cargoItems.length < p.cargoMax) {
                audioSys.playCollect();
                const item: CargoItem = {
                  id: `ore-${Date.now()}-${Math.random()}`,
                  name: '稀有礦料',
                  type: 'ore',
                  val: d.val,
                  cry: 0,
                  color: '#ffd700',
                  tier: 1,
                };
                onAddCargo(item);
                addFloatingText(d.x, d.y - 12, `+礦料 (${d.val}💰)`, '#ffd700');
                state.drops.splice(i, 1);
              } else {
                addFloatingText(p.x, p.y - 30, '⚠️ 背包已滿！', '#ff3366');
              }
            }
          }
        }

        // 8. Bubbles & Floating Particles
        state.bubbles.forEach((b) => {
          b.y -= b.speed;
          b.wobble += 0.05;
          b.x += Math.sin(b.wobble) * 0.3;
          if (b.y < 0) {
            b.y = WORLD_DEPTH;
            b.x = Math.random() * WORLD_WIDTH;
          }
        });

        for (let i = state.particles.length - 1; i >= 0; i--) {
          const pt = state.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life--;
          if (pt.life <= 0) state.particles.splice(i, 1);
        }

        for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
          const ft = state.floatingTexts[i];
          ft.y += ft.vy;
          ft.alpha -= 0.02;
          if (ft.alpha <= 0) state.floatingTexts.splice(i, 1);
        }

        // Camera smoothly follows player
        const targetCamX = p.x - canvas.width / 2;
        const targetCamY = p.y - canvas.height / 2;
        state.camera.x += (Math.max(0, Math.min(WORLD_WIDTH - canvas.width, targetCamX)) - state.camera.x) * 0.12;
        state.camera.y += (Math.max(0, Math.min(WORLD_DEPTH - canvas.height, targetCamY)) - state.camera.y) * 0.12;

        if (state.shakeIntensity > 0) {
          state.shakeIntensity *= 0.85;
          if (state.shakeIntensity < 0.2) state.shakeIntensity = 0;
        }

        // Real-time HUD State Sync (throttled to ~10 FPS for ultra-smooth UI without lag)
        const now = performance.now();
        if (now - lastHudUpdateRef.current > 100) {
          lastHudUpdateRef.current = now;
          setLiveHud({
            depth: currentDepth,
            o2: Math.max(0, p.o2),
            maxO2: p.maxO2,
            nearSurface: p.y <= 90,
          });
        }

        // Inform parent of real-time O2 state
        onUpdateStats({ o2: p.o2 });
      }

      // ==================== RENDERING ====================
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Screen Shake (only if settings.screenShake is enabled)
      if (settings.screenShake && state.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * state.shakeIntensity * 2;
        const sy = (Math.random() - 0.5) * state.shakeIntensity * 2;
        ctx.translate(sx, sy);
      }

      // Dynamic Depth Atmosphere Gradient
      const depthRatio = Math.min(1, Math.max(0, (state.camera.y + canvas.height / 2) / WORLD_DEPTH));
      const r = Math.floor(14 * (1 - depthRatio));
      const g = Math.floor(55 * (1 - depthRatio) + 4);
      const b = Math.floor(95 * (1 - depthRatio) + 12);

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
      grad.addColorStop(1, `rgb(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.3)}, ${Math.floor(b * 0.4)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Light Caustics / Surface rays
      if (state.camera.y < 500) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.18 * (1 - state.camera.y / 500));
        ctx.fillStyle = '#64ffda';
        for (let i = 0; i < 6; i++) {
          const rayX = ((Date.now() * 0.03 + i * 180) % (canvas.width + 200)) - 100;
          ctx.beginPath();
          ctx.moveTo(rayX, 0);
          ctx.lineTo(rayX + 60, canvas.height);
          ctx.lineTo(rayX + 110, canvas.height);
          ctx.lineTo(rayX + 40, 0);
          ctx.fill();
        }
        ctx.restore();
      }

      // World Translation
      ctx.translate(-state.camera.x, -state.camera.y);

      // 1. Draw Surface Base Dock Station
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, WORLD_WIDTH, 44);
      // Caution stripes
      ctx.fillStyle = '#f39c12';
      for (let x = 0; x < WORLD_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 38);
        ctx.lineTo(x + 18, 38);
        ctx.lineTo(x + 28, 44);
        ctx.lineTo(x + 10, 44);
        ctx.fill();
      }

      // Dock platform neon text
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('🚢 [母艦港口 DOCK STATION] 靠近海面按 [E] 鍵靠港整備與販售', state.camera.x + 28, 28);

      // 2. Draw Bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      state.bubbles.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2.5 Dynamic Depth Markers (Every 500 Meters)
      DEPTH_MARKERS.forEach((marker) => {
        const worldY = marker.depth + 40;
        // Viewport culling for performance
        if (worldY < state.camera.y - 50 || worldY > state.camera.y + canvas.height + 50) return;

        ctx.save();
        // Dashed horizontal boundary line across entire map
        ctx.setLineDash([12, 10]);
        ctx.strokeStyle = marker.color;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = marker.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, worldY);
        ctx.lineTo(WORLD_WIDTH, worldY);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Depth tick marks along the line inside the visible camera span
        const startX = Math.max(0, Math.floor(state.camera.x / 40) * 40);
        const endX = Math.min(WORLD_WIDTH, state.camera.x + canvas.width + 40);
        ctx.strokeStyle = marker.border;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (let tx = startX; tx <= endX; tx += 40) {
          ctx.moveTo(tx, worldY - 5);
          ctx.lineTo(tx, worldY + 5);
        }
        ctx.stroke();

        // Responsive glowing depth badge centered on player inside viewport
        const badgeWidth = 290;
        const badgeHeight = 26;
        const minBadgeX = state.camera.x + 20 + badgeWidth / 2;
        const maxBadgeX = state.camera.x + canvas.width - 20 - badgeWidth / 2;
        const badgeX = Math.max(minBadgeX, Math.min(maxBadgeX, p.x));

        // Translucent cyber badge background
        ctx.fillStyle = 'rgba(3, 14, 25, 0.9)';
        ctx.strokeStyle = marker.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = marker.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(badgeX - badgeWidth / 2, worldY - badgeHeight / 2, badgeWidth, badgeHeight, 5);
        ctx.fill();
        ctx.stroke();

        // Depth badge text
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = marker.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 4;
        ctx.fillText(`▼ 深度標記: ${marker.label} ▼`, badgeX, worldY);

        // Fixed edge anchor tags
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = marker.color;
        ctx.textAlign = 'left';
        ctx.fillText(`── ${marker.depth}m ──`, 24, worldY - 8);
        ctx.textAlign = 'right';
        ctx.fillText(`── ${marker.depth}m ──`, WORLD_WIDTH - 24, worldY - 8);

        ctx.restore();
      });

      // 3. Draw Rocks / Minerals
      state.rocks.forEach((r) => {
        ctx.save();
        ctx.fillStyle = r.color;
        ctx.strokeStyle = r.accentColor;
        ctx.lineWidth = 2;

        // Custom stylized polygonal rock
        const hw = r.w / 2;
        const hh = r.h / 2;
        ctx.beginPath();
        ctx.moveTo(r.x - hw + r.shapeOffsets[0], r.y - hh + r.shapeOffsets[1]);
        ctx.lineTo(r.x + hw + r.shapeOffsets[2], r.y - hh + r.shapeOffsets[3]);
        ctx.lineTo(r.x + hw + r.shapeOffsets[4], r.y + hh + r.shapeOffsets[5]);
        ctx.lineTo(r.x - hw + r.shapeOffsets[6], r.y + hh + r.shapeOffsets[7]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner crystalline veins
        if (r.tier >= 2) {
          ctx.fillStyle = r.tier === 3 ? '#ffeb3b' : '#ea80fc';
          ctx.beginPath();
          ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Health Bar if damaged
        if (r.hp < r.maxHp) {
          const barW = 38;
          const barH = 5;
          const pct = Math.max(0, r.hp / r.maxHp);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(r.x - barW / 2, r.y - hh - 10, barW, barH);
          ctx.fillStyle = pct < 0.3 ? '#ff1744' : '#00e676';
          ctx.fillRect(r.x - barW / 2, r.y - hh - 10, barW * pct, barH);
        }

        ctx.restore();
      });

      // 4. Draw Drop Items
      state.drops.forEach((d) => {
        ctx.save();
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        if (d.type === 'crystal') {
          // Diamond shape
          ctx.moveTo(d.x, d.y - 6);
          ctx.lineTo(d.x + 5, d.y);
          ctx.lineTo(d.x, d.y + 6);
          ctx.lineTo(d.x - 5, d.y);
        } else {
          // Round gold pearl
          ctx.arc(d.x, d.y, 5 + Math.sin(d.pulse) * 0.8, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });

      // 5. Draw Jellyfish
      state.jellies.forEach((j) => {
        ctx.save();
        ctx.shadowColor = j.glowColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = j.color;

        // Dome bell
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.size, Math.PI, 0);
        ctx.fill();

        // Trailing tentacles
        ctx.strokeStyle = j.color;
        ctx.lineWidth = 1.8;
        for (let t = -2; t <= 2; t++) {
          ctx.beginPath();
          ctx.moveTo(j.x + t * 4, j.y);
          const wave = Math.sin(j.pulse + t) * 4;
          ctx.lineTo(j.x + t * 4 + wave, j.y + 12 + Math.cos(j.pulse) * 4);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 6. Draw Mining Laser
      if (state.mouse.isDown && mode === 'DIVE') {
        const drawLaserBeam = (angleOffset: number) => {
          const beamAngle = p.angle + angleOffset;
          const endX = p.x + Math.cos(beamAngle) * p.laserDist;
          const endY = p.y + Math.sin(beamAngle) * p.laserDist;

          ctx.save();
          // Outer neon glow
          ctx.strokeStyle = 'rgba(255, 30, 80, 0.75)';
          ctx.lineWidth = 5 + Math.sin(Date.now() * 0.04) * 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Inner laser core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        };

        drawLaserBeam(0);
        if (p.dualLaser) {
          drawLaserBeam(-0.1);
          drawLaserBeam(0.1);
        }
      }

      // 7. Draw Companion Drone
      if (p.hasDrone) {
        ctx.save();
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.dronePos.x, p.dronePos.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eye lens
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.dronePos.x - 2, p.dronePos.y - 2, 4, 4);

        // Drone antenna
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.dronePos.x, p.dronePos.y - 8);
        ctx.lineTo(p.dronePos.x, p.dronePos.y - 14);
        ctx.stroke();
        ctx.restore();
      }

      // 8. Draw Player Turtle
      drawPixelTurtle(ctx, p.x, p.y, p.angle, state.swimCycle);

      // 9. Draw Hit Particles
      state.particles.forEach((pt) => {
        ctx.save();
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.restore();
      });

      // 10. Floating Texts
      state.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x - 20, ft.y);
        ctx.restore();
      });

      // 11. Sonar Radar Pointer (if hasDepthRadar is unlocked)
      if (p.hasDepthRadar) {
        // Point towards high-tier items
        const targets = [
          ...state.jellies.filter((j) => j.tier === 3),
          ...state.rocks.filter((r) => r.tier >= 2),
        ];

        targets.slice(0, 3).forEach((target) => {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 350) {
            const radAngle = Math.atan2(dy, dx);
            const indDist = 80;
            const indX = p.x + Math.cos(radAngle) * indDist;
            const indY = p.y + Math.sin(radAngle) * indDist;

            ctx.save();
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(indX, indY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      }

      ctx.restore(); // Restore world translation

      // Low Oxygen Red Vignette Pulsing Warning
      if (p.o2 / p.maxO2 <= 0.22) {
        ctx.save();
        const pulse = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
        const vigGrad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.25,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.7
        );
        vigGrad.addColorStop(0, 'rgba(255, 0, 0, 0)');
        vigGrad.addColorStop(1, `rgba(255, 0, 40, ${0.35 + pulse * 0.3})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      gameStateRef.current.animFrameId = requestAnimationFrame(gameLoop);
    };

    gameStateRef.current.animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      active = false;
      cancelAnimationFrame(gameStateRef.current.animFrameId);
    };
  }, [mode, cargoItems.length, talents, settings, onAddCargo, onAddCurrency, onEmergencyRescue, onEnterBase, onRecordMaxDepth, onUpdateStats]);

  // Pixel Turtle Drawing Function
  const drawPixelTurtle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    cycle: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const flipperWave = Math.sin(cycle) * 4;

    // Flippers (Green)
    ctx.fillStyle = '#27ae60';
    // Front flippers with flapping motion
    ctx.fillRect(8, -17 + flipperWave, 13, 7);
    ctx.fillRect(8, 10 - flipperWave, 13, 7);
    // Rear flippers
    ctx.fillRect(-17, -13, 8, 5);
    ctx.fillRect(-17, 8, 8, 5);

    // Carapace Shell (Deep Shell Brown)
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 19, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#4e342e';
    ctx.stroke();

    // Carapace scutes pattern
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-6, -5, 8, 10);
    ctx.fillRect(4, -3, 5, 6);

    // Head (Emerald)
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(19, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Diving Goggles / Eyes
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(20, -4, 3, 3);
    ctx.fillRect(20, 2, 3, 3);

    // Mounted Heavy Laser Cannon Bracket
    ctx.fillStyle = '#607d8b';
    ctx.fillRect(-4, -6, 12, 4);
    // Emitter tip
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(8, -6, 4, 4);

    ctx.restore();
  };

  // Real-time HUD Values
  const currentDepth = liveHud.depth;
  const currentBiome = BIOMES.find((b) => currentDepth >= b.startDepth && currentDepth < b.endDepth) || BIOMES[BIOMES.length - 1];
  const o2Percent = Math.max(0, Math.min(100, (liveHud.o2 / liveHud.maxO2) * 100));
  const cargoPercent = Math.min(100, (cargoItems.length / playerStats.cargoMax) * 100);
  const nearSurface = liveHud.nearSurface;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#02070e] overflow-hidden select-none">
      {/* Top HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none text-xs font-mono font-bold text-white drop-shadow-md">
        {/* Left Stats Cluster */}
        <div className="flex items-center gap-3 bg-[#061421]/80 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#163a52] pointer-events-auto shadow-xl">
          {/* Depth Indicator */}
          <div>
            <span className="text-gray-400">深度: </span>
            <span className="text-[#00ffcc] text-sm">{currentDepth}</span>
            <span className="text-gray-400"> m</span>
            <span className="hidden sm:inline-block ml-1.5 text-[10px] text-cyan-300 font-normal">
              [{currentBiome.name.split(' ')[0]}]
            </span>
          </div>

          <span className="text-[#193a4f]">|</span>

          {/* Oxygen Gauge */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">氧氣:</span>
            <div className="w-24 sm:w-32 h-3 bg-black/60 border border-[#2b546e] rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  o2Percent < 25 ? 'bg-red-500 animate-pulse' : o2Percent < 50 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${o2Percent}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-300 font-mono">
              {Math.max(0, Math.round(liveHud.o2))}s
            </span>
          </div>

          <span className="text-[#193a4f]">|</span>

          {/* Cargo Gauge */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">背包:</span>
            <div className="w-16 sm:w-24 h-3 bg-black/60 border border-[#2b546e] rounded overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${cargoPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-300 font-mono">
              {cargoItems.length}/{playerStats.cargoMax}
            </span>
          </div>
        </div>

        {/* Right Currency & Controls Cluster */}
        <div className="flex items-center gap-3 bg-[#061421]/80 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#163a52] pointer-events-auto shadow-xl">
          <div className="flex items-center gap-1.5 text-amber-300">
            <span>💰</span>
            <span>{pearls.toLocaleString()}</span>
          </div>

          <span className="text-[#193a4f]">|</span>

          <div className="flex items-center gap-1.5 text-fuchsia-300">
            <span>💠</span>
            <span>{crystals.toLocaleString()}</span>
          </div>

          <span className="text-[#193a4f]">|</span>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1 rounded hover:bg-[#122e42] text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="開關音效"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-1 rounded hover:bg-[#122e42] text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="操作說明與教學"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Surface Docking Prompt */}
      {nearSurface && mode === 'DIVE' && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            onClick={() => {
              audioSys.playDock();
              onEnterBase();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs rounded-full border border-emerald-300/60 shadow-2xl cursor-pointer"
          >
            <Anchor className="w-4 h-4" />
            <span>已抵達海面！點擊或按 [E] 靠港進入母艦</span>
          </button>
        </div>
      )}

      {/* Low Oxygen Warning Pill */}
      {o2Percent < 22 && mode === 'DIVE' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-red-600/90 text-white text-xs font-mono font-bold rounded-lg border border-red-400 shadow-2xl animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span>⚠️ 氧氣存量過低！請立即上浮返航！</span>
        </div>
      )}

      {/* The Main High-Performance Game Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={650}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="w-full h-full max-w-[1000px] max-h-[650px] aspect-[1000/650] object-contain shadow-2xl border-2 border-[#16364a] rounded-lg block cursor-crosshair"
      />

      {/* CRT Scanline Filter Overlay (Optional) */}
      {settings.crtFilter && (
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
            backgroundSize: '100% 4px',
          }}
        />
      )}
    </div>
  );
};
