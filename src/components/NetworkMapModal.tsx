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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 text-left">
      <div className="transit-card bg-white max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-xl border border-slate-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              KMRL Multimodal Stations & Jetties Directory
            </h3>
            <p className="text-xs text-slate-500">
              Browse all official transit stops and tap to select as journey endpoints.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('metro')}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              activeTab === 'metro'
                ? 'bg-[#00A19C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Train size={13} /> Blue Line (25)
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              activeTab === 'water'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ship size={13} /> Water Metro (15)
          </button>
          <button
            onClick={() => setActiveTab('feeder')}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-display ${
              activeTab === 'feeder'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bus size={13} /> Feeder e-Buses (18)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto max-h-[50vh] divide-y divide-slate-100 bg-white">
          {activeTab === 'metro' && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#007E7A] mb-2 font-display">
                Blue Line Rail Corridor (Aluva ➔ Tripunithura)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metroStations.map((station, idx) => (
                  <div
                    key={station.id}
                    className="p-2.5 rounded-md border border-slate-200 bg-white hover:border-[#00A19C] hover:bg-[#E6F6F5] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#E6F6F5] text-[#007E7A] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#99DEDB] font-display">
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
                        className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E6F6F5] text-[#007E7A] border border-[#99DEDB] hover:bg-[#D4EFEB] cursor-pointer font-display"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(station.name, 'destination');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] hover:bg-[#BAE6FD] cursor-pointer font-display"
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#0369A1] mb-2 font-display">
                Operational Water Metro Jetties
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {waterJetties.map((jetty) => (
                  <div
                    key={jetty.id}
                    className="p-2.5 rounded-md border border-slate-200 bg-white hover:border-[#0284C7] hover:bg-[#E0F2FE] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Ship size={13} className="text-[#0284C7] shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{jetty.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'origin');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E6F6F5] text-[#007E7A] border border-[#99DEDB] hover:bg-[#D4EFEB] cursor-pointer font-display"
                      >
                        From
                      </button>
                      <button
                        onClick={() => {
                          onSelectStation(jetty.name, 'destination');
                          onClose();
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] hover:bg-[#BAE6FD] cursor-pointer font-display"
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
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] mb-1 font-display">
                Feeder e-Bus Corridors
              </div>
              {feederRoutes.map((fb) => (
                <div key={fb.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 font-display">
                    <Bus size={12} className="text-[#D97706]" /> {fb.name}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {fb.stops.map((stop, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          onSelectStation(stop, 'origin');
                          onClose();
                        }}
                        className="text-[10px] font-semibold bg-white hover:bg-[#FEF3C7] border border-slate-200 hover:border-[#FDE68A] text-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
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
