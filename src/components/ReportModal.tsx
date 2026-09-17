import React, { useState } from 'react';
import { Company, Location, Report, ReportStatus, ValidationResult } from '../types';
import { SEED_COMPANIES } from '../data/seedData';
import { validateReportLocation } from '../engine/aggregation';
import { Check, X, AlertTriangle, ShieldCheck, Navigation, MapPin } from 'lucide-react';

interface ReportModalProps {
  location: Location;
  userCoords: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmitReport: (
    locationId: string,
    companyId: string,
    status: ReportStatus,
    lat: number,
    lng: number,
    accuracy: number
  ) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  location,
  userCoords,
  onClose,
  onSubmitReport,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState('go3');
  // Proximity simulator mode for testing GPS verification in browser preview
  const [simMode, setSimMode] = useState<'inside' | 'nearby' | 'far' | 'real'>('inside');
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(12);

  // Compute simulated or real coords
  let currentLat = location.latitude;
  let currentLng = location.longitude;
  let accuracy = gpsAccuracy;

  if (simMode === 'inside') {
    currentLat = location.latitude + 0.0002;
    currentLng = location.longitude + 0.0002;
    accuracy = 12;
  } else if (simMode === 'nearby') {
    currentLat = location.latitude + 0.0018; // ~200m away
    currentLng = location.longitude + 0.0018;
    accuracy = 65; // Poor accuracy warning test
  } else if (simMode === 'far') {
    currentLat = location.latitude + 0.05; // ~5km away
    currentLng = location.longitude + 0.05;
    accuracy = 25;
  } else if (simMode === 'real' && userCoords) {
    currentLat = userCoords.lat;
    currentLng = userCoords.lng;
    accuracy = 20;
  }

  const validation: ValidationResult = validateReportLocation(
    location,
    currentLat,
    currentLng,
    accuracy
  );

  const handleSubmit = (status: ReportStatus) => {
    onSubmitReport(location.id, selectedCompanyId, status, currentLat, currentLng, accuracy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Kas siin on müügimees?</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {location.name} ({location.city})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Company Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Vali ettevõte
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SEED_COMPANIES.map((company) => {
                const isSelected = selectedCompanyId === company.id;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-slate-900 text-sm">{company.name}</span>
                    <span className="text-[11px] text-slate-400 truncate">{company.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GPS Validation & Test Proximity Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                GPS Valideerimine (Raadius {location.geofenceRadiusMeters} m)
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  validation.isValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {validation.isValid ? 'Lubatud' : 'Liiga kaugel'}
              </span>
            </div>

            <p className="text-slate-500">
              Vahemaa keskusest: <strong className="text-slate-800">{validation.distanceMeters} m</strong> • GPS täpsus: <strong className="text-slate-800">{accuracy} m</strong>
            </p>

            {validation.isAccuracyWarning && (
              <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>GPS täpsus on madal ({accuracy} m). Raport salvestatakse madalama usaldusväärsusega (kaal {validation.adjustedReliabilityWeight}).</span>
              </div>
            )}

            {!validation.isValid && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                Oled sellest keskusest liiga kaugel. Tõese info tagamiseks saab kinnitatud raportit esitada vaid kohapeal viibides.
              </div>
            )}

            {/* Test Simulation Buttons (ensures interactive demonstration in web preview) */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5">
              <span className="text-slate-400 self-center text-[10px] mr-1">GPS test:</span>
              <button
                type="button"
                onClick={() => setSimMode('inside')}
                className={`px-2 py-1 rounded text-[11px] font-medium border ${
                  simMode === 'inside'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Keskuses kohapeal (12 m)
              </button>
              <button
                type="button"
                onClick={() => setSimMode('nearby')}
                className={`px-2 py-1 rounded text-[11px] font-medium border ${
                  simMode === 'nearby'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Parklas / madal GPS (65 m)
              </button>
              <button
                type="button"
                onClick={() => setSimMode('far')}
                className={`px-2 py-1 rounded text-[11px] font-medium border ${
                  simMode === 'far'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                5 km eemal (väljaspool)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={!validation.isValid}
              onClick={() => handleSubmit('PRESENT')}
              className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition"
            >
              <Check className="w-5 h-5" />
              <span>Jah, on kohal</span>
            </button>

            <button
              type="button"
              disabled={!validation.isValid}
              onClick={() => handleSubmit('NOT_PRESENT')}
              className="py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 active:scale-[0.98] transition"
            >
              <X className="w-5 h-5" />
              <span>Ei ole kohal</span>
            </button>
          </div>

          {/* Privacy footer */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Privaatsus: Raport on anonüümne. Isikuandmeid ega fotosid ei koguta ega avaldata.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
