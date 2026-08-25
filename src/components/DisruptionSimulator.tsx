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
  Footprints,
  Send,
  Check
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
  onAcceptReroute,
  loading,
  replanError,
  useSimulator
}) {
  const [activeDisruption, setActiveDisruption] = useState(null);
  const [disruptions, setDisruptions] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const customEvent = {
      id: 'custom_' + Date.now(),
      title: 'Custom Incident',
      targetRoute: '',
      eventText: customInput.trim()
    };
    setActiveDisruption(customEvent);
    await onReplan(customEvent.eventText);
  };

  const getFilteredPresets = () => {
    const destination = (itinerary?.legs[itinerary.legs.length - 1]?.to || '').toLowerCase();
    let list = [...disruptions];

    if (selectedFilter === 'water') {
      list = list.filter(d => d.targetRoute.toLowerCase().includes('water') || d.targetRoute.toLowerCase().includes('jetty') || d.eventText.toLowerCase().includes('jetty') || d.eventText.toLowerCase().includes('water'));
    } else if (selectedFilter === 'metro') {
      list = list.filter(d => d.eventText.toLowerCase().includes('metro') || d.title.toLowerCase().includes('metro'));
    }

    return list.sort((a, b) => {
      const aMatch = destination.includes(a.targetRoute.toLowerCase());
      const bMatch = destination.includes(b.targetRoute.toLowerCase());
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
  };

  const filteredPresets = getFilteredPresets();

  const isLegBlockedByDisruption = (leg) => {
    if (!activeDisruption) return false;
    const text = activeDisruption.eventText.toLowerCase();
    return (
      text.includes(leg.from.toLowerCase())
      || text.includes(leg.to.toLowerCase())
      || text.includes(leg.name.toLowerCase())
    );
  };

  const durationDelta = reroutedItinerary && itinerary ? reroutedItinerary.total_duration - itinerary.total_duration : 0;
  const costDelta = reroutedItinerary && itinerary ? reroutedItinerary.total_cost - itinerary.total_cost : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-10 text-left smooth-enter">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 hover:text-[#009999] transition-all duration-200 text-xs font-bold bg-white border border-slate-200 hover:border-[#99dedb] px-4 py-2 rounded-full cursor-pointer shadow-2xs hover:scale-102"
        >
          <ArrowLeft size={14} /> Back to Itinerary
        </button>

        {reroutedItinerary && onAcceptReroute && (
          <button
            onClick={() => onAcceptReroute(reroutedItinerary)}
            className="flex items-center gap-2 text-white bg-[#009999] hover:bg-[#008080] px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm shadow-teal-600/30 font-display uppercase tracking-wider hover:scale-102"
          >
            <Check size={14} /> Adopt Rerouted Plan
          </button>
        )}
      </div>

      {/* Disruption Control Center Header Card */}
      <div className="kmrl-glass-card p-6 md:p-7 mb-8 border-l-4 border-l-[#dc2626] bg-white">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-[#dc2626] flex items-center justify-center border border-red-200 shrink-0 shadow-2xs">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
              KMRL Transit Disruption Control Center
            </h2>
            <p className="text-xs text-slate-500 font-medium font-sans">
              Simulate weather, high-tide closures, or rail delays to trigger automated multimodal graph rerouting.
            </p>
          </div>
        </div>

        {/* Custom Disruption Input Form */}
        <form onSubmit={handleCustomSubmit} className="mt-5 mb-4 sm:mt-6 sm:mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-display mb-1.5">
            Simulate Custom Incident
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="E.g., High Court Water Metro Jetty closed due to high tide..."
              className="flex-1 transit-input px-3.5 sm:px-4 py-2.5 text-xs font-medium bg-white"
            />
            <button
              type="submit"
              disabled={loading || !customInput.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40 inline-flex items-center justify-center gap-1.5 shrink-0 font-display uppercase tracking-wider hover:scale-102 active:scale-95"
            >
              <Send size={13} /> Run Reroute
            </button>
          </div>
        </form>

        {/* Category Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-t border-slate-100 pt-3.5 mb-3.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display shrink-0">Simulation Presets:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                selectedFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('water')}
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                selectedFilter === 'water' ? 'bg-white text-[#0284c7] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Water Metro
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('metro')}
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                selectedFilter === 'metro' ? 'bg-white text-[#009999] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Metro Rail
            </button>
          </div>
        </div>

        {/* Presets List */}
        <div>
          {feedLoading ? (
            <div role="status" className="text-xs text-slate-400 py-6 text-center animate-pulse">
              Scanning active transit network alerts...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {filteredPresets.map((preset) => {
                const isTargeted = (itinerary?.legs[itinerary?.legs.length - 1]?.to || '')
                  .toLowerCase()
                  .includes(preset.targetRoute.toLowerCase());
                const isActive = activeDisruption?.id === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleTriggerPreset(preset)}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative ${
                      isActive
                        ? 'bg-[#fee2e2] border-[#dc2626] shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:scale-101'
                    }`}
                  >
                    {isTargeted && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[9px] font-bold uppercase tracking-wider">
                        Active Route
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5 font-display">
                      {preset.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{preset.eventText}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div role="status" className="kmrl-glass-card p-12 text-center bg-white border border-slate-200 rounded-2xl smooth-enter">
          <Zap className="mx-auto mb-2.5 text-[#009999] animate-bounce" size={24} />
          <h3 className="text-base font-bold text-slate-900 mb-1 font-display">Calculating Resilient Reroute...</h3>
          <p className="text-xs text-slate-500 font-sans">
            Adapter Agent mapping alternative feeder buses and road-link bypasses in real time...
          </p>
        </div>
      )}

      {/* Replan Error */}
      {!loading && replanError && (
        <div role="alert" className="kmrl-glass-card p-6 border border-red-200 bg-red-50 text-center rounded-2xl smooth-enter">
          <XCircle className="mx-auto mb-1.5 text-red-600" size={22} aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 mb-0.5 font-display">No alternative bypass found</h3>
          <p className="text-xs text-slate-500">{replanError}</p>
        </div>
      )}

      {/* Side-by-Side Comparison Panels */}
      {!loading && reroutedItinerary && activeDisruption && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 smooth-enter">
          
          {/* Left Panel: Disrupted Route */}
          <div className="kmrl-glass-card p-6 border border-red-200 bg-white rounded-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold rounded-full uppercase mb-4 font-display">
              <XCircle size={12} /> Blocked Original Route
            </div>

            <div className="mb-4 border-b border-slate-100 pb-3.5">
              <h3 className="text-base font-bold text-slate-900 font-display">Original Commute</h3>
              <p className="text-xs text-red-600 mt-1 font-semibold">
                ⚠️ Incident: {activeDisruption.eventText}
              </p>
            </div>

            {/* Original Legs */}
            <div className="relative pl-6 border-l-2 border-red-200 ml-3 space-y-3.5 py-1">
              {itinerary?.legs.map((leg, idx) => {
                const isLegBlocked = isLegBlockedByDisruption(leg);
                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[35px] top-2 w-6 h-6 rounded-full border flex items-center justify-center bg-white z-20 shadow-2xs ${
                      isLegBlocked ? 'border-red-400 text-red-600' : 'border-slate-300 text-slate-400'
                    }`}>
                      <Icon size={12} />
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      isLegBlocked ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{leg.mode}</span>
                        {isLegBlocked && <span className="text-[9px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full border border-red-200">BLOCKED</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 line-through decoration-red-400 font-display">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{leg.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Re-routed Plan */}
          <div className="kmrl-glass-card p-6 border-2 border-[#009999] bg-white rounded-2xl shadow-lg shadow-teal-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6f8f7] text-[#009999] border border-[#99dedb] text-[10px] font-bold rounded-full uppercase font-display">
                <CheckCircle size={12} /> Adapted Multimodal Bypass
              </div>

              {onAcceptReroute && (
                <button
                  onClick={() => onAcceptReroute(reroutedItinerary)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#009999] hover:bg-[#008080] text-white text-xs font-bold transition-all duration-200 cursor-pointer font-display uppercase tracking-wider shadow-xs hover:scale-102"
                >
                  <Check size={12} /> Adopt Route
                </button>
              )}
            </div>

            {/* Metrics Comparison Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Rerouted Journey</h3>
                <p className="text-xs text-[#009999] font-semibold">
                  ✓ Multimodal alternate route resolved
                </p>
              </div>

              {/* Comparing Metrics with Delta Badges */}
              <div className="flex items-center gap-2.5">
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center shadow-2xs">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-display">Duration</div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center font-display">
                    <span className="line-through text-slate-400 text-[10px]">{itinerary.total_duration}m</span>
                    <ArrowRight size={10} className="text-[#009999]" />
                    <span className="text-[#009999]">{reroutedItinerary.total_duration}m</span>
                  </div>
                  <div className="text-[9px] font-bold text-[#009999]">
                    {durationDelta > 0 ? `+${durationDelta}m` : `${durationDelta}m`}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-center shadow-2xs">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-display">Fare</div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center font-display">
                    <span className="line-through text-slate-400 text-[10px]">₹{itinerary.total_cost}</span>
                    <ArrowRight size={10} className="text-[#009999]" />
                    <span className="text-[#009999]">₹{reroutedItinerary.total_cost}</span>
                  </div>
                  <div className="text-[9px] font-bold text-[#009999]">
                    {costDelta > 0 ? `+₹${costDelta}` : costDelta < 0 ? `-₹${Math.abs(costDelta)}` : 'Same'}
                  </div>
                </div>
              </div>
            </div>

            {/* Adapted Legs */}
            <div className="relative pl-6 border-l-2 border-[#009999] ml-3 space-y-3.5 py-1 mb-4">
              {reroutedItinerary.legs.map((leg, idx) => {
                const isNewLeg = !itinerary?.legs.some(oldLeg => 
                  oldLeg.from.toLowerCase() === leg.from.toLowerCase() && 
                  oldLeg.to.toLowerCase() === leg.to.toLowerCase() &&
                  oldLeg.mode === leg.mode
                );

                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[35px] top-2 w-6 h-6 rounded-full border flex items-center justify-center bg-white z-20 shadow-2xs ${
                      isNewLeg ? 'border-[#009999] text-[#009999] bg-[#e6f8f7]' : 'border-slate-300 text-slate-400'
                    }`}>
                      <Icon size={12} />
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      isNewLeg ? 'border-[#99dedb] bg-[#e6f8f7]/50 shadow-2xs' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase ${isNewLeg ? 'text-[#009999]' : 'text-slate-400'}`}>{leg.mode}</span>
                        {isNewLeg && <span className="text-[9px] text-[#009999] font-bold bg-[#e6f8f7] px-2 py-0.5 rounded-full border border-[#99dedb]">NEW BYPASS LEG</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 font-display">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">{leg.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explainer note */}
            <div className="p-3.5 rounded-xl bg-[#e6f8f7] border border-[#99dedb]">
              <h4 className="text-[10px] font-bold text-[#007a7a] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
                <Info size={12} className="text-[#009999]" /> Rerouting Explanation
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
