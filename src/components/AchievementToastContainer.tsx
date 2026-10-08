import React from 'react';
import { AchievementToast } from '../types/game';
import { Award, Sparkles, X } from 'lucide-react';

interface AchievementToastContainerProps {
  toasts: AchievementToast[];
  onDismiss: (id: string) => void;
}

export const AchievementToastContainer: React.FC<AchievementToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none select-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#04111d]/95 border-2 border-amber-400/90 rounded-lg p-3.5 shadow-[0_0_25px_rgba(255,193,7,0.35)] backdrop-blur-md text-white animate-bounce-short transition-all overflow-hidden relative"
        >
          {/* Top shimmer accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />

          <div className="flex items-start gap-3">
            {/* Animated Trophy / Icon Badge */}
            <div className="w-11 h-11 shrink-0 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/30 border border-amber-400/60 flex items-center justify-center text-2xl shadow-inner relative">
              <span>{toast.achievement.icon}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-spin text-xs" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono tracking-wider font-extrabold text-amber-400 uppercase flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400 inline" /> 成就達成 UNLOCKED!
                </span>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-gray-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-sm font-bold text-slate-100 font-mono tracking-wide truncate mt-0.5">
                {toast.achievement.title}
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 leading-snug">
                {toast.achievement.desc}
              </p>

              {toast.achievement.rewardText && (
                <div className="mt-1.5 inline-block text-[11px] font-mono font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded">
                  獎勵: {toast.achievement.rewardText}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
