import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Clock, 
  Coins, 
  Zap,
  Info,
  Train, 
  Ship, 
  Bus, 
  Footprints
} from 'lucide-react';

const PRESETS = [
  {
    id: 'hc_closed',
    title: 'High Court Jetty Closed',
    desc: 'Commute Alert: Water Metro suspended at High Court due to low tide silt.',
    targetRoute: 'Fort Kochi',
    eventText: 'High Court Water Metro Jetty operations are closed due to shallow channels.'
  },
  {
    id: 'mc3_delayed',
    title: 'Feeder e-Bus MC-3 Delay',
    desc: 'Traffic Alert: MC-3 e-Bus delayed by 25 mins on Seaport-Airport Road.',
    targetRoute: 'Infopark',
    eventText: 'Feeder Bus MC-3 is delayed by 25 minutes due to roadway gridlock.'
  },
  {
    id: 'vy_closed',
    title: 'Vyttila Jetty Maintenance',
    desc: 'Operational Alert: Vyttila Water Metro pontoon maintenance.',
    targetRoute: 'Kakkanad',
    eventText: 'Vyttila Water Metro Jetty is closed for loading platform servicing.'
  }
];

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
  loading 
}) {
  const [activeDisruption, setActiveDisruption] = useState(null);

  const handleTriggerPreset = async (preset) => {
    setActiveDisruption(preset);
    await onReplan(preset.eventText);
  };

  const getActivePresets = () => {
    const destination = (itinerary?.legs[itinerary.legs.length - 1]?.to || '').toLowerCase();
    return [...PRESETS].sort((a, b) => {
      const aMatch = destination.includes(a.targetRoute.toLowerCase());
      const bMatch = destination.includes(b.targetRoute.toLowerCase());
      return bMatch - aMatch;
    });
  };

  const activePresets = getActivePresets();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-charcoal transition-all text-xs font-semibold mb-6 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Itinerary
      </button>

      {/* Disruption Settings Card */}
      <div className="clean-card rounded-3xl p-6 mb-8 border border-red-200 bg-red-50/10">
        <h2 className="text-xl md:text-2xl font-normal text-charcoal mb-2 flex items-center gap-2 font-serif">
          <AlertTriangle className="text-red-600" /> Disruption Control Center
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Trigger a Kochi transit event below. The Adapter Agent will instantly reroute you starting from your current position.
        </p>

        {/* Presets List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activePresets.map((preset) => {
            const isTargeted = (itinerary?.legs[itinerary?.legs.length - 1]?.to || '')
              .toLowerCase()
              .includes(preset.targetRoute.toLowerCase());

            return (
              <button
                key={preset.id}
                onClick={() => handleTriggerPreset(preset)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeDisruption?.id === preset.id
                    ? 'bg-red-100/30 border-red-400'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                } relative`}
              >
                {isTargeted && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase">
                    Suggested
                  </span>
                )}
                <h4 className="text-xs font-bold text-charcoal mb-1 flex items-center gap-1.5">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-gray-500 leading-normal">{preset.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="clean-card rounded-3xl p-16 text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-charcoal animate-spin"></div>
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-charcoal animate-pulse" size={18} />
          </div>
          <h3 className="text-base font-bold text-charcoal mb-1">Rerouting Commute...</h3>
          <p className="text-xs text-gray-500">
            Adapter Agent mapping alternative feeder buses and transfer routes...
          </p>
        </div>
      )}

      {/* Side-by-Side Comparison Panels */}
      {!loading && reroutedItinerary && activeDisruption && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          
          {/* Left Panel: Disrupted Route */}
          <div className="clean-card rounded-3xl p-6 border border-red-200 opacity-70 relative bg-gray-50/50">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-white text-red-700 border border-red-200 text-[10px] font-bold rounded-full flex items-center gap-1">
              <XCircle size={12} /> Disrupted Commute
            </div>

            <div className="mb-6 border-b border-gray-200/60 pb-4 mt-2">
              <h3 className="text-base font-bold text-charcoal">Original Plan</h3>
              <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                ⚠️ Blocked: {activeDisruption.eventText}
              </p>
            </div>

            {/* Original Legs in Connected Timeline */}
            <div className="relative pl-6 border-l border-red-200 ml-4 space-y-5 py-2">
              {itinerary?.legs.map((leg, idx) => {
                const isLegBlocked = 
                  (leg.mode === 'water_metro' && activeDisruption.id === 'hc_closed' && leg.from.includes('High Court')) ||
                  (leg.mode === 'water_metro' && activeDisruption.id === 'vy_closed' && leg.from.includes('Vyttila')) ||
                  (leg.mode === 'feeder_bus' && activeDisruption.id === 'mc3_delayed' && leg.name.includes('MC-3'));

                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    {/* Circle icon centered on the timeline line */}
                    <div className={`absolute -left-[38px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center bg-white z-20 ${
                      isLegBlocked ? 'border-red-400 text-red-600' : 'border-gray-300 text-gray-400'
                    }`}>
                      <Icon size={12} />
                    </div>

                    <div className={`p-3.5 rounded-xl border bg-white ${
                      isLegBlocked ? 'border-red-200 bg-red-50/20' : 'border-gray-200/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{leg.mode}</span>
                        {isLegBlocked && <span className="text-[9px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-200">BLOCKED</span>}
                      </div>
                      <h4 className="text-xs font-bold text-gray-500 mt-0.5 line-through decoration-red-400">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1">{leg.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Re-routed Plan */}
          <div className="clean-card rounded-3xl p-6 border border-emerald-300/80 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1 animate-pulse">
              <CheckCircle size={12} /> Copilot Rerouted
            </div>

            {/* Metrics Change */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mt-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-charcoal">Adapted Commute</h3>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  ✨ Multi-leg optimization complete
                </p>
              </div>

              {/* Comparing Metrics */}
              <div className="flex items-center gap-2">
                <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-xl text-center">
                  <div className="text-[8px] text-gray-400 font-bold uppercase">Time</div>
                  <div className="text-[11px] font-bold text-charcoal flex items-center gap-1 justify-center">
                    <span className="line-through text-gray-400 text-[9px]">{itinerary.total_duration}m</span>
                    <ArrowRight size={10} className="text-emerald-600" />
                    <span className="text-emerald-700">{reroutedItinerary.total_duration}m</span>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-xl text-center">
                  <div className="text-[8px] text-gray-400 font-bold uppercase">Fare</div>
                  <div className="text-[11px] font-bold text-charcoal flex items-center gap-1 justify-center">
                    <span className="line-through text-gray-400 text-[9px]">₹{itinerary.total_cost}</span>
                    <ArrowRight size={10} className="text-emerald-600" />
                    <span className="text-emerald-700">₹{reroutedItinerary.total_cost}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adapted Legs in Connected Timeline */}
            <div className="relative pl-6 border-l border-emerald-300 ml-4 space-y-5 py-2 mb-6">
              {reroutedItinerary.legs.map((leg, idx) => {
                const isNewLeg = !itinerary?.legs.some(oldLeg => 
                  oldLeg.from.toLowerCase() === leg.from.toLowerCase() && 
                  oldLeg.to.toLowerCase() === leg.to.toLowerCase() &&
                  oldLeg.mode === leg.mode
                );

                const Icon = MODE_ICONS[leg.mode] || Footprints;

                return (
                  <div key={idx} className="relative">
                    {/* Circle icon centered on the timeline line */}
                    <div className={`absolute -left-[38px] top-1.5 w-6 h-6 rounded-full border flex items-center justify-center bg-white z-20 ${
                      isNewLeg ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-gray-400'
                    }`}>
                      <Icon size={12} />
                    </div>

                    <div className={`p-3.5 rounded-xl border bg-white ${
                      isNewLeg ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-200/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold uppercase ${isNewLeg ? 'text-emerald-700' : 'text-gray-400'}`}>{leg.mode}</span>
                        {isNewLeg && <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">NEW LEG</span>}
                      </div>
                      <h4 className="text-xs font-bold text-charcoal mt-0.5">
                        {leg.from} ➔ {leg.to}
                      </h4>
                      <p className="text-[10px] text-gray-600 mt-1">{leg.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adapter Agent Reasoning */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="text-[10px] font-bold text-charcoal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info size={14} className="text-emerald-700" /> Rerouting Explanation
              </h4>
              <p className="text-[11px] text-gray-700 leading-relaxed font-sans italic">
                "{reroutedItinerary.explanation}"
              </p>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
