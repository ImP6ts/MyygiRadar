import React from 'react';
import { Location, ReportStatus } from '../types';
import { Bell, Check, X, ShieldAlert } from 'lucide-react';

interface GeofenceSimulatorModalProps {
  location: Location;
  companyName: string;
  companyId: string;
  onClose: () => void;
  onAnswer: (status: ReportStatus) => void;
}

export const GeofenceSimulatorModal: React.FC<GeofenceSimulatorModalProps> = ({
  location,
  companyName,
  onClose,
  onAnswer,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mt-8 sm:mt-0">
        {/* Android push notification banner header */}
        <div className="bg-slate-900 text-white p-3 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-sky-600 rounded-md text-white">
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold tracking-wide">MÜÜGIRADAR • SAABUMISTEAVITUS</span>
          </div>
          <span className="text-slate-400">just nüüd</span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Oled saabunud asukohta {location.name}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Kas siin on praegu <strong className="text-slate-900 font-semibold">{companyName}</strong> müügiesindaja?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onAnswer('PRESENT')}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition"
            >
              <Check className="w-4 h-4" />
              <span>Jah, on kohal</span>
            </button>

            <button
              onClick={() => onAnswer('NOT_PRESENT')}
              className="py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 active:scale-[0.98] transition"
            >
              <X className="w-4 h-4" />
              <span>Ei ole kohal</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
            <span>Geofencing raadius: {location.geofenceRadiusMeters} m</span>
            <button onClick={onClose} className="text-slate-500 hover:underline">
              Jäta vahele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
