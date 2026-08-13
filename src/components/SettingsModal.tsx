import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, UserCheck, LogOut, Copy, Check, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { triggerHaptic } from '../lib/vibration';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  coupleCode?: string;
  onProfileUpdate: (updated: any) => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  coupleCode,
  onProfileUpdate,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const statuses = ['available', 'sleeping', 'working', 'listening', 'busy', 'thinking'];

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    triggerHaptic(40);
    const updated = { ...userProfile, language: lang };
    onProfileUpdate(updated);

    if (isSupabaseConfigured && userProfile?.id) {
      await supabase.from('users').update({ language: lang }).eq('id', userProfile.id);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    triggerHaptic(40);
    const updated = { ...userProfile, status: newStatus };
    onProfileUpdate(updated);

    if (isSupabaseConfigured && userProfile?.id) {
      await supabase.from('users').update({ status: newStatus }).eq('id', userProfile.id);
    }
  };

  const handleCopyCode = () => {
    if (!coupleCode) return;
    navigator.clipboard.writeText(coupleCode);
    setCopied(true);
    triggerHaptic(40);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForceUpdate = async () => {
    triggerHaptic(50);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
    } catch {}
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-card rounded-3xl w-full max-w-sm p-6 border border-white/10 space-y-6 relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-lg font-bold text-white">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-pink-400" />
            <span>{t('settings.language')}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                i18n.language === 'en'
                  ? 'gradient-accent-bg text-white border-transparent font-semibold shadow-md shadow-pink-500/20'
                  : 'glass-pill text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => handleLanguageChange('es')}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                i18n.language === 'es'
                  ? 'gradient-accent-bg text-white border-transparent font-semibold shadow-md shadow-pink-500/20'
                  : 'glass-pill text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              🇪🇸 Español
            </button>
          </div>
        </div>

        {/* Status Update */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>{t('settings.status')}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((st) => {
              const label = t(`home.status.${st}`);
              const isActive = userProfile?.status === st;
              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left truncate border transition ${
                    isActive
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 font-semibold'
                      : 'glass-pill text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Couple Code */}
        {coupleCode && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{t('settings.couple_code')}</p>
                <p className="text-sm font-mono font-bold text-white tracking-widest">{coupleCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Force Update & Clear Cache Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={handleForceUpdate}
            className="w-full py-2.5 px-4 rounded-xl glass-pill border border-pink-500/30 text-pink-300 text-xs font-semibold hover:bg-white/10 flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
            <span>🔄 Clear Cache & Update App</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="pt-1">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('settings.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
