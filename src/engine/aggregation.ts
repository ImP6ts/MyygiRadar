import { Company, CompanyPresence, Location, Report, ValidationResult } from '../types';

export const HALF_LIFE_MINUTES = 45;
export const MAX_AGE_MINUTES = 180;

/**
 * Calculates distance in meters between two lat/lon points using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
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

/**
 * Validates whether user is sufficiently close to submit a verified report
 * and checks GPS accuracy.
 */
export function validateReportLocation(
  location: Location,
  userLat: number,
  userLng: number,
  gpsAccuracyMeters: number
): ValidationResult {
  const distance = calculateDistanceMeters(userLat, userLng, location.latitude, location.longitude);
  const maxAllowedRadius = location.geofenceRadiusMeters + Math.max(gpsAccuracyMeters, 20);
  const isWithin = distance <= maxAllowedRadius;
  const isAccuracyWarning = gpsAccuracyMeters > 50;

  let weight = 1.0;
  if (gpsAccuracyMeters > 80) weight = 0.3;
  else if (gpsAccuracyMeters > 40) weight = 0.7;
  else if (gpsAccuracyMeters > 20) weight = 0.9;

  let message = 'Asukoht kinnitatud.';
  if (!isWithin) {
    message = `Oled sellest asukohast liiga kaugel (${distance} m, keskuse lubatud raadius ${maxAllowedRadius} m).`;
  } else if (isAccuracyWarning) {
    message = `GPS täpsus on madal (${Math.round(gpsAccuracyMeters)} m). Raport arvestatakse madalama usaldusväärsusega.`;
  }

  return {
    isValid: isWithin,
    distanceMeters: distance,
    isAccuracyWarning,
    adjustedReliabilityWeight: weight,
    message
  };
}

/**
 * Aggregates reports using exponential time decay and multi-hour persistent presence detection.
 */
export function aggregateCompanyStatus(
  company: Company,
  reports: Report[],
  currentTimeMillis: number = Date.now()
): CompanyPresence {
  const startOfDay = new Date(currentTimeMillis);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMillis = startOfDay.getTime();

  // Filter to today's reports for this company
  const companyReports = reports.filter(
    (r) => r.companyId === company.id && r.timestampMillis >= startOfDayMillis
  );

  let weightedPresent = 0;
  let weightedAbsent = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lastConfirmedTime: number | null = null;

  const hoursWithReports = new Map<number, number>();

  for (const report of companyReports) {
    const ageMinutes = (currentTimeMillis - report.timestampMillis) / (60 * 1000);
    const hour = new Date(report.timestampMillis).getHours();
    hoursWithReports.set(hour, (hoursWithReports.get(hour) || 0) + 1);

    if (report.status === 'PRESENT') {
      if (!lastConfirmedTime || report.timestampMillis > lastConfirmedTime) {
        lastConfirmedTime = report.timestampMillis;
      }
    }

    if (ageMinutes >= 0 && ageMinutes <= MAX_AGE_MINUTES) {
      // Exponential decay: weight = e^(-ln(2) * (age / halfLife))
      const decay = Math.exp(-0.693147 * (ageMinutes / HALF_LIFE_MINUTES));
      const reportWeight = report.userReliabilityWeight * decay;

      if (report.status === 'PRESENT') {
        weightedPresent += reportWeight;
        presentCount++;
      } else {
        weightedAbsent += reportWeight;
        absentCount++;
      }
    }
  }

  const totalWeight = weightedPresent + weightedAbsent;
  // Multiple confirmations across at least 3 distinct hours indicates persistent presence today
  const isPersistent = hoursWithReports.size >= 3 && presentCount >= 3;

  const hourlyList = Array.from(hoursWithReports.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  if (totalWeight < 0.4) {
    return {
      company,
      status: 'UNKNOWN',
      confidenceScore: 0,
      lastConfirmedTimeMillis: lastConfirmedTime,
      recentConfirmationsCount: presentCount,
      isPersistentPresenceToday: isPersistent,
      presentReportsCount: presentCount,
      absentReportsCount: absentCount,
      hourlyReports: hourlyList
    };
  }

  const netScore = (weightedPresent - weightedAbsent) / totalWeight;

  let status: 'PRESENT' | 'PROBABLY_PRESENT' | 'PROBABLY_ABSENT' | 'UNKNOWN' = 'UNKNOWN';
  if (netScore >= 0.65 && totalWeight >= 1.8) {
    status = 'PRESENT';
  } else if (netScore >= 0.25) {
    status = 'PROBABLY_PRESENT';
  } else if (netScore <= -0.45) {
    status = 'PROBABLY_ABSENT';
  }

  return {
    company,
    status,
    confidenceScore: Math.round(netScore * 100) / 100,
    lastConfirmedTimeMillis: lastConfirmedTime,
    recentConfirmationsCount: presentCount,
    isPersistentPresenceToday: isPersistent,
    presentReportsCount: presentCount,
    absentReportsCount: absentCount,
    hourlyReports: hourlyList
  };
}

export function formatTimeAgo(timestampMillis: number | null): string {
  if (!timestampMillis) return 'Puudub';
  const diffSec = Math.floor((Date.now() - timestampMillis) / 1000);
  if (diffSec < 60) return 'just praegu';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min tagasi`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} tundi tagasi`;
  return `${Math.floor(diffHours / 24)} päeva tagasi`;
}
