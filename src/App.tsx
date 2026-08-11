import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { PairingView } from './components/PairingView';
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

  // App state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [coupleData, setCoupleData] = useState<any>(null);
  const [touches, setTouches] = useState<any[]>([]);

  // Navigation state (touches | chat | radio | memories | stats)
  const [activeTab, setActiveTab] = useState<'touches' | 'chat' | 'radio' | 'memories' | 'stats'>('touches');

  // Modals & overlay state
  const [incomingTouch, setIncomingTouch] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // 1. Initial auth state check
  useEffect(() => {
    async function checkAuth() {
      if (!isSupabaseConfigured) {
        setLoadingInitial(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setLoadingInitial(false);
      }
    }

    checkAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          await loadUserData(session.user.id);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setPartnerProfile(null);
          setCoupleData(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Load user profile, couple, partner, and touch history
  const loadUserData = async (userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // Fetch user profile
      let { data: profile } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      
      // Auto-heal missing profile row so profile form never blocks existing login
      if (!profile || !profile.name) {
        const { data: { session } } = await supabase.auth.getSession();
        const defaultName = session?.user?.email ? session.user.email.split('@')[0] : 'User';
        const autoTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
        
        profile = {
          id: userId,
          name: defaultName,
          nickname: defaultName,
          country: 'Spain',
          city: 'Madrid',
          latitude: 40.4168,
          longitude: -3.7038,
          language: i18n.language,
          timezone: autoTz || 'Europe/Madrid',
          status: 'available',
        };

        await supabase.from('users').upsert(profile, { onConflict: 'id' });
      }

      if (profile) {
        setUserProfile(profile);
        if (profile.language) {
          i18n.changeLanguage(profile.language);
        }
      }

      // Fetch couple membership
      const { data: couples } = await supabase
        .from('couples')
        .select('*')
        .or(`person_a.eq.${userId},person_b.eq.${userId}`);

      if (couples && couples.length > 0) {
        const activeCouple = couples[0];
        setCoupleData(activeCouple);

        const partnerId = activeCouple.person_a === userId ? activeCouple.person_b : activeCouple.person_a;
        if (partnerId) {
          const { data: partner } = await supabase.from('users').select('*').eq('id', partnerId).single();
          if (partner) setPartnerProfile(partner);
        }

        // Fetch recent touch history
        const { data: recentTouches } = await supabase
          .from('touches')
          .select('*, touch_type:touch_type_id(*)')
          .eq('couple_id', activeCouple.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (recentTouches) setTouches(recentTouches);
      }
    } catch (err) {
      console.warn('Error loading user data:', err);
    }
  };

  // 3. Supabase Realtime subscription on `touches` table
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

  const handleAuthComplete = (user: any, profile: any) => {
    setCurrentUser(user);
    setUserProfile(profile);

    if (!isSupabaseConfigured) {
      setCoupleData({ id: 'demo-couple-123', couple_code: 'X7K92M' });
      setPartnerProfile({
        id: 'partner-demo-456',
        name: 'Maria',
        nickname: 'Mi Amor',
        country: 'Dominican Republic',
        city: 'Santo Domingo',
        timezone: 'America/Santo_Domingo',
        status: 'thinking',
        latitude: 18.4861,
        longitude: -69.9312,
      });
      setTouches([
        {
          id: 't-1',
          sender_id: 'partner-demo-456',
          emoji: '🤗',
          name: 'Hug',
          created_at: new Date(Date.now() - 120000).toISOString(),
        },
        {
          id: 't-2',
          sender_id: user?.id || 'demo-user',
          emoji: '❤️',
          name: 'Love',
          created_at: new Date(Date.now() - 600000).toISOString(),
        },
      ]);
    }
  };

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

  const handlePairingComplete = (couple: any) => {
    setCoupleData(couple);
    if (!isSupabaseConfigured) {
      setPartnerProfile({
        id: 'partner-demo-789',
        name: 'Maria',
        nickname: 'Mi Amor',
        country: 'Spain',
        city: 'Madrid',
        timezone: 'Europe/Madrid',
        status: 'available',
        latitude: 40.4168,
        longitude: -3.7038,
      });
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setUserProfile(null);
    setPartnerProfile(null);
    setCoupleData(null);
    setTouches([]);
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-pink-500">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const partnerName = partnerProfile?.nickname || partnerProfile?.name || 'Partner';
  const userName = userProfile?.nickname || userProfile?.name || 'You';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans relative pb-20">
      {!currentUser || !userProfile ? (
        <AuthModal onAuthComplete={handleAuthComplete} />
      ) : !coupleData ? (
        <PairingView userProfile={userProfile} onPairingComplete={handlePairingComplete} />
      ) : (
        <>
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
            <ChatView currentUserId={userProfile.id} partnerName={partnerName} />
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
        </>
      )}

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
