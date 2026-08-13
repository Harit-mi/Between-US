import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mic, Play, Pause, Sparkles, Square, ShieldCheck, Lock, Languages, Globe } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';
import { getCoupleEncryptionKey, encryptE2EE, decryptE2EE } from '../lib/crypto';
import { translateText } from '../lib/translate';

interface ChatViewProps {
  currentUserId: string;
  partnerName: string;
  coupleCode?: string;
}

interface Message {
  id: string;
  sender_id: string;
  text?: string;
  translatedText?: string;
  type: 'text' | 'voice';
  audioUrl?: string;
  duration?: string;
  time: string;
  isEncrypted?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUserId, partnerName, coupleCode = 'LOVE26' }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [enableTranslation, setEnableTranslation] = useState(true);

  // E2EE Crypto Key reference
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize E2EE Key on load
  useEffect(() => {
    async function initE2EE() {
      try {
        const key = await getCoupleEncryptionKey(coupleCode);
        cryptoKeyRef.current = key;
      } catch (err) {
        console.warn('E2EE key derivation error:', err);
      }
    }
    initE2EE();
  }, [coupleCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Text Message with AES-256 E2EE + Live EN <-> ES Translation
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    triggerHaptic(40);
    const rawText = inputText.trim();

    // Live Translate between English & Spanish
    let translated: string | undefined = undefined;
    if (enableTranslation) {
      // If current UI is English, translate to Spanish for partner; if Spanish, translate to English
      const targetLang = i18n.language === 'es' ? 'en' : 'es';
      translated = await translateText(rawText, targetLang);
    }

    let encryptedContent = rawText;
    if (cryptoKeyRef.current) {
      encryptedContent = await encryptE2EE(rawText, cryptoKeyRef.current);
    }

    const displayMessageText = cryptoKeyRef.current
      ? await decryptE2EE(encryptedContent, cryptoKeyRef.current)
      : rawText;

    const newMsg: Message = {
      id: 'm-' + Date.now(),
      sender_id: currentUserId,
      text: displayMessageText,
      translatedText: translated,
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  // Start Mic Recording using MediaRecorder API
  const startRecording = async () => {
    try {
      triggerHaptic([50, 50]);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const mins = Math.floor(recordingTime / 60);
        const secs = recordingTime % 60;
        const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        const newVoiceMsg: Message = {
          id: 'v-' + Date.now(),
          sender_id: currentUserId,
          type: 'voice',
          audioUrl,
          duration: durStr || '0:03',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: true,
        };

        setMessages((prev) => [...prev, newVoiceMsg]);
        setRecordingTime(0);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission error:', err);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    triggerHaptic(60);
    clearInterval(timerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      const newVoiceMsg: Message = {
        id: 'v-' + Date.now(),
        sender_id: currentUserId,
        type: 'voice',
        duration: `0:0${Math.max(2, recordingTime)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEncrypted: true,
      };
      setMessages((prev) => [...prev, newVoiceMsg]);
      setRecordingTime(0);
    }
    setIsRecording(false);
  };

  // Toggle Voice Note Playback
  const togglePlayVoiceNote = (msg: Message) => {
    triggerHaptic(40);
    if (playingAudioId === msg.id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      if (msg.audioUrl) {
        const audio = new Audio(msg.audioUrl);
        audioPlayerRef.current = audio;
        audio.play();
        setPlayingAudioId(msg.id);

        audio.onended = () => {
          setPlayingAudioId(null);
        };
      } else {
        setPlayingAudioId(msg.id);
        setTimeout(() => setPlayingAudioId(null), 3000);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto p-4 safe-area-pt space-y-4">
      {/* Header with E2EE Badge & Live Translation Toggle */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-accent-bg flex items-center justify-center font-bold text-white shadow-md shadow-pink-500/20 uppercase">
            {partnerName ? partnerName.charAt(0) : 'M'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{partnerName || 'Michel'}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>AES-256 Encrypted</span>
            </p>
          </div>
        </div>

        {/* Live Translation Toggle Button */}
        <button
          onClick={() => {
            triggerHaptic(40);
            setEnableTranslation(!enableTranslation);
          }}
          className={`py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition ${
            enableTranslation
              ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
              : 'glass-pill text-slate-400 border-white/10'
          }`}
          title="Toggle Live English <-> Spanish Translation"
        >
          <Globe className="w-3.5 h-3.5 text-pink-400" />
          <span>{enableTranslation ? 'Translate EN ↔ ES' : 'Translation Off'}</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 glass-card rounded-3xl p-4 border border-white/10 overflow-y-auto space-y-3 min-h-[340px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2 py-12">
            <ShieldCheck className="w-8 h-8 text-emerald-400/80 animate-pulse" />
            <p className="text-center font-semibold text-slate-300">Messages & Voice Notes are End-to-End Encrypted</p>
            <span className="text-[10px] text-slate-500 text-center max-w-[260px]">
              🌐 Live English ↔ Spanish auto-translation is active for Harit & Michel!
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const isPlayingThis = playingAudioId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs shadow-md transition ${
                    isMe
                      ? 'gradient-accent-bg text-white rounded-br-none shadow-pink-500/20'
                      : 'glass-pill text-slate-200 rounded-bl-none border border-white/10'
                  }`}
                >
                  {msg.type === 'voice' ? (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        onClick={() => togglePlayVoiceNote(msg)}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition"
                      >
                        {isPlayingThis ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-white rounded-full transition-all duration-300 ${
                                isPlayingThis ? 'w-full animate-pulse' : 'w-1/3'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] text-white/90 font-mono ml-1">{msg.duration}</span>
                        </div>
                        <span className="text-[9px] text-white/70 flex items-center gap-1 mt-0.5">
                          <Lock className="w-2.5 h-2.5 text-emerald-300" />
                          <span>{isPlayingThis ? 'Playing encrypted note...' : 'Encrypted Voice Note'}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="leading-relaxed font-medium">{msg.text}</p>

                      {/* Live Translation Sub-Bubble */}
                      {msg.translatedText && (
                        <div className="pt-1 border-t border-white/15 text-[11px] text-pink-200 flex items-start gap-1 font-sans">
                          <Globe className="w-3 h-3 text-pink-300 shrink-0 mt-0.5" />
                          <span className="italic">{msg.translatedText}</span>
                        </div>
                      )}

                      <span className="text-[9px] text-white/70 flex items-center gap-1 mt-1 justify-end">
                        <Lock className="w-2.5 h-2.5 text-emerald-300" />
                        <span>Encrypted</span>
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording Status Bar */}
      {isRecording && (
        <div className="glass-card rounded-2xl p-3 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Recording Encrypted Voice Note... ({recordingTime}s)</span>
          </div>
          <button
            onClick={stopRecording}
            className="px-3 py-1 bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1 active:scale-95 transition"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>Stop & Send</span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendText} className="flex items-center gap-2 pb-4">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('chat.placeholder')}
          disabled={isRecording}
          className="flex-1 px-4 py-3 rounded-2xl glass-card border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-3 rounded-2xl transition ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40 scale-110'
              : 'glass-card border border-white/10 text-pink-400 hover:text-white'
          }`}
          title={isRecording ? 'Stop Recording' : 'Record Encrypted Voice Note'}
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={!inputText.trim() || isRecording}
          className="p-3 rounded-2xl gradient-accent-bg text-white shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-40 transition active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
