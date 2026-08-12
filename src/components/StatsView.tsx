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
    { title: 'First Touch Sent', date: 'Today', icon: '❤️', unlocked: totalTouches > 0 },
    { title: 'Connected Couple World', date: 'Active', icon: '🔒', unlocked: true },
    { title: '10 Touches Milestone', date: totalTouches >= 10 ? 'Unlocked' : `${totalTouches}/10`, icon: '🔥', unlocked: totalTouches >= 10 },
    { title: '50 Touches Master', date: totalTouches >= 50 ? 'Unlocked' : `${totalTouches}/50`, icon: '🎉', unlocked: totalTouches >= 50 },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto p-4 safe-area-pt space-y-4 overflow-y-auto pb-12">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border border-pink-500/20 text-center space-y-2 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-accent-bg text-white shadow-lg shadow-pink-500/25 mb-1">
          <Heart className="w-6 h-6 fill-white animate-heart-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">{userName || 'Harit'} & {partnerName || 'Michel'}</h2>
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
          <p className="text-3xl font-extrabold text-white tracking-tight">{totalTouches}</p>
          <p className="text-xs text-slate-400 font-medium">{t('stats.total_touches')}</p>
        </div>
      </div>

      {/* Connection Strength */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Connection Strength</span>
          </span>
          <span className="text-xs font-mono font-bold text-pink-400">
            {Math.min(100, Math.max(50, totalTouches * 10))}%
          </span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full gradient-accent-bg rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, Math.max(50, totalTouches * 10))}%` }}
          />
        </div>
      </div>

      {/* Milestones List */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3 pb-8">
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
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                m.unlocked ? 'text-pink-300 bg-pink-500/10' : 'text-slate-500 bg-white/5'
              }`}>
                {m.unlocked ? 'Unlocked' : 'In Progress'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
