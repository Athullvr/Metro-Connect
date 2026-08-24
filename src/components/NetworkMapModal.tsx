import React, { useState } from 'react';
import { X, Train, Ship, Bus } from 'lucide-react';
import transitData from '../data.json';

export default function NetworkMapModal({
  isOpen,
  onClose,
  onSelectStation
}) {
  const [activeTab, setActiveTab] = useState('metro'); // 'metro' | 'water' | 'feeder'

  if (!isOpen) return null;

  const metroStations = transitData.metro_line.stations;
  const waterJetties = transitData.water_metro.jetties;
  const feederRoutes = transitData.feeder_buses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card rounded-3xl border border-white/90 bg-white/95 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              Kochi Multimodal Network Explorer
            </h3>
            <p className="text-xs text-slate-500">
              Browse all transit stops and tap to select as your journey endpoint.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/70 p-2 gap-2">
          <button
            onClick={() => setActiveTab('metro')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'metro'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Train size={13} /> Metro Rail (25)
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'water'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ship size={13} /> Water Metro (15)
          </button>
          <button
            onClick={() => setActiveTab('feeder')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'feeder'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bus size={13} /> Feeder e-Buses (18)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[50vh] divide-y divide-slate-100">
          {activeTab === 'metro' && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-1">
                <span>Blue Line Corridor (Aluva ➔ Tripunithura)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metroStations.map((station, idx) => (
                  <div
                    key={station.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{station.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'origin');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 cursor-pointer"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'destination');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer"
                      >
                        To
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'water' && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-3">
                Operational Water Metro Jetties
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {waterJetties.map((jetty) => (
                  <div
                    key={jetty.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-sky-400 hover:bg-sky-50/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Ship size={14} className="text-sky-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{jetty.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'origin');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 cursor-pointer"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'destination');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer"
                      >
                        To
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'feeder' && (
            <div className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-3">
                First & Last-Mile Feeder Bus Corridors
              </div>
              {feederRoutes.map((fb) => (
                <div key={fb.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Bus size={13} className="text-amber-600" /> {fb.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {fb.stops.map((stop, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          onSelectStation(stop, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-semibold bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {stop}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
