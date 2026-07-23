import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Settings, 
  Wifi, 
  WifiOff, 
  Compass, 
  Briefcase, 
  TrendingDown, 
  Activity, 
  Search 
} from 'lucide-react';
import transitData from '../data.json';

const SUGGESTIONS = [
  {
    origin: 'Aluva',
    destination: 'Fort Kochi',
    label: 'Aluva ➔ Fort Kochi',
    desc: 'Metro + Walk + Water Metro'
  },
  {
    origin: 'Vyttila',
    destination: 'Kakkanad Jetty',
    label: 'Vyttila ➔ Kakkanad',
    desc: 'Water Metro Bypass'
  },
  {
    origin: 'Kalamassery',
    destination: 'Infopark',
    label: 'Kalamassery ➔ Infopark',
    desc: 'IT e-Bus Feeder'
  }
];

export default function Home({ 
  onPlan, 
  apiKey, 
  setApiKey, 
  useSimulator, 
  setUseSimulator 
}) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Search Autocomplete States
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originRef = useRef(null);
  const destRef = useRef(null);

  // Constraints
  const [constraints, setConstraints] = useState({
    luggage: false,
    scenic: false,
    lowCost: false,
    speed: true
  });

  // Collect and group transit stops from data.json
  const getGroupedStops = () => {
    const metro = transitData.metro_line.stations.map(s => ({ name: s.name, type: 'Kochi Metro Station' }));
    const water = transitData.water_metro.jetties.map(j => ({ name: j.name, type: 'Water Metro Jetty' }));
    const bus = Array.from(new Set(transitData.feeder_buses.flatMap(fb => fb.stops)))
      .map(stop => ({ name: stop, type: 'Feeder Bus Stop' }));

    return [...metro, ...water, ...bus];
  };

  const allStops = getGroupedStops();

  // Filter suggestions dynamically
  useEffect(() => {
    if (!origin) {
      setOriginSuggestions(allStops.slice(0, 5)); // show first few as defaults
    } else {
      const filtered = allStops.filter(s => 
        s.name.toLowerCase().includes(origin.toLowerCase())
      );
      setOriginSuggestions(filtered);
    }
  }, [origin]);

  useEffect(() => {
    if (!destination) {
      setDestSuggestions(allStops.slice(0, 5));
    } else {
      const filtered = allStops.filter(s => 
        s.name.toLowerCase().includes(destination.toLowerCase())
      );
      setDestSuggestions(filtered);
    }
  }, [destination]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (originRef.current && !originRef.current.contains(event.target)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(event.target)) {
        setShowDestDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestClick = (s) => {
    setOrigin(s.origin);
    setDestination(s.destination);
    setShowOriginDropdown(false);
    setShowDestDropdown(false);
  };

  const toggleConstraint = (key) => {
    setConstraints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin || !destination) return;
    setLoading(true);
    await onPlan(origin, destination, constraints);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-16 relative">
      
      {/* Brand Header */}
      <div className="text-center mb-10 md:mb-12 relative max-w-2xl mx-auto animate-fadeIn">
        <h1 className="font-serif font-normal text-4xl md:text-5xl text-charcoal tracking-tight leading-tight mb-5">
          The first agentic AI platform that actually runs your commute.
        </h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
          Metro Connect Copilot plugs into Kochi Metro, Water Metro, and e-buses to plan legs, explain transit choices, and adapt dynamically during weather or route disruptions.
        </p>
      </div>

      {/* Main Clean Card Form */}
      <div className="clean-card rounded-3xl p-6 md:p-8 relative z-30">
        
        {/* Settings Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all border border-gray-200 cursor-pointer"
            title="Configure AI Agent API Settings"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* API Settings */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 animate-fadeIn">
            <h3 className="text-xs font-bold text-charcoal mb-3 flex items-center gap-2">
              <Settings size={14} className="text-metro-text" /> Copilot Agent Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Copilot Engine Mode</label>
                <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setUseSimulator(true)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      useSimulator 
                        ? 'bg-white text-charcoal shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <WifiOff size={11} /> Local Simulator
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSimulator(false)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      !useSimulator 
                        ? 'bg-white text-charcoal shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Wifi size={11} /> OpenAI API
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">OpenAI API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  disabled={useSimulator}
                  className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-charcoal placeholder-gray-400 focus:outline-none focus:border-metro-border transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            
            {/* Origin Autocomplete Input */}
            <div ref={originRef} className="relative">
              <label className="block text-[10px] text-metro-text font-bold tracking-wider uppercase mb-1.5">Starting Station</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-metro-text" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Type start station or click suggestions..."
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setShowOriginDropdown(true);
                  }}
                  onFocus={() => {
                    setShowOriginDropdown(true);
                    setShowDestDropdown(false);
                  }}
                  className="w-full bg-white border border-gray-200 focus:border-metro-border rounded-xl pl-11 pr-4 py-3.5 text-charcoal text-xs focus:outline-none transition-all"
                />
              </div>

              {/* Suggestions Dropdown overlay */}
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto scrollbar-thin z-50">
                  {originSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOrigin(s.name);
                        setShowOriginDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 cursor-pointer"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                        {s.type.replace('Kochi ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Autocomplete Input */}
            <div ref={destRef} className="relative">
              <label className="block text-[10px] text-water-text font-bold tracking-wider uppercase mb-1.5">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-water-text" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Type destination jetty or station..."
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowDestDropdown(true);
                  }}
                  onFocus={() => {
                    setShowDestDropdown(true);
                    setShowOriginDropdown(false);
                  }}
                  className="w-full bg-white border border-gray-200 focus:border-water-border rounded-xl pl-11 pr-4 py-3.5 text-charcoal text-xs focus:outline-none transition-all"
                />
              </div>

              {/* Suggestions Dropdown overlay */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto scrollbar-thin z-50">
                  {destSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestination(s.name);
                        setShowDestDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 cursor-pointer"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                        {s.type.replace('Kochi ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Constraints Selector */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold tracking-wider uppercase mb-2">Trip Constraints</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => toggleConstraint('speed')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                  constraints.speed 
                    ? 'bg-metro-bg border-metro-border text-metro-text font-bold' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Activity size={13} /> Speed
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('luggage')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                  constraints.luggage 
                    ? 'bg-water-bg border-water-border text-water-text font-bold' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Briefcase size={13} /> Luggage
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('scenic')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                  constraints.scenic 
                    ? 'bg-feeder-bg border-feeder-border text-feeder-text font-bold' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Compass size={13} /> Scenic
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('lowCost')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                  constraints.lowCost 
                    ? 'bg-fare-bg border-fare-border text-fare-text font-bold' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <TrendingDown size={13} /> Cost
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-charcoal hover:bg-black text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Coordinating transit commute...
              </span>
            ) : (
              <span className="text-xs font-semibold tracking-wider uppercase flex items-center gap-2">
                Plan Commute Route <Search size={14} />
              </span>
            )}
          </button>
        </form>

        {/* Shortcuts tag badges */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Quick Demos:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestClick(s)}
              className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-charcoal-light px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
