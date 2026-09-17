import React from 'react';
import { SettingsState } from '../types';
import { Shield, Bell, MapPin, Info, CheckCircle2, Sliders, Smartphone } from 'lucide-react';

interface SettingsTabProps {
  settings: SettingsState;
  onUpdateSettings: (newSettings: Partial<SettingsState>) => void;
  onSimulateGeofenceArrival: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onSimulateGeofenceArrival,
}) => {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seaded</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Rakenduse load, saabumise kontroll ja privaatsuse seadistused.
        </p>
      </div>

      {/* Permissions Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-600" />
          <span>Rakenduse õigused</span>
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <div className="font-medium text-slate-800 text-sm">Asukoha luba (GPS)</div>
            <div className="text-xs text-slate-500">Vajalik läheduses olevate keskuste ja raportite kinnitamiseks</div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
            Aktiivne
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-medium text-slate-800 text-sm">Teavituste luba</div>
            <div className="text-xs text-slate-500">Kaubanduskeskusesse saabumisel kohalolu küsimine</div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
            Aktiivne
          </span>
        </div>
      </div>

      {/* Geofencing & Arrival Checks Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-600" />
              <span>Saabumise kontrollid (Geofencing)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Küsi teavitusega keskusesse sisenemisel: "Kas siin on müügimees?"
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.arrivalChecksEnabled}
              onChange={(e) => onUpdateSettings({ arrivalChecksEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
          </label>
        </div>

        {/* Cooldown Slider */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-400" />
              Teavituste ooteaeg (Cooldown)
            </span>
            <span className="font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
              {settings.cooldownHours} tundi
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={settings.cooldownHours}
            onChange={(e) => onUpdateSettings({ cooldownHours: parseInt(e.target.value, 10) })}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Väldib kasutaja korduvat häirimist samas keskuses teatud tundide jooksul.
          </p>
        </div>

        {/* Live Simulator Trigger */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onSimulateGeofenceArrival}
            className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Smartphone className="w-4 h-4 text-sky-600" />
            <span>Käivita geofence saabumisteavituse simulatsioon</span>
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2 text-slate-800">
        <h2 className="text-base font-bold flex items-center gap-2 text-sky-950">
          <Shield className="w-5 h-5 text-sky-600" />
          <span>Privaatsuspõhimõtted</span>
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          Rakendus <strong>EI tuvasta, pildista, nimeta ega jälgi ühtegi konkreetset inimest</strong>.
          Me jälgime vaid ettevõtete (nt GO3, Telia, Elisa) avalike müügipunktide ja esinduste kohalolu kaubanduskeskustes.
        </p>
        <p className="text-xs text-slate-700 leading-relaxed">
          Sinu raportid salvestatakse anonüümse Firebase UID identifikaatoriga, mida ei seota sinu nime, meiliaadressi ega telefoninumbriga.
        </p>
      </div>

      {/* About App Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-500" />
          <span>Müügiradar Eesti MVP</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Versioon 1.0.0. Ehitatud Kotlin / Jetpack Compose Clean Architecture baasil (Material 3, Google Maps SDK, Android Geofencing API, Firebase Firestore & Auth).
        </p>
      </div>
    </div>
  );
};
