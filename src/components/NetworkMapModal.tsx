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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm text-left animate-modal-in">
      <div className="transit-card bg-white max-w-2xl w-full max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200/90 rounded-t-3xl sm:rounded-2xl">
        
        {/* Mobile Swipe / Sheet Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="text-[10px] font-bold text-[#009999] uppercase tracking-widest mb-0.5 font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#009999] animate-kmrl-pulse" />
              KMRL Directory
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
              Multimodal Stations & Jetties
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-sans">
              Tap any stop to select as journey start or destination.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer shrink-0"
            aria-label="Close station explorer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs (KMRL Pill Styling with Mobile Horizontal Scroll) */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-slate-100 bg-slate-50/90 p-2 sm:p-2.5 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('metro')}
            className={`flex-1 min-w-[130px] sm:min-w-0 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-display shrink-0 ${
              activeTab === 'metro'
                ? 'bg-[#009999] text-white shadow-sm shadow-teal-500/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-200/60 bg-white/60 sm:bg-transparent'
            }`}
          >
            <Train size={14} /> Blue Line (25)
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`flex-1 min-w-[130px] sm:min-w-0 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-display shrink-0 ${
              activeTab === 'water'
                ? 'bg-[#0284c7] text-white shadow-sm shadow-sky-500/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-200/60 bg-white/60 sm:bg-transparent'
            }`}
          >
            <Ship size={14} /> Water Metro (15)
          </button>
          <button
            onClick={() => setActiveTab('feeder')}
            className={`flex-1 min-w-[140px] sm:min-w-0 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-display shrink-0 ${
              activeTab === 'feeder'
                ? 'bg-[#d97706] text-white shadow-sm shadow-amber-500/20 scale-[1.01]'
                : 'text-slate-600 hover:bg-slate-200/60 bg-white/60 sm:bg-transparent'
            }`}
          >
            <Bus size={14} /> Feeder e-Buses (18)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[50vh] divide-y divide-slate-100 bg-white scrollbar-thin">
          {activeTab === 'metro' && (
            <div className="space-y-2.5 smooth-enter">
              <div className="text-xs font-bold uppercase tracking-wider text-[#009999] mb-2.5 font-display flex items-center justify-between">
                <span>Aluva ➔ Tripunithura Spine</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">25 Stations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {metroStations.map((station, idx) => (
                  <div
                    key={station.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-[#009999] hover:bg-[#e6f8f7]/40 transition-all duration-200 flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-6 h-6 rounded-full bg-[#e6f8f7] text-[#009999] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#99dedb] font-display">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-[#009999] transition-colors truncate">{station.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e6f8f7] text-[#009999] border border-[#99dedb] hover:bg-[#ccfbf1] transition-colors cursor-pointer font-display active:scale-95"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'destination');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] hover:bg-[#bae6fd] transition-colors cursor-pointer font-display active:scale-95"
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
            <div className="space-y-2.5 smooth-enter">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0369a1] mb-2.5 font-display flex items-center justify-between">
                <span>Vembanad Backwater Jetties</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">15 Jetties</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {waterJetties.map((jetty) => (
                  <div
                    key={jetty.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-[#0284c7] hover:bg-[#e0f2fe]/40 transition-all duration-200 flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Ship size={14} className="text-[#0284c7] shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0284c7] transition-colors truncate">{jetty.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e6f8f7] text-[#009999] border border-[#99dedb] hover:bg-[#ccfbf1] transition-colors cursor-pointer font-display active:scale-95"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'destination');
                          onClose();
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] hover:bg-[#bae6fd] transition-colors cursor-pointer font-display active:scale-95"
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
            <div className="space-y-3.5 smooth-enter">
              <div className="text-xs font-bold uppercase tracking-wider text-[#b45309] mb-1.5 font-display">
                Feeder e-Bus Corridors
              </div>
              {feederRoutes.map((fb) => (
                <div key={fb.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
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
                        className="text-[10px] font-semibold bg-white hover:bg-[#fef3c7] hover:border-[#fde68a] border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer active:scale-95"
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
