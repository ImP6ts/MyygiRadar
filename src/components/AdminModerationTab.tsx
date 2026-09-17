import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Building2,
  Tag,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Location, LocationIssueReport } from '../types';

interface AdminModerationTabProps {
  currentUserId: string;
  isAdmin: boolean;
  onToggleAdminSimulatedUid: (uid: string) => void;
  pendingLocations: Location[];
  issueReports: LocationIssueReport[];
  onApproveLocation: (locationId: string) => void;
  onRejectLocation: (locationId: string) => void;
  onDismissIssueReport: (reportId: string) => void;
}

export const AdminModerationTab: React.FC<AdminModerationTabProps> = ({
  currentUserId,
  isAdmin,
  onToggleAdminSimulatedUid,
  pendingLocations,
  issueReports,
  onApproveLocation,
  onRejectLocation,
  onDismissIssueReport
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'issues'>('pending');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Admin Role Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ASUKOHTADE KINNITAMINE
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administraatori modereerimispaneel uute poodide ja vigade kontrolliks
          </p>
        </div>

        {/* Admin UID Simulator / Verification */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              Aktiivne Firebase UID
            </span>
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
              {currentUserId}
            </span>
          </div>

          <button
            onClick={() =>
              onToggleAdminSimulatedUid(
                isAdmin ? 'regular_user_uid_123' : 'admin_myygiradar_master'
              )
            }
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              isAdmin
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 hover:bg-amber-200'
            }`}
          >
            {isAdmin ? 'Admin (Sees)' : 'Tavakasutaja (Väljas)'}
          </button>
        </div>
      </div>

      {!isAdmin ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-6 rounded-2xl text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-900 dark:text-red-200">
            Juurdepääs piiratud
          </h3>
          <p className="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">
            Sinu praegune kasutajatunnus ei kuulu administraatorite nimekirja (AdminConfig.kt ja firestore.rules).
            Modereerimiseks lülita sisse administraatori UID või konfigureeri oma UID.
          </p>
          <button
            onClick={() => onToggleAdminSimulatedUid('admin_myygiradar_master')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
          >
            Lülitu administraatoriks (admin_myygiradar_master)
          </button>
        </div>
      ) : (
        <>
          {/* Sub Navigation */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>Ootel asukohad</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {pendingLocations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'issues'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>Teatatud vead</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {issueReports.length}
              </span>
            </button>
          </div>

          {/* Tab 1: PENDING Locations */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingLocations.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Kõik asukohad on läbi vaadatud!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hetkel pole ühtegi kasutaja esitatud asukohta modereerimise ootel.
                  </p>
                </div>
              ) : (
                pendingLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {loc.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            OOTEL
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {loc.address}, {loc.city}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                          {loc.type}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Coordinates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Esitatud:
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {loc.submittedAt
                            ? new Date(loc.submittedAt).toLocaleString('et-EE')
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> Esitaja UID:
                        </span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block">
                          {loc.submittedBy || 'Anonüümne'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Koordinaadid:
                        </span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: KINNITA and LÜKKA TAGASI */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        id={`btn-reject-location-${loc.id}`}
                        onClick={() => onRejectLocation(loc.id)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Lükka tagasi
                      </button>

                      <button
                        id={`btn-approve-location-${loc.id}`}
                        onClick={() => onApproveLocation(loc.id)}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Kinnita (Avalda kaardil)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Reported Issues */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              {issueReports.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Veateateid pole esitatud
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kasutajate saadetud "TEATA VEAST" raportid ilmuvad siia ülevaatamiseks.
                  </p>
                </div>
              ) : (
                issueReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {report.locationName}
                          </h4>
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Vea tüüp: {report.issueType}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {new Date(report.reportedAt).toLocaleString('et-EE')}
                      </span>
                    </div>

                    {report.description && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                        "{report.description}"
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Teataja UID: {report.reportedBy}</span>
                      <button
                        onClick={() => onDismissIssueReport(report.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Märgi lahendatuks
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
