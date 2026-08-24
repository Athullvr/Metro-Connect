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
  Sparkles,
  Zap,
  Share2,
  Check,
  Receipt
} from 'lucide-react';

const MODE_CONFIG = {
  metro: {
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    iconBg: 'bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-teal-500/25',
    lineColor: 'border-teal-500',
    icon: Train,
    label: 'Kochi Metro Blue Line'
  },
  water_metro: {
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sky-500/25',
    lineColor: 'border-sky-500',
    icon: Ship,
    label: 'Kochi Water Metro'
  },
  feeder_bus: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-500/25',
    lineColor: 'border-amber-500',
    icon: Bus,
    label: 'Metro Feeder e-Bus'
  },
  walk: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    iconBg: 'bg-slate-200 text-slate-700',
    lineColor: 'border-slate-300',
    icon: Footprints,
    label: 'Walk Connection'
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
    const summary = `Metro Connect Journey:
From: ${itinerary.legs[0]?.from}
To: ${itinerary.legs[itinerary.legs.length - 1]?.to}
Total Duration: ${itinerary.total_duration} mins
Total Fare: ₹${itinerary.total_cost}

Legs:
${itinerary.legs.map((l, i) => `${i + 1}. [${l.mode.toUpperCase()}] ${l.from} ➔ ${l.to} (${l.duration}m · ₹${l.cost})`).join('\n')}

Reasoning: ${itinerary.explanation}`;

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

  // Compute sub-fares
  const metroCost = itinerary.legs.filter(l => l.mode === 'metro').reduce((sum, l) => sum + l.cost, 0);
  const waterCost = itinerary.legs.filter(l => l.mode === 'water_metro').reduce((sum, l) => sum + l.cost, 0);
  const feederCost = itinerary.legs.filter(l => l.mode === 'feeder_bus').reduce((sum, l) => sum + l.cost, 0);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-10 animate-fadeIn relative z-10">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all text-xs font-semibold bg-white/90 border border-slate-200 hover:bg-white px-4 py-2 rounded-xl cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} /> Back to Search
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-slate-700 hover:text-teal-700 bg-white/90 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title="Copy itinerary summary to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className="text-teal-600" /> Copied to Clipboard
            </>
          ) : (
            <>
              <Share2 size={14} /> Share Journey Pass
            </>
          )}
        </button>
      </div>

      {/* Digital Transit Boarding Pass Header */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8 border border-white/80 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-sky-500 to-amber-500" />

        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> Recommended Transit Route
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 font-display tracking-tight">
              <span>{itinerary.legs[0]?.from}</span>
              <ArrowRight size={18} className="text-slate-400 shrink-0" /> 
              <span>{itinerary.legs[itinerary.legs.length - 1]?.to}</span>
            </h2>
          </div>
          
          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-slate-50/90 border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Duration</div>
                <div className="text-sm font-extrabold text-slate-900 font-display">{itinerary.total_duration} mins</div>
              </div>
            </div>

            <div 
              onClick={() => setShowFareDetails(!showFareDetails)}
              className="flex items-center gap-2.5 bg-slate-50/90 border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-xs cursor-pointer hover:bg-slate-100/80 transition-colors"
              title="Click to view fare breakdown"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                ₹
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  Est. Fare <Receipt size={9} />
                </div>
                <div className="text-sm font-extrabold text-slate-900 font-display">₹{itinerary.total_cost}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown Sub-Card (Collapsible/Interactive) */}
        {showFareDetails && (
          <div className="mt-5 pt-4 border-t border-slate-200/80 grid grid-cols-3 gap-3 text-center animate-fadeIn">
            <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100">
              <span className="text-[9px] font-bold text-teal-800 uppercase block">Metro Blue Line</span>
              <span className="text-xs font-extrabold text-teal-900">₹{metroCost}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">
              <span className="text-[9px] font-bold text-sky-800 uppercase block">Water Metro</span>
              <span className="text-xs font-extrabold text-sky-900">₹{waterCost}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[9px] font-bold text-amber-800 uppercase block">Feeder Buses</span>
              <span className="text-xs font-extrabold text-amber-900">₹{feederCost}</span>
            </div>
          </div>
        )}
      </div>

      {/* Connected Visual Timeline */}
      <div className="relative pl-8 md:pl-10 border-l-2 border-slate-200 ml-6 md:ml-8 space-y-6 py-2">
        {itinerary.legs.map((leg, idx) => {
          const config = MODE_CONFIG[leg.mode] || MODE_CONFIG.walk;
          const Icon = config.icon;

          return (
            <div 
              key={idx}
              className="relative animate-fadeIn"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Circular Mode Icon centered exactly on the timeline border */}
              <div className={`absolute -left-[57px] md:-left-[61px] top-3 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md z-20 ${config.iconBg}`}>
                <Icon size={18} />
              </div>

              {/* Connected Leg Detail Card */}
              <div className="glass-card rounded-2xl p-5 relative transition-all border border-slate-200/80 hover:border-slate-300">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                    {config.label}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-bold bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    <span className="flex items-center gap-1"><Clock size={11} className="text-slate-400" /> {leg.duration} min</span>
                    {leg.cost > 0 && <span className="text-teal-700 font-extrabold">₹{leg.cost}</span>}
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2 font-display">
                  <span>{leg.from}</span>
                  <span className="text-slate-300">➔</span>
                  <span>{leg.to}</span>
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {leg.details}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Reasoning Panel */}
      <div className="glass-card rounded-2xl p-5 md:p-6 mt-8 mb-6 border border-teal-100 bg-gradient-to-br from-teal-50/40 via-white to-sky-50/30">
        <h4 className="text-[10px] font-bold text-teal-800 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-teal-600" /> Copilot Routing Logic
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed font-sans italic">
          "{itinerary.explanation}"
        </p>
      </div>

      {/* Disruption Simulator Trigger Banner */}
      <div className="rounded-3xl p-6 md:p-7 border border-rose-200 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 text-center shadow-xs">
        <div className="w-11 h-11 rounded-2xl bg-rose-100/80 text-rose-700 flex items-center justify-center mx-auto mb-3 border border-rose-200">
          <AlertTriangle size={20} />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1 font-display">Commute Disruption Simulator</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          Simulate a real Kochi monsoon storm, jetty shutdown, or metro delay to test dynamic AI rerouting.
        </p>
        <button
          onClick={onTriggerDisruptionSim}
          className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Zap size={14} /> Open Disruption Simulator
        </button>
      </div>
    </div>
  );
}
