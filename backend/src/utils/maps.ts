/**
 * Google Maps & Geolocation Utilities
 */

// Restaurant fixed origin coordinates (Single-restaurant model: MG Road, Bengaluru)
export const RESTAURANT_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
  name: 'PQM Kitchen & Restaurant',
  address: 'MG Road, Indiranagar, Bengaluru, Karnataka 560001',
};

/**
 * Calculate Haversine Distance in Kilometers between two coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // round to 1 decimal place
}

/**
 * Estimate Delivery Time based on distance
 * Average urban delivery speed: 20 km/h + 15 mins kitchen prep time
 */
export function estimateDeliveryTime(distanceKm: number): {
  prepTimeMinutes: number;
  transitTimeMinutes: number;
  totalTimeMinutes: number;
  formattedEta: string;
} {
  const prepTime = 15; // 15 mins kitchen prep
  const transitTime = Math.max(10, Math.round((distanceKm / 20) * 60)); // min 10 mins transit
  const totalTime = prepTime + transitTime;

  return {
    prepTimeMinutes: prepTime,
    transitTimeMinutes: transitTime,
    totalTimeMinutes: totalTime,
    formattedEta: `${totalTime - 5} - ${totalTime + 5} mins`,
  };
}
