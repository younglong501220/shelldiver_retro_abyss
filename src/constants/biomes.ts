import { BiomeZone } from '../types/game';

export const WORLD_WIDTH = 2400;
export const WORLD_DEPTH = 3800;

export const BIOMES: BiomeZone[] = [
  {
    name: '日光淺礁區 (Sunlit Reef)',
    startDepth: 0,
    endDepth: 400,
    colorTop: '#0d324d',
    colorBottom: '#0a2538',
    description: '陽光穿透的海域，浮游著淺藍水母與普通珊瑚礦岩。',
  },
  {
    name: '黃昏沉船帶 (Twilight Wreckage)',
    startDepth: 400,
    endDepth: 1200,
    colorTop: '#0a2538',
    colorBottom: '#051824',
    description: '散落著沉船遺留的鈦合金裝甲，綠色電氣水母穿梭其中。',
  },
  {
    name: '午夜海溝 (Midnight Trench)',
    startDepth: 1200,
    endDepth: 2400,
    colorTop: '#051824',
    colorBottom: '#020b13',
    description: '高壓深黑領域，富含神秘紫晶簇與深海霓光水母。',
  },
  {
    name: '超深淵星核 (Abyssal Star-Core)',
    startDepth: 2400,
    endDepth: 3800,
    colorTop: '#020b13',
    colorBottom: '#01050a',
    description: '深邃無底的極限世界，棲息著無價的黃金水母與純粹星石晶脈！',
  },
];

export const JELLY_TIERS = [
  { tier: 0, name: '幼藍水母', color: '#00f5ff', glowColor: 'rgba(0, 245, 255, 0.4)', val: 30, size: 14 },
  { tier: 1, name: '螢光電水母', color: '#39ff14', glowColor: 'rgba(57, 255, 20, 0.4)', val: 85, size: 17 },
  { tier: 2, name: '深淵魅紫水母', color: '#d05ce3', glowColor: 'rgba(208, 92, 227, 0.4)', val: 240, size: 20 },
  { tier: 3, name: '黃金星輝水母', color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.6)', val: 680, size: 24 },
];

export const ROCK_TIERS = [
  { tier: 0, name: '珊瑚礦岩', hp: 60, col: '#795548', accent: '#a1887f', cry: 0, val: 60 },
  { tier: 1, name: '沉船鈦合金', hp: 170, col: '#455a64', accent: '#78909c', cry: 1, val: 150 },
  { tier: 2, name: '遠古星石簇', hp: 380, col: '#4a148c', accent: '#ba68c8', cry: 3, val: 340 },
  { tier: 3, name: '深核奇點異金', hp: 800, col: '#ff6f00', accent: '#ffb74d', cry: 6, val: 800 },
];
