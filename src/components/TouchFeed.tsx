import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface TouchFeedProps {
  touches: any[];
  currentUserId: string;
  partnerName: string;
}

export const TouchFeed: React.FC<TouchFeedProps> = ({ touches, currentUserId, partnerName }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'es' ? es : enUS;

  const getTouchLabel = (touch: any) => {
    const emoji = touch.touch_type?.emoji || touch.emoji || '❤️';
    const rawName = touch.touch_type?.name_en || touch.name || 'Love';
    // Translate touch type name
    const translatedName = t(`touch.${rawName}`, { defaultValue: rawName });
    return { emoji, name: translatedName };
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{t('home.history_title')}</span>
        </h3>
        <span className="text-[11px] font-medium text-slate-500 bg-white/5 px-2.5 py-0.5 rounded-full">
          {touches.length}
        </span>
      </div>

      {touches.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
          <Heart className="w-6 h-6 text-slate-600" />
          <p>{t('home.no_touches')}</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {touches.map((item) => {
            const isMe = item.sender_id === currentUserId;
            const { emoji, name } = getTouchLabel(item);
            
            let timeAgo = '';
            try {
              timeAgo = formatDistanceToNow(new Date(item.created_at || Date.now()), {
                addSuffix: true,
                locale: dateLocale,
              });
            } catch {
              timeAgo = 'just now';
            }

            return (
              <div
                key={item.id || Math.random()}
                className={`p-3 rounded-2xl glass-pill flex items-center justify-between text-xs transition ${
                  isMe ? 'border-l-2 border-l-pink-500/50' : 'border-l-2 border-l-rose-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{emoji}</span>
                  <div>
                    <p className="font-medium text-slate-200">
                      {isMe
                        ? t('home.you_sent', { emoji: '', name })
                        : t('home.partner_sent', { name: partnerName, emoji: '', type: name })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-2">{timeAgo}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
