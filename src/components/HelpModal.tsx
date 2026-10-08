import React from 'react';
import { X, Navigation, Crosshair, Sparkles, AlertCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#051421] border border-[#00f0ff]/50 rounded-xl max-w-lg w-full p-5 text-gray-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded hover:bg-[#122e42] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 border-b border-[#14354c] pb-3">
          <span className="text-2xl">🐢</span>
          <div>
            <h2 className="text-lg font-bold text-[#4ef2bb] font-mono">
              《龜龜深潛者》潛航指南
            </h2>
            <p className="text-xs text-gray-400">Shelldiver Abyss Operations Manual</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Core Loop */}
          <div className="p-3 rounded bg-[#081e30] border border-[#16405e]">
            <div className="font-bold text-cyan-300 text-sm mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> 核心遊玩循環
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>
                <strong>潛入深淵</strong>：控制海龜往深海探索，越深處水母與礦石價值越高。
              </li>
              <li>
                <strong>捕撈水母</strong>：游向水母直接觸碰收進海藻背包。
              </li>
              <li>
                <strong>雷射採礦</strong>：長按滑鼠左鍵瞄準發射高溫拆解光束，粉碎礦岩與沉船遺物。
              </li>
              <li>
                <strong>及時返航</strong>：在氧氣耗盡前游回海面，按 <kbd className="bg-black/40 px-1 py-0.5 rounded text-amber-300">E</kbd> 靠港母艦售出海產並升級天賦！
              </li>
            </ol>
          </div>

          {/* Section 2: Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#081e30] border border-[#16405e]">
              <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" /> 移動操控
              </div>
              <ul className="space-y-1 text-gray-300">
                <li><kbd className="bg-black/40 px-1 rounded text-cyan-300">W</kbd> <kbd className="bg-black/40 px-1 rounded text-cyan-300">A</kbd> <kbd className="bg-black/40 px-1 rounded text-cyan-300">S</kbd> <kbd className="bg-black/40 px-1 rounded text-cyan-300">D</kbd> / 方向鍵游動</li>
                <li>具備水中慣性與流體阻尼手感</li>
              </ul>
            </div>

            <div className="p-3 rounded bg-[#081e30] border border-[#16405e]">
              <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-rose-400" /> 雷射與射擊
              </div>
              <ul className="space-y-1 text-gray-300">
                <li>滑鼠游標瞄準轉向</li>
                <li>按住 <strong>滑鼠左鍵</strong> 持續照射開採</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Dangerous Depth Warning */}
          <div className="p-3 rounded bg-red-950/30 border border-red-800/60 text-red-200">
            <div className="font-bold text-sm mb-1 flex items-center gap-1.5 text-red-400">
              <AlertCircle className="w-4 h-4" /> 氧氣與深海高壓警告
            </div>
            <p>
              海水深度每加深 1,000 米，巨大水壓將加劇氧氣消耗！請適時升級【抗壓合金龜殼】降低耗氧速率。若氧氣耗盡，母艦將啟動緊急彈射彈回海面，但會<strong>遺失 40% 的背包收穫</strong>！
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#14354c] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#127a69] hover:bg-[#159a85] text-white font-bold rounded text-xs transition-colors cursor-pointer"
          >
            我明白了，開始冒險
          </button>
        </div>
      </div>
    </div>
  );
};
