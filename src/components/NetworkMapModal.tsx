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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
      <div className="transit-card bg-white max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200/90 rounded-2xl animate-modal-in">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <div className="text-[10px] font-bold text-[#009999] uppercase tracking-widest mb-0.5 font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#009999] animate-kmrl-pulse" />
              KMRL Directory
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Multimodal Stations & Jetties Explorer
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Browse all official transit points and click to set journey endpoints.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs (KMRL Pill Styling) */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-2.5 gap-2">
          <button
            onClick={() => setActiveTab('metro')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              activeTab === 'metro'
                ? 'bg-[#009999] text-white shadow-sm shadow-teal-500/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Train size={14} /> Blue Line (25)
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              activeTab === 'water'
                ? 'bg-[#0284c7] text-white shadow-sm shadow-sky-500/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Ship size={14} /> Water Metro (15)
          </button>
          <button
            onClick={() => setActiveTab('feeder')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              activeTab === 'feeder'
                ? 'bg-[#d97706] text-white shadow-sm shadow-amber-500/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Bus size={14} /> Feeder e-Buses (18)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[50vh] divide-y divide-slate-100 bg-white scrollbar-thin">
          {activeTab === 'metro' && (
            <div className="space-y-3 smooth-enter">
              <div className="text-xs font-bold uppercase tracking-wider text-[#009999] mb-3 font-display flex items-center justify-between">
                <span>Blue Line Rail Corridor (Aluva ➔ Tripunithura)</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">25 Elevated Stations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {metroStations.map((station, idx) => (
                  <div
                    key={station.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-[#009999] hover:bg-[#e6f8f7]/50 transition-all duration-200 flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#e6f8f7] text-[#009999] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#99dedb] font-display">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-[#009999] transition-colors">{station.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e6f8f7] text-[#009999] border border-[#99dedb] hover:bg-[#ccfbf1] transition-colors cursor-pointer font-display"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'destination');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] hover:bg-[#bae6fd] transition-colors cursor-pointer font-display"
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
            <div className="space-y-3 smooth-enter">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0369a1] mb-3 font-display flex items-center justify-between">
                <span>Operational Water Metro Jetties</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">Backwater Catamaran Network</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {waterJetties.map((jetty) => (
                  <div
                    key={jetty.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-[#0284c7] hover:bg-[#e0f2fe]/50 transition-all duration-200 flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Ship size={14} className="text-[#0284c7] shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0284c7] transition-colors">{jetty.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e6f8f7] text-[#009999] border border-[#99dedb] hover:bg-[#ccfbf1] transition-colors cursor-pointer font-display"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'destination');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] hover:bg-[#bae6fd] transition-colors cursor-pointer font-display"
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
            <div className="space-y-4 smooth-enter">
              <div className="text-xs font-bold uppercase tracking-wider text-[#b45309] mb-2 font-display">
                Feeder e-Bus Corridors
              </div>
              {feederRoutes.map((fb) => (
                <div key={fb.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/90">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5 font-display">
                    <Bus size={13} className="text-[#d97706]" /> {fb.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {fb.stops.map((stop, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          onSelectStation(stop, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-semibold bg-white hover:bg-[#fef3c7] hover:border-[#fde68a] border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
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
