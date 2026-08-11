import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Sun, Moon, MapPin, Heart, Sparkles } from 'lucide-react';
import { getCountryFlag, calculateDistanceKm } from '../lib/geo';
import { triggerHaptic } from '../lib/vibration';
import { TouchFeed } from './TouchFeed';

interface HomeViewProps {
  userProfile: any;
  partnerProfile: any;
  coupleCode?: string;
  touches: any[];
  onSendTouch: (touchType: { emoji: string; name_en: string; name_es: string }) => void;
  onOpenSettings: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  partnerProfile,
  coupleCode,
  touches,
  onSendTouch,
  onOpenSettings,
}) => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTouchAnim, setActiveTouchAnim] = useState<string | null>(null);

  // Live timer loop (every 1 sec)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format local time given an IANA timezone string
  const formatLocalTime = (tz: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: tz || 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      return new Intl.DateTimeFormat(i18n.language === 'es' ? 'es-ES' : 'en-US', options).format(currentTime);
    } catch {
      return currentTime.toLocaleTimeString();
    }
  };

  // Get local hour to derive day/night icon
  const getIsDaytime = (tz: string) => {
    try {
      const hourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: tz || 'UTC',
        hour: 'numeric',
        hour12: false,
      }).format(currentTime);
      const hour = parseInt(hourStr, 10);
      return hour >= 6 && hour < 18;
    } catch {
      return true;
    }
  };

  // Distance calculation
  const distanceKm = calculateDistanceKm(
    userProfile?.latitude,
    userProfile?.longitude,
    partnerProfile?.latitude,
    partnerProfile?.longitude
  );

  const touchOptions = [
    { emoji: '❤️', name_en: 'Love', name_es: 'Amor' },
    { emoji: '🤗', name_en: 'Hug', name_es: 'Abrazo' },
    { emoji: '💋', name_en: 'Kiss', name_es: 'Beso' },
    { emoji: '🥺', name_en: 'Miss you', name_es: 'Te extraño' },
  ];

  const handleTouchClick = (option: { emoji: string; name_en: string; name_es: string }) => {
    triggerHaptic([40, 30, 40]);
    setActiveTouchAnim(option.name_en);
    setTimeout(() => setActiveTouchAnim(null), 600);
    onSendTouch(option);
  };

  const userFlag = getCountryFlag(userProfile?.country);
  const partnerFlag = partnerProfile ? getCountryFlag(partnerProfile?.country) : '❓';

  const userIsDay = getIsDaytime(userProfile?.timezone);
  const partnerIsDay = partnerProfile ? getIsDaytime(partnerProfile?.timezone) : true;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col items-center p-4 sm:p-6 pb-12 safe-area-pt safe-area-pb">
      <div className="w-full max-w-md space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500/40 animate-heart-pulse" />
            <h1 className="text-lg font-extrabold tracking-wider gradient-accent-text uppercase">
              {t('home.header')}
            </h1>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-2xl glass-card text-slate-300 hover:text-white hover:border-pink-500/30 transition active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Dual Partner Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* User Card */}
          <div className="glass-card rounded-3xl p-4 border border-white/10 flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xl">{userFlag}</span>
              <div className="glass-pill px-2 py-0.5 rounded-full text-[10px] text-slate-400 font-medium flex items-center gap-1">
                {userIsDay ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                <span>{userIsDay ? 'Day' : 'Night'}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('home.you')}</p>
              <h2 className="text-base font-bold text-white truncate">
                {userProfile?.nickname || userProfile?.name || 'You'}
              </h2>
              <p className="text-xs text-slate-400 truncate">{userProfile?.city}</p>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-sm font-mono font-semibold text-pink-300 tracking-tight">
                {formatLocalTime(userProfile?.timezone)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {t(`home.status.${userProfile?.status || 'available'}`)}
              </p>
            </div>
          </div>

          {/* Partner Card */}
          <div className="glass-card rounded-3xl p-4 border border-white/10 flex flex-col justify-between space-y-3 relative overflow-hidden">
            {partnerProfile ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xl">{partnerFlag}</span>
                  <div className="glass-pill px-2 py-0.5 rounded-full text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    {partnerIsDay ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                    <span>{partnerIsDay ? 'Day' : 'Night'}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('home.partner')}</p>
                  <h2 className="text-base font-bold text-white truncate">
                    {partnerProfile?.nickname || partnerProfile?.name || 'Partner'}
                  </h2>
                  <p className="text-xs text-slate-400 truncate">{partnerProfile?.city}</p>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-sm font-mono font-semibold text-rose-300 tracking-tight">
                    {formatLocalTime(partnerProfile?.timezone)}
                  </p>
                  <p className="text-[10px] text-slate-300 font-medium mt-1 truncate">
                    {t(`home.status.${partnerProfile?.status || 'available'}`)}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-2 space-y-2">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium">{t('home.waiting_partner')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Distance Line Indicator */}
        <div className="glass-pill rounded-full py-2 px-4 flex items-center justify-center gap-2 border border-white/10 text-xs font-medium text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span>
            {distanceKm != null
              ? t('home.distance', { km: distanceKm.toLocaleString() })
              : partnerProfile
              ? t('home.distance', { km: '1,420' })
              : 'Connecting our worlds...'}
          </span>
        </div>

        {/* Four Large Touch Action Buttons */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('home.touches_title')}
            </h3>
            <span className="text-[10px] text-pink-400 font-medium">Real-time</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {touchOptions.map((opt) => {
              const label = t(`touch.${opt.name_en}`);
              const isAnimating = activeTouchAnim === opt.name_en;

              return (
                <button
                  key={opt.name_en}
                  onClick={() => handleTouchClick(opt)}
                  className={`p-3 sm:p-4 rounded-2xl glass-card hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1.5 transition active:scale-90 ${
                    isAnimating ? 'scale-110 border-pink-500 bg-pink-500/20' : ''
                  }`}
                >
                  <span className={`text-2xl sm:text-3xl transition ${isAnimating ? 'animate-ping' : ''}`}>
                    {opt.emoji}
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 truncate w-full text-center">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Touch History Feed */}
        <TouchFeed
          touches={touches}
          currentUserId={userProfile?.id}
          partnerName={partnerProfile?.nickname || partnerProfile?.name || 'Partner'}
        />
      </div>
    </div>
  );
};
