import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Location, LocationIssueReport } from '../types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  currentUserId: string;
  onIssueReported: (issue: LocationIssueReport) => void;
}

const ISSUE_TYPES: { id: LocationIssueReport['issueType']; label: string; desc: string }[] = [
  {
    id: 'DOES_NOT_EXIST',
    label: 'Asukohta pole tegelikult olemas',
    desc: 'Pood või keskus on suletud, lammutatud või seda pole kunagi eksisteerinud.'
  },
  {
    id: 'DUPLICATE',
    label: 'Duplikaat',
    desc: 'Sama kaubanduskeskus või pood on kaardil juba teise nime või punktiga.'
  },
  {
    id: 'INCORRECT_NAME',
    label: 'Vale nimi või eksitav kirjeldus',
    desc: 'Poe ärinimi või aadress on vigane või aegunud.'
  },
  {
    id: 'INCORRECT_POSITION',
    label: 'Vale asukoht kaardil',
    desc: 'Kaardimarker asub vales kvartalis, tänaval või linnas.'
  },
  {
    id: 'OTHER',
    label: 'Muu probleem',
    desc: 'Muud märkused või vajalikud parandused.'
  }
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  location,
  currentUserId,
  onIssueReported
}) => {
  const [selectedType, setSelectedType] = useState<LocationIssueReport['issueType']>('DOES_NOT_EXIST');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !location) return null;

  const handleSubmit = () => {
    const report: LocationIssueReport = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      locationId: location.id,
      locationName: location.name,
      issueType: selectedType,
      description: description.trim(),
      reportedBy: currentUserId,
      reportedAt: Date.now(),
      status: 'PENDING'
    };

    onIssueReported(report);
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setDescription('');
    setSelectedType('DOES_NOT_EXIST');
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      id="report-issue-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Teata veast
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {location.name}
              </p>
            </div>
          </div>
          <button
            id="close-report-issue-modal"
            onClick={resetAndClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!submitted ? (
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mis on selle asukoha juures valesti?
              </label>
              <div className="space-y-2">
                {ISSUE_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedType === type.id
                        ? 'border-red-500/80 bg-red-50/50 dark:bg-red-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="issueType"
                      checked={selectedType === type.id}
                      onChange={() => setSelectedType(type.id)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {type.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {type.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Täpsustav selgitus (vabatahtlik)
              </label>
              <textarea
                id="input-issue-description"
                rows={2}
                placeholder="Lisa täiendav info moderaatorile..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500">
              Märkus: Asukohta ei eemaldata koheselt. Teade suunatakse administraatori töölauale ülevaatamiseks.
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Katkesta
              </button>
              <button
                id="btn-submit-issue-report"
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-500/20"
              >
                Saada teade
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Veateade edastatud
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Täname! Moderaator vaatab teate läbi ja teeb vajadusel parandused.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors"
              >
                Sulge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
