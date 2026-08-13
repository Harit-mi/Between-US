import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Disc, Plus, Youtube, Volume2, Sparkles, Play, Pause, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface RadioViewProps {
  partnerName: string;
  coupleCode?: string;
  currentUserName?: string;
}

export const RadioView: React.FC<RadioViewProps> = ({ partnerName, coupleCode = 'LOVE26', currentUserName = 'Harit' }) => {
  const { t } = useTranslation();
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [syncedBy, setSyncedBy] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synced Romantic Playlist (Web Audio + YouTube Streams)
  const [playlist, setPlaylist] = useState<any[]>([
    {
      title: 'Lofi Chill Beats 24/7 (Live Stream)',
      artist: 'Relaxing Romantic Lofi',
      youtubeId: 'jfKfPfyJRdk',
      audioUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv', // Web audio stream for 100% web background play
      type: 'youtube',
      cover: '☕',
    },
    {
      title: 'Perfect - Ed Sheeran (Acoustic)',
      artist: 'Ed Sheeran',
      youtubeId: '2Vv-BfVoq4g',
      audioUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      type: 'youtube',
      cover: '🌹',
    },
    {
      title: 'Golden Hour - JVKE (Piano Instrumental)',
      artist: 'JVKE',
      youtubeId: 'PEM0Vs8jf1w',
      type: 'youtube',
      cover: '✨',
    },
    {
      title: 'Die With A Smile - Lady Gaga & Bruno Mars',
      artist: 'Lady Gaga & Bruno Mars',
      youtubeId: 'kPa7bsKwL-c',
      type: 'youtube',
      cover: '🎵',
    },
    {
      title: 'Acoustic Love Songs Stream',
      artist: '24/7 Radio Stream',
      youtubeId: '5qap5aO4i9A',
      audioUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      type: 'audio',
      cover: '💖',
    },
  ]);

  // Input states for adding custom song links
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Configure MediaSession for Native Browser Background Audio Playback
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: `Between Us Radio • Synced with ${partnerName || 'Michel'}`,
          artwork: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
        });

        navigator.mediaSession.setActionHandler('play', () => handleSetPlaying(true, true));
        navigator.mediaSession.setActionHandler('pause', () => handleSetPlaying(false, true));
      } catch (err) {
        console.warn('MediaSession error:', err);
      }
    }
  }, [currentTrack, partnerName]);

  // Real-Time Supabase Sync Broadcast Channel
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel(`radio_sync_${coupleCode}`);

    channel
      .on('broadcast', { event: 'radio_state' }, (payload) => {
        const { trackIndex, playing, sender } = payload.payload;
        if (sender !== currentUserName) {
          triggerHaptic([30, 30]);
          setCurrentTrackIndex(trackIndex);
          setIsPlaying(playing);
          setSyncedBy(sender);
          setTimeout(() => setSyncedBy(null), 4000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleCode, currentUserName]);

  // Broadcast track selection to partner
  const broadcastSync = (newIndex: number, newPlaying: boolean) => {
    if (isSupabaseConfigured) {
      const channel = supabase.channel(`radio_sync_${coupleCode}`);
      channel.send({
        type: 'broadcast',
        event: 'radio_state',
        payload: {
          trackIndex: newIndex,
          playing: newPlaying,
          sender: currentUserName,
          timestamp: Date.now(),
        },
      });
    }
  };

  const handleSelectTrack = (idx: number) => {
    triggerHaptic(40);
    setCurrentTrackIndex(idx);
    setIsPlaying(true);
    broadcastSync(idx, true);
  };

  const handleSetPlaying = (playing: boolean, userInitiated = true) => {
    if (userInitiated) triggerHaptic(40);
    setIsPlaying(playing);
    broadcastSync(currentTrackIndex, playing);
  };

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
    const ytId = extractYouTubeId(inputUrl);
    const videoId = ytId || '2Vv-BfVoq4g';

    const newTrack = {
      title: inputTitle.trim() || 'Custom YouTube Video',
      artist: `Added by ${currentUserName} ❤️`,
      youtubeId: videoId,
      type: 'youtube',
      cover: '🎬',
    };

    setPlaylist((prev) => [newTrack, ...prev]);
    setCurrentTrackIndex(0);
    setIsPlaying(true);
    broadcastSync(0, true);
    setInputUrl('');
    setInputTitle('');
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto p-4 safe-area-pt space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 glass-pill px-3 py-1 rounded-full border border-pink-500/20 text-xs font-semibold text-pink-300">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>{t('radio.title')}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Real-Time Synced Radio with {partnerName || 'Michel'}</p>
        </div>

        {/* Live Partner Sync Indicator Badge */}
        <div className="flex items-center gap-1.5 glass-pill px-2.5 py-1 rounded-xl text-[10px] text-emerald-300 border border-emerald-500/30">
          <Zap className="w-3 h-3 text-emerald-400 animate-pulse fill-emerald-400" />
          <span>Synced Live</span>
        </div>
      </div>

      {/* Live Sync Notification Toast */}
      {syncedBy && (
        <div className="glass-card rounded-2xl p-3 border border-pink-500/40 bg-gradient-to-r from-pink-950/60 to-purple-950/60 flex items-center gap-2 text-xs text-pink-200 animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{syncedBy} changed the track! Playing together in sync... ❤️</span>
        </div>
      )}

      {/* Main Synced Player Card */}
      <div className="glass-card rounded-3xl p-5 border border-pink-500/30 w-full flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-purple-950/40">
        {/* Track Metadata Header */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
          <div className="text-left space-y-0.5 max-w-[240px]">
            <div className="inline-flex items-center gap-1 text-[10px] text-pink-300 bg-pink-500/10 px-2.5 py-0.5 rounded-full font-medium">
              <Volume2 className="w-3 h-3 text-pink-400" />
              <span>Now Playing Together</span>
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight truncate">{currentTrack.title}</h2>
            <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
          </div>

          <button
            onClick={() => handleSetPlaying(!isPlaying, true)}
            className="w-10 h-10 rounded-2xl gradient-accent-bg flex items-center justify-center text-white shadow-lg shadow-pink-500/30 active:scale-95 transition"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>
        </div>

        {/* Video / Audio Player Frame */}
        <div className="w-full h-[220px] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-xl relative">
          {currentTrack.type === 'youtube' ? (
            <iframe
              key={currentTrack.youtubeId + (isPlaying ? '-play' : '-pause')}
              src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=${isPlaying ? '1' : '0'}&enablejsapi=1&origin=${encodeURIComponent(origin)}`}
              title={currentTrack.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full block border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-pink-950/40 to-slate-900">
              <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-3xl shadow-xl animate-pulse">
                {currentTrack.cover}
              </div>
              <p className="text-xs text-pink-300 font-semibold">Web Audio Live Stream</p>
              <audio
                ref={audioRef}
                src={currentTrack.audioUrl}
                autoPlay={isPlaying}
                controls
                className="w-4/5 h-10"
              />
            </div>
          )}
        </div>

        {/* Real-time Sync Status Bar */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-300 bg-white/5 px-3.5 py-2 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <Disc className={`w-3.5 h-3.5 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} />
            <span>Listening live with {partnerName || 'Michel'}</span>
          </div>

          <button
            onClick={() => broadcastSync(currentTrackIndex, isPlaying)}
            className="flex items-center gap-1 text-[10px] text-pink-300 hover:text-white font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-Sync</span>
          </button>
        </div>
      </div>

      {/* PERMANENT PASTE YOUTUBE / AUDIO LINK INPUT BOX */}
      <form onSubmit={handleAddLink} className="glass-card rounded-3xl p-4 border border-pink-500/30 space-y-2.5 bg-gradient-to-r from-pink-950/30 to-purple-950/30">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Add Song / Video to Shared Radio</span>
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
            placeholder="Song Title (optional)"
            className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl gradient-accent-bg text-white font-semibold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add & Sync</span>
          </button>
        </div>
      </form>

      {/* Shared Playlist List */}
      <div className="w-full glass-card rounded-3xl p-4 border border-white/10 space-y-2 pb-6">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Shared Radio Playlist ({playlist.length})
          </span>
          <span className="text-[10px] text-pink-300 font-medium">Tap to Play Together</span>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {playlist.map((track, idx) => {
            const isActive = idx === currentTrackIndex;
            return (
              <button
                key={track.title + idx}
                onClick={() => handleSelectTrack(idx)}
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
                  <span className={`text-[10px] ${isActive ? 'text-white/90 font-bold' : 'text-slate-500'}`}>
                    {isActive ? (isPlaying ? '▶ Playing Live' : '⏸ Paused') : 'Play Together'}
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
