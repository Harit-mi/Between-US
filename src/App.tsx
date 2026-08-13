import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { RadioView } from './components/RadioView';
import { MemoriesView } from './components/MemoriesView';
import { StatsView } from './components/StatsView';
import { TouchOverlay } from './components/TouchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { triggerHaptic, sendBrowserNotification, playTouchChimeSound } from './lib/vibration';
import { Heart, MessageCircle, Radio as RadioIcon, Image, Sparkles } from 'lucide-react';

export function App() {
  const { t, i18n } = useTranslation();

  // Profile: Harit in Ahmedabad, India 🇮🇳 | Michel in Santo Domingo, Dominican Republic 🇩🇴
  const defaultUser = { id: 'user-harit-123', email: 'harit@betweenus.app' };
  const defaultProfile = {
    id: 'user-harit-123',
    name: 'Harit',
    nickname: 'Amor',
    country: 'India',
    city: 'Ahmedabad',
    latitude: 23.0225,
    longitude: 72.5714,
    language: 'en',
    timezone: 'Asia/Kolkata',
    status: 'available',
  };

  const defaultPartner = {
    id: 'partner-michel-456',
    name: 'Michel',
    nickname: 'Michel',
    country: 'Dominican Republic',
    city: 'Santo Domingo',
    latitude: 18.4861,
    longitude: -69.9312,
    language: 'es',
    timezone: 'America/Santo_Domingo',
    status: 'thinking',
  };

  const defaultCouple = {
    id: 'couple-789',
    couple_code: 'LOVE26',
  };

  // App state
  const [currentUser] = useState<any>(defaultUser);
  const [userProfile, setUserProfile] = useState<any>(defaultProfile);
  const [partnerProfile] = useState<any>(defaultPartner);
  const [coupleData] = useState<any>(defaultCouple);

  const [touches, setTouches] = useState<any[]>([
    {
      id: 't-1',
      sender_id: 'partner-michel-456',
      emoji: '🤗',
      name: 'Hug',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 't-2',
      sender_id: 'user-harit-123',
      emoji: '❤️',
      name: 'Love',
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
  ]);

  // Navigation state (touches | chat | radio | memories | stats)
  const [activeTab, setActiveTab] = useState<'touches' | 'chat' | 'radio' | 'memories' | 'stats'>('touches');

  // Modals & overlay state
  const [incomingTouch, setIncomingTouch] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Real-time WebSocket Touch Broadcast Channel
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channelCode = coupleData?.couple_code || 'LOVE26';
    const channel = supabase.channel(`touch_room_${channelCode}`);

    channel
      .on('broadcast', { event: 'send_touch' }, (payload) => {
        const { senderId, senderName, emoji, typeEn, typeEs } = payload.payload;

        if (senderId !== userProfile?.id) {
          // 1. Play sound chime
          playTouchChimeSound();

          // 2. Trigger vibration
          triggerHaptic([100, 50, 100, 50, 100]);

          // 3. Add to touches feed
          const newTouchObj = {
            id: 't-' + Date.now(),
            sender_id: senderId,
            emoji: emoji,
            name: typeEn,
            touch_type: { emoji, name_en: typeEn, name_es: typeEs },
            created_at: new Date().toISOString(),
          };

          setTouches((prev) => [newTouchObj, ...prev]);

          // 4. Pop up animated overlay
          setIncomingTouch({
            emoji,
            senderName: senderName || partnerProfile?.nickname || partnerProfile?.name || 'Partner',
            typeEn,
            typeEs,
          });

          // 5. Fire OS System Push Notification
          const notifText = i18n.language === 'es'
            ? `${senderName} te envió ${emoji} ${typeEs}`
            : `${senderName} sent you ${emoji} ${typeEn}`;
          sendBrowserNotification('Between Us ❤️', notifText, emoji);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleData?.couple_code, userProfile?.id, partnerProfile, i18n.language]);

  const handleSendTouch = async (touchOption: { emoji: string; name_en: string; name_es: string }) => {
    if (!userProfile) return;

    const optimisticTouch = {
      id: 'opt-' + Date.now(),
      couple_id: coupleData?.id || 'demo-couple',
      sender_id: userProfile.id,
      receiver_id: partnerProfile?.id || 'partner-id',
      emoji: touchOption.emoji,
      name: touchOption.name_en,
      touch_type: { emoji: touchOption.emoji, name_en: touchOption.name_en, name_es: touchOption.name_es },
      created_at: new Date().toISOString(),
    };

    setTouches((prev) => [optimisticTouch, ...prev]);

    // Broadcast touch instantly via Supabase WebSocket channel
    if (isSupabaseConfigured) {
      const channelCode = coupleData?.couple_code || 'LOVE26';
      const channel = supabase.channel(`touch_room_${channelCode}`);
      channel.send({
        type: 'broadcast',
        event: 'send_touch',
        payload: {
          senderId: userProfile.id,
          senderName: userProfile.nickname || userProfile.name || 'Harit',
          emoji: touchOption.emoji,
          typeEn: touchOption.name_en,
          typeEs: touchOption.name_es,
          timestamp: Date.now(),
        },
      });
    }
  };

  const handleLogout = () => {
    triggerHaptic(40);
    setActiveTab('touches');
  };

  const partnerName = partnerProfile?.nickname || partnerProfile?.name || 'Partner';
  const userName = userProfile?.nickname || userProfile?.name || 'You';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans relative pb-20">
      {activeTab === 'touches' && (
        <HomeView
          userProfile={userProfile}
          partnerProfile={partnerProfile}
          coupleCode={coupleData?.couple_code}
          touches={touches}
          onSendTouch={handleSendTouch}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {activeTab === 'chat' && (
        <ChatView
          currentUserId={userProfile.id}
          partnerName={partnerName}
          coupleCode={coupleData?.couple_code}
        />
      )}

      {activeTab === 'radio' && (
        <RadioView partnerName={partnerName} />
      )}

      {activeTab === 'memories' && (
        <MemoriesView partnerName={partnerName} />
      )}

      {activeTab === 'stats' && (
        <StatsView partnerName={partnerName} userName={userName} totalTouches={touches.length} />
      )}

      {/* Bottom Fixed Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
          <button
            onClick={() => {
              triggerHaptic(30);
              setActiveTab('touches');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'touches' ? 'text-pink-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'touches' ? 'fill-pink-500' : ''}`} />
            <span className="text-[10px]">{t('nav.touches')}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(30);
              setActiveTab('chat');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'chat' ? 'text-pink-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageCircle className={`w-5 h-5 ${activeTab === 'chat' ? 'fill-pink-500' : ''}`} />
            <span className="text-[10px]">{t('nav.chat')}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(30);
              setActiveTab('radio');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'radio' ? 'text-pink-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <RadioIcon className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.radio')}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(30);
              setActiveTab('memories');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'memories' ? 'text-pink-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Image className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.memories')}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(30);
              setActiveTab('stats');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'stats' ? 'text-pink-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.stats')}</span>
          </button>
        </div>
      </nav>

      {/* Realtime Touch Overlay */}
      <TouchOverlay touchData={incomingTouch} onDismiss={() => setIncomingTouch(null)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        coupleCode={coupleData?.couple_code}
        onProfileUpdate={(updated) => setUserProfile(updated)}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
