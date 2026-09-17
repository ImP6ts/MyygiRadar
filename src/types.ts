export type ReportStatus = 'PRESENT' | 'NOT_PRESENT';

export type AggregatedStatus = 'PRESENT' | 'PROBABLY_PRESENT' | 'PROBABLY_ABSENT' | 'UNKNOWN';

export type LocationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LocationType =
  | 'Supermarket'
  | 'Hüpermarket'
  | 'Kaubanduskeskus'
  | 'Elektroonikapood'
  | 'Muu';

export interface Company {
  id: string;
  name: string;
  category: string;
  color: string;
  active: boolean;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  type: string;
  active: boolean;
  activeCompanyIds: string[];
  status: LocationStatus;
  submittedBy?: string;
  submittedAt?: number;
  reviewedBy?: string | null;
  reviewedAt?: number | null;
}

export interface LocationIssueReport {
  id: string;
  locationId: string;
  locationName: string;
  issueType: 'DOES_NOT_EXIST' | 'DUPLICATE' | 'INCORRECT_NAME' | 'INCORRECT_POSITION' | 'OTHER';
  description: string;
  reportedBy: string;
  reportedAt: number;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export interface Report {
  id: string;
  locationId: string;
  companyId: string;
  status: ReportStatus;
  timestampMillis: number;
  anonymousUserId: string;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters: number;
  userReliabilityWeight: number;
}

export interface CompanyPresence {
  company: Company;
  status: AggregatedStatus;
  confidenceScore: number;
  lastConfirmedTimeMillis: number | null;
  recentConfirmationsCount: number;
  isPersistentPresenceToday: boolean;
  presentReportsCount: number;
  absentReportsCount: number;
  hourlyReports: { hour: number; count: number }[];
}

export interface ValidationResult {
  isValid: boolean;
  distanceMeters: number;
  isAccuracyWarning: boolean;
  adjustedReliabilityWeight: number;
  message: string;
}

export interface SettingsState {
  arrivalChecksEnabled: boolean;
  cooldownHours: number;
  hasLocationPermission: boolean;
  hasNotificationPermission: boolean;
}
