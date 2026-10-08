import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TalentNode, CargoItem, PlayerStats, GameSettings, AchievementToast } from './types/game';
import { INITIAL_TALENTS } from './constants/talents';
import { ACHIEVEMENTS } from './constants/achievements';
import { GameCanvas } from './components/GameCanvas';
import { BaseDockModal } from './components/BaseDockModal';
import { HelpModal } from './components/HelpModal';
import { AchievementToastContainer } from './components/AchievementToastContainer';
import { audioSys } from './audio/soundEngine';

const STORAGE_KEY = 'shelldiver_save_v3';

export default function App() {
  // Load saved state or default
  const savedData = useMemo(() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        return JSON.parse(item);
      }
    } catch {
      // LocalStorage unavailable
    }
    return null;
  }, []);

  const [pearls, setPearls] = useState<number>(() => savedData?.pearls ?? 150);
  const [crystals, setCrystals] = useState<number>(() => savedData?.crystals ?? 2);
  const [totalPearlsEarned, setTotalPearlsEarned] = useState<number>(() => savedData?.totalPearlsEarned ?? 150);
  const [totalCrystalsEarned, setTotalCrystalsEarned] = useState<number>(() => savedData?.totalCrystalsEarned ?? 2);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => savedData?.unlockedAchievements ?? []);
  const [achievementToasts, setAchievementToasts] = useState<AchievementToast[]>([]);

  const [cargoItems, setCargoItems] = useState<CargoItem[]>(() => savedData?.cargoItems ?? []);
  const [maxDepthRecord, setMaxDepthRecord] = useState<number>(() => savedData?.maxDepthRecord ?? 0);
  const [totalDives, setTotalDives] = useState<number>(() => savedData?.totalDives ?? 0);
  const [mode, setMode] = useState<'DIVE' | 'BASE'>('DIVE');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [rescueNotice, setRescueNotice] = useState<string | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => ({
    soundEnabled: savedData?.settings?.soundEnabled ?? true,
    masterVolume: savedData?.settings?.masterVolume ?? 0.65,
    screenShake: savedData?.settings?.screenShake ?? true,
    crtFilter: savedData?.settings?.crtFilter ?? false,
    touchControls: savedData?.settings?.touchControls ?? false,
  }));

  const [talents, setTalents] = useState<TalentNode[]>(() => {
    if (savedData?.talents) {
      // Merge saved levels with INITIAL_TALENTS definition
      return INITIAL_TALENTS.map((t) => {
        const saved = savedData.talents.find((st: { id: string; lvl: number }) => st.id === t.id);
        return {
          ...t,
          lvl: saved ? saved.lvl : 0,
        };
      });
    }
    return INITIAL_TALENTS;
  });

  // Calculate Player Stats based on current talents
  const playerStats = useMemo<PlayerStats>(() => {
    const getLvl = (id: string) => talents.find((x) => x.id === id)?.lvl ?? 0;
    const maxO2 = 100 + getLvl('o2_tank') * 35;

    return {
      x: 500,
      y: 50,
      vx: 0,
      vy: 0,
      angle: 0,
      o2: maxO2,
      maxO2,
      speed: 3.2 + getLvl('fins') * 0.8,
      cargoMax: 15 + getLvl('cargo_bay') * 12,
      laserDmg: 20 + getLvl('laser_power') * 15,
      laserDist: 220 + getLvl('laser_range') * 75,
      magnetDist: getLvl('magnet') * 65,
      hasDrone: getLvl('drone') > 0,
      dronePos: { x: 500, y: 50 },
      dualLaser: getLvl('dual_laser') > 0,
      hasDepthRadar: getLvl('depth_sight') > 0,
      hasEmergencyBoost: getLvl('emergency_boost') > 0,
    };
  }, [talents]);

  // Audio settings sync - immediately apply to soundEngine
  useEffect(() => {
    audioSys.setMuted(!settings.soundEnabled);
    audioSys.setVolume(settings.masterVolume);
  }, [settings.soundEnabled, settings.masterVolume]);

  // Persistent save to localStorage
  useEffect(() => {
    try {
      const dataToSave = {
        pearls,
        crystals,
        totalPearlsEarned,
        totalCrystalsEarned,
        unlockedAchievements,
        cargoItems,
        maxDepthRecord,
        totalDives,
        settings,
        talents: talents.map((t) => ({ id: t.id, lvl: t.lvl })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // LocalStorage error ignore
    }
  }, [
    pearls,
    crystals,
    totalPearlsEarned,
    totalCrystalsEarned,
    unlockedAchievements,
    cargoItems,
    maxDepthRecord,
    totalDives,
    settings,
    talents,
  ]);

  // Dismiss achievement toast
  const handleDismissToast = useCallback((id: string) => {
    setAchievementToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Trigger Achievement unlock with fanfare and reward
  const unlockAchievement = useCallback((achId: string) => {
    const ach = ACHIEVEMENTS.find((a) => a.id === achId);
    if (!ach) return;

    setUnlockedAchievements((prev) => {
      if (prev.includes(achId)) return prev;
      return [...prev, achId];
    });

    audioSys.playAchievement();

    const toastId = `${ach.id}-${Date.now()}`;
    setAchievementToasts((prev) => [
      ...prev,
      {
        id: toastId,
        achievement: ach,
        timestamp: Date.now(),
      },
    ]);

    // Apply achievement rewards
    if (achId === 'depth_500') {
      setPearls((p) => p + 100);
      setTotalPearlsEarned((tp) => tp + 100);
    } else if (achId === 'depth_1000') {
      setPearls((p) => p + 300);
      setTotalPearlsEarned((tp) => tp + 300);
      setCrystals((c) => c + 1);
      setTotalCrystalsEarned((tc) => tc + 1);
    } else if (achId === 'depth_2000') {
      setPearls((p) => p + 800);
      setTotalPearlsEarned((tp) => tp + 800);
      setCrystals((c) => c + 2);
      setTotalCrystalsEarned((tc) => tc + 2);
    } else if (achId === 'depth_3000') {
      setPearls((p) => p + 2000);
      setTotalPearlsEarned((tp) => tp + 2000);
      setCrystals((c) => c + 5);
      setTotalCrystalsEarned((tc) => tc + 5);
    } else if (achId === 'pearls_1000') {
      setPearls((p) => p + 150);
      setTotalPearlsEarned((tp) => tp + 150);
    } else if (achId === 'pearls_10000') {
      setPearls((p) => p + 1500);
      setTotalPearlsEarned((tp) => tp + 1500);
      setCrystals((c) => c + 3);
      setTotalCrystalsEarned((tc) => tc + 3);
    } else if (achId === 'crystals_5') {
      setPearls((p) => p + 200);
      setTotalPearlsEarned((tp) => tp + 200);
    } else if (achId === 'crystals_20') {
      setPearls((p) => p + 1000);
      setTotalPearlsEarned((tp) => tp + 1000);
      setCrystals((c) => c + 2);
      setTotalCrystalsEarned((tc) => tc + 2);
    } else if (achId === 'upgrade_3') {
      setPearls((p) => p + 150);
      setTotalPearlsEarned((tp) => tp + 150);
    } else if (achId === 'tech_drone') {
      setPearls((p) => p + 500);
      setTotalPearlsEarned((tp) => tp + 500);
      setCrystals((c) => c + 2);
      setTotalCrystalsEarned((tc) => tc + 2);
    } else if (achId === 'dive_5') {
      setPearls((p) => p + 300);
      setTotalPearlsEarned((tp) => tp + 300);
    }

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setAchievementToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4500);
  }, []);

  // Real-time achievement condition evaluation
  useEffect(() => {
    ACHIEVEMENTS.forEach((ach) => {
      if (unlockedAchievements.includes(ach.id)) return;

      let satisfied = false;
      switch (ach.id) {
        case 'depth_500':
          if (maxDepthRecord >= 500) satisfied = true;
          break;
        case 'depth_1000':
          if (maxDepthRecord >= 1000) satisfied = true;
          break;
        case 'depth_2000':
          if (maxDepthRecord >= 2000) satisfied = true;
          break;
        case 'depth_3000':
          if (maxDepthRecord >= 3000) satisfied = true;
          break;
        case 'pearls_1000':
          if (totalPearlsEarned >= 1000) satisfied = true;
          break;
        case 'pearls_10000':
          if (totalPearlsEarned >= 10000) satisfied = true;
          break;
        case 'crystals_5':
          if (totalCrystalsEarned >= 5) satisfied = true;
          break;
        case 'crystals_20':
          if (totalCrystalsEarned >= 20) satisfied = true;
          break;
        case 'upgrade_3':
          if (talents.reduce((acc, t) => acc + t.lvl, 0) >= 3) satisfied = true;
          break;
        case 'tech_drone':
          if (playerStats.hasDrone) satisfied = true;
          break;
        case 'dive_5':
          if (totalDives >= 5) satisfied = true;
          break;
      }

      if (satisfied) {
        unlockAchievement(ach.id);
      }
    });
  }, [
    maxDepthRecord,
    totalPearlsEarned,
    totalCrystalsEarned,
    talents,
    playerStats.hasDrone,
    totalDives,
    unlockedAchievements,
    unlockAchievement,
  ]);

  // Handle adding cargo items
  const handleAddCargo = useCallback(
    (item: CargoItem): boolean => {
      if (cargoItems.length < playerStats.cargoMax) {
        setCargoItems((prev) => [...prev, item]);
        return true;
      }
      return false;
    },
    [cargoItems.length, playerStats.cargoMax]
  );

  // Handle currency gains
  const handleAddCurrency = useCallback((pDelta: number, cDelta: number) => {
    if (pDelta > 0) {
      setPearls((prev) => prev + pDelta);
      setTotalPearlsEarned((prev) => prev + pDelta);
    }
    if (cDelta > 0) {
      setCrystals((prev) => prev + cDelta);
      setTotalCrystalsEarned((prev) => prev + cDelta);
    }
  }, []);

  // Sell all loot
  const handleSellAll = useCallback(() => {
    if (cargoItems.length === 0) return;
    const totalGained = cargoItems.reduce((acc, it) => acc + it.val, 0);
    setPearls((prev) => prev + totalGained);
    setTotalPearlsEarned((prev) => prev + totalGained);
    setCargoItems([]);
    audioSys.playCollect();
  }, [cargoItems]);

  // Talent Upgrade
  const handleUpgradeTalent = useCallback(
    (talentId: string) => {
      const node = talents.find((t) => t.id === talentId);
      if (!node) return;
      if (node.lvl >= node.max) return;

      // Check prerequisites
      const reqsMet = node.req.every((reqId) => {
        const p = talents.find((t) => t.id === reqId);
        return p && p.lvl > 0;
      });
      if (!reqsMet) {
        alert('尚未解鎖前置天賦！');
        return;
      }

      const cost = node.cost(node.lvl);
      if (node.cur === 'pearls') {
        if (pearls < cost) {
          alert(`珍珠不足！需要 ${cost} 珍珠。`);
          return;
        }
        setPearls((prev) => prev - cost);
      } else {
        if (crystals < cost) {
          alert(`星石晶體不足！需要 ${cost} 晶體。`);
          return;
        }
        setCrystals((prev) => prev - cost);
      }

      audioSys.playUpgrade();
      setTalents((prev) =>
        prev.map((t) => (t.id === talentId ? { ...t, lvl: t.lvl + 1 } : t))
      );
    },
    [talents, pearls, crystals]
  );

  // Transition into Base Dock
  const handleEnterBase = useCallback(() => {
    setMode('BASE');
    audioSys.playDock();
  }, []);

  // Start Dive from Base Dock
  const handleStartDive = useCallback(() => {
    setMode('DIVE');
    setTotalDives((prev) => prev + 1);
  }, []);

  // Update Settings with instant persistence
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.soundEnabled !== undefined) {
        audioSys.setMuted(!newSettings.soundEnabled);
      }
      if (newSettings.masterVolume !== undefined) {
        audioSys.setVolume(newSettings.masterVolume);
      }
      return updated;
    });
  }, []);

  // Reset Progress
  const handleResetProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPearls(150);
    setCrystals(2);
    setTotalPearlsEarned(150);
    setTotalCrystalsEarned(2);
    setUnlockedAchievements([]);
    setCargoItems([]);
    setMaxDepthRecord(0);
    setTotalDives(0);
    setTalents(INITIAL_TALENTS);
    setMode('DIVE');
  }, []);

  // Emergency rescue when oxygen depletes
  const handleEmergencyRescue = useCallback(() => {
    const lostCount = Math.floor(cargoItems.length * 0.4);
    if (lostCount > 0) {
      setCargoItems((prev) => prev.slice(lostCount));
      setRescueNotice(`⚠️ 氧氣耗盡！緊急推進彈射回港，遺失了 ${lostCount} 件漁獲！`);
    } else {
      setRescueNotice('⚠️ 氧氣耗盡！緊急推進裝置啟動，你已被安全回收至母艦！');
    }
    setTimeout(() => {
      setRescueNotice(null);
    }, 5000);
  }, [cargoItems.length]);

  // Record max depth
  const handleRecordMaxDepth = useCallback((depth: number) => {
    setMaxDepthRecord((prev) => Math.max(prev, depth));
  }, []);

  // Keyboard shortcut for quick actions in Base mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'BASE') {
        if (e.code === 'Space') {
          e.preventDefault();
          handleSellAll();
        } else if (e.code === 'Enter') {
          e.preventDefault();
          handleStartDive();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, handleSellAll, handleStartDive]);

  return (
    <div className="w-screen h-screen bg-[#02070e] flex items-center justify-center overflow-hidden font-sans">
      {/* Floating Achievement Unlocked Popups */}
      <AchievementToastContainer
        toasts={achievementToasts}
        onDismiss={handleDismissToast}
      />

      {/* Emergency rescue notification toast */}
      {rescueNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white border border-red-500 px-5 py-2.5 rounded-lg shadow-2xl text-xs font-mono font-bold animate-bounce flex items-center gap-2">
          <span>{rescueNotice}</span>
        </div>
      )}

      {/* Main Game Canvas and HUD */}
      <GameCanvas
        pearls={pearls}
        crystals={crystals}
        cargoItems={cargoItems}
        playerStats={playerStats}
        talents={talents}
        settings={settings}
        mode={mode}
        onEnterBase={handleEnterBase}
        onUpdateStats={() => {}}
        onAddCargo={handleAddCargo}
        onAddCurrency={handleAddCurrency}
        onOpenHelp={() => setIsHelpOpen(true)}
        onToggleSound={() =>
          handleUpdateSettings({ soundEnabled: !settings.soundEnabled })
        }
        onRecordMaxDepth={handleRecordMaxDepth}
        onEmergencyRescue={handleEmergencyRescue}
      />

      {/* Mothership Dock Base Modal */}
      <BaseDockModal
        isOpen={mode === 'BASE'}
        pearls={pearls}
        crystals={crystals}
        cargoItems={cargoItems}
        talents={talents}
        playerStats={playerStats}
        settings={settings}
        maxDepthRecord={maxDepthRecord}
        totalDives={totalDives}
        unlockedAchievements={unlockedAchievements}
        totalPearlsEarned={totalPearlsEarned}
        totalCrystalsEarned={totalCrystalsEarned}
        onSellAll={handleSellAll}
        onUpgrade={handleUpgradeTalent}
        onStartDive={handleStartDive}
        onUpdateSettings={handleUpdateSettings}
        onResetProgress={handleResetProgress}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
