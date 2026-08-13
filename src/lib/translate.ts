// Fast client-side Live Translation engine (English <-> Spanish)

const ROMANTIC_DICTIONARY: Record<string, { es: string; en: string }> = {
  'i love you': { es: 'Te amo', en: 'I love you' },
  'i miss you': { es: 'Te extraño', en: 'I miss you' },
  'good morning': { es: 'Buenos días', en: 'Good morning' },
  'good night': { es: 'Buenas noches', en: 'Good night' },
  'how are you?': { es: '¿Cómo estás?', en: 'How are you?' },
  'i miss you so much': { es: 'Te extraño muchísimo', en: 'I miss you so much' },
  'my love': { es: 'Mi amor', en: 'My love' },
  'te amo': { es: 'Te amo', en: 'I love you' },
  'te extraño': { es: 'Te extraño', en: 'I miss you' },
  'buenos dias': { es: 'Buenos días', en: 'Good morning' },
  'buenas noches': { es: 'Buenas noches', en: 'Good night' },
};

export async function translateText(text: string, targetLang: 'es' | 'en'): Promise<string> {
  if (!text || !text.trim()) return '';

  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // Check dictionary cache first for instant zero-latency translation
  if (ROMANTIC_DICTIONARY[lowerText]) {
    return ROMANTIC_DICTIONARY[lowerText][targetLang];
  }

  const sourceLang = targetLang === 'es' ? 'en' : 'es';
  const langpair = `${sourceLang}|${targetLang}`;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langpair}`
    );
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.warn('Translation API error:', err);
  }

  // Fallback if offline
  return targetLang === 'es' ? `[ES] ${cleanText}` : `[EN] ${cleanText}`;
}
