import { Company, Location, Report } from '../types';

export const SEED_COMPANIES: Company[] = [
  { id: 'go3', name: 'GO3', category: 'Televisioon ja Meedia', color: '#EF4444', active: true },
  { id: 'telia', name: 'Telia', category: 'Telekom', color: '#8B5CF6', active: true },
  { id: 'elisa', name: 'Elisa', category: 'Telekom', color: '#3B82F6', active: true },
  { id: 'luminor', name: 'Luminor', category: 'Pangandus ja Liising', color: '#EC4899', active: true },
  { id: 'other', name: 'Muu ettevõte', category: 'Muu', color: '#64748B', active: true },
];

export const SEED_LOCATIONS: Location[] = [
  {
    id: 'tartu_lounakeskus',
    name: 'Lõunakeskus',
    address: 'Ringtee 75',
    city: 'Tartu',
    latitude: 58.3582,
    longitude: 26.6806,
    geofenceRadiusMeters: 300,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'tallinn_ulemiste',
    name: 'Ülemiste Keskus',
    address: 'Suur-Sõjamäe 4',
    city: 'Tallinn',
    latitude: 59.4218,
    longitude: 24.7937,
    geofenceRadiusMeters: 260,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'tallinn_kristiine',
    name: 'Kristiine Keskus',
    address: 'Endla 45',
    city: 'Tallinn',
    latitude: 59.4267,
    longitude: 24.7214,
    geofenceRadiusMeters: 210,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'tallinn_rocca',
    name: 'Rocca al Mare',
    address: 'Paldiski mnt 102',
    city: 'Tallinn',
    latitude: 59.4285,
    longitude: 24.6548,
    geofenceRadiusMeters: 250,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'tallinn_jarve',
    name: 'Järve Keskus',
    address: 'Pärnu mnt 238',
    city: 'Tallinn',
    latitude: 59.3957,
    longitude: 24.7176,
    geofenceRadiusMeters: 220,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'tartu_tasku',
    name: 'Tasku Keskus',
    address: 'Turu 2',
    city: 'Tartu',
    latitude: 58.3782,
    longitude: 26.7303,
    geofenceRadiusMeters: 180,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'tartu_kvartal',
    name: 'Kvartal',
    address: 'Riia 2',
    city: 'Tartu',
    latitude: 58.3768,
    longitude: 26.7289,
    geofenceRadiusMeters: 180,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  },
  {
    id: 'parnu_kaubamajakas',
    name: 'Kaubamajakas',
    address: 'Papiniidu 8/10',
    city: 'Pärnu',
    latitude: 58.3688,
    longitude: 24.5422,
    geofenceRadiusMeters: 220,
    type: 'Kaubanduskeskus',
    active: true,
    activeCompanyIds: ['go3', 'telia', 'elisa', 'luminor', 'other'],
    status: 'APPROVED'
  }
];

// Helper to generate seed reports relative to now
const now = Date.now();
const min = 60 * 1000;
const hour = 60 * min;

export const INITIAL_SEED_REPORTS: Report[] = [
  // Lõunakeskus: GO3 has repeated confirmations today across multiple hours (demonstrates persistent presence)
  {
    id: 'rep_1',
    locationId: 'tartu_lounakeskus',
    companyId: 'go3',
    status: 'PRESENT',
    timestampMillis: now - 8 * min,
    anonymousUserId: 'anon_user_1',
    latitude: 58.3583,
    longitude: 26.6808,
    gpsAccuracyMeters: 12,
    userReliabilityWeight: 1.0
  },
  {
    id: 'rep_2',
    locationId: 'tartu_lounakeskus',
    companyId: 'go3',
    status: 'PRESENT',
    timestampMillis: now - 22 * min,
    anonymousUserId: 'anon_user_2',
    latitude: 58.3581,
    longitude: 26.6805,
    gpsAccuracyMeters: 8,
    userReliabilityWeight: 1.0
  },
  {
    id: 'rep_3',
    locationId: 'tartu_lounakeskus',
    companyId: 'go3',
    status: 'PRESENT',
    timestampMillis: now - 1 * hour - 15 * min,
    anonymousUserId: 'anon_user_3',
    latitude: 58.3582,
    longitude: 26.6807,
    gpsAccuracyMeters: 14,
    userReliabilityWeight: 1.0
  },
  {
    id: 'rep_4',
    locationId: 'tartu_lounakeskus',
    companyId: 'go3',
    status: 'PRESENT',
    timestampMillis: now - 2 * hour - 40 * min,
    anonymousUserId: 'anon_user_4',
    latitude: 58.3580,
    longitude: 26.6804,
    gpsAccuracyMeters: 10,
    userReliabilityWeight: 1.0
  },
  {
    id: 'rep_5',
    locationId: 'tartu_lounakeskus',
    companyId: 'go3',
    status: 'PRESENT',
    timestampMillis: now - 4 * hour - 10 * min,
    anonymousUserId: 'anon_user_5',
    latitude: 58.3584,
    longitude: 26.6809,
    gpsAccuracyMeters: 15,
    userReliabilityWeight: 1.0
  },
  // Lõunakeskus: Telia last confirmation 3 hours ago (UNKNOWN / stale)
  {
    id: 'rep_6',
    locationId: 'tartu_lounakeskus',
    companyId: 'telia',
    status: 'PRESENT',
    timestampMillis: now - 3 * hour - 5 * min,
    anonymousUserId: 'anon_user_6',
    latitude: 58.3582,
    longitude: 26.6806,
    gpsAccuracyMeters: 10,
    userReliabilityWeight: 1.0
  },
  // Ülemiste Keskus: Elisa reported present recently
  {
    id: 'rep_7',
    locationId: 'tallinn_ulemiste',
    companyId: 'elisa',
    status: 'PRESENT',
    timestampMillis: now - 14 * min,
    anonymousUserId: 'anon_user_7',
    latitude: 59.4219,
    longitude: 24.7938,
    gpsAccuracyMeters: 9,
    userReliabilityWeight: 1.0
  },
  {
    id: 'rep_8',
    locationId: 'tallinn_ulemiste',
    companyId: 'elisa',
    status: 'PRESENT',
    timestampMillis: now - 35 * min,
    anonymousUserId: 'anon_user_8',
    latitude: 59.4217,
    longitude: 24.7935,
    gpsAccuracyMeters: 11,
    userReliabilityWeight: 1.0
  },
  // Kristiine Keskus: Telia reported NOT PRESENT
  {
    id: 'rep_9',
    locationId: 'tallinn_kristiine',
    companyId: 'telia',
    status: 'NOT_PRESENT',
    timestampMillis: now - 25 * min,
    anonymousUserId: 'anon_user_9',
    latitude: 59.4268,
    longitude: 24.7215,
    gpsAccuracyMeters: 10,
    userReliabilityWeight: 1.0
  },
  {
    id: 'rep_10',
    locationId: 'tallinn_kristiine',
    companyId: 'telia',
    status: 'NOT_PRESENT',
    timestampMillis: now - 40 * min,
    anonymousUserId: 'anon_user_10',
    latitude: 59.4266,
    longitude: 24.7212,
    gpsAccuracyMeters: 16,
    userReliabilityWeight: 1.0
  }
];
