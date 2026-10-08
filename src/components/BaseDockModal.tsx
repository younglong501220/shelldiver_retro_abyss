import React, { useState } from 'react';
import { TalentNode, CargoItem, PlayerStats, GameSettings } from '../types/game';
import { TalentTreeCanvas } from './TalentTreeCanvas';
import { BIOMES, JELLY_TIERS, ROCK_TIERS } from '../constants/biomes';
import { ACHIEVEMENTS } from '../constants/achievements';
import { audioSys } from '../audio/soundEngine';
import {
  Anchor,
  Zap,
  Sliders,
  Award,
  BookOpen,
  DollarSign,
  Play,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface BaseDockModalProps {
  isOpen: boolean;
  pearls: number;
  crystals: number;
  cargoItems: CargoItem[];
  talents: TalentNode[];
  playerStats: PlayerStats;
  settings: GameSettings;
  maxDepthRecord: number;
  totalDives: number;
  unlockedAchievements: string[];
  totalPearlsEarned: number;
  totalCrystalsEarned: number;
  onSellAll: () => void;
  onUpgrade: (talentId: string) => void;
  onStartDive: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetProgress: () => void;
}

export const BaseDockModal: React.FC<BaseDockModalProps> = ({
  isOpen,
  pearls,
  crystals,
  cargoItems,
  talents,
  playerStats,
  settings,
  maxDepthRecord,
  totalDives,
  unlockedAchievements,
  totalPearlsEarned,
  totalCrystalsEarned,
  onSellAll,
  onUpgrade,
  onStartDive,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'talents' | 'hangar' | 'bestiary' | 'achievements' | 'settings'>('talents');

  if (!isOpen) return null;

  const totalCargoValue = cargoItems.reduce((acc, item) => acc + item.val, 0);

  return (
    <div className="absolute inset-0 z-50 bg-[#030912]/95 backdrop-blur-md flex flex-col p-4 md:p-6 text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#143147] pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#0a2333] border border-[#00f0ff]/40 flex items-center justify-center text-xl shadow-lg">
            🐢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-[#4ef2bb] font-mono">
                龜龜母艦基地港口
              </h1>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                DOCK BASE v2.5
              </span>
            </div>
            <p className="text-xs text-gray-400">
              維護海龜潛水機體，售出捕撈海產，擴充深海科技樹
            </p>
          </div>
        </div>

        {/* Currency & Quick Action */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 bg-[#071724] border border-[#163a52] px-3.5 py-1.5 rounded-lg text-sm font-mono shadow-inner">
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              💰 珍珠: <span>{pearls.toLocaleString()}</span>
            </span>
            <span className="text-[#1f4b66]">|</span>
            <span className="flex items-center gap-1.5 text-fuchsia-300 font-bold">
              💠 星石: <span>{crystals.toLocaleString()}</span>
            </span>
          </div>

          <button
            onClick={onSellAll}
            disabled={cargoItems.length === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded font-semibold text-xs transition-all shadow-md ${
              cargoItems.length > 0
                ? 'bg-amber-600 hover:bg-amber-500 text-white hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
            }`}
            title="快捷鍵: 空格鍵 (Space)"
          >
            <DollarSign className="w-4 h-4" />
            <span>售出全部漁獲 (+{totalCargoValue} 珍珠)</span>
            <kbd className="hidden sm:inline-block bg-black/30 px-1.5 py-0.5 rounded text-[10px] text-amber-200">
              SPACE
            </kbd>
          </button>
        </div>
      </header>

      {/* Nav Tabs */}
      <div className="flex items-center gap-1 border-b border-[#12283a] pb-2 mb-3 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('talents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            activeTab === 'talents'
              ? 'bg-[#127a69] text-white font-bold shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1f2e]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>天賦科技矩陣</span>
        </button>

        <button
          onClick={() => setActiveTab('hangar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            activeTab === 'hangar'
              ? 'bg-[#127a69] text-white font-bold shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1f2e]'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>海龜整備機庫</span>
        </button>

        <button
          onClick={() => setActiveTab('bestiary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            activeTab === 'bestiary'
              ? 'bg-[#127a69] text-white font-bold shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1f2e]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>深海圖鑑</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            activeTab === 'achievements'
              ? 'bg-[#127a69] text-white font-bold shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1f2e]'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>深潛功勳</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#127a69] text-white font-bold shadow'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#0c1f2e]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-rose-400" />
          <span>設定</span>
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        {/* TAB 1: TALENT TREE */}
        {activeTab === 'talents' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2 px-1">
              <span>點擊節點升級。需具備相應貨幣及前置天賦解鎖。</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span> 生存機動
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff3366]"></span> 雷射矩陣
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb300]"></span> 貨艙經濟
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]"></span> 終極科技
                </span>
              </div>
            </div>

            <TalentTreeCanvas
              talents={talents}
              pearls={pearls}
              crystals={crystals}
              onUpgrade={onUpgrade}
            />
          </div>
        )}

        {/* TAB 2: SUBMARINE HANGAR */}
        {activeTab === 'hangar' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#05131f] border border-[#143147] rounded-lg">
            <h2 className="text-base font-bold text-[#4ef2bb] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> 龜龜機體數值概覽
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#081c2c] p-3.5 rounded border border-[#193c54]">
                <div className="text-xs text-gray-400 mb-1">最大氧氣量 (Max O2)</div>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {Math.round(playerStats.maxO2)} 秒
                </div>
                <div className="text-[11px] text-gray-500 mt-1">決定深海持續探索時間</div>
              </div>

              <div className="bg-[#081c2c] p-3.5 rounded border border-[#193c54]">
                <div className="text-xs text-gray-400 mb-1">推進巡航速度 (Swim Speed)</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {playerStats.speed.toFixed(1)} kn
                </div>
                <div className="text-[11px] text-gray-500 mt-1">尾鰭推進力與水阻克服</div>
              </div>

              <div className="bg-[#081c2c] p-3.5 rounded border border-[#193c54]">
                <div className="text-xs text-gray-400 mb-1">次元海藻背包容量 (Cargo)</div>
                <div className="text-xl font-bold font-mono text-amber-400">
                  {playerStats.cargoMax} 格
                </div>
                <div className="text-[11px] text-gray-500 mt-1">目前已裝載: {cargoItems.length} 件</div>
              </div>

              <div className="bg-[#081c2c] p-3.5 rounded border border-[#193c54]">
                <div className="text-xs text-gray-400 mb-1">雷射每秒輸出 (Laser DPS)</div>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {playerStats.laserDmg} /s
                </div>
                <div className="text-[11px] text-gray-500 mt-1">熔解珊瑚礦石與合金殘骸速度</div>
              </div>

              <div className="bg-[#081c2c] p-3.5 rounded border border-[#193c54]">
                <div className="text-xs text-gray-400 mb-1">雷射有效射程 (Laser Dist)</div>
                <div className="text-xl font-bold font-mono text-fuchsia-400">
                  {playerStats.laserDist} px
                </div>
                <div className="text-[11px] text-gray-500 mt-1">光束聚焦投射的最遠半徑</div>
              </div>

              <div className="bg-[#081c2c] p-3.5 rounded border border-[#193c54]">
                <div className="text-xs text-gray-400 mb-1">渦流磁吸半徑 (Magnet Pull)</div>
                <div className="text-xl font-bold font-mono text-teal-400">
                  {playerStats.magnetDist > 0 ? `${playerStats.magnetDist} px` : '未啟用'}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">自動將掉落珍珠晶體吸入</div>
              </div>
            </div>

            <h2 className="text-base font-bold text-[#4ef2bb] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 裝備外掛組件
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className={`p-3 rounded border ${playerStats.hasDrone ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200' : 'bg-[#081a26] border-gray-800 text-gray-500'}`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>🤖 自律水母無人機</span>
                  {playerStats.hasDrone && <span className="text-[10px] bg-cyan-700 text-white px-1 rounded">運作中</span>}
                </div>
                <p>跟隨海龜移動，自動以輔助雷射射擊 180px 範圍內礁石。</p>
              </div>

              <div className={`p-3 rounded border ${playerStats.hasDepthRadar ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200' : 'bg-[#081a26] border-gray-800 text-gray-500'}`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>📡 深淵生物雷達</span>
                  {playerStats.hasDepthRadar && <span className="text-[10px] bg-indigo-700 text-white px-1 rounded">啟用</span>}
                </div>
                <p>於視野邊界標註稀有黃金星輝水母與珍稀星石礦簇坐標方向。</p>
              </div>

              <div className={`p-3 rounded border ${playerStats.dualLaser ? 'bg-rose-950/40 border-rose-500 text-rose-200' : 'bg-[#081a26] border-gray-800 text-gray-500'}`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>⚡ 雙聯共振光束</span>
                  {playerStats.dualLaser && <span className="text-[10px] bg-rose-700 text-white px-1 rounded">裝備中</span>}
                </div>
                <p>雙射線聚能照射，具備雙倍判定面積。</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MARINE BESTIARY */}
        {activeTab === 'bestiary' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#05131f] border border-[#143147] rounded-lg">
            <h2 className="text-base font-bold text-[#4ef2bb] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> 深海生態深度帶
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {BIOMES.map((biome, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border border-[#1b3d54] bg-[#071928] text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-cyan-300 mb-1">
                    <span>{biome.name}</span>
                    <span className="font-mono text-gray-400">
                      {biome.startDepth}m ~ {biome.endDepth}m
                    </span>
                  </div>
                  <p className="text-gray-300">{biome.description}</p>
                </div>
              ))}
            </div>

            <h2 className="text-base font-bold text-[#4ef2bb] mb-3">🪼 水母物種全覽</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {JELLY_TIERS.map((jelly) => (
                <div
                  key={jelly.tier}
                  className="p-3 rounded border border-[#1b3d54] bg-[#071928] flex flex-col items-center text-center text-xs"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-lg"
                    style={{ backgroundColor: `${jelly.color}33`, border: `2px solid ${jelly.color}` }}
                  >
                    <span className="text-lg">🪼</span>
                  </div>
                  <div className="font-bold text-slate-100">{jelly.name}</div>
                  <div className="text-amber-300 font-mono mt-1">基礎價值: {jelly.val} 珍珠</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    生成深度: {jelly.tier * 900}m+
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-base font-bold text-[#4ef2bb] mb-3">⛏️ 海底礦石與沉船殘骸</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {ROCK_TIERS.map((rock) => (
                <div
                  key={rock.tier}
                  className="p-3 rounded border border-[#1b3d54] bg-[#071928] flex flex-col items-center text-center text-xs"
                >
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center mb-2 shadow-lg"
                    style={{ backgroundColor: rock.col, border: `2px solid ${rock.accent}` }}
                  >
                    <span className="text-lg">🪨</span>
                  </div>
                  <div className="font-bold text-slate-100">{rock.name}</div>
                  <div className="text-red-300 font-mono mt-1">耐久度: {rock.hp} HP</div>
                  <div className="text-fuchsia-300 font-mono text-[11px]">
                    掉落星石: {rock.cry > 0 ? `+${rock.cry} 💠` : '無'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#05131f] border border-[#143147] rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14354c] pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#4ef2bb] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> 深潛榮譽成就矩陣
                </h2>
                <p className="text-xs text-gray-400">達成極限深度與資源累積，解鎖深淵功勳與豐厚獎勵</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-[#071d2e] border border-[#1b4360] px-3 py-1.5 rounded-lg">
                <span className="text-gray-400">達成度:</span>
                <span className="text-amber-400 font-bold">{unlockedAchievements.length} / {ACHIEVEMENTS.length}</span>
                <span className="text-gray-500">
                  ({Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedAchievements.includes(ach.id);

                // Compute progress for uncompleted achievements
                let progress = 0;
                let progressText = '';

                switch (ach.id) {
                  case 'depth_500':
                    progress = Math.min(100, Math.round((maxDepthRecord / 500) * 100));
                    progressText = `${Math.min(maxDepthRecord, 500)} / 500 m`;
                    break;
                  case 'depth_1000':
                    progress = Math.min(100, Math.round((maxDepthRecord / 1000) * 100));
                    progressText = `${Math.min(maxDepthRecord, 1000)} / 1,000 m`;
                    break;
                  case 'depth_2000':
                    progress = Math.min(100, Math.round((maxDepthRecord / 2000) * 100));
                    progressText = `${Math.min(maxDepthRecord, 2000)} / 2,000 m`;
                    break;
                  case 'depth_3000':
                    progress = Math.min(100, Math.round((maxDepthRecord / 3000) * 100));
                    progressText = `${Math.min(maxDepthRecord, 3000)} / 3,000 m`;
                    break;
                  case 'pearls_1000':
                    progress = Math.min(100, Math.round((totalPearlsEarned / 1000) * 100));
                    progressText = `${Math.min(totalPearlsEarned, 1000)} / 1,000 珍珠`;
                    break;
                  case 'pearls_10000':
                    progress = Math.min(100, Math.round((totalPearlsEarned / 10000) * 100));
                    progressText = `${Math.min(totalPearlsEarned, 10000)} / 10,000 珍珠`;
                    break;
                  case 'crystals_5':
                    progress = Math.min(100, Math.round((totalCrystalsEarned / 5) * 100));
                    progressText = `${Math.min(totalCrystalsEarned, 5)} / 5 晶體`;
                    break;
                  case 'crystals_20':
                    progress = Math.min(100, Math.round((totalCrystalsEarned / 20) * 100));
                    progressText = `${Math.min(totalCrystalsEarned, 20)} / 20 晶體`;
                    break;
                  case 'upgrade_3': {
                    const totalLvl = talents.reduce((acc, t) => acc + t.lvl, 0);
                    progress = Math.min(100, Math.round((totalLvl / 3) * 100));
                    progressText = `${Math.min(totalLvl, 3)} / 3 次升級`;
                    break;
                  }
                  case 'tech_drone':
                    progress = playerStats.hasDrone ? 100 : 0;
                    progressText = playerStats.hasDrone ? '已解鎖' : '未解鎖';
                    break;
                  case 'dive_5':
                    progress = Math.min(100, Math.round((totalDives / 5) * 100));
                    progressText = `${Math.min(totalDives, 5)} / 5 次出港`;
                    break;
                  default:
                    progress = isUnlocked ? 100 : 0;
                    progressText = isUnlocked ? '已解鎖' : '進行中';
                }

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isUnlocked
                        ? 'bg-[#082030] border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-[#061622] border-[#143247] opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xl shadow-inner ${
                          isUnlocked
                            ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                            : 'bg-slate-900 border border-slate-700 text-gray-500'
                        }`}
                      >
                        {ach.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs font-bold font-mono tracking-wide ${isUnlocked ? 'text-amber-300' : 'text-gray-300'}`}>
                            {ach.title}
                          </h4>
                          {isUnlocked ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> 已達成
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              <Lock className="w-3 h-3 text-gray-500" /> 未解鎖
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                          {ach.desc}
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                            <span>進度: {progressText}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-[#1b3d54]">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isUnlocked ? 'bg-amber-400' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {ach.rewardText && (
                          <div className="mt-2 text-[10px] font-mono text-emerald-300/90 flex items-center gap-1">
                            <span>達成獎勵:</span>
                            <span className="font-bold">{ach.rewardText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#05131f] border border-[#143147] rounded-lg text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#14354c] pb-3 mb-2">
              <div>
                <h2 className="text-base font-bold text-[#4ef2bb] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" /> 音效設定與系統控制
                </h2>
                <p className="text-xs text-gray-400">所有音效與視覺設定將即時自動持久化保存至 localStorage</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>已自動儲存至本機</span>
              </div>
            </div>

            {/* Audio Section */}
            <div className="bg-[#081c2c] p-4 rounded-lg border border-[#1b3d54] space-y-4 shadow-inner">
              <div className="font-bold text-sm text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  音效引擎控制 (Web Audio API)
                </span>
                <button
                  onClick={() => {
                    audioSys.init();
                    audioSys.playTestSound();
                  }}
                  className="px-3 py-1 bg-[#124d66] hover:bg-[#166485] text-cyan-200 border border-cyan-500/50 rounded font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="點擊播放測試音階以檢驗當前音量"
                >
                  <span>🔊 播放測試音 (Test Sound)</span>
                </button>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 rounded bg-[#061522] border border-[#123046]">
                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    )}
                    <span>音效主開關</span>
                  </div>
                  <div className="text-gray-400 text-[11px] mt-0.5">
                    {settings.soundEnabled ? '音效已開啟（可聽到雷射、捕獲與升級音）' : '音效已靜音'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`px-3 py-1.5 rounded font-mono font-bold text-xs cursor-pointer transition-all ${
                      settings.soundEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700'
                    }`}
                  >
                    {settings.soundEnabled ? '已開啟 (ON)' : '已靜音 (MUTED)'}
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Master Volume Slider */}
              <div className="p-3 rounded bg-[#061522] border border-[#123046] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-100">主音效音量調節</div>
                    <div className="text-gray-400 text-[11px]">控制所有合成雷射、水母拾取與成就音效的大小</div>
                  </div>
                  <div className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-[#0b2538] border border-cyan-800 text-cyan-300">
                    {Math.round(settings.masterVolume * 100)}%
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <VolumeX className="w-4 h-4 text-gray-500" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.masterVolume}
                    onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                    className="flex-1 accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Visual Filters */}
              <div className="flex items-center justify-between border-t border-[#132c3f] pt-3">
                <div>
                  <div className="font-bold text-sm text-slate-100">復古 CRT 街機橫紋濾鏡</div>
                  <div className="text-gray-400 text-[11px]">模擬 90 年代街機 CRT 掃描線光影氛圍</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.crtFilter}
                  onChange={(e) => onUpdateSettings({ crtFilter: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[#132c3f] pt-3">
                <div>
                  <div className="font-bold text-sm text-slate-100">採礦擊碎震屏特效</div>
                  <div className="text-gray-400 text-[11px]">岩石粉碎時提供微量鏡頭震動打擊感</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.screenShake}
                  onChange={(e) => onUpdateSettings({ screenShake: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Reset Data Section */}
            <div className="bg-[#081c2c] p-4 rounded-lg border border-red-950/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-red-400">清除並重置本機存檔</div>
                <div className="text-gray-400 text-[11px]">清空所有升級天賦、持有珍珠與已達成成就</div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('確定要清除所有遊戲進度、天賦科技與成就並重新開始嗎？此操作無法撤回。')) {
                    onResetProgress();
                  }
                }}
                className="px-3.5 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 rounded text-xs cursor-pointer transition-colors"
              >
                清空重置
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <footer className="mt-3 pt-3 border-t border-[#12283a] flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>💡 操作指南: WASD 或方向鍵游動，滑鼠左鍵持續發射雷射拆解礦物。游回海面按 [E] 靠港。</span>
        </div>

        <button
          onClick={onStartDive}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded shadow-lg shadow-emerald-900/40 cursor-pointer hover:scale-105 active:scale-95 transition-all text-sm font-mono tracking-wider border border-emerald-400/50"
          title="快捷鍵: 回車鍵 (ENTER)"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>出港深潛 (ENTER)</span>
        </button>
      </footer>
    </div>
  );
};
