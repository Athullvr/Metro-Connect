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
    <div className="w-full max-w-5xl mx-auto px-4 py-8 text-left">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-5">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-md cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Itinerary
        </button>

        {reroutedItinerary && onAcceptReroute && (
          <button
            onClick={() => onAcceptReroute(reroutedItinerary)}
            className="flex items-center gap-1.5 text-white bg-[#00A19C] hover:bg-[#008E89] px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer shadow-xs font-display uppercase tracking-wider"
          >
            <Check size={13} /> Adopt Rerouted Plan
          </button>
        )}
      </div>

      {/* Disruption Control Center Header Card */}
      <div className="transit-card p-5 md:p-6 mb-7 border-l-4 border-l-[#DC2626] bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center border border-red-200 shrink-0">
            <AlertTriangle size={17} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 font-display">
              KMRL Transit Disruption Control Center
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Simulate weather, high-tide closures, or rail delays to trigger automated multimodal graph rerouting.
            </p>
          </div>
        </div>

        {/* Custom Disruption Input Form */}
        <form onSubmit={handleCustomSubmit} className="mt-5 mb-4">
          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider font-display mb-1">
            Simulate Custom Event
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="E.g., High Court Water Metro Jetty closed due to high tide..."
              className="flex-1 transit-input px-3.5 py-2 text-xs font-medium"
            />
            <button
              type="submit"
              disabled={loading || !customInput.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-md transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5 shrink-0 font-display uppercase tracking-wider"
            >
              <Send size={12} /> Run Reroute
            </button>
          </div>
        </form>

        {/* Category Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-t border-slate-100 pt-3 mb-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display">Simulation Presets:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                selectedFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Events
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('water')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                selectedFilter === 'water' ? 'bg-white text-[#0284C7] shadow-xs' : 'text-slate-600'
              }`}
            >
              Water Metro
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('metro')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                selectedFilter === 'metro' ? 'bg-white text-[#007E7A] shadow-xs' : 'text-slate-600'
              }`}
            >
              Metro Rail
            </button>
          </div>
        </div>

        {/* Presets List */}
        <div>
          {feedLoading ? (
            <div role="status" className="text-xs text-slate-400 py-4 text-center">
              Scanning active transit network alerts...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {filteredPresets.map((preset) => {
                const isTargeted = (itinerary?.legs[itinerary?.legs.length - 1]?.to || '')
                  .toLowerCase()
                  .includes(preset.targetRoute.toLowerCase());
                const isActive = activeDisruption?.id === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleTriggerPreset(preset)}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-[#FEE2E2] border-[#DC2626]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isTargeted && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-[8px] font-bold uppercase tracking-wider">
                        Active Route
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1 font-display">
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
        <div role="status" className="transit-card p-12 text-center bg-white border border-slate-200">
          <Zap className="mx-auto mb-2 text-[#00A19C]" size={20} />
          <h3 className="text-sm font-bold text-slate-900 mb-0.5 font-display">Calculating Resilient Reroute...</h3>
          <p className="text-xs text-slate-500">
            Adapter Agent mapping alternative feeder buses and road-link bypasses...
          </p>
        </div>
      )}

      {/* Replan Error */}
      {!loading && replanError && (
        <div role="alert" className="transit-card p-5 border border-red-200 bg-red-50 text-center">
          <XCircle className="mx-auto mb-1 text-red-600" size={20} aria-hidden="true" />
          <h3 className="text-xs font-bold text-slate-900 mb-0.5">No alternative bypass found</h3>
          <p className="text-xs text-slate-500">{replanError}</p>
        </div>
      )}

      {/* Side-by-Side Comparison Panels */}
      {!loading && reroutedItinerary && activeDisruption && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Left Panel: Disrupted Route */}
          <div className="transit-card p-5 border border-red-200 bg-white">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold rounded uppercase mb-3 font-display">
              <XCircle size={11} /> Blocked Original Route
            </div>

            <div className="mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-display">Original Commute</h3>
              <p className="text-[11px] text-red-600 mt-0.5 font-semibold">
                ⚠️ Blocked: {activeDisruption.eventText}
              </p>
            </div>

            {/* Original Legs */}
            <div className="relative pl-5 border-l-2 border-red-200 ml-3 space-y-3 py-1">
              {itinerary?.legs.map((leg, idx) => {
                const isLegBlocked = isLegBlockedByDisruption(leg);
                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[29px] top-1.5 w-5 h-5 rounded border flex items-center justify-center bg-white z-20 ${
                      isLegBlocked ? 'border-red-400 text-red-600' : 'border-slate-300 text-slate-400'
                    }`}>
                      <Icon size={10} />
                    </div>

                    <div className={`p-2.5 rounded-lg border ${
                      isLegBlocked ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{leg.mode}</span>
                        {isLegBlocked && <span className="text-[8px] text-red-600 font-bold bg-red-100 px-1.5 py-0.2 rounded border border-red-200">BLOCKED</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 line-through decoration-red-400 font-display">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-[10px] text-slate-400">{leg.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Re-routed Plan */}
          <div className="transit-card p-5 border-2 border-[#00A19C] bg-white">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E6F6F5] text-[#007E7A] border border-[#99DEDB] text-[9px] font-bold rounded uppercase font-display">
                <CheckCircle size={11} /> Adapted Multimodal Bypass
              </div>

              {onAcceptReroute && (
                <button
                  onClick={() => onAcceptReroute(reroutedItinerary)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#00A19C] hover:bg-[#008E89] text-white text-[10px] font-bold transition-colors cursor-pointer font-display uppercase tracking-wider"
                >
                  <Check size={11} /> Adopt Route
                </button>
              )}
            </div>

            {/* Metrics Comparison Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Rerouted Journey</h3>
                <p className="text-[11px] text-[#007E7A] font-semibold">
                  ✓ Multimodal alternate route resolved
                </p>
              </div>

              {/* Comparing Metrics with Delta Badges */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-center">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-display">Duration</div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center font-display">
                    <span className="line-through text-slate-400 text-[10px]">{itinerary.total_duration}m</span>
                    <ArrowRight size={9} className="text-[#007E7A]" />
                    <span className="text-[#007E7A]">{reroutedItinerary.total_duration}m</span>
                  </div>
                  <div className="text-[8px] font-bold text-[#007E7A]">
                    {durationDelta > 0 ? `+${durationDelta}m` : `${durationDelta}m`}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-center">
                  <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-display">Fare</div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1 justify-center font-display">
                    <span className="line-through text-slate-400 text-[10px]">₹{itinerary.total_cost}</span>
                    <ArrowRight size={9} className="text-[#007E7A]" />
                    <span className="text-[#007E7A]">₹{reroutedItinerary.total_cost}</span>
                  </div>
                  <div className="text-[8px] font-bold text-[#007E7A]">
                    {costDelta > 0 ? `+₹${costDelta}` : costDelta < 0 ? `-₹${Math.abs(costDelta)}` : 'Same'}
                  </div>
                </div>
              </div>
            </div>

            {/* Adapted Legs */}
            <div className="relative pl-5 border-l-2 border-[#00A19C] ml-3 space-y-3 py-1 mb-4">
              {reroutedItinerary.legs.map((leg, idx) => {
                const isNewLeg = !itinerary?.legs.some(oldLeg => 
                  oldLeg.from.toLowerCase() === leg.from.toLowerCase() && 
                  oldLeg.to.toLowerCase() === leg.to.toLowerCase() &&
                  oldLeg.mode === leg.mode
                );

                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[29px] top-1.5 w-5 h-5 rounded border flex items-center justify-center bg-white z-20 ${
                      isNewLeg ? 'border-[#00A19C] text-[#007E7A] bg-[#E6F6F5]' : 'border-slate-300 text-slate-400'
                    }`}>
                      <Icon size={10} />
                    </div>

                    <div className={`p-2.5 rounded-lg border ${
                      isNewLeg ? 'border-[#99DEDB] bg-[#E6F6F5]/40' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[9px] font-bold uppercase ${isNewLeg ? 'text-[#007E7A]' : 'text-slate-400'}`}>{leg.mode}</span>
                        {isNewLeg && <span className="text-[8px] text-[#007E7A] font-bold bg-[#E6F6F5] px-1.5 py-0.2 rounded border border-[#99DEDB]">NEW BYPASS LEG</span>}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 font-display">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-[10px] text-slate-600">{leg.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explainer note */}
            <div className="p-3 rounded-lg bg-[#E6F6F5] border border-[#99DEDB]">
              <h4 className="text-[9px] font-bold text-[#007E7A] uppercase tracking-wider mb-1 flex items-center gap-1 font-display">
                <Info size={11} className="text-[#00A19C]" /> Rerouting Explanation
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
