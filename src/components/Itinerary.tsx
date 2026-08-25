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
    badge: 'bg-[#e6f8f7] text-[#009999] border-[#99dedb]',
    iconBg: 'bg-gradient-to-br from-[#009999] to-[#007a7a] text-white',
    lineColor: 'border-[#009999]',
    icon: Train,
    image: '/images/kochi-metro.jpg',
    label: 'Kochi Metro Blue Line'
  },
  water_metro: {
    badge: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
    iconBg: 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white',
    lineColor: 'border-[#0284c7]',
    icon: Ship,
    image: '/images/kochi-water-metro.jpg',
    label: 'Kochi Water Metro'
  },
  feeder_bus: {
    badge: 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]',
    iconBg: 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-white',
    lineColor: 'border-[#d97706]',
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
    <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-10 text-left smooth-enter">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 hover:text-[#009999] transition-all duration-200 text-xs font-bold bg-white border border-slate-200 hover:border-[#99dedb] px-4 py-2 rounded-full cursor-pointer shadow-2xs hover:scale-102"
        >
          <ArrowLeft size={14} /> Back to Search
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[#009999] bg-[#e6f8f7] border border-[#99dedb] hover:bg-[#ccfbf1] px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:scale-102"
          title="Copy itinerary summary to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className="text-[#009999]" /> Copied Ticket
            </>
          ) : (
            <>
              <Share2 size={14} /> Share Journey Ticket
            </>
          )}
        </button>
      </div>

      {/* Transit Boarding Ticket Header */}
      <div className="kmrl-glass-card p-4 sm:p-7 mb-6 sm:mb-8 border-t-4 border-t-[#009999] relative bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-[#009999] uppercase tracking-widest mb-1 font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#009999] animate-kmrl-pulse" />
              Recommended Multimodal Journey
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2 font-display tracking-tight flex-wrap">
              <span>{itinerary.legs[0]?.from}</span>
              <ArrowRight size={18} className="text-[#009999] shrink-0" /> 
              <span>{itinerary.legs[itinerary.legs.length - 1]?.to}</span>
            </h2>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xs">
              <Clock size={15} className="text-[#009999] shrink-0" />
              <div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider font-display">Duration</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 font-display">{itinerary.total_duration} mins</div>
              </div>
            </div>

            <div 
              onClick={() => setShowFareDetails(!showFareDetails)}
              className="flex-1 sm:flex-none flex items-center gap-2 bg-slate-50 border border-slate-200/90 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-[#e6f8f7] hover:border-[#99dedb] transition-all duration-200 shadow-2xs group"
              title="Click to view fare breakdown"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#009999] text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-xs shrink-0">
                ₹
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 font-display group-hover:text-[#009999]">
                  Total Fare <Receipt size={9} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 font-display">₹{itinerary.total_cost}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown Drawer */}
        {showFareDetails && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 sm:gap-3 text-center smooth-enter">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#e6f8f7] border border-[#99dedb]">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#009999] uppercase block font-display">Metro</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-display">₹{metroCost}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#e0f2fe] border border-[#bae6fd]">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#0369a1] uppercase block font-display">Water Metro</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-display">₹{waterCost}</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#fef3c7] border border-[#fde68a]">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#b45309] uppercase block font-display">Feeder</span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-display">₹{feederCost}</span>
            </div>
          </div>
        )}
      </div>

      {/* Transit Timeline Legs */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-500/30 ml-3 sm:ml-4 space-y-4 sm:space-y-6 py-2">
        {itinerary.legs.map((leg, idx) => {
          const config = MODE_CONFIG[leg.mode] || MODE_CONFIG.walk;
          const Icon = config.icon;

          return (
            <div key={idx} className="relative group">
              {/* Timeline Mode Icon Circle */}
              <div className={`absolute -left-[37px] sm:-left-[49px] top-3 w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md z-20 transition-transform duration-200 group-hover:scale-110 ${config.iconBg}`}>
                <Icon size={14} className="sm:w-[17px] sm:h-[17px]" />
              </div>

              {/* Connected Leg Detail Card */}
              <div className="transit-card p-4 sm:p-5 relative bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl group-hover:border-teal-400 group-hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-2.5 py-0.5 rounded-full border font-display tracking-wider truncate max-w-[170px] sm:max-w-none ${config.badge}`}>
                    {config.label}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-700 font-bold bg-slate-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-slate-200 shrink-0">
                    <span className="flex items-center gap-1 font-display"><Clock size={11} className="text-slate-500" /> {leg.duration} min</span>
                    {leg.cost > 0 && <span className="text-[#009999] font-bold font-display">₹{leg.cost}</span>}
                  </div>
                </div>
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-1.5 font-display flex-wrap">
                      <span>{leg.from}</span>
                      <span className="text-[#009999]">➔</span>
                      <span>{leg.to}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {leg.details}
                    </p>
                  </div>

                  {config.image && (
                    <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border border-slate-200 hidden xs:block shadow-2xs">
                      <img 
                        src={config.image} 
                        alt={config.label} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
      <div className="kmrl-glass-card p-5 mt-8 mb-6 bg-[#e6f8f7] border border-[#99dedb]">
        <h4 className="text-xs font-bold text-[#007a7a] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-display">
          <Info size={14} className="text-[#009999]" /> KMRL Multimodal Route Optimization
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
          "{itinerary.explanation}"
        </p>
      </div>

      {/* Disruption Simulator Trigger Banner */}
      <div className="transit-card p-6 border border-slate-200 bg-white text-center rounded-2xl">
        <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#dc2626] flex items-center justify-center mx-auto mb-3 border border-red-200 shadow-2xs">
          <AlertTriangle size={18} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1 font-display">KMRL Network Disruption Simulator</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
          Simulate high-tide jetty shutdowns, monsoon delays, or rail maintenance to test dynamic graph rerouting in real-time.
        </p>
        <button
          onClick={onTriggerDisruptionSim}
          className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer inline-flex items-center gap-2 font-display tracking-wider uppercase transition-all duration-200 hover:scale-102 hover:shadow-red-600/30"
        >
          <Zap size={14} /> Open Disruption Simulator
        </button>
      </div>
    </div>
  );
}
