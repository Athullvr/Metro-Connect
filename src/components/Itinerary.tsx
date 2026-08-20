import React from 'react';
import { 
  Train, 
  Ship, 
  Bus, 
  Footprints, 
  Clock, 
  Coins, 
  ArrowLeft, 
  AlertTriangle, 
  ChevronRight,
  Info
} from 'lucide-react';

const MODE_CONFIG = {
  metro: {
    color: 'bg-metro-bg border-metro-border text-metro-text',
    icon: Train,
    label: 'Kochi Metro (Blue Line)',
    stripe: 'bg-metro-border'
  },
  water_metro: {
    color: 'bg-water-bg border-water-border text-water-text',
    icon: Ship,
    label: 'Kochi Water Metro',
    stripe: 'bg-water-border'
  },
  feeder_bus: {
    color: 'bg-feeder-bg border-feeder-border text-feeder-text',
    icon: Bus,
    label: 'MetroConnect Feeder e-Bus',
    stripe: 'bg-feeder-border'
  },
  walk: {
    color: 'bg-gray-100 border-gray-300 text-gray-500',
    icon: Footprints,
    label: 'Walk Connection',
    stripe: 'bg-gray-300'
  }
};

export default function Itinerary({ 
  itinerary, 
  onBack, 
  onTriggerDisruptionSim 
}) {
  if (!itinerary) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-charcoal transition-all text-xs font-semibold mb-6 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Search
      </button>

      {/* Header Commute summary */}
      <div className="clean-card rounded-3xl p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Transit Copilot Commute Route</div>
            <h2 className="text-xl md:text-2xl font-normal text-charcoal flex items-center gap-2 font-serif">
              {itinerary.legs[0]?.from} 
              <ChevronRight size={18} className="text-gray-400" /> 
              {itinerary.legs[itinerary.legs.length - 1]?.to}
            </h2>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl">
              <Clock size={16} className="text-water-text" />
              <div>
                <div className="text-[9px] text-gray-500 uppercase font-medium">Duration</div>
                <div className="text-sm font-bold text-charcoal">{itinerary.total_duration} mins</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl">
              <Coins size={16} className="text-fare-text" />
              <div>
                <div className="text-[9px] text-gray-500 uppercase font-medium">Est. Fare</div>
                <div className="text-sm font-bold text-charcoal">₹{itinerary.total_cost}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Visual Timeline */}
      <div className="relative pl-8 md:pl-10 border-l border-gray-300 ml-6 md:ml-8 space-y-6 py-2">
        {itinerary.legs.map((leg, idx) => {
          const config = MODE_CONFIG[leg.mode] || MODE_CONFIG.walk;
          const Icon = config.icon;

          return (
            <div 
              key={idx}
              className="relative animate-fadeIn"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {/* Circular Mode Icon centered exactly on the timeline border-l line */}
              <div className={`absolute -left-[57px] md:-left-[61px] top-2 w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center shadow-sm z-20 ${config.color}`}>
                <Icon size={16} />
              </div>

              {/* Connected Leg Detail Card */}
              <div className="clean-card rounded-2xl p-5 relative transition-all hover:border-gray-300">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    {config.label}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-charcoal font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                    <span className="flex items-center gap-1"><Clock size={10} /> {leg.duration} min</span>
                    {leg.cost > 0 && <span>₹{leg.cost}</span>}
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-charcoal mb-1">
                  {leg.from} ➔ {leg.to}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {leg.details}
                </p>
              </div>

              {/* Connecting Transfer Indicator Line (between legs) */}
              {idx < itinerary.legs.length - 1 && (
                <div className="absolute left-[-57px] md:left-[-61px] bottom-[-24px] h-6 flex items-center pointer-events-none select-none z-10">
                  <div className="w-10 text-center text-[9px] font-bold text-gray-400 bg-gray-50 px-1 rounded border border-gray-200">
                    ➔
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reasoning Panel */}
      <div className="clean-card rounded-2xl p-5 mt-8 mb-6 bg-gradient-to-br from-gray-50/50 to-white">
        <h4 className="text-[10px] font-bold text-charcoal uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info size={14} className="text-metro-text" /> Transit Copilot Reasoning
        </h4>
        <p className="text-xs text-gray-700 leading-relaxed font-sans italic">
          "{itinerary.explanation}"
        </p>
      </div>

      {/* Reroute Resiliency Trigger Card */}
      <div className="border-2 border-dashed border-red-200 bg-red-50/30 rounded-3xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 text-red-700 flex items-center justify-center mx-auto mb-3 animate-pulse">
          <AlertTriangle size={20} />
        </div>
        <h3 className="text-sm font-bold text-charcoal mb-1">CommCommute Resiliency Check</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
          Simulate a weather or backwater flow failure to check how the AI adapter agent handles routing delays.
        </p>
        <button
          onClick={onTriggerDisruptionSim}
          className="px-6 py-2.5 bg-charcoal hover:bg-black text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
        >
          Simulate CommCommute Disruption
        </button>
      </div>
    </div>
  );
}
