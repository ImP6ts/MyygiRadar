import React, { useState, useEffect } from 'react';
import { Location, LocationIssueReport, Report, ReportStatus, SettingsState } from './types';
import { SEED_COMPANIES, SEED_LOCATIONS, INITIAL_SEED_REPORTS } from './data/seedData';
import { MapTab } from './components/MapTab';
import { NearbyTab } from './components/NearbyTab';
import { SettingsTab } from './components/SettingsTab';
import { AndroidCodeInspector } from './components/AndroidCodeInspector';
import { ReportModal } from './components/ReportModal';
import { AddLocationModal } from './components/AddLocationModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { UserSubmissionsTab } from './components/UserSubmissionsTab';
import { AdminModerationTab } from './components/AdminModerationTab';
import { GeofenceSimulatorModal } from './components/GeofenceSimulatorModal';
import {
  Map,
  Navigation,
  Settings,
  Layers,
  Wifi,
  WifiOff,
  CheckCircle2,
  Bookmark,
  ShieldCheck
} from 'lucide-react';

const ADMIN_UIDS = new Set([
  'admin_myygiradar_master',
  'arletpdr_admin_uid',
  'dev_test_admin_uid'
]);

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'map' | 'nearby' | 'submissions' | 'admin' | 'settings' | 'code'
  >('map');

  // Configurable Firebase User ID (Admin vs Regular User simulation)
  const [currentUserId, setCurrentUserId] = useState<string>('admin_myygiradar_master');
  const isAdmin = ADMIN_UIDS.has(currentUserId);

  // Locations state
  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem('myygiradar_locations_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SEED_LOCATIONS;
      }
    }
    return SEED_LOCATIONS;
  });

  // Issue reports state
  const [issueReports, setIssueReports] = useState<LocationIssueReport[]>(() => {
    const saved = localStorage.getItem('myygiradar_issue_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('myygiradar_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SEED_REPORTS;
      }
    }
    return INITIAL_SEED_REPORTS;
  });

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [reportModalLocation, setReportModalLocation] = useState<Location | null>(null);
  const [issueModalLocation, setIssueModalLocation] = useState<Location | null>(null);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 59.4218, // Tallinn Ülemiste
    lng: 24.7937,
  });

  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsState>({
    arrivalChecksEnabled: true,
    cooldownHours: 3,
    hasLocationPermission: true,
    hasNotificationPermission: true,
  });

  const [geofenceModal, setGeofenceModal] = useState<{
    isOpen: boolean;
    location: Location;
    companyName: string;
    companyId: string;
  } | null>(null);

  // Persist locations
  useEffect(() => {
    localStorage.setItem('myygiradar_locations_v2', JSON.stringify(locations));
  }, [locations]);

  // Persist issue reports
  useEffect(() => {
    localStorage.setItem('myygiradar_issue_reports', JSON.stringify(issueReports));
  }, [issueReports]);

  // Persist sales reports
  useEffect(() => {
    localStorage.setItem('myygiradar_reports', JSON.stringify(reports));
  }, [reports]);

  const refreshUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          showToast('GPS asukoht värskendatud!');
        },
        () => {
          setUserCoords({ lat: 59.437, lng: 24.7535 });
          showToast('GPS luba puudub, kasutatakse vaikeasukohta (Tallinn).');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle new user location submission (status = PENDING)
  const handleLocationSubmitted = (newLoc: Location) => {
    setLocations((prev) => [newLoc, ...prev]);
    showToast(`Asukoht "${newLoc.name}" esitatud kinnitamiseks! Staatus: OOTEL`);
  };

  // Handle location issue report
  const handleIssueReported = (issue: LocationIssueReport) => {
    setIssueReports((prev) => [issue, ...prev]);
    showToast(`Veateade asukoha kohta "${issue.locationName}" edastatud moderaatorile!`);
  };

  // Admin approves location -> becomes APPROVED, visible on public map!
  const handleApproveLocation = (locationId: string) => {
    if (!isAdmin) {
      showToast('Puuduvad administraatori õigused!');
      return;
    }
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, status: 'APPROVED', reviewedBy: currentUserId, reviewedAt: Date.now() }
          : loc
      )
    );
    showToast('Asukoht kinnitatud! Nüüd on see avalikul kaardil nähtav.');
  };

  // Admin rejects location -> status REJECTED
  const handleRejectLocation = (locationId: string) => {
    if (!isAdmin) {
      showToast('Puuduvad administraatori õigused!');
      return;
    }
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, status: 'REJECTED', reviewedBy: currentUserId, reviewedAt: Date.now() }
          : loc
      )
    );
    showToast('Asukoht tagasi lükatud.');
  };

  const handleDismissIssueReport = (reportId: string) => {
    setIssueReports((prev) => prev.filter((r) => r.id !== reportId));
    showToast('Veateade märgitud lahendatuks.');
  };

  // Handle sales rep presence report submission
  const handleReportSubmit = (
    locationId: string,
    companyId: string,
    status: ReportStatus,
    lat: number,
    lng: number,
    accuracy: number
  ) => {
    const newReport: Report = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      locationId,
      companyId,
      status,
      timestampMillis: Date.now(),
      anonymousUserId: currentUserId,
      latitude: lat,
      longitude: lng,
      gpsAccuracyMeters: accuracy,
      userReliabilityWeight: accuracy <= 20 ? 1.0 : accuracy <= 60 ? 0.7 : 0.4,
    };

    if (!isOnline) {
      setOfflineQueueCount((prev) => prev + 1);
      showToast('Võrguühendus puudub. Raport lisati kohalikku järjekorda!');
    } else {
      setReports((prev) => [newReport, ...prev]);
      showToast('Aruanne edukalt salvestatud!');
    }
  };

  const handleSimulateGeofenceArrival = () => {
    const louna = locations.find((l) => l.id === 'tartu_lounakeskus') || locations[0];
    setGeofenceModal({
      isOpen: true,
      location: louna,
      companyName: 'GO3',
      companyId: 'go3',
    });
  };

  const pendingLocations = locations.filter((l) => l.status === 'PENDING');
  const userSubmissions = locations.filter(
    (l) => l.submittedBy === currentUserId || (l.status !== 'APPROVED' && l.submittedBy)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-600/30">
            M
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-slate-900 dark:text-slate-100">
              Müügiradar Eesti
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Modereeritud müügikohtade ja esinduste kaart
            </p>
          </div>
        </div>

        {/* Status indicator pills & admin role info */}
        <div className="flex items-center gap-2">
          {pendingLocations.length > 0 && (
            <button
              onClick={() => setActiveTab('admin')}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1 animate-pulse"
              title="Ootel asukohad modereerimiseks"
            >
              <span>{pendingLocations.length} ootel</span>
            </button>
          )}

          {/* Offline/Online toggle */}
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              if (!isOnline && offlineQueueCount > 0) {
                showToast(`Taasühendatud! ${offlineQueueCount} ootel raportit sünkrooniti.`);
                setOfflineQueueCount(0);
              }
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
            title="Klõpsa võrguühenduse simuleerimiseks"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            {offlineQueueCount > 0 && (
              <span className="bg-rose-600 text-white rounded-full px-1.5 text-[10px]">
                {offlineQueueCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'map' && (
          <MapTab
            locations={locations}
            reports={reports}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onOpenReport={(loc) => setReportModalLocation(loc)}
            onOpenAddLocation={() => setIsAddLocationOpen(true)}
            onOpenReportIssue={(loc) => setIssueModalLocation(loc)}
            userCoords={userCoords}
            onRefreshLocation={refreshUserLocation}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyTab
            locations={locations}
            reports={reports}
            userCoords={userCoords}
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              setActiveTab('map');
            }}
            onRequestLocation={refreshUserLocation}
            onOpenAddLocation={() => setIsAddLocationOpen(true)}
          />
        )}

        {activeTab === 'submissions' && (
          <div className="p-4">
            <UserSubmissionsTab
              submissions={userSubmissions}
              onOpenAddModal={() => setIsAddLocationOpen(true)}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="p-4">
            <AdminModerationTab
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onToggleAdminSimulatedUid={(uid) => setCurrentUserId(uid)}
              pendingLocations={pendingLocations}
              issueReports={issueReports}
              onApproveLocation={handleApproveLocation}
              onRejectLocation={handleRejectLocation}
              onDismissIssueReport={handleDismissIssueReport}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
            onSimulateGeofenceArrival={handleSimulateGeofenceArrival}
          />
        )}

        {activeTab === 'code' && <AndroidCodeInspector />}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Report Modal */}
      {reportModalLocation && (
        <ReportModal
          location={reportModalLocation}
          userCoords={userCoords}
          onClose={() => setReportModalLocation(null)}
          onSubmitReport={handleReportSubmit}
        />
      )}

      {/* Add Location Modal ("LISA POOD / OSTUKESKUS") */}
      <AddLocationModal
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        userLat={userCoords?.lat || 59.4218}
        userLng={userCoords?.lng || 24.7937}
        existingLocations={locations}
        currentUserId={currentUserId}
        onLocationSubmitted={handleLocationSubmitted}
      />

      {/* Report Issue Modal ("TEATA VEAST") */}
      <ReportIssueModal
        isOpen={!!issueModalLocation}
        onClose={() => setIssueModalLocation(null)}
        location={issueModalLocation}
        currentUserId={currentUserId}
        onIssueReported={handleIssueReported}
      />

      {/* Geofence Simulator Modal */}
      {geofenceModal && geofenceModal.isOpen && (
        <GeofenceSimulatorModal
          location={geofenceModal.location}
          companyName={geofenceModal.companyName}
          companyId={geofenceModal.companyId}
          onClose={() => setGeofenceModal(null)}
          onAnswer={(status) => {
            handleReportSubmit(
              geofenceModal.location.id,
              geofenceModal.companyId,
              status,
              geofenceModal.location.latitude,
              geofenceModal.location.longitude,
              15
            );
            setGeofenceModal(null);
          }}
        />
      )}

      {/* Bottom Navigation Bar (Material 3 style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-2 px-1 shadow-lg">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'map'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Map className={`w-5 h-5 ${activeTab === 'map' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">Kaart</span>
        </button>

        <button
          onClick={() => setActiveTab('nearby')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'nearby'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Navigation className={`w-5 h-5 ${activeTab === 'nearby' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">Läheduses</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'submissions'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${activeTab === 'submissions' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">Minu kohad</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition relative ${
            activeTab === 'admin'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${activeTab === 'admin' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">Kinnitamine</span>
          {pendingLocations.length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">Seaded</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'code'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Layers className={`w-5 h-5 ${activeTab === 'code' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">Android Kood</span>
        </button>
      </nav>
    </div>
  );
}
