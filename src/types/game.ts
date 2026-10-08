export type CurrencyType = 'pearls' | 'crystals';

export interface TalentNode {
  id: string;
  name: string;
  desc: string;
  category: 'survival' | 'laser' | 'cargo' | 'tech';
  max: number;
  lvl: number;
  cost: (level: number) => number;
  cur: CurrencyType;
  x: number;
  y: number;
  req: string[];
}

export interface CargoItem {
  id: string;
  name: string;
  type: 'jelly' | 'ore' | 'relic';
  val: number;
  cry: number;
  icon?: string;
  color: string;
  tier: number;
}

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  o2: number;
  maxO2: number;
  speed: number;
  cargoMax: number;
  laserDmg: number;
  laserDist: number;
  magnetDist: number;
  hasDrone: boolean;
  dronePos: { x: number; y: number };
  dualLaser: boolean;
  hasDepthRadar: boolean;
  hasEmergencyBoost: boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
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

export interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  wobble: number;
}

export interface JellyfishEntity {
  id: number;
  x: number;
  y: number;
  seed: number;
  tier: number;
  name: string;
  color: string;
  glowColor: string;
  val: number;
  size: number;
  pulse: number;
  hp: number;
}

export interface RockEntity {
  id: number;
  x: number;
  y: number;
  tier: number;
  name: string;
  maxHp: number;
  hp: number;
  color: string;
  accentColor: string;
  cry: number;
  val: number;
  w: number;
  h: number;
  shapeOffsets: number[];
}

export interface DropItemEntity {
  id: number;
  x: number;
  y: number;
  type: 'val' | 'crystal';
  val: number;
  cry: number;
  vx: number;
  vy: number;
  color: string;
  pulse: number;
}

export interface BiomeZone {
  name: string;
  startDepth: number;
  endDepth: number;
  colorTop: string;
  colorBottom: string;
  description: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  masterVolume: number;
  screenShake: boolean;
  crtFilter: boolean;
  touchControls: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rewardText: string;
  category: 'depth' | 'wealth' | 'mining' | 'tech';
}

export interface AchievementToast {
  id: string;
  achievement: AchievementDef;
  timestamp: number;
}
