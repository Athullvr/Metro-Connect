import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  Info,
  Train,
  Ship,
  Bus,
  Footprints
} from 'lucide-react';
import { fetchDisruptions } from '../services/disruptions.js';

const MODE_ICONS = {
  metro: Train,
  water_metro: Ship,
  feeder_bus: Bus,
  walk: Footprints
};

export default function DisruptionSimulator({
  itinerary,
  reroutedItinerary,
  onBack,
  onReplan,
  loading,
  replanError,
  useSimulator
}) {
  const [activeDisruption, setActiveDisruption] = useState(null);
  const [disruptions, setDisruptions] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    fetchDisruptions(useSimulator).then((live) => {
      if (!cancelled) {
        setDisruptions(live);
        setFeedLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [useSimulator]);

  const handleTriggerPreset = async (preset) => {
    setActiveDisruption(preset);
    await onReplan(preset.eventText);
  };

  const getActivePresets = () => {
    const destination = (itinerary?.legs[itinerary.legs.length - 1]?.to || '').toLowerCase();
    return [...disruptions].sort((a, b) => {
      const aMatch = destination.includes(a.targetRoute.toLowerCase());
      const bMatch = destination.includes(b.targetRoute.toLowerCase());
      return bMatch - aMatch;
    });
  };

  const activePresets = getActivePresets();

  // A leg is "blocked" by the active disruption if the event text mentions
  // the stops or route name it runs on — generalizes across any live/mock
  // disruption instead of matching a fixed set of preset ids.
  const isLegBlockedByDisruption = (leg) => {
    if (!activeDisruption) return false;
    const text = activeDisruption.eventText.toLowerCase();
    return (
      text.includes(leg.from.toLowerCase())
      || text.includes(leg.to.toLowerCase())
      || text.includes(leg.name.toLowerCase())
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-10 animate-fadeIn relative z-10">
      {/* Back Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold mb-6 bg-white/90 border border-slate-200 hover:bg-white px-4 py-2 rounded-xl cursor-pointer shadow-xs"
      >
        <ArrowLeft size={14} /> Back to Itinerary
      </button>

      {/* Disruption Settings Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8 border border-rose-200/80 bg-gradient-to-br from-rose-50/30 via-white to-amber-50/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 font-display tracking-tight">
              Transit Disruption Control Center
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Simulate live weather or channel closures in Kochi to trigger instant multimodal AI rerouting.
            </p>
          </div>
        </div>

        {/* Presets List */}
        <div className="mt-6">
          {feedLoading ? (
            <div role="status" aria-live="polite" className="text-xs text-slate-400 py-6 text-center flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Scanning live network conditions...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {activePresets.map((preset) => {
                const isTargeted = (itinerary?.legs[itinerary?.legs.length - 1]?.to || '')
                  .toLowerCase()
                  .includes(preset.targetRoute.toLowerCase());
                const isActive = activeDisruption?.id === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleTriggerPreset(preset)}
                    aria-pressed={isActive}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-rose-50 border-rose-400 shadow-sm shadow-rose-500/10 ring-2 ring-rose-200'
                        : 'bg-white/90 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isTargeted && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase tracking-wider">
                        Active Route
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5 font-display">
                      {preset.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">{preset.eventText}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div role="status" aria-live="polite" className="glass-card rounded-3xl p-16 text-center border border-white/80">
          <div className="relative w-12 h-12 mx-auto mb-4" aria-hidden="true">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-teal-600 animate-spin" />
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-600 animate-pulse" size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Computing Resilient Alternative...</h3>
          <p className="text-xs text-slate-500">
            Adapter Agent mapping alternative feeder buses, metro hops, and transfer links...
          </p>
        </div>
      )}

      {/* Replan Error */}
      {!loading && replanError && (
        <div role="alert" className="glass-card rounded-3xl p-6 border border-rose-200 bg-rose-50/40 text-center">
          <XCircle className="mx-auto mb-2 text-rose-600" size={24} aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No alternative route found</h3>
          <p className="text-xs text-slate-500">{replanError}</p>
        </div>
      )}

      {/* Side-by-Side Comparison Panels */}
      {!loading && reroutedItinerary && activeDisruption && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Left Panel: Disrupted Route */}
          <div className="glass-card rounded-3xl p-6 border border-rose-200/80 relative bg-rose-50/15">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold rounded-full mb-4">
              <XCircle size={12} /> Disrupted Route
            </div>

            <div className="mb-6 border-b border-slate-200/80 pb-4">
              <h3 className="text-base font-bold text-slate-900 font-display">Original Journey</h3>
              <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                ⚠️ Blocked: {activeDisruption.eventText}
              </p>
            </div>

            {/* Original Legs */}
            <div className="relative pl-6 border-l-2 border-rose-200 ml-4 space-y-4 py-1">
              {itinerary?.legs.map((leg, idx) => {
                const isLegBlocked = isLegBlockedByDisruption(leg);
                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[37px] top-2 w-6 h-6 rounded-full border flex items-center justify-center bg-white z-20 ${
                      isLegBlocked ? 'border-rose-400 text-rose-600' : 'border-slate-300 text-slate-400'
                    }`}>
                      <Icon size={12} />
                    </div>

                    <div className={`p-3.5 rounded-xl border bg-white/90 ${
                      isLegBlocked ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200/60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{leg.mode}</span>
                        {isLegBlocked && <span className="text-[9px] text-rose-600 font-extrabold bg-rose-100 px-2 py-0.5 rounded border border-rose-200">BLOCKED</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 line-through decoration-rose-400">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">{leg.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Re-routed Plan */}
          <div className="glass-card rounded-3xl p-6 border border-teal-300 relative bg-teal-50/15 glow-teal">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-bold rounded-full mb-4 animate-pulse">
              <CheckCircle size={12} /> AI Copilot Rerouted
            </div>

            {/* Metrics Comparison Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Adapted Alternative</h3>
                <p className="text-[11px] text-teal-700 font-semibold">
                  ✨ Multi-modal bypass resolved
                </p>
              </div>

              {/* Comparing Metrics */}
              <div className="flex items-center gap-2">
                <div className="bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl text-center shadow-2xs">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Time</div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1 justify-center">
                    <span className="line-through text-slate-400 text-[10px]">{itinerary.total_duration}m</span>
                    <ArrowRight size={10} className="text-teal-600" />
                    <span className="text-teal-700">{reroutedItinerary.total_duration}m</span>
                  </div>
                </div>
                <div className="bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl text-center shadow-2xs">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Fare</div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1 justify-center">
                    <span className="line-through text-slate-400 text-[10px]">₹{itinerary.total_cost}</span>
                    <ArrowRight size={10} className="text-teal-600" />
                    <span className="text-teal-700">₹{reroutedItinerary.total_cost}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adapted Legs */}
            <div className="relative pl-6 border-l-2 border-teal-400 ml-4 space-y-4 py-1 mb-6">
              {reroutedItinerary.legs.map((leg, idx) => {
                const isNewLeg = !itinerary?.legs.some(oldLeg => 
                  oldLeg.from.toLowerCase() === leg.from.toLowerCase() && 
                  oldLeg.to.toLowerCase() === leg.to.toLowerCase() &&
                  oldLeg.mode === leg.mode
                );

                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[37px] top-2 w-6 h-6 rounded-full border flex items-center justify-center bg-white z-20 ${
                      isNewLeg ? 'border-teal-500 text-teal-700 bg-teal-50' : 'border-slate-300 text-slate-400'
                    }`}>
                      <Icon size={12} />
                    </div>

                    <div className={`p-3.5 rounded-xl border bg-white/95 ${
                      isNewLeg ? 'border-teal-200 bg-teal-50/30' : 'border-slate-200/60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-bold uppercase ${isNewLeg ? 'text-teal-700' : 'text-slate-400'}`}>{leg.mode}</span>
                        {isNewLeg && <span className="text-[9px] text-teal-800 font-extrabold bg-teal-100 px-2 py-0.5 rounded border border-teal-200">NEW ROUTE LEG</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-[10px] text-slate-600 mt-1">{leg.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adapter Agent Reasoning */}
            <div className="p-4 rounded-2xl bg-white/90 border border-teal-100 shadow-2xs">
              <h4 className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Info size={14} className="text-teal-600" /> Rerouting Explanation
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
                "{reroutedItinerary.explanation}"
              </p>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
