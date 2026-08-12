import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Plus, Heart, Sparkles, Calendar, X, Upload, Video, Trash2 } from 'lucide-react';
import { triggerHaptic } from '../lib/vibration';

interface MemoriesViewProps {
  partnerName: string;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({ partnerName }) => {
  const { t } = useTranslation();

  // Load saved memories from LocalStorage on mount
  const [memories, setMemories] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('between_us_memories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save memories to LocalStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('between_us_memories', JSON.stringify(memories));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }, [memories]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress high-res iPhone camera photos using HTML5 Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200; // Resize max width/height to 1200px
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to 80% quality JPEG (~150KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo & Video File Selection from Camera Roll
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(40);
    setIsUploading(true);
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    try {
      if (isVideo) {
        // Handle Video
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setMediaUrl(event.target.result as string);
          }
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } else {
        // Compress & Handle Photo
        const compressedUrl = await compressImage(file);
        setMediaUrl(compressedUrl);
        setIsUploading(false);
      }
    } catch (err) {
      console.warn('File processing error:', err);
      setIsUploading(false);
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    triggerHaptic([40, 40]);
    const fallbackImage = 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80';

    const newMem = {
      id: 'mem-' + Date.now(),
      title: newTitle.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      mediaUrl: mediaUrl.trim() || fallbackImage,
      mediaType: mediaType,
      caption: newCaption.trim() || 'A special moment saved forever ❤️',
      likes: 1,
    };

    setMemories((prev) => [newMem, ...prev]);
    setNewTitle('');
    setNewCaption('');
    setMediaUrl('');
    setMediaType('image');
    setIsAdding(false);
  };

  const handleDeleteMemory = (id: string) => {
    triggerHaptic(50);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto p-4 safe-area-pt space-y-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>{t('memories.title')}</span>
          </h2>
          <p className="text-[11px] text-slate-400">Photos & Videos with {partnerName || 'Michel'}</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="py-2 px-3 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20 flex items-center gap-1.5 active:scale-95 transition"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'Close' : t('memories.add_memory')}</span>
        </button>
      </div>

      {/* Add Memory Form with Auto Compression & Persistent Storage */}
      {isAdding && (
        <form onSubmit={handleAddMemory} className="glass-card rounded-3xl p-5 border border-pink-500/30 space-y-3 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xs font-semibold text-pink-300 uppercase tracking-wider">New Shared Memory</h3>

          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Memory title (e.g. Sunset in Santo Domingo)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500"
          />

          {/* Attach Photo or Video Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-pink-500/40 bg-white/5 hover:bg-white/10 text-pink-300 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-pink-400" />
              <span>
                {isUploading
                  ? 'Processing & Compressing Photo...'
                  : mediaUrl
                  ? '✓ Photo/Video Attached (Tap to change)'
                  : '📷 Attach Photo or Video from Camera Roll'}
              </span>
            </button>
          </div>

          {/* Media Preview inside form if attached */}
          {mediaUrl && (
            <div className="w-full h-36 rounded-xl overflow-hidden bg-black/50 border border-white/10 relative">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="w-full h-full object-cover" />
              ) : (
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
              <span className="absolute top-2 left-2 glass-pill px-2 py-0.5 rounded-full text-[9px] text-white uppercase font-bold">
                {mediaType}
              </span>
            </div>
          )}

          <textarea
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder={t('memories.caption_placeholder')}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-pink-500 resize-none"
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-2 rounded-xl glass-pill text-slate-400 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-2 rounded-xl gradient-accent-bg text-white text-xs font-semibold shadow-md shadow-pink-500/20 disabled:opacity-50"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Shared Memories Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-10">
        {memories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2 py-12">
            <ImageIcon className="w-8 h-8 text-slate-600" />
            <p className="font-medium text-center">{t('memories.empty')}</p>
            <span className="text-[10px] text-slate-600">Tap "+ Add Memory" to attach photos & videos from your camera roll!</span>
          </div>
        ) : (
          memories.map((mem) => (
            <div key={mem.id} className="glass-card rounded-3xl overflow-hidden border border-white/10 space-y-3">
              <div className="relative h-56 w-full overflow-hidden bg-black flex items-center justify-center">
                {mem.mediaType === 'video' ? (
                  <video
                    src={mem.mediaUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mem.mediaUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                )}

                <div className="absolute top-3 right-3 glass-pill px-2.5 py-1 rounded-full text-[10px] text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-pink-400" />
                  <span>{mem.date}</span>
                </div>

                {mem.mediaType === 'video' && (
                  <div className="absolute top-3 left-3 glass-pill px-2 py-0.5 rounded-full text-[10px] text-pink-300 flex items-center gap-1 font-bold">
                    <Video className="w-3 h-3 text-pink-400" />
                    <span>VIDEO</span>
                  </div>
                )}
              </div>

              <div className="p-4 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{mem.title}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        triggerHaptic(50);
                        setMemories((prev) =>
                          prev.map((m) => (m.id === mem.id ? { ...m, likes: m.likes + 1 } : m))
                        );
                      }}
                      className="flex items-center gap-1 text-xs text-pink-400 hover:scale-110 active:scale-95 transition"
                    >
                      <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                      <span>{mem.likes}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{mem.caption}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
