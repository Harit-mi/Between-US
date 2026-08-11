import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCityCoordinates } from '../lib/geo';
import { Heart, Globe, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onAuthComplete: (user: any, profile: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthComplete }) => {
  const { t, i18n } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User object temporary holder
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Profile setup state
  const autoTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [country, setCountry] = useState('Spain');
  const [city, setCity] = useState('Madrid');
  const [timezone, setTimezone] = useState(autoTz || 'Europe/Madrid');

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isSupabaseConfigured) {
      setTimeout(() => {
        const mockUser = { id: 'demo-user-' + Math.random().toString(36).substr(2, 6), email };
        const mockProfile = {
          id: mockUser.id,
          name: email.split('@')[0] || 'User',
          nickname: email.split('@')[0] || 'User',
          country: 'Spain',
          city: 'Madrid',
          timezone: autoTz,
          status: 'available',
        };
        onAuthComplete(mockUser, mockProfile);
        setLoading(false);
      }, 500);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpErr) throw signUpErr;

        if (data.session) {
          await supabase.auth.setSession(data.session);
        }

        if (data.user) {
          setCurrentUser(data.user);
          setStep('profile');
        }
      } else {
        // LOG IN FLOW
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;

        if (data.session && data.user) {
          await supabase.auth.setSession(data.session);

          // Fetch profile with authenticated session headers
          let { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          // Auto-heal missing profile row using email prefix so user is never stuck
          if (!profile || !profile.name) {
            const defaultName = data.user.email ? data.user.email.split('@')[0] : 'User';
            const newProfile = {
              id: data.user.id,
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

            await supabase.from('users').upsert(newProfile, { onConflict: 'id' });
            profile = newProfile;
          }

          onAuthComplete(data.user, profile);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const coords = getCityCoordinates(city);
    const profileData = {
      id: currentUser?.id || 'demo-user-id',
      name: name.trim(),
      nickname: nickname.trim() || name.trim(),
      country: country.trim(),
      city: city.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      language: i18n.language,
      timezone: timezone.trim() || 'UTC',
      status: 'available',
    };

    if (isSupabaseConfigured && currentUser?.id) {
      try {
        const { error: upsertErr } = await supabase.from('users').upsert(profileData, { onConflict: 'id' });
        if (upsertErr) {
          console.error('Supabase profile save error:', upsertErr);
          setError(upsertErr.message);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Profile save exception:', err);
        setError(err.message || 'Error saving profile');
        setLoading(false);
        return;
      }
    }

    onAuthComplete(currentUser || { id: profileData.id, email }, profileData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLanguage}
          className="glass-pill px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all hover:bg-white/10 active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-pink-400" />
          <span>{i18n.language === 'en' ? 'Español (ES)' : 'English (EN)'}</span>
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card border border-pink-500/20 mb-4 shadow-lg shadow-pink-500/10">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500/30 animate-heart-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            {t('app.title')}
          </h1>
          <p className="text-sm text-slate-400">{t('auth.subheading')}</p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'auth' ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email_placeholder')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl gradient-accent-bg text-white font-semibold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.98] transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isSignUp ? t('auth.submit_signup') : t('auth.submit_login')}</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-pink-400 transition"
                >
                  {isSignUp ? t('auth.switch_to_login') : t('auth.switch_to_signup')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-white">{t('auth.profile_title')}</h2>
                <p className="text-xs text-slate-400">{t('auth.profile_sub')}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.name')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.nickname')}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Mi Amor"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('auth.country')}
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Spain"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('auth.city')}
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Madrid"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('auth.timezone')}
                </label>
                <input
                  type="text"
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g. Europe/Madrid"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl gradient-accent-bg text-white font-semibold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 active:scale-[0.98] transition mt-4"
              >
                {loading ? 'Saving...' : t('auth.save_profile')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
