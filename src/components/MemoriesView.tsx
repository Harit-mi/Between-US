import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Plus, Heart, Sparkles, Calendar } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface MemoriesViewProps {
  partnerName: string;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();
  const [memories, setMemories] = useState<any[]>([
    {
      id: 'mem-1',
      title: 'Our First Sunset Together 🌅',
      date: 'Aug 1, 2026',
      image: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80',
      caption: 'Unforgettable evening watching the sun go down over the horizon.',
      likes: 2,
    },
    {
      id: 'mem-2',
      title: 'Coffee Date & Long Talks ☕',
      date: 'Jul 24, 2026',
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
      caption: 'Hours flew by like minutes. Best coffee date ever.',
      likes: 4,
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    triggerHaptic([40, 40]);
    const mockImages = [
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
    ];

    const newMem = {
      id: 'mem-' + Date.now(),
      title: newTitle.trim(),
      date: 'Today',
      image: mockImages[Math.floor(Math.random() * mockImages.length)],
      caption: newCaption.trim() || 'A special moment saved forever ❤️',
      likes: 1,
    };

    setMemories((prev) => [newMem, ...prev]);
    setNewTitle('');
    setNewCaption('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>{t('memories.title')}</span>
          </h2>
          <p className="text-[11px] text-slate-400">Captured moments with {partnerName}</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="py-2 px-3 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20 flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('memories.add_memory')}</span>
        </button>
      </div>

      {/* Add Memory Form */}
      {isAdding && (
        <form onSubmit={handleAddMemory} className="glass-card rounded-3xl p-5 border border-pink-500/30 space-y-3 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xs font-semibold text-pink-300 uppercase tracking-wider">New Shared Memory</h3>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Memory title (e.g. Stargazing Night)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
          />

          <textarea
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder={t('memories.caption_placeholder')}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 resize-none"
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-xl glass-pill text-slate-400 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Memories Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {memories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <Image className="w-8 h-8 text-slate-600" />
            <p>{t('memories.empty')}</p>
          </div>
        ) : (
          memories.map((mem) => (
            <div key={mem.id} className="glass-card rounded-3xl overflow-hidden border border-white/10 space-y-3">
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={mem.image}
                  alt={mem.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 right-3 glass-pill px-2.5 py-1 rounded-full text-[10px] text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-pink-400" />
                  <span>{mem.date}</span>
                </div>
              </div>

              <div className="p-4 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{mem.title}</h3>
                  <button
                    onClick={() => {
                      triggerHaptic(50);
                      setMemories((prev) =>
                        prev.map((m) => (m.id === mem.id ? { ...m, likes: m.likes + 1 } : m))
                      );
                    }}
                    className="flex items-center gap-1 text-xs text-pink-400 hover:scale-110 active:scale-95 transition"
                  >
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                    <span>{mem.likes}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{mem.caption}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
