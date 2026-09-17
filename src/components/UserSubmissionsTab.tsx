import React from 'react';
import { Bookmark, Plus, Clock, CheckCircle2, XCircle, MapPin, Building2 } from 'lucide-react';
import { Location } from '../types';

interface UserSubmissionsTabProps {
  submissions: Location[];
  onOpenAddModal: () => void;
}

export const UserSubmissionsTab: React.FC<UserSubmissionsTabProps> = ({
  submissions,
  onOpenAddModal
}) => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Minu lisatud kohad
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Esitatud kinnitamiseks ja nende praegune staatus
          </p>
        </div>

        <button
          id="btn-add-location-from-submissions"
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Lisa uus asukoht
        </button>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Sa pole veel ühtegi asukohta esitanud
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Kui märkad, et mõni pood või kaubanduskeskus on kaardilt puudu, saad selle lisada. Pärast moderaatori heakskiitu ilmub see avalikule kaardile.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Lisa pood / ostukeskus
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((loc) => {
            const isPending = loc.status === 'PENDING';
            const isApproved = loc.status === 'APPROVED';
            const isRejected = loc.status === 'REJECTED';

            return (
              <div
                key={loc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {loc.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {loc.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {loc.address}, {loc.city}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <Clock className="w-3.5 h-3.5" />
                        OOTEL
                      </span>
                    )}

                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        KINNITATUD
                      </span>
                    )}

                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                        <XCircle className="w-3.5 h-3.5" />
                        TAGASI LÜKATUD
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Esitatud kinnitamiseks: {loc.submittedAt ? new Date(loc.submittedAt).toLocaleDateString('et-EE') : 'Täna'}</span>
                  {isApproved && <span className="text-emerald-600 font-semibold">Avaldatud avalikul kaardil</span>}
                  {isPending && <span className="text-amber-600 font-semibold">Ootab moderaatori ülevaatust</span>}
                  {isRejected && <span className="text-red-500 font-semibold">Moderaator lükkas tagasi</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
