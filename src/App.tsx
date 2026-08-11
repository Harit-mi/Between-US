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
import { triggerHaptic, sendBrowserNotification } from './lib/vibration';
import { Heart, MessageCircle, Radio as RadioIcon, Image, Sparkles } from 'lucide-react';

export function App() {
  const { t, i18n } = useTranslation();

  // Instant default user & partner profiles
  const defaultUser = { id: 'user-hitansh-123', email: 'hitansh@betweenus.app' };
  const defaultProfile = {
    id: 'user-hitansh-123',
    name: 'Hitansh',
    nickname: 'Amor',
    country: 'India',
    city: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    language: 'en',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata',
    status: 'available',
  };

  const defaultPartner = {
    id: 'partner-maria-456',
    name: 'Maria',
    nickname: 'Mi Amor',
    country: 'Spain',
    city: 'Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
    language: 'es',
    timezone: 'Europe/Madrid',
    status: 'thinking',
  };

  const defaultCouple = {
    id: 'couple-789',
    couple_code: 'LOVE26',
  };

  // App state with instant defaults
  const [currentUser] = useState<any>(defaultUser);
  const [userProfile, setUserProfile] = useState<any>(defaultProfile);
  const [partnerProfile] = useState<any>(defaultPartner);
  const [coupleData] = useState<any>(defaultCouple);
  
  const [touches, setTouches] = useState<any[]>([
    {
      id: 't-1',
      sender_id: 'partner-maria-456',
      emoji: '🤗',
      name: 'Hug',
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 't-2',
      sender_id: 'user-hitansh-123',
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

  // Supabase Realtime subscription (if configured)
  useEffect(() => {
    if (!isSupabaseConfigured || !coupleData?.id) return;

    const channel = supabase
      .channel(`realtime-touches-${coupleData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'touches',
          filter: `couple_id=eq.${coupleData.id}`,
        },
        async (payload) => {
          const newTouch = payload.new;

          let touchType = null;
          if (newTouch.touch_type_id) {
            const { data } = await supabase.from('touch_types').select('*').eq('id', newTouch.touch_type_id).single();
            touchType = data;
          }

          const fullTouch = { ...newTouch, touch_type: touchType };
          setTouches((prev) => [fullTouch, ...prev]);

          if (newTouch.sender_id !== userProfile?.id) {
            triggerHaptic([100, 50, 100, 50, 100]);

            const emoji = touchType?.emoji || '❤️';
            const senderName = partnerProfile?.nickname || partnerProfile?.name || 'Partner';
            const typeEn = touchType?.name_en || 'Love';
            const typeEs = touchType?.name_es || 'Amor';

            setIncomingTouch({
              emoji,
              senderName,
              typeEn,
              typeEs,
            });

            const notifText = i18n.language === 'es' ? `${senderName} te envió ${emoji}` : `${senderName} sent you ${emoji}`;
            sendBrowserNotification('Between Us ❤️', notifText, emoji);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleData?.id, userProfile?.id, partnerProfile, i18n.language]);

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

    if (isSupabaseConfigured && partnerProfile?.id && coupleData?.id) {
      try {
        const { data: touchTypes } = await supabase
          .from('touch_types')
          .select('id')
          .eq('couple_id', coupleData.id)
          .eq('emoji', touchOption.emoji)
          .limit(1);

        if (touchTypes && touchTypes.length > 0) {
          await supabase.rpc('send_touch', {
            receiver_id: partnerProfile.id,
            touch_type_id: touchTypes[0].id,
          });
        }
      } catch (err) {
        console.warn('send_touch RPC exception:', err);
      }
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
