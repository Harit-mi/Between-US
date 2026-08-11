import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Heart, Copy, Check, PlusCircle, Link as LinkIcon, Loader2, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface PairingViewProps {
  userProfile: any;
  onPairingComplete: (couple: any) => void;
}

export const PairingView: React.FC<PairingViewProps> = ({ userProfile, onPairingComplete }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorld = async () => {
    setLoading(true);
    setError(null);
    triggerHaptic(60);

    if (!isSupabaseConfigured) {
      // Demo fallback code generator
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setCreatedCode(randomCode);
      setMode('create');
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcErr } = await supabase.rpc('create_couple');
      if (rpcErr) throw rpcErr;
      if (data) {
        setCreatedCode(data);
        setMode('create');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating couple');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdCode) return;
    navigator.clipboard.writeText(createdCode);
    setCopied(true);
    triggerHaptic([30, 30]);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoinWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setLoading(true);
    setError(null);
    triggerHaptic(60);

    if (!isSupabaseConfigured) {
      // Demo couple fallback object
      const demoCouple = {
        id: 'demo-couple-' + joinCodeInput.toUpperCase(),
        couple_code: joinCodeInput.toUpperCase(),
        person_a: 'demo-partner-id',
        person_b: userProfile.id,
      };
      onPairingComplete(demoCouple);
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcErr } = await supabase.rpc('join_couple', {
        code: joinCodeInput.trim().toUpperCase(),
      });
      if (rpcErr) throw rpcErr;
      if (data) {
        onPairingComplete(data);
      }
    } catch (err: any) {
      setError(err.message || t('pairing.invalid_code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass-card border border-pink-500/20 mb-4 shadow-lg shadow-pink-500/10">
          <Heart className="w-7 h-7 text-pink-500 fill-pink-500/30 animate-heart-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('pairing.title', { name: userProfile?.nickname || userProfile?.name || 'Friend' })}
        </h1>
        <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
          {t('pairing.subheading')}
        </p>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={handleCreateWorld}
              disabled={loading}
              className="w-full p-5 rounded-3xl glass-card hover:bg-white/10 border border-pink-500/30 text-left transition flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl gradient-accent-bg flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {t('pairing.create_button')}
                  </h3>
                  <p className="text-xs text-slate-400">Generate a private 6-character code</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => {
                setMode('join');
                setError(null);
              }}
              className="w-full p-5 rounded-3xl glass-card hover:bg-white/10 border border-white/10 text-left transition flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-pink-400 border border-white/10">
                  <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {t('pairing.join_button')}
                  </h3>
                  <p className="text-xs text-slate-400">Enter your partner's code</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-1 transition" />
            </button>
          </div>
        )}

        {mode === 'create' && createdCode && (
          <div className="glass-card rounded-3xl p-8 border border-pink-500/20 space-y-6">
            <span className="text-xs font-semibold text-pink-400 tracking-wider uppercase">
              {t('pairing.code_generated')}
            </span>

            <div className="bg-black/40 border border-white/10 rounded-2xl py-5 px-4 tracking-[0.4em] font-mono text-3xl sm:text-4xl font-bold text-white select-all">
              {createdCode}
            </div>

            <p className="text-sm font-medium text-pink-300/90 flex items-center justify-center gap-1.5">
              <span>{t('pairing.romantic_line')}</span>
            </p>

            <button
              onClick={handleCopyCode}
              className="w-full py-3.5 px-4 rounded-xl gradient-accent-bg text-white font-semibold text-sm shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('pairing.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('pairing.copy_code')}</span>
                </>
              )}
            </button>

            <div className="pt-2 text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
              <span>{t('pairing.waiting')}</span>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinWorld} className="glass-card rounded-3xl p-8 border border-white/10 space-y-6">
            <h2 className="text-lg font-bold text-white">{t('pairing.enter_code')}</h2>

            <div>
              <input
                type="text"
                maxLength={6}
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder={t('pairing.code_placeholder')}
                className="w-full py-4 text-center tracking-[0.3em] font-mono text-2xl font-bold uppercase rounded-2xl bg-white/5 border border-white/15 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('select');
                  setError(null);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl glass-pill text-slate-300 text-sm font-medium hover:text-white transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || joinCodeInput.length < 6}
                className="flex-1 py-3.5 px-4 rounded-xl gradient-accent-bg text-white font-semibold text-sm shadow-lg shadow-pink-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('pairing.submit_join')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
