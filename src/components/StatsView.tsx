import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Calendar, Sparkles, Award, Flame, Star, Plus, Edit2, Check, Clock } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface StatsViewProps {
  partnerName: string;
  userName: string;
  totalTouches: number;
}

export const StatsView: React.FC<StatsViewProps> = ({ partnerName, userName, totalTouches }) => {
  const { t } = useTranslation();

  // Anniversary date state (persisted in LocalStorage)
  const [anniversaryDate, setAnniversaryDate] = useState<string>(() => {
    try {
      return localStorage.getItem('between_us_anniversary') || '2024-01-01';
    } catch {
      return '2024-01-01';
    }
  });

  const [isEditingDate, setIsEditingDate] = useState(false);

  // Custom Story Milestones (persisted in LocalStorage)
  const [storyEvents, setStoryEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('between_us_story_events');
      return saved
        ? JSON.parse(saved)
        : [
            { id: 's1', title: 'Connected Harit 🇮🇳 & Michel 🇩🇴', date: 'Jan 2024', icon: '💖' },
            { id: 's2', title: 'First End-to-End Encrypted Chat', date: 'Active', icon: '🔒' },
          ];
    } catch {
      return [];
    }
  });

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // Save anniversary date when updated
  useEffect(() => {
    try {
      localStorage.setItem('between_us_anniversary', anniversaryDate);
    } catch {}
  }, [anniversaryDate]);

  // Save story events when updated
  useEffect(() => {
    try {
      localStorage.setItem('between_us_story_events', JSON.stringify(storyEvents));
    } catch {}
  }, [storyEvents]);

  // Calculate live days together dynamically from anniversary date
  const calculateDaysTogether = () => {
    try {
      const start = new Date(anniversaryDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const daysTogether = calculateDaysTogether();

  const handleAddStoryEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    triggerHaptic(40);
    const newEv = {
      id: 'story-' + Date.now(),
      title: newEventTitle.trim(),
      date: newEventDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      icon: '✨',
    };

    setStoryEvents((prev) => [newEv, ...prev]);
    setNewEventTitle('');
    setNewEventDate('');
    setIsAddingEvent(false);
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto p-4 safe-area-pt space-y-4 overflow-y-auto pb-12">
      {/* Top Banner Header */}
      <div className="glass-card rounded-3xl p-5 border border-pink-500/20 text-center space-y-2 relative overflow-hidden bg-gradient-to-b from-pink-950/40 via-slate-900/80 to-purple-950/40">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-accent-bg text-white shadow-lg shadow-pink-500/25 mb-1">
          <Heart className="w-6 h-6 fill-white animate-heart-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">{userName || 'Harit'} & {partnerName || 'Michel'}</h2>
        <p className="text-xs text-pink-300 font-medium">Our Story & Shared Milestones ❤️</p>
      </div>

      {/* Days Together Counter & Anniversary Picker */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Days Together</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic(40);
              setIsEditingDate(!isEditingDate);
            }}
            className="text-[11px] text-pink-300 hover:text-white flex items-center gap-1 font-medium glass-pill px-2.5 py-1 rounded-xl"
          >
            {isEditingDate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit2 className="w-3 h-3 text-pink-400" />}
            <span>{isEditingDate ? 'Done' : 'Set Date'}</span>
          </button>
        </div>

        {/* Big Days Counter */}
        <div className="text-center py-2">
          <p className="text-5xl font-extrabold text-white tracking-tight gradient-accent-text">{daysTogether}</p>
          <p className="text-xs text-slate-400 mt-1">Days of love between Ahmedabad 🇮🇳 & Santo Domingo 🇩🇴</p>
        </div>

        {/* Date Edit Input Box */}
        {isEditingDate && (
          <div className="pt-2 border-t border-white/10 space-y-2 animate-in fade-in zoom-in duration-150">
            <label className="text-[10px] text-slate-400 block font-medium">Select your Anniversary / Relationship Start Date:</label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-pink-500/40 text-white text-xs focus:outline-none focus:border-pink-500"
            />
          </div>
        )}
      </div>

      {/* Primary Counter Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-3xl p-4 border border-white/10 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-1">
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">{totalTouches}</p>
          <p className="text-[11px] text-slate-400 font-medium">{t('stats.total_touches')}</p>
        </div>

        <div className="glass-card rounded-3xl p-4 border border-white/10 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-1">
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">100%</p>
          <p className="text-[11px] text-slate-400 font-medium">Connection Sync</p>
        </div>
      </div>

      {/* Our Story Events & Timeline */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3 pb-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-pink-400" />
            <span>Our Relationship Timeline ({storyEvents.length})</span>
          </h3>
          <button
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="py-1 px-2.5 rounded-xl gradient-accent-bg text-white text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-3 h-3" />
            <span>Add Event</span>
          </button>
        </div>

        {/* Add Event Form */}
        {isAddingEvent && (
          <form onSubmit={handleAddStoryEvent} className="p-3 rounded-2xl bg-white/5 border border-pink-500/30 space-y-2 animate-in fade-in zoom-in duration-150">
            <input
              type="text"
              required
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Event title (e.g. Met for the first time)"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                placeholder="Date (e.g. Feb 14, 2024)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl gradient-accent-bg text-white font-semibold text-xs"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {storyEvents.map((ev) => (
            <div key={ev.id} className="glass-pill p-3 rounded-2xl flex items-center justify-between text-xs border border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-lg">{ev.icon}</span>
                <div>
                  <p className="font-semibold text-slate-200">{ev.title}</p>
                  <p className="text-[10px] text-slate-400">{ev.date}</p>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
