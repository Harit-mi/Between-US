import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

interface TouchOverlayProps {
  touchData: {
    emoji: string;
    senderName: string;
    typeEn: string;
    typeEs: string;
  } | null;
  onDismiss: () => void;
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({ touchData, onDismiss }) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (touchData) {
      // Fire subtle heart confetti
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ff4d6d', '#ff8fab', '#ffffff'],
          shapes: ['circle'],
          scalar: 1.2,
        });
      } catch {
        // Fallback if confetti unavailable
      }

      // Auto dismiss after 2.8s
      const timer = setTimeout(() => {
        onDismiss();
      }, 2800);

      return () => clearTimeout(timer);
    }
  }, [touchData, onDismiss]);

  if (!touchData) return null;

  // Translate notification message in receiver's own active language
  const touchKeyMap: Record<string, string> = {
    'Love': 'sent_love',
    'Hug': 'sent_hug',
    'Kiss': 'sent_kiss',
    'Miss you': 'misses_you',
  };

  const key = touchKeyMap[touchData.typeEn] || 'sent_love';
  const actionText = t(`touch.${key}`);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl cursor-pointer select-none p-4"
    >
      <div className="animate-overlay-bounce flex flex-col items-center text-center space-y-6">
        {/* Animated Big Emoji */}
        <div className="relative">
          <div className="absolute inset-0 bg-pink-500/30 rounded-full blur-3xl animate-pulse" />
          <span className="relative text-8xl sm:text-9xl drop-shadow-[0_10px_25px_rgba(255,77,109,0.5)]">
            {touchData.emoji}
          </span>
        </div>

        {/* Sender Name & Action Text */}
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {touchData.senderName}
          </p>
          <p className="text-lg sm:text-xl font-medium text-pink-300">
            {actionText}
          </p>
        </div>

        <span className="text-xs text-slate-500 font-medium">Tap anywhere to close</span>
      </div>
    </div>
  );
};
