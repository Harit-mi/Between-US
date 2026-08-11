import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { PairingView } from './components/PairingView';
import { HomeView } from './components/HomeView';
import { TouchOverlay } from './components/TouchOverlay';
import { SettingsModal } from './components/SettingsModal';
import { triggerHaptic, sendBrowserNotification } from './lib/vibration';

export function App() {
  const { t, i18n } = useTranslation();

  // App state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [coupleData, setCoupleData] = useState<any>(null);
  const [touches, setTouches] = useState<any[]>([]);

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
      const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single();
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

  // 3. Supabase Realtime subscription on `touches` table for couple_id
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

          // Fetch touch_type details for translation
          let touchType = null;
          if (newTouch.touch_type_id) {
            const { data } = await supabase.from('touch_types').select('*').eq('id', newTouch.touch_type_id).single();
            touchType = data;
          }

          const fullTouch = { ...newTouch, touch_type: touchType };

          // Add to touch history feed
          setTouches((prev) => [fullTouch, ...prev]);

          // If sent by partner, trigger overlay & push notification
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

            // Fire browser push notification in receiver's language
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

  // Handle auth completion
  const handleAuthComplete = (user: any, profile: any) => {
    setCurrentUser(user);
    setUserProfile(profile);

    // If demo mode, set up mock partner & couple
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

  // Handle send touch click
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
        // Find matching touch_type_id
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

  // Handle pairing completion
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans">
      {!currentUser || !userProfile ? (
        <AuthModal onAuthComplete={handleAuthComplete} />
      ) : !coupleData ? (
        <PairingView userProfile={userProfile} onPairingComplete={handlePairingComplete} />
      ) : (
        <HomeView
          userProfile={userProfile}
          partnerProfile={partnerProfile}
          coupleCode={coupleData?.couple_code}
          touches={touches}
          onSendTouch={handleSendTouch}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
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
