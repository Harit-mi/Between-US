import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Play, Pause, SkipForward, Music, Disc, Plus, X, Youtube, Link as LinkIcon } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface RadioViewProps {
  partnerName: string;
}

export const RadioView: React.FC<RadioViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Free pre-loaded streams (No Spotify Premium needed!) + User added tracks
  const [playlist, setPlaylist] = useState<any[]>([
    {
      title: 'Lofi Girl - Chill Beats 24/7',
      artist: 'Free Live Stream',
      youtubeId: 'jfKfPfyJRdk',
      cover: '☕',
      type: 'youtube',
    },
    {
      title: 'Romantic Piano & Acoustic',
      artist: 'Free Web Radio',
      youtubeId: '4xDzrJKXOOY',
      cover: '🌹',
      type: 'youtube',
    },
    {
      title: 'Midnight Jazz & Rain',
      artist: 'Relaxing Vibes',
      youtubeId: '5qap5aO4i9A',
      cover: '🌙',
      type: 'youtube',
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const currentTrack = playlist[currentTrackIndex] || null;

  // Extract YouTube Video ID from any YouTube URL format
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

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
    const ytId = extractYouTubeId(newUrl);

    const track = {
      title: newTitle.trim(),
      artist: ytId ? 'YouTube Stream' : 'Custom Web Track',
      youtubeId: ytId || 'jfKfPfyJRdk',
      cover: ytId ? '🎬' : '🎵',
      type: ytId ? 'youtube' : 'custom',
    };

    setPlaylist((prev) => [track, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-4">
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
          <span>{isAdding ? 'Close' : 'Add YouTube Song'}</span>
        </button>
      </div>

      {/* Add YouTube / Audio Track Form */}
      {isAdding && (
        <form onSubmit={handleAddTrack} className="w-full glass-card rounded-3xl p-5 border border-pink-500/30 space-y-3 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Add Song (No Premium Needed!)</span>
            </h3>
          </div>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Song Name (e.g. Perfect - Ed Sheeran)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
          />

          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=...)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
          />

          <p className="text-[10px] text-slate-400">
            💡 <strong>100% Free:</strong> Paste any YouTube song link! Works on all phones without Spotify Premium or paid accounts.
          </p>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20 mt-1"
          >
            Add & Play Together
          </button>
        </form>
      )}

      {/* Embedded Free Player Card */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 w-full flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden">
        {currentTrack && currentTrack.youtubeId ? (
          <div className="w-full rounded-2xl overflow-hidden aspect-video bg-black/60 border border-white/10 shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1`}
              title={currentTrack.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div
              className={`w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-2xl transition-transform duration-1000 ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
            >
              <div className="w-14 h-14 rounded-full gradient-accent-bg flex items-center justify-center text-xl shadow-inner">
                {currentTrack?.cover || '📻'}
              </div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-slate-950 border border-white/20" />
            </div>
          </div>
        )}

        {/* Track Details */}
        <div className="text-center space-y-0.5">
          <h2 className="text-base font-bold text-white tracking-tight">
            {currentTrack ? currentTrack.title : 'No Song Selected'}
          </h2>
          <p className="text-xs text-pink-300 font-medium">
            {currentTrack ? currentTrack.artist : 'Add any YouTube link!'}
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
            Our Playlist ({playlist.length})
          </span>
          <Music className="w-3.5 h-3.5 text-pink-400" />
        </div>

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
                <div className="flex items-center gap-2.5 truncate max-w-[240px]">
                  <span>{track.cover}</span>
                  <div className="text-left truncate">
                    <p className="font-medium leading-none mb-0.5 truncate">{track.title}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{track.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-pink-300">
                  {track.youtubeId && <Youtube className="w-3 h-3 text-red-400" />}
                  <span>{isActive ? 'Playing' : 'Play'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
