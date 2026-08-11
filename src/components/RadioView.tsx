import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Play, Pause, SkipForward, Music, Disc } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface RadioViewProps {
  partnerName: string;
}

export const RadioView: React.FC<RadioViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const playlist = [
    { title: 'Golden Hour', artist: 'JVKE', duration: '3:29', cover: '✨' },
    { title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', duration: '4:11', cover: '🌹' },
    { title: 'As It Was', artist: 'Harry Styles', duration: '2:47', cover: '🎵' },
    { title: 'Lover', artist: 'Taylor Swift', duration: '3:41', cover: '💖' },
  ];

  const currentTrack = playlist[currentTrackIndex];

  const togglePlay = () => {
    triggerHaptic(50);
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    triggerHaptic(40);
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="w-full text-center space-y-1">
        <div className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full border border-pink-500/20 text-xs font-semibold text-pink-300">
          <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>{t('radio.title')}</span>
        </div>
        <p className="text-xs text-slate-400">{t('radio.sync_msg')}</p>
      </div>

      {/* Vinyl Art Display */}
      <div className="glass-card rounded-3xl p-8 border border-white/10 w-full flex flex-col items-center justify-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Vinyl Disc Spin Animation */}
          <div
            className={`w-44 h-44 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-2xl transition-transform duration-1000 ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '6s' }}
          >
            <div className="w-20 h-20 rounded-full gradient-accent-bg flex items-center justify-center text-3xl shadow-inner">
              {currentTrack.cover}
            </div>
            <div className="absolute w-4 h-4 rounded-full bg-slate-950 border border-white/20" />
          </div>
        </div>

        {/* Track Details */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">{currentTrack.title}</h2>
          <p className="text-xs text-pink-300 font-medium">{currentTrack.artist}</p>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
          <span>Listening together with {partnerName}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-2xl gradient-accent-bg flex items-center justify-center text-white shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
          </button>

          <button
            onClick={handleNextTrack}
            className="p-3.5 rounded-2xl glass-pill border border-white/10 text-slate-300 hover:text-white hover:border-pink-500/30 transition active:scale-95"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Playlist Selector */}
      <div className="w-full glass-card rounded-3xl p-4 border border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('radio.select_track')}
          </span>
          <Music className="w-3.5 h-3.5 text-pink-400" />
        </div>

        <div className="space-y-1.5">
          {playlist.map((track, idx) => {
            const isActive = idx === currentTrackIndex;
            return (
              <button
                key={track.title}
                onClick={() => {
                  triggerHaptic(40);
                  setCurrentTrackIndex(idx);
                  setIsPlaying(true);
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs transition ${
                  isActive
                    ? 'gradient-accent-bg text-white font-semibold shadow-md shadow-pink-500/20'
                    : 'glass-pill text-slate-300 border border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{track.cover}</span>
                  <div className="text-left">
                    <p className="font-medium leading-none mb-0.5">{track.title}</p>
                    <p className={`text-[10px] ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{track.artist}</p>
                  </div>
                </div>
                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{track.duration}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
