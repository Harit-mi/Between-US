import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Music, Disc, Plus, Youtube, Volume2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface RadioViewProps {
  partnerName: string;
}

export const RadioView: React.FC<RadioViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Pre-loaded popular romantic tracks & live streams
  const [playlist, setPlaylist] = useState<any[]>([
    {
      title: 'Lofi Chill Beats 24/7',
      artist: 'Free Live Radio',
      youtubeId: 'jfKfPfyJRdk',
      cover: '☕',
    },
    {
      title: 'Perfect - Ed Sheeran',
      artist: 'Romantic Special',
      youtubeId: '2Vv-BfVoq4g',
      cover: '🌹',
    },
    {
      title: 'Golden Hour - JVKE',
      artist: 'Acoustic Version',
      youtubeId: 'PEM0Vs8jf1w',
      cover: '✨',
    },
  ]);

  // Input states for adding song links directly
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Helper to parse YouTube video IDs
  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() && !inputTitle.trim()) return;

    triggerHaptic([40, 40]);
    const ytId = extractYouTubeId(inputUrl) || 'jfKfPfyJRdk';
    const title = inputTitle.trim() || (ytId ? 'Custom YouTube Song' : 'Our Song');

    const newTrack = {
      title,
      artist: 'Added by you ❤️',
      youtubeId: ytId,
      cover: '🎬',
    };

    setPlaylist((prev) => [newTrack, ...prev]);
    setCurrentTrackIndex(0);
    setInputUrl('');
    setInputTitle('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-1 rounded-full border border-pink-500/20 text-xs font-semibold text-pink-300">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{t('radio.title')}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">100% Free Music • Synced with {partnerName || 'Partner'}</p>
        </div>
        <Sparkles className="w-4 h-4 text-pink-400" />
      </div>

      {/* PERMANENT PASTE LINK INPUT BOX (Always visible!) */}
      <form onSubmit={handleAddSong} className="glass-card rounded-3xl p-4 border border-pink-500/30 space-y-2.5 bg-gradient-to-r from-pink-950/30 to-purple-950/30">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Paste Any YouTube Song Link</span>
        </div>

        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste YouTube URL here (e.g. https://www.youtube.com/watch?v=...)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500"
        />

        <div className="flex gap-2">
          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            placeholder="Song Title (optional)"
            className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl gradient-accent-bg text-white font-semibold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Main Interactive Music Player Card */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 w-full flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden">
        {/* Track Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1 text-[10px] text-pink-300 bg-pink-500/10 px-2.5 py-0.5 rounded-full font-medium">
            <Volume2 className="w-3 h-3 text-pink-400" />
            <span>Now Playing</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{currentTrack.title}</h2>
          <p className="text-xs text-slate-400">{currentTrack.artist}</p>
        </div>

        {/* Embedded Interactive YouTube Audio Player (Tappable for audio!) */}
        <div className="w-full rounded-2xl overflow-hidden aspect-video bg-black border border-white/15 shadow-xl relative">
          <iframe
            src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&playsinline=1`}
            title={currentTrack.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          <Disc className="w-3.5 h-3.5 text-pink-400 animate-spin" />
          <span>Tap video controls above to adjust volume</span>
        </div>
      </div>

      {/* Shared Playlist List */}
      <div className="w-full glass-card rounded-3xl p-4 border border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Our Playlist ({playlist.length})
          </span>
          <Music className="w-3.5 h-3.5 text-pink-400" />
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {playlist.map((track, idx) => {
            const isActive = idx === currentTrackIndex;
            return (
              <button
                key={track.title + idx}
                onClick={() => {
                  triggerHaptic(40);
                  setCurrentTrackIndex(idx);
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
                <span className={`text-[10px] ${isActive ? 'text-white/90 font-bold' : 'text-slate-500'}`}>
                  {isActive ? '▶ Playing' : 'Play'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
