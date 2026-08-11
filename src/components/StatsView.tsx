import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Calendar, Sparkles, Award, Flame, Star } from 'lucide-react';

interface StatsViewProps {
  partnerName: string;
  userName: string;
  totalTouches: number;
}

export const StatsView: React.FC<StatsViewProps> = ({ partnerName, userName, totalTouches }) => {
  const { t } = useTranslation();

  const milestones = [
    { title: 'First Touch Sent', date: 'Aug 11, 2026', icon: '❤️' },
    { title: 'Connected Couples', date: 'Day 1', icon: '🔒' },
    { title: '100 Touches Sent', date: 'Unlocking soon', icon: '🔥' },
    { title: '1 Month Anniversary', date: 'Sep 11, 2026', icon: '🎉' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border border-pink-500/20 text-center space-y-2 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-accent-bg text-white shadow-lg shadow-pink-500/25 mb-1">
          <Heart className="w-6 h-6 fill-white" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">{userName} & {partnerName}</h2>
        <p className="text-xs text-pink-300 font-medium">{t('app.tagline')}</p>
      </div>

      {/* Primary Counter Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-3xl p-5 border border-white/10 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 mx-auto flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">1</p>
          <p className="text-xs text-slate-400 font-medium">{t('stats.days_together')}</p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-white/10 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-2">
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">{Math.max(totalTouches, 12)}</p>
          <p className="text-xs text-slate-400 font-medium">{t('stats.total_touches')}</p>
        </div>
      </div>

      {/* Love Meter Card */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Connection Strength</span>
          </span>
          <span className="text-xs font-mono font-bold text-pink-400">99.8%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div className="h-full gradient-accent-bg rounded-full w-[99.8%] animate-pulse" />
        </div>
      </div>

      {/* Milestones List */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-pink-400" />
            <span>Milestones & Badges</span>
          </h3>
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        </div>

        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.title} className="glass-pill p-3 rounded-2xl flex items-center justify-between text-xs border border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-lg">{m.icon}</span>
                <div>
                  <p className="font-semibold text-slate-200">{m.title}</p>
                  <p className="text-[10px] text-slate-400">{m.date}</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full">Unlocked</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
