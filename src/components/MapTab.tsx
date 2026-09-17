import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CompanyPresence, Location, Report } from '../types';
import { SEED_COMPANIES } from '../data/seedData';
import { aggregateCompanyStatus, formatTimeAgo } from '../engine/aggregation';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  PlusCircle,
  Flag
} from 'lucide-react';

interface MapTabProps {
  locations: Location[];
  reports: Report[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location | null) => void;
  onOpenReport: (location: Location) => void;
  onOpenAddLocation: () => void;
  onOpenReportIssue: (location: Location) => void;
  userCoords: { lat: number; lng: number } | null;
  onRefreshLocation: () => void;
}

export const MapTab: React.FC<MapTabProps> = ({
  locations,
  reports,
  selectedLocation,
  onSelectLocation,
  onOpenReport,
  onOpenAddLocation,
  onOpenReportIssue,
  userCoords,
  onRefreshLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // STRICT REQUIREMENT: Only APPROVED locations appear on the normal public map
  const approvedLocations = locations.filter((loc) => loc.status === 'APPROVED');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Estonia
    const map = L.map(mapContainerRef.current, {
      center: [58.75, 25.5],
      zoom: 7.5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap CartoDB Positron / standard tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Location Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    (Object.values(markersRef.current) as L.Marker[]).forEach((m) => m.remove());
    markersRef.current = {};

    approvedLocations.forEach((loc) => {
      // Calculate overall mall status (highest presence)
      const presences = SEED_COMPANIES.map((c) =>
        aggregateCompanyStatus(c, reports.filter((r) => r.locationId === loc.id))
      );
      const hasPresent = presences.some((p) => p.status === 'PRESENT');
      const hasProbable = presences.some((p) => p.status === 'PROBABLY_PRESENT');

      let badgeBg = '#64748B';
      if (hasPresent) badgeBg = '#10B981';
      else if (hasProbable) badgeBg = '#3B82F6';

      const isSelected = selectedLocation?.id === loc.id;

      const customIcon = L.divIcon({
        className: 'custom-mall-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            background: ${badgeBg};
            color: white;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          ">
            🏬
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectLocation(loc);
      });

      markersRef.current[loc.id] = marker;
    });
  }, [approvedLocations, reports, selectedLocation, onSelectLocation]);

  // Update User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoords) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: `
          <div style="
            position: relative;
            width: 18px;
            height: 18px;
            background: #0284C7;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 6px rgba(2,132,199,0.3);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    }
  }, [userCoords]);

  // Selected location presences
  const presences: CompanyPresence[] = selectedLocation
    ? SEED_COMPANIES.map((company) =>
        aggregateCompanyStatus(
          company,
          reports.filter((r) => r.locationId === selectedLocation.id)
        )
      )
    : [];

  return (
    <div className="relative w-full h-[calc(100vh-140px)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Action Bar: Add Location ("LISA POOD / OSTUKESKUS") and GPS */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2.5">
        {/* Prominent Button: LISA POOD / OSTUKESKUS */}
        <button
          id="btn-add-location"
          onClick={onOpenAddLocation}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 font-bold text-xs transition border border-blue-500 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>LISA POOD / OSTUKESKUS</span>
        </button>

        <button
          onClick={onRefreshLocation}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white text-slate-800 rounded-xl shadow-md font-medium text-xs hover:bg-slate-50 transition border border-slate-200"
          title="Minu asukoht"
        >
          <Navigation className="w-4 h-4 text-sky-600 fill-sky-600" />
          <span className="hidden sm:inline">Minu asukoht</span>
        </button>
      </div>

      {/* Map Legend Banner */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-slate-700 font-medium">Kohal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          <span className="text-slate-700 font-medium">Tõenäoliselt kohal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
          <span className="text-slate-700 font-medium">Teadmata</span>
        </div>
      </div>

      {/* Location Details Bottom Sheet */}
      {selectedLocation && (
        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedLocation.name}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  {selectedLocation.type}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedLocation.address}, {selectedLocation.city}
              </p>
            </div>
            <button
              onClick={() => onSelectLocation(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Companies List */}
          <div className="space-y-3 mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Müügiesindajate staatus
            </h3>

            {presences.map((p) => {
              const statusCfg = {
                PRESENT: { label: 'Kohal', color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
                PROBABLY_PRESENT: { label: 'Tõenäoliselt kohal', color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
                PROBABLY_ABSENT: { label: 'Tõenäoliselt ei ole kohal', color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
                UNKNOWN: { label: 'Teadmata', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
              }[p.status];

              return (
                <div
                  key={p.company.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{p.company.name}</span>
                      <span className="text-xs text-slate-400">({p.company.category})</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Viimane kinnitus: {formatTimeAgo(p.lastConfirmedTimeMillis)}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Hiljutisi kinnitusi: {p.recentConfirmationsCount}
                    </span>
                  </div>

                  {/* Persistent presence indicator */}
                  {p.isPersistentPresenceToday && (
                    <div className="mt-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs font-medium border border-sky-200 dark:border-sky-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{p.company.name} kohalolek on täna selles kohas korduvalt kinnitatud.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons: Report Presence and Report Issue */}
          <div className="space-y-2">
            <button
              onClick={() => onOpenReport(selectedLocation)}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 hover:bg-sky-700 active:scale-[0.99] transition text-sm"
            >
              <span>Kas siin on müügimees? Teata kohalolust</span>
            </button>

            {/* TEATA VEAST action */}
            <button
              id="btn-report-issue"
              onClick={() => onOpenReportIssue(selectedLocation)}
              className="w-full py-2.5 px-4 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 font-semibold flex items-center justify-center gap-1.5 transition text-xs"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>TEATA VEAST</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
