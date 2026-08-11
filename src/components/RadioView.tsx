import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Music, Disc, Plus, Youtube, Volume2, Sparkles, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface RadioViewProps {
  partnerName: string;
}

export const RadioView: React.FC<RadioViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const SPOTIFY_PLAYLIST_FULL_URL = 'https://open.spotify.com/playlist/52Fiun5SvbLRCHBpPyitEa?si=0dbf85e6f8fb429c&pt=4bddc171140376f3850ef498f18b30d8';

  // Embed-friendly YouTube video IDs
  const [playlist, setPlaylist] = useState<any[]>([
    {
      title: 'Perfect - Ed Sheeran (Lyric & Audio)',
      artist: 'Romantic Special',
      youtubeId: '2Vv-BfVoq4g',
      type: 'youtube',
      cover: '🌹',
    },
    {
      title: 'Golden Hour - JVKE (Official Music)',
      artist: 'Acoustic Special',
      youtubeId: 'PEM0Vs8jf1w',
      type: 'youtube',
      cover: '✨',
    },
    {
      title: "Harit & Michel's Shared Spotify Playlist",
      artist: 'Harit & Michel • Collaborative Collection',
      spotifyUrl: SPOTIFY_PLAYLIST_FULL_URL,
      type: 'spotify_link',
      cover: '💖',
    },
    {
      title: 'Lofi Chill Beats 24/7 (Live Stream)',
      artist: 'Relaxing Music',
      youtubeId: 'jfKfPfyJRdk',
      type: 'youtube',
      cover: '☕',
    },
    {
      title: 'Die With A Smile - Lady Gaga & Bruno Mars',
      artist: 'Duet Special',
      youtubeId: 'kPa7bsKwL-c',
      type: 'youtube',
      cover: '🎵',
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

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() && !inputTitle.trim()) return;

    triggerHaptic([40, 40]);
    const isSpotify = inputUrl.includes('spotify.com');
    const ytId = extractYouTubeId(inputUrl);

    let newTrack: any;

    if (isSpotify) {
      newTrack = {
        title: inputTitle.trim() || 'Shared Spotify Playlist',
        artist: 'Spotify Collection',
        spotifyUrl: inputUrl.trim(),
        type: 'spotify_link',
        cover: '🎧',
      };
    } else {
      const videoId = ytId || '2Vv-BfVoq4g';
      newTrack = {
        title: inputTitle.trim() || 'Custom YouTube Video',
        artist: 'Added by you ❤️',
        youtubeId: videoId,
        type: 'youtube',
        cover: '🎬',
      };
    }

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
          <p className="text-[11px] text-slate-400 mt-1">YouTube Videos & Spotify • Synced with {partnerName || 'Partner'}</p>
        </div>
        <Sparkles className="w-4 h-4 text-pink-400" />
      </div>

      {/* Main Interactive YouTube Video Player Card */}
      <div className="glass-card rounded-3xl p-4 border border-white/10 w-full flex flex-col items-center justify-center space-y-3 shadow-2xl relative overflow-hidden">
        {/* Track Title & Direct External Button */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-2">
          <div className="text-left space-y-0.5 max-w-[220px]">
            <div className="inline-flex items-center gap-1 text-[10px] text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full font-medium">
              <Volume2 className="w-3 h-3 text-pink-400" />
              <span>Now Playing</span>
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight truncate">{currentTrack.title}</h2>
            <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
          </div>

          {currentTrack.type === 'youtube' && (
            <a
              href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-pill px-2.5 py-1.5 rounded-xl text-[11px] text-red-400 hover:text-white flex items-center gap-1 border border-red-500/20 transition shrink-0"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Privacy-enhanced youtube-nocookie.com domain with cross-origin referrer policy */}
        {currentTrack.type === 'youtube' ? (
          <div className="w-full rounded-2xl overflow-hidden aspect-video max-h-56 bg-black border border-white/15 shadow-xl relative">
            <iframe
              key={currentTrack.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&playsinline=1`}
              title={currentTrack.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center space-y-3 w-full">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-xl">
              💖
            </div>
            <a
              href={currentTrack.spotifyUrl || SPOTIFY_PLAYLIST_FULL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
            >
              <span>Open in Spotify App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          <Disc className="w-3 h-3 text-pink-400 animate-spin" />
          <span>Synced playback with {partnerName || 'Partner'}</span>
        </div>
      </div>

      {/* Spotify Launcher Quick Banner */}
      <div className="glass-card rounded-2xl p-3 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🟢</span>
          <span className="text-xs font-bold text-white">Spotify Playlist</span>
        </div>
        <a
          href={SPOTIFY_PLAYLIST_FULL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1 px-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1"
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* PERMANENT PASTE YOUTUBE / SPOTIFY LINK INPUT BOX */}
      <form onSubmit={handleAddLink} className="glass-card rounded-3xl p-4 border border-pink-500/30 space-y-2.5 bg-gradient-to-r from-pink-950/30 to-purple-950/30">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Paste Any YouTube Video Link</span>
        </div>

        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500"
        />

        <div className="flex gap-2">
          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            placeholder="Video Title (optional)"
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

      {/* Featured YouTube Videos & Playlist List */}
      <div className="w-full glass-card rounded-3xl p-4 border border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            YouTube Videos & Music ({playlist.length})
          </span>
          <Youtube className="w-3.5 h-3.5 text-red-500" />
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto">
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
                <div className="flex items-center gap-1">
                  {track.type === 'youtube' ? (
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-semibold">Spotify</span>
                  )}
                  <span className={`text-[10px] ${isActive ? 'text-white/90 font-bold' : 'text-slate-500'}`}>
                    {isActive ? '▶ Playing' : 'Play'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
