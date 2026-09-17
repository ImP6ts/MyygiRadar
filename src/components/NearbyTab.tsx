import React, { useState } from 'react';
import { Location, Report } from '../types';
import { SEED_COMPANIES } from '../data/seedData';
import { aggregateCompanyStatus, calculateDistanceMeters } from '../engine/aggregation';
import { Search, MapPin, Navigation, PlusCircle } from 'lucide-react';

interface NearbyTabProps {
  locations: Location[];
  reports: Report[];
  userCoords: { lat: number; lng: number } | null;
  onSelectLocation: (location: Location) => void;
  onRequestLocation: () => void;
  onOpenAddLocation?: () => void;
}

export const NearbyTab: React.FC<NearbyTabProps> = ({
  locations,
  reports,
  userCoords,
  onSelectLocation,
  onRequestLocation,
  onOpenAddLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Requirement: Only APPROVED locations appear on the public map and nearby list
  const approvedLocations = locations.filter((loc) => loc.status === 'APPROVED');

  const filtered = approvedLocations
    .filter((loc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q)
      );
    })
    .map((loc) => {
      const distance = userCoords
        ? calculateDistanceMeters(userCoords.lat, userCoords.lng, loc.latitude, loc.longitude)
        : null;
      return { loc, distance };
    })
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return a.loc.name.localeCompare(b.loc.name);
    });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Läheduses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Leia lähimad kaubanduskeskused ja vaata aktiivseid müügiesindajaid.
          </p>
        </div>

        {onOpenAddLocation && (
          <button
            onClick={onOpenAddLocation}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lisa pood</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Otsi keskust või linna (nt Ülemiste, Tartu, Kristiine)..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
        />
      </div>

      {/* Use My Location Banner */}
      <button
        onClick={onRequestLocation}
        className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition border ${
          userCoords
            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
        }`}
      >
        <Navigation className={`w-4 h-4 ${userCoords ? 'text-sky-600 fill-sky-600' : 'text-slate-500'}`} />
        <span>
          {userCoords
            ? 'GPS asukoht aktiivne • Järjestatud vahemaa järgi'
            : 'Kasuta minu asukohta (järjesta vahemaa järgi)'}
        </span>
      </button>

      {/* Locations List */}
      <div className="space-y-3">
        {filtered.map(({ loc, distance }) => {
          const presences = SEED_COMPANIES.slice(0, 3).map((c) =>
            aggregateCompanyStatus(
              c,
              reports.filter((r) => r.locationId === loc.id)
            )
          );

          return (
            <div
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{loc.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {loc.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {loc.address}, {loc.city}
                  </p>
                </div>

                {distance !== null && (
                  <span className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-lg border border-sky-100 dark:border-sky-800">
                    {distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`}
                  </span>
                )}
              </div>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                {presences.map((p) => {
                  const statusColors = {
                    PRESENT: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    PROBABLY_PRESENT: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    PROBABLY_ABSENT: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    UNKNOWN: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                  }[p.status];

                  const statusLabels = {
                    PRESENT: 'Kohal',
                    PROBABLY_PRESENT: 'Tõenäoliselt kohal',
                    PROBABLY_ABSENT: 'Ei ole kohal',
                    UNKNOWN: 'Teadmata',
                  }[p.status];

                  return (
                    <span
                      key={p.company.id}
                      className={`text-[11px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${statusColors}`}
                    >
                      <span className="font-bold">{p.company.name}:</span> {statusLabels}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
