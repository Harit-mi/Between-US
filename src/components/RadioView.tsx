import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Play, Pause, SkipForward, Music, Disc, Plus, X } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface RadioViewProps {
  partnerName: string;
}

export const RadioView: React.FC<RadioViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Users manage their own shared playlist
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');

  const currentTrack = playlist[currentTrackIndex] || null;

  const togglePlay = () => {
    if (!currentTrack) return;
    triggerHaptic(50);
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    if (playlist.length === 0) return;
    triggerHaptic(40);
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    triggerHaptic([40, 40]);
    const emojis = ['🎵', '🎶', '🎷', '🎸', '🎹', '💖', '🌹'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    const track = {
      title: newTitle.trim(),
      artist: newArtist.trim() || 'Our Special Song',
      cover: randomEmoji,
      duration: '3:30',
    };

    setPlaylist((prev) => [...prev, track]);
    if (playlist.length === 0) {
      setCurrentTrackIndex(0);
    }
    setNewTitle('');
    setNewArtist('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-1 rounded-full border border-pink-500/20 text-xs font-semibold text-pink-300">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{t('radio.title')}</span>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="py-1.5 px-3 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20 flex items-center gap-1 active:scale-95 transition"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? 'Close' : 'Add Song'}</span>
        </button>
      </div>

      {/* Add Track Form */}
      {isAdding && (
        <form onSubmit={handleAddTrack} className="w-full glass-card rounded-3xl p-5 border border-pink-500/30 space-y-3 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xs font-semibold text-pink-300 uppercase tracking-wider">Add Song to Our Playlist</h3>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Song Title (e.g. Perfect)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
          />

          <input
            type="text"
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            placeholder="Artist / Special Note (e.g. Ed Sheeran)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20 mt-1"
          >
            Add to Playlist
          </button>
        </form>
      )}

      {/* Vinyl Art Display */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 w-full flex flex-col items-center justify-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <div
            className={`w-40 h-40 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-2xl transition-transform duration-1000 ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '6s' }}
          >
            <div className="w-16 h-16 rounded-full gradient-accent-bg flex items-center justify-center text-2xl shadow-inner">
              {currentTrack?.cover || '📻'}
            </div>
            <div className="absolute w-4 h-4 rounded-full bg-slate-950 border border-white/20" />
          </div>
        </div>

        {/* Track Details */}
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">
            {currentTrack ? currentTrack.title : 'No Songs Added Yet'}
          </h2>
          <p className="text-xs text-pink-300 font-medium">
            {currentTrack ? currentTrack.artist : 'Tap "Add Song" above to create your shared playlist!'}
          </p>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
          <span>Synced with {partnerName || 'Partner'}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 pt-1">
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="w-12 h-12 rounded-2xl gradient-accent-bg flex items-center justify-center text-white shadow-xl shadow-pink-500/30 disabled:opacity-30 hover:scale-105 active:scale-95 transition"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={handleNextTrack}
            disabled={playlist.length <= 1}
            className="p-3 rounded-2xl glass-pill border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 transition active:scale-95"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playlist Selector */}
      <div className="w-full glass-card rounded-3xl p-4 border border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('radio.select_track')} ({playlist.length})
          </span>
          <Music className="w-3.5 h-3.5 text-pink-400" />
        </div>

        {playlist.length === 0 ? (
          <p className="text-center text-slate-500 text-xs py-4">Your playlist is empty. Add your favorite romantic songs!</p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {playlist.map((track, idx) => {
              const isActive = idx === currentTrackIndex;
              return (
                <button
                  key={track.title + idx}
                  onClick={() => {
                    triggerHaptic(40);
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-xs transition ${
                    isActive
                      ? 'gradient-accent-bg text-white font-semibold shadow-md shadow-pink-500/20'
                      : 'glass-pill text-slate-300 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{track.cover}</span>
                    <div className="text-left truncate max-w-[200px]">
                      <p className="font-medium leading-none mb-0.5 truncate">{track.title}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{track.artist}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{track.duration}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
