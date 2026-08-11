// Haversine formula to compute straight-line distance in kilometers
export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Static fallback city coordinates for popular cities
const POPULAR_CITIES: Record<string, { lat: number; lng: number }> = {
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'santo domingo': { lat: 18.4861, lng: -69.9312 },
  'new york': { lat: 40.7128, lng: -74.006 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'mumbai': { lat: 19.076, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.209 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'bogota': { lat: 4.711, lng: -74.0721 },
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'berlin': { lat: 52.52, lng: 13.405 },
};

export function getCityCoordinates(cityName: string): { lat: number; lng: number } {
  const normalized = cityName.toLowerCase().trim();
  if (POPULAR_CITIES[normalized]) {
    return POPULAR_CITIES[normalized];
  }
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = (hash << 5) - hash + cityName.charCodeAt(i);
    hash |= 0;
  }
  const lat = ((Math.abs(hash) % 12000) / 100) - 60;
  const lng = ((Math.abs(hash * 31) % 36000) / 100) - 180;
  return { lat, lng };
}

// Convert country name or code to flag emoji
export function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return '🌐';
  const c = countryName.toLowerCase().trim();
  if (c.includes('dominican') || c === 'do') return '🇩🇴';
  if (c.includes('india') || c === 'in') return '🇮🇳';
  if (c.includes('spain') || c.includes('españa') || c === 'es') return '🇪🇸';
  if (c.includes('united states') || c.includes('usa') || c.includes('us') || c.includes('eeuu')) return '🇺🇸';
  if (c.includes('mexico') || c.includes('méxico') || c === 'mx') return '🇲🇽';
  if (c.includes('colombia') || c === 'co') return '🇨🇴';
  if (c.includes('argentina') || c === 'ar') return '🇦🇷';
  if (c.includes('chile') || c === 'cl') return '🇨🇱';
  if (c.includes('canada') || c === 'ca') return '🇨🇦';
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') return '🇬🇧';
  if (c.includes('france') || c === 'fr') return '🇫🇷';
  if (c.includes('germany') || c === 'de') return '🇩🇪';
  if (c.includes('japan') || c === 'jp') return '🇯🇵';
  return '📍';
}
