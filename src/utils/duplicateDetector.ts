import { Location } from '../types';

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  matchedLocation: Location | null;
  matchReason: string | null;
}

export function detectDuplicateLocation(
  candidateName: string,
  candidateAddress: string,
  candidateLat: number,
  candidateLng: number,
  existingLocations: Location[]
): DuplicateCheckResult {
  const normName = normalize(candidateName);
  const normAddress = normalize(candidateAddress);

  for (const existing of existingLocations) {
    const distMeters = calculateDistanceMeters(
      candidateLat,
      candidateLng,
      existing.latitude,
      existing.longitude
    );
    const existingNormName = normalize(existing.name);
    const existingNormAddr = normalize(existing.address);

    // 1. Proximity check (< 150m is a strong duplicate match for commercial retail)
    if (distMeters <= 150) {
      return {
        hasDuplicate: true,
        matchedLocation: existing,
        matchReason: `Asukoht asub väga lähedal olemasolevale kohale (${Math.round(distMeters)} m): ${existing.name}`
      };
    }

    // 2. Name similarity
    const nameSim = calculateSimilarity(normName, existingNormName);
    if (nameSim >= 0.75) {
      return {
        hasDuplicate: true,
        matchedLocation: existing,
        matchReason: `Nimi sarnaneb olemasoleva asukohaga: ${existing.name}`
      };
    }

    // 3. Address match in vicinity
    if (normAddress.length > 3 && existingNormAddr.length > 3) {
      const addrSim = calculateSimilarity(normAddress, existingNormAddr);
      if (addrSim >= 0.8 && distMeters <= 600) {
        return {
          hasDuplicate: true,
          matchedLocation: existing,
          matchReason: `Aadress kattub olemasoleva asukohaga: ${existing.name} (${existing.address})`
        };
      }
    }
  }

  return {
    hasDuplicate: false,
    matchedLocation: null,
    matchReason: null
  };
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zõäöü0-9\s]/g, '')
    .trim();
}

function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  if (s1.includes(s2) || s2.includes(s1)) {
    const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    return Math.max(0.75, ratio);
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return 1.0 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
