import React, { useState } from 'react';
import { 
  Train, 
  Ship, 
  Bus, 
  Footprints, 
  Clock, 
  ArrowLeft, 
  AlertTriangle, 
  ArrowRight,
  Zap,
  Share2,
  Check,
  Receipt,
  Info
} from 'lucide-react';

const MODE_CONFIG = {
  metro: {
    badge: 'bg-[#E6F6F5] text-[#007E7A] border-[#99DEDB]',
    iconBg: 'bg-[#00A19C] text-white',
    lineColor: 'border-[#00A19C]',
    icon: Train,
    image: '/images/kochi-metro.jpg',
    label: 'Kochi Metro Blue Line'
  },
  water_metro: {
    badge: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    iconBg: 'bg-[#0284C7] text-white',
    lineColor: 'border-[#0284C7]',
    icon: Ship,
    image: '/images/kochi-water-metro.jpg',
    label: 'Kochi Water Metro'
  },
  feeder_bus: {
    badge: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    iconBg: 'bg-[#D97706] text-white',
    lineColor: 'border-[#D97706]',
    icon: Bus,
    image: '/images/kochi-feeder-bus.jpg',
    label: 'Metro Feeder e-Bus'
  },
  walk: {
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    iconBg: 'bg-slate-700 text-white',
    lineColor: 'border-slate-400',
    icon: Footprints,
    image: null,
    label: 'Walking Transfer'
  }
};

export default function Itinerary({ 
  itinerary, 
  onBack, 
  onTriggerDisruptionSim 
}) {
  const [copied, setCopied] = useState(false);
  const [showFareDetails, setShowFareDetails] = useState(false);

  if (!itinerary) return null;

  const handleShare = async () => {
    const summary = `KMRL Metro Connect Journey:
From: ${itinerary.legs[0]?.from}
To: ${itinerary.legs[itinerary.legs.length - 1]?.to}
Total Duration: ${itinerary.total_duration} mins
Total Fare: ₹${itinerary.total_cost}

Legs:
${itinerary.legs.map((l, i) => `${i + 1}. [${l.mode.toUpperCase()}] ${l.from} ➔ ${l.to} (${l.duration}m · ₹${l.cost})`).join('\n')}

Routing Logic: ${itinerary.explanation}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn('Could not copy to clipboard', e);
    }
  };

  const metroCost = itinerary.legs.filter(l => l.mode === 'metro').reduce((sum, l) => sum + l.cost, 0);
  const waterCost = itinerary.legs.filter(l => l.mode === 'water_metro').reduce((sum, l) => sum + l.cost, 0);
  const feederCost = itinerary.legs.filter(l => l.mode === 'feeder_bus').reduce((sum, l) => sum + l.cost, 0);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 text-left">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-5">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 transition-colors text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-md cursor-pointer"
        >
          <ArrowLeft size={13} /> Back to Search
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[#007E7A] bg-[#E6F6F5] border border-[#99DEDB] hover:bg-[#D4EFEB] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer"
          title="Copy itinerary summary to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} className="text-[#007E7A]" /> Copied Ticket
            </>
          ) : (
            <>
              <Share2 size={13} /> Share Journey Ticket
            </>
          )}
        </button>
      </div>

      {/* Transit Boarding Ticket Header */}
      <div className="transit-card p-6 mb-7 border-t-4 border-t-[#00A19C] relative bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-[#007E7A] uppercase tracking-widest mb-1 font-display">
              Recommended Multimodal Route
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <span>{itinerary.legs[0]?.from}</span>
              <ArrowRight size={16} className="text-slate-400 shrink-0" /> 
              <span>{itinerary.legs[itinerary.legs.length - 1]?.to}</span>
            </h2>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
              <Clock size={15} className="text-[#007E7A]" />
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-display">Total Time</div>
                <div className="text-xs font-bold text-slate-900 font-display">{itinerary.total_duration} mins</div>
              </div>
            </div>

            <div 
              onClick={() => setShowFareDetails(!showFareDetails)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              title="Click to view sub-fares"
            >
              <div className="w-5 h-5 rounded bg-[#00A19C] text-white flex items-center justify-center font-bold text-[10px]">
                ₹
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 font-display">
                  Est. Fare <Receipt size={9} />
                </div>
                <div className="text-xs font-bold text-slate-900 font-display">₹{itinerary.total_cost}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown Drawer */}
        {showFareDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2 rounded-md bg-[#E6F6F5] border border-[#99DEDB]">
              <span className="text-[9px] font-bold text-[#007E7A] uppercase block font-display">Metro Rail</span>
              <span className="text-xs font-bold text-slate-900 font-display">₹{metroCost}</span>
            </div>
            <div className="p-2 rounded-md bg-[#E0F2FE] border border-[#BAE6FD]">
              <span className="text-[9px] font-bold text-[#0369A1] uppercase block font-display">Water Metro</span>
              <span className="text-xs font-bold text-slate-900 font-display">₹{waterCost}</span>
            </div>
            <div className="p-2 rounded-md bg-[#FEF3C7] border border-[#FDE68A]">
              <span className="text-[9px] font-bold text-[#B45309] uppercase block font-display">Feeder Bus</span>
              <span className="text-xs font-bold text-slate-900 font-display">₹{feederCost}</span>
            </div>
          </div>
        )}
      </div>

      {/* Transit Timeline Legs */}
      <div className="relative pl-7 border-l-2 border-slate-300 ml-4 space-y-5 py-1">
        {itinerary.legs.map((leg, idx) => {
          const config = MODE_CONFIG[leg.mode] || MODE_CONFIG.walk;
          const Icon = config.icon;

          return (
            <div key={idx} className="relative">
              {/* Timeline Mode Icon Circle */}
              <div className={`absolute -left-[43px] top-2.5 w-8 h-8 rounded-lg flex items-center justify-center shadow-xs z-20 ${config.iconBg}`}>
                <Icon size={16} />
              </div>

              {/* Connected Leg Detail Card */}
              <div className="transit-card p-4 relative bg-white border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border font-display ${config.badge}`}>
                    {config.label}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    <span className="flex items-center gap-1 font-display"><Clock size={11} className="text-slate-500" /> {leg.duration} min</span>
                    {leg.cost > 0 && <span className="text-[#007E7A] font-bold font-display">₹{leg.cost}</span>}
                  </div>
                </div>
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5 font-display">
                      <span>{leg.from}</span>
                      <span className="text-slate-400">➔</span>
                      <span>{leg.to}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {leg.details}
                    </p>
                  </div>

                  {config.image && (
                    <div className="w-16 h-11 rounded-md overflow-hidden shrink-0 border border-slate-200 hidden sm:block">
                      <img 
                        src={config.image} 
                        alt={config.label} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Routing Logic Explainer Box */}
      <div className="transit-card p-4 mt-7 mb-5 bg-[#E6F6F5] border border-[#99DEDB]">
        <h4 className="text-[10px] font-bold text-[#007E7A] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
          <Info size={13} className="text-[#00A19C]" /> Route Optimization Logic
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
          "{itinerary.explanation}"
        </p>
      </div>

      {/* Disruption Simulator Trigger Banner */}
      <div className="transit-card p-5 border border-slate-200 bg-white text-center">
        <div className="w-9 h-9 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-2 border border-red-200">
          <AlertTriangle size={17} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-0.5 font-display">KMRL Network Disruption Simulator</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-normal">
          Simulate high-tide jetty shutdowns, monsoon delays, or rail maintenance to test dynamic graph rerouting.
        </p>
        <button
          onClick={onTriggerDisruptionSim}
          className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5 font-display tracking-wider uppercase transition-colors"
        >
          <Zap size={13} /> Open Disruption Simulator
        </button>
      </div>
    </div>
  );
}
