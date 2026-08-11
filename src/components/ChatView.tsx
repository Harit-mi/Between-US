import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Mic, Volume2, Sparkles, Heart } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface ChatViewProps {
  currentUserId: string;
  partnerName: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUserId, partnerName }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      sender_id: 'partner-id',
      text: 'Good morning my love! ❤️',
      type: 'text',
      time: '08:30 AM',
    },
    {
      id: 'm2',
      sender_id: currentUserId,
      text: 'Good morning! Thinking of you so much today 🥺',
      type: 'text',
      time: '08:32 AM',
    },
    {
      id: 'm3',
      sender_id: 'partner-id',
      text: 'Voice note (0:08)',
      type: 'voice',
      duration: '0:08',
      time: '08:35 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    triggerHaptic(40);
    const newMsg = {
      id: 'm-' + Date.now(),
      sender_id: currentUserId,
      text: inputText.trim(),
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleVoiceRecordToggle = () => {
    triggerHaptic([50, 50]);
    if (isRecording) {
      // Send mock voice note
      const newVoice = {
        id: 'v-' + Date.now(),
        sender_id: currentUserId,
        text: 'Voice note (0:05)',
        type: 'voice',
        duration: '0:05',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newVoice]);
      setIsRecording(false);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-accent-bg flex items-center justify-center font-bold text-white shadow-md shadow-pink-500/20">
            {partnerName.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{partnerName}</h2>
            <p className="text-[11px] text-pink-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Private Chat & Voice</span>
            </p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-pink-400" />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 glass-card rounded-3xl p-4 border border-white/10 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <Heart className="w-6 h-6 text-pink-500/50" />
            <p>{t('chat.empty')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs shadow-md transition ${
                    isMe
                      ? 'gradient-accent-bg text-white rounded-br-none shadow-pink-500/20'
                      : 'glass-pill text-slate-200 rounded-bl-none border border-white/10'
                  }`}
                >
                  {msg.type === 'voice' ? (
                    <div className="flex items-center gap-2.5 py-0.5">
                      <button
                        onClick={() => triggerHaptic(60)}
                        className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <div className="h-1.5 w-24 bg-white/30 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-white rounded-full" />
                        </div>
                        <span className="text-[10px] text-white/80 mt-0.5 block font-mono">{msg.duration}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{msg.text}</p>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendText} className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('chat.placeholder')}
          className="flex-1 px-4 py-3 rounded-2xl glass-card border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500"
        />

        <button
          type="button"
          onClick={handleVoiceRecordToggle}
          className={`p-3 rounded-2xl transition ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
              : 'glass-card border border-white/10 text-pink-400 hover:text-white'
          }`}
          title={isRecording ? t('chat.recording') : t('chat.record_voice')}
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-3 rounded-2xl gradient-accent-bg text-white shadow-lg shadow-pink-500/25 hover:opacity-95 disabled:opacity-40 transition active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
