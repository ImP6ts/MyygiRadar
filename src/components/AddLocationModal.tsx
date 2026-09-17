import React, { useState } from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  Building2,
  Navigation,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Location, LocationType } from '../types';
import { detectDuplicateLocation } from '../utils/duplicateDetector';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
  existingLocations: Location[];
  currentUserId: string;
  onLocationSubmitted: (newLoc: Location) => void;
}

const LOCATION_TYPES: LocationType[] = [
  'Supermarket',
  'Hüpermarket',
  'Kaubanduskeskus',
  'Elektroonikapood',
  'Muu'
];

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  userLat,
  userLng,
  existingLocations,
  currentUserId,
  onLocationSubmitted
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tallinn');
  const [type, setType] = useState<LocationType>('Kaubanduskeskus');
  const [lat, setLat] = useState(userLat);
  const [lng, setLng] = useState(userLng);

  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [duplicateWarning, setDuplicateWarning] = useState<Location | null>(null);

  if (!isOpen) return null;

  const handleNextToPreview = () => {
    // Check duplicates first
    const dupCheck = detectDuplicateLocation(name, address, lat, lng, existingLocations);
    if (dupCheck.hasDuplicate && dupCheck.matchedLocation) {
      setDuplicateWarning(dupCheck.matchedLocation);
      return;
    }
    setDuplicateWarning(null);
    setStep('preview');
  };

  const handleFinalSubmit = () => {
    const newLocation: Location = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      geofenceRadiusMeters: 200,
      type: type,
      active: true,
      activeCompanyIds: ['telia', 'elisa', 'go3', 'luminor'],
      status: 'PENDING',
      submittedBy: currentUserId,
      submittedAt: Date.now(),
      reviewedBy: null,
      reviewedAt: null
    };

    onLocationSubmitted(newLocation);
    setStep('success');
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setCity('Tallinn');
    setType('Kaubanduskeskus');
    setLat(userLat);
    setLng(userLng);
    setStep('form');
    setDuplicateWarning(null);
    onClose();
  };

  return (
    <div
      id="add-location-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Lisa pood / ostukeskus
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uued asukohad vaadatakse moderaatori poolt üle
              </p>
            </div>
          </div>
          <button
            id="close-add-location-modal"
            onClick={resetForm}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keskuse või poe nimi *
              </label>
              <input
                id="input-location-name"
                type="text"
                placeholder="nt Mustamäe Keskus, Selver, K-Rauta"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDuplicateWarning(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aadress *
                </label>
                <input
                  id="input-location-address"
                  type="text"
                  placeholder="nt A. H. Tammsaare tee 104a"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setDuplicateWarning(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Linn *
                </label>
                <input
                  id="input-location-city"
                  type="text"
                  placeholder="Tallinn"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Asukoha tüüp *
              </label>
              <div className="flex flex-wrap gap-2">
                {LOCATION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      type === t
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates & Pin adjustment */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Kaardi asukoht (GPS)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLat(userLat);
                    setLng(userLng);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Minu GPS asukoht
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Laiuskraad (Lat):</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Pikkuskraad (Lng):</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Duplicate Warning if detected */}
            {duplicateWarning && (
              <div
                id="duplicate-location-warning"
                className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2 text-xs"
              >
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Sarnane asukoht on juba olemas.</span>
                </div>
                <p>
                  Andmebaasis on juba registreeritud koht: <strong>{duplicateWarning.name}</strong> (
                  {duplicateWarning.address}, {duplicateWarning.city}).
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-semibold"
                  >
                    Katkesta lisamine
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateWarning(null);
                      setStep('preview');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                  >
                    Jätka sellest hoolimata
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Katkesta
              </button>
              <button
                id="btn-preview-location-submit"
                type="button"
                disabled={!name.trim() || !address.trim() || !city.trim()}
                onClick={handleNextToPreview}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                Vaata üle <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Andmete kinnitus enne esitamist
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500">Nimi:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500">Aadress:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {address}, {city}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500">Tüüp:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                  <span className="text-slate-500">Koordinaadid:</span>
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 text-xs">Esialgne staatus:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    OOTEL (PENDING)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex gap-2.5 items-start">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Asukoht lisatakse avalikule kaardile alles pärast administraatori ülevaatust ja heakskiitu.
              </span>
            </div>

            <div className="pt-2 flex justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Muuda andmeid
              </button>
              <button
                id="btn-confirm-submit-location"
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/20"
              >
                Esita kinnitamiseks
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="mt-5 text-center space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Esitatud kinnitamiseks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Sinu asukoht <strong>"{name}"</strong> on salvestatud. Moderaator kontrollib selle andmeid enne avalikustamist.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300">
              <span>Staatus:</span>
              <span className="font-bold">OOTEL</span>
            </div>

            <div className="pt-3">
              <button
                id="btn-close-submission-success"
                type="button"
                onClick={resetForm}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors"
              >
                Valmis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
