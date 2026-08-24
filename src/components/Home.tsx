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
  Search,
  LocateFixed,
  Train,
  Ship,
  Bus,
  ArrowRight
} from 'lucide-react';
import transitData from '../data.json';
import { detectNearestStation } from '../lib/geolocation.js';
import { getTrips, clearTrips } from '../lib/tripHistory.js';

const SUGGESTIONS = [
  {
    origin: 'Aluva',
    destination: 'Fort Kochi',
    label: 'Aluva ➔ Fort Kochi',
    badge: '52m · ₹50',
    desc: 'Metro + Walk + Water Metro'
  },
  {
    origin: 'Vyttila',
    destination: 'Kakkanad Jetty',
    label: 'Vyttila ➔ Kakkanad',
    badge: '25m · ₹30',
    desc: 'Water Metro Bypass'
  },
  {
    origin: 'Kalamassery',
    destination: 'Infopark',
    label: 'Kalamassery ➔ Infopark',
    badge: '35m · ₹35',
    desc: 'IT e-Bus Feeder'
  }
];

// Collect and group transit stops from data.json once
const ALL_STOPS = [
  ...transitData.metro_line.stations.map(s => ({ name: s.name, type: 'Kochi Metro Station' })),
  ...transitData.water_metro.jetties.map(j => ({ name: j.name, type: 'Water Metro Jetty' })),
  ...Array.from(new Set(transitData.feeder_buses.flatMap(fb => fb.stops)))
    .map(stop => ({ name: stop, type: 'Feeder Bus Stop' }))
];

export default function Home({
  onPlan,
  useSimulator,
  setUseSimulator,
  planError
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

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleUseMyLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { node } = await detectNearestStation();
      setOrigin(node.name);
      setShowOriginDropdown(false);
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setLocating(false);
    }
  };

  // Constraints
  const [constraints, setConstraints] = useState({
    luggage: false,
    scenic: false,
    lowCost: false,
    speed: true
  });

  // Filter suggestions dynamically
  useEffect(() => {
    if (!origin) {
      setOriginSuggestions(ALL_STOPS.slice(0, 5)); // show first few as defaults
    } else {
      const filtered = ALL_STOPS.filter(s => 
        s.name.toLowerCase().includes(origin.toLowerCase())
      );
      setOriginSuggestions(filtered);
    }
  }, [origin]);

  useEffect(() => {
    if (!destination) {
      setDestSuggestions(ALL_STOPS.slice(0, 5));
    } else {
      const filtered = ALL_STOPS.filter(s => 
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

  const handleDropdownKeyDown = (e, closeDropdown) => {
    if (e.key === 'Escape') {
      closeDropdown();
      e.target.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.currentTarget.parentElement.querySelector('[role="listbox"] button')?.focus();
    }
  };

  const [recentTrips, setRecentTrips] = useState([]);

  useEffect(() => {
    setRecentTrips(getTrips());
  }, []);

  const handleClearHistory = () => {
    clearTrips();
    setRecentTrips([]);
  };

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

  const handleSwapStops = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setShowOriginDropdown(false);
    setShowDestDropdown(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 relative">
      
      {/* Elevated Hero Brand Header */}
      <div className="text-center mb-8 md:mb-10 relative max-w-2xl mx-auto animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50/80 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-4 backdrop-blur-sm shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-ping" />
          Kochi Metro • Water Metro • Feeder e-Buses
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight leading-tight mb-3">
          Smarter transit across <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600">Kochi's waters & rails</span>.
        </h1>
        <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
          Real-time multimodal graph routing across all 25 Blue Line stations, 6 operational Water Metro routes, and feeder bus links.
        </p>
      </div>

      {/* Main Glassmorphic Planner Card */}
      <div className="glass-card rounded-3xl p-6 md:p-8 relative z-30">
        
        {/* Settings Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 text-slate-500 transition-all border border-slate-200/60 cursor-pointer"
            title="Configure AI Agent API Settings"
            aria-label="Configure AI Agent API Settings"
            aria-expanded={showSettings}
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Engine Settings Drawer */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Settings size={14} className="text-teal-600" /> Copilot Engine Settings
            </h3>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wider">Engine Routing Mode</label>
              <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setUseSimulator(true)}
                  aria-pressed={useSimulator}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    useSimulator
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <WifiOff size={12} /> Local Simulator (Offline)
                </button>
                <button
                  type="button"
                  onClick={() => setUseSimulator(false)}
                  aria-pressed={!useSimulator}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    !useSimulator
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wifi size={12} /> Live AI Copilot (OpenAI Proxy)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Live mode proxies requests server-side via `/api/plan` with automated simulator fallbacks.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inputs Row with Centered Swap Button */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-end relative">
            
            {/* Origin Autocomplete Input */}
            <div ref={originRef} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="origin-input" className="block text-[10px] text-teal-700 font-bold tracking-wider uppercase">Starting Station</label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="flex items-center gap-1 text-[9px] font-bold text-teal-600 hover:text-teal-800 transition-all cursor-pointer disabled:opacity-50"
                  title="Detect the nearest station from your current location"
                >
                  <LocateFixed size={11} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'Locating...' : 'Use my GPS location'}
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600" size={16} aria-hidden="true" />
                <input
                  id="origin-input"
                  type="text"
                  required
                  role="combobox"
                  aria-expanded={showOriginDropdown && originSuggestions.length > 0}
                  aria-haspopup="listbox"
                  aria-controls="origin-listbox"
                  aria-autocomplete="list"
                  placeholder="Type start station, jetty or landmark..."
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    setShowOriginDropdown(true);
                  }}
                  onFocus={() => {
                    setShowOriginDropdown(true);
                    setShowDestDropdown(false);
                  }}
                  onKeyDown={(e) => handleDropdownKeyDown(e, () => setShowOriginDropdown(false))}
                  className="w-full bg-white/90 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl pl-10 pr-9 py-3.5 text-slate-800 text-xs font-medium focus:outline-none transition-all shadow-xs"
                />
                {origin && (
                  <button
                    type="button"
                    onClick={() => setOrigin('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                    title="Clear start station"
                    aria-label="Clear start station"
                  >
                    ✕
                  </button>
                )}
              </div>
              {locationError && (
                <p role="alert" className="text-[10px] text-rose-500 mt-1 font-medium">{locationError}</p>
              )}

              {/* Suggestions Dropdown overlay */}
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div id="origin-listbox" role="listbox" aria-label="Starting station suggestions" className="absolute top-[100%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-56 overflow-y-auto scrollbar-thin z-50 divide-y divide-slate-100">
                  {originSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="option"
                      aria-selected={origin === s.name}
                      onClick={() => {
                        setOrigin(s.name);
                        setShowOriginDropdown(false);
                      }}
                      onKeyDown={(e) => e.key === 'Escape' && setShowOriginDropdown(false)}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:bg-teal-50/50 focus:bg-teal-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        s.type.includes('Metro Station') 
                          ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                          : s.type.includes('Water') 
                            ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {s.type.replace('Kochi ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center pb-1">
              <button
                type="button"
                onClick={handleSwapStops}
                title="Swap origin and destination"
                aria-label="Swap origin and destination"
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              >
                ⇄
              </button>
            </div>

            {/* Destination Autocomplete Input */}
            <div ref={destRef} className="relative">
              <label htmlFor="destination-input" className="block text-[10px] text-sky-700 font-bold tracking-wider uppercase mb-1.5">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600" size={16} aria-hidden="true" />
                <input
                  id="destination-input"
                  type="text"
                  required
                  role="combobox"
                  aria-expanded={showDestDropdown && destSuggestions.length > 0}
                  aria-haspopup="listbox"
                  aria-controls="destination-listbox"
                  aria-autocomplete="list"
                  placeholder="Type destination jetty, stop or station..."
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowDestDropdown(true);
                  }}
                  onFocus={() => {
                    setShowDestDropdown(true);
                    setShowOriginDropdown(false);
                  }}
                  onKeyDown={(e) => handleDropdownKeyDown(e, () => setShowDestDropdown(false))}
                  className="w-full bg-white/90 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 rounded-xl pl-10 pr-9 py-3.5 text-slate-800 text-xs font-medium focus:outline-none transition-all shadow-xs"
                />
                {destination && (
                  <button
                    type="button"
                    onClick={() => setDestination('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                    title="Clear destination"
                    aria-label="Clear destination"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown overlay */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div id="destination-listbox" role="listbox" aria-label="Destination suggestions" className="absolute top-[100%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 max-h-56 overflow-y-auto scrollbar-thin z-50 divide-y divide-slate-100">
                  {destSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="option"
                      aria-selected={destination === s.name}
                      onClick={() => {
                        setDestination(s.name);
                        setShowDestDropdown(false);
                      }}
                      onKeyDown={(e) => e.key === 'Escape' && setShowDestDropdown(false)}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:bg-sky-50/50 focus:bg-sky-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        s.type.includes('Metro Station') 
                          ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                          : s.type.includes('Water') 
                            ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
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
            <label className="block text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-2">Trip Preferences</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => toggleConstraint('speed')}
                aria-pressed={constraints.speed}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  constraints.speed
                    ? 'bg-teal-500 text-white border-teal-600 shadow-sm shadow-teal-500/20'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Activity size={13} /> Fastest Route
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('luggage')}
                aria-pressed={constraints.luggage}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  constraints.luggage
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm shadow-sky-500/20'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Briefcase size={13} /> Luggage Friendly
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('scenic')}
                aria-pressed={constraints.scenic}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  constraints.scenic
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Compass size={13} /> Scenic / Water
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('lowCost')}
                aria-pressed={constraints.lowCost}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  constraints.lowCost
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingDown size={13} /> Lowest Fare
              </button>
            </div>
          </div>

          {/* Plan error banner */}
          {planError && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <p className="font-semibold">{planError.message}</p>
              {planError.suggestions?.length > 0 && (
                <p className="mt-1 text-rose-600">
                  Did you mean: {planError.suggestions.join(', ')}?
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 hover:from-teal-800 hover:to-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-900/15 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span role="status" aria-live="polite" className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                Coordinating transit commute...
              </span>
            ) : (
              <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 font-display">
                Plan Multimodal Journey <Search size={14} />
              </span>
            )}
          </button>
        </form>

        {/* Shortcuts tag badges */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Popular Journeys:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestClick(s)}
              className="text-xs bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-800 px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium inline-flex items-center gap-1.5 shadow-2xs hover:scale-102"
            >
              <span>{s.label}</span>
              <span className="text-[9px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded-full border border-teal-200">{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Recent Trips */}
        {recentTrips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Recent Journeys:</span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
              >
                Clear History
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {recentTrips.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => handleSuggestClick({ origin: trip.origin, destination: trip.destination })}
                  className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium"
                >
                  {trip.origin} ➔ {trip.destination}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Kochi Integrated Transit Network Visual Showcase */}
      <div className="mt-12 animate-fadeIn">
        <div className="flex items-center justify-between mb-5 px-1">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-display">
              Integrated Kochi Transit Network
            </h3>
            <p className="text-xs text-slate-500">
              Three seamless mobility modes coordinated by our AI engine.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Metro Rail */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'Aluva', destination: 'Maharajas College' })}
            className="glass-card rounded-2xl overflow-hidden border border-teal-200/80 hover:border-teal-400 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col"
          >
            <div className="relative h-40 overflow-hidden bg-slate-100">
              <img 
                src="/images/kochi-metro.jpg" 
                alt="Kochi Metro Blue Line" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-teal-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                <Train size={11} /> 25 Stations
              </span>
              <span className="absolute bottom-3 left-3 text-white text-xs font-bold font-display">
                Kochi Metro Blue Line
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Elevated rapid rail linking Aluva to Tripunithura. Fast, air-conditioned arterial spine.
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
                <span>Try Aluva ➔ Maharajas</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>

          {/* Card 2: Water Metro */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'High Court Jetty', destination: 'Fort Kochi Jetty' })}
            className="glass-card rounded-2xl overflow-hidden border border-sky-200/80 hover:border-sky-400 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col"
          >
            <div className="relative h-40 overflow-hidden bg-slate-100">
              <img 
                src="/images/kochi-water-metro.jpg" 
                alt="Kochi Water Metro Catamaran" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-sky-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                <Ship size={11} /> 15 Jetties
              </span>
              <span className="absolute bottom-3 left-3 text-white text-xs font-bold font-display">
                Kochi Water Metro
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Battery-electric catamarans bypassing city traffic across Vembanad backwaters.
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold text-sky-700 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
                <span>Try High Court ➔ Fort Kochi</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>

          {/* Card 3: Feeder Buses */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'Kalamassery', destination: 'Infopark' })}
            className="glass-card rounded-2xl overflow-hidden border border-amber-200/80 hover:border-amber-400 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col"
          >
            <div className="relative h-40 overflow-hidden bg-slate-100">
              <img 
                src="/images/kochi-feeder-bus.jpg" 
                alt="Metro Feeder e-Bus" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1">
                <Bus size={11} /> 18 Feeder Links
              </span>
              <span className="absolute bottom-3 left-3 text-white text-xs font-bold font-display">
                Metro Feeder e-Buses
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                First and last-mile electric feeder connections to IT hubs, hospitals, and campuses.
              </p>
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
                <span>Try Kalamassery ➔ Infopark</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
