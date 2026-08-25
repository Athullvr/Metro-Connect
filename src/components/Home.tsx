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
import NetworkMapModal from './NetworkMapModal';

const SUGGESTIONS = [
  {
    origin: 'Aluva',
    destination: 'Fort Kochi',
    label: 'Aluva ➔ Fort Kochi',
    badge: '52 min • ₹50',
    desc: 'Metro + Walk + Water Metro'
  },
  {
    origin: 'Vyttila',
    destination: 'Kakkanad Jetty',
    label: 'Vyttila ➔ Kakkanad',
    badge: '25 min • ₹30',
    desc: 'Water Metro Bypass'
  },
  {
    origin: 'Kalamassery',
    destination: 'Infopark',
    label: 'Kalamassery ➔ Infopark',
    badge: '35 min • ₹35',
    desc: 'IT e-Bus Feeder'
  }
];

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
  const [showMapModal, setShowMapModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSelectFromMap = (stationName, target) => {
    if (target === 'origin') {
      setOrigin(stationName);
    } else {
      setDestination(stationName);
    }
  };

  // Autocomplete States
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

  useEffect(() => {
    if (!origin) {
      setOriginSuggestions(ALL_STOPS.slice(0, 5));
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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 smooth-enter">
      
      {/* Official KMRL Transit Hero */}
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f8f7] border border-[#99dedb] text-[#009999] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#009999] animate-kmrl-pulse" />
          The Heartbeat of Kochi
        </div>
        <h1 className="font-display font-black text-3xl md:text-5xl text-slate-900 tracking-tight mb-3 leading-tight">
          Bridging <span className="text-[#009999]">Distances</span>, Connecting <span className="text-[#14b1b2]">Lives</span>
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-sans">
          Smarter journeys. Faster connections. Integrated schedule and routing across Kochi Metro Blue Line, Water Metro ferries, and electric feeder buses.
        </p>
      </div>

      {/* Main Search Planner Card */}
      <div className="kmrl-glass-card p-6 md:p-8 relative bg-white/95">
        
        {/* Card Header Actions (Stations Explorer + Settings) */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#009999] shadow-xs" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-800">
              Trip Coordinator & Route Planner
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e6f8f7] hover:bg-[#ccfbf1] text-[#007a7a] text-xs font-bold border border-[#99dedb] transition-all duration-200 hover:scale-[1.02] cursor-pointer shadow-2xs"
              title="Open full network station explorer"
            >
              <Compass size={14} className="text-[#009999]" /> Stations Explorer
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 border border-slate-200 cursor-pointer"
              title="Configure Engine Settings"
              aria-label="Configure Engine Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Engine Settings Drawer */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left smooth-enter">
            <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5 font-display">
              <Settings size={13} className="text-[#009999]" /> Router Engine Settings
            </h3>
            <div className="flex bg-slate-200/80 p-1 rounded-lg max-w-sm">
              <button
                type="button"
                onClick={() => setUseSimulator(true)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  useSimulator ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <WifiOff size={12} /> Offline Graph
              </button>
              <button
                type="button"
                onClick={() => setUseSimulator(false)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                  !useSimulator ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wifi size={12} /> Live AI Proxy
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inputs Row with Center Swap Button */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3.5 items-end">
            
            {/* Origin Input */}
            <div ref={originRef} className="relative text-left">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="origin-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                  Origin Station / Jetty
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#009999] hover:text-[#007a7a] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed size={12} className={locating ? 'animate-spin text-[#009999]' : ''} />
                  {locating ? 'Locating...' : 'Use GPS'}
                </button>
              </div>
              <div className="relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#009999] transition-transform duration-200 group-focus-within:scale-110" size={16} aria-hidden="true" />
                <input
                  id="origin-input"
                  type="text"
                  required
                  role="combobox"
                  aria-expanded={showOriginDropdown && originSuggestions.length > 0}
                  placeholder="Starting station, jetty or stop..."
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
                  className="w-full transit-input pl-10 pr-9 py-3 font-medium text-sm text-slate-900 bg-white placeholder-slate-400"
                />
                {origin && (
                  <button
                    type="button"
                    onClick={() => setOrigin('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              {locationError && (
                <p role="alert" className="text-xs text-rose-600 mt-1.5 font-medium">{locationError}</p>
              )}

              {/* Suggestions Dropdown */}
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div role="listbox" className="absolute top-[100%] left-0 w-full bg-white border border-slate-200/90 rounded-xl shadow-xl mt-1.5 max-h-56 overflow-y-auto scrollbar-thin z-50 divide-y divide-slate-100 smooth-enter">
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
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#e6f8f7] flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span className="font-semibold text-slate-800 group-hover:text-[#009999] transition-colors">{s.name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        s.type.includes('Metro Station') 
                          ? 'bg-[#e6f8f7] text-[#009999] border border-[#99dedb]' 
                          : s.type.includes('Water') 
                            ? 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]' 
                            : 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                      }`}>
                        {s.type.replace('Kochi ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center pb-0.5">
              <button
                type="button"
                onClick={handleSwapStops}
                title="Swap origin and destination"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[#e6f8f7] hover:text-[#009999] text-slate-600 border border-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:rotate-180 cursor-pointer font-bold text-base shadow-2xs"
              >
                ⇄
              </button>
            </div>

            {/* Destination Input */}
            <div ref={destRef} className="relative text-left">
              <label htmlFor="destination-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-display mb-1.5">
                Destination Station / Jetty
              </label>
              <div className="relative group">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#22c55e] transition-transform duration-200 group-focus-within:scale-110" size={16} aria-hidden="true" />
                <input
                  id="destination-input"
                  type="text"
                  required
                  role="combobox"
                  aria-expanded={showDestDropdown && destSuggestions.length > 0}
                  placeholder="Destination station, jetty or stop..."
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
                  className="w-full transit-input pl-10 pr-9 py-3 font-medium text-sm text-slate-900 bg-white placeholder-slate-400"
                />
                {destination && (
                  <button
                    type="button"
                    onClick={() => setDestination('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div role="listbox" className="absolute top-[100%] left-0 w-full bg-white border border-slate-200/90 rounded-xl shadow-xl mt-1.5 max-h-56 overflow-y-auto scrollbar-thin z-50 divide-y divide-slate-100 smooth-enter">
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
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#e8f3f0] flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span className="font-semibold text-slate-800 group-hover:text-[#22c55e] transition-colors">{s.name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        s.type.includes('Metro Station') 
                          ? 'bg-[#e6f8f7] text-[#009999] border border-[#99dedb]' 
                          : s.type.includes('Water') 
                            ? 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]' 
                            : 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
                      }`}>
                        {s.type.replace('Kochi ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Trip Preferences (Sleek Pills) */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider font-display mb-2">
              Routing Preferences
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => toggleConstraint('speed')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  constraints.speed
                    ? 'bg-[#009999] text-white border-[#008080] shadow-sm shadow-teal-500/20 scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Activity size={14} /> Fastest Route
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('luggage')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  constraints.luggage
                    ? 'bg-[#15803d] text-white border-[#166534] shadow-sm shadow-green-600/20 scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Briefcase size={14} /> Luggage Friendly
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('scenic')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  constraints.scenic
                    ? 'bg-[#0284c7] text-white border-[#0369a1] shadow-sm shadow-sky-500/20 scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Compass size={14} /> Water Metro
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('lowCost')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                  constraints.lowCost
                    ? 'bg-slate-800 text-white border-slate-900 shadow-sm scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <TrendingDown size={14} /> Lowest Fare
              </button>
            </div>
          </div>

          {/* Plan Error Message */}
          {planError && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-left smooth-enter">
              <p className="font-semibold">{planError.message}</p>
              {planError.suggestions?.length > 0 && (
                <p className="mt-1 text-rose-600">
                  Available stops: {planError.suggestions.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Submit CTA Button (Kochi Metro Brand Pill Style) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-kmrl-primary text-sm uppercase tracking-wider font-display font-bold flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Calculating Optimal Multimodal Route...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={16} /> Plan Integrated Transit Journey
              </span>
            )}
          </button>
        </form>

        {/* Popular Route Shortcuts (Swipeable on Mobile) */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-left">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display block mb-2 sm:inline-block sm:mr-2.5 sm:mb-0">Frequent Routes:</span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestClick(s)}
                className="text-xs bg-slate-50 hover:bg-[#e6f8f7] border border-slate-200 hover:border-[#99dedb] text-slate-700 hover:text-[#009999] px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer font-medium inline-flex items-center gap-2 shrink-0 shadow-2xs"
              >
                <span>{s.label}</span>
                <span className="text-[10px] font-bold text-[#009999] bg-[#e6f8f7] px-2 py-0.5 rounded-full border border-[#99dedb]">{s.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches (Swipeable on Mobile) */}
        {recentTrips.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-left flex-wrap gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display shrink-0">Recent:</span>
              {recentTrips.slice(0, 3).map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => handleSuggestClick({ origin: trip.origin, destination: trip.destination })}
                  className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer font-medium shrink-0 active:scale-95"
                >
                  {trip.origin} ➔ {trip.destination}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
            >
              Clear
            </button>
          </div>
        )}

      </div>

      {/* Kochi Integrated Transit Infrastructure Showcase */}
      <div className="mt-12 text-left">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f8f7] text-[#009999] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            KMRL Transit Corridors
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">
            Integrated Mobility Infrastructure
          </h3>
          <p className="text-xs md:text-sm text-slate-500">
            Unified ticketing, real-time tracking, and green transport networks across Greater Kochi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Metro Card */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'Aluva', destination: 'Maharajas College' })}
            className="transit-card-interactive overflow-hidden flex flex-col group rounded-2xl"
          >
            <div className="relative h-40 bg-slate-100 overflow-hidden">
              <img 
                src="/images/kochi-metro.jpg" 
                alt="Kochi Metro Blue Line" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#009999] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-display shadow-sm">
                <Train size={11} /> 25 Stations
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display mb-1 group-hover:text-[#009999] transition-colors">
                  Kochi Metro Blue Line
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Aluva to Tripunithura spine. High-frequency elevated rapid transit with contactless ticketing.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#009999] pt-2.5 border-t border-slate-100">
                <span>Aluva ➔ Maharajas</span>
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Water Metro Card */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'High Court Jetty', destination: 'Fort Kochi Jetty' })}
            className="transit-card-interactive overflow-hidden flex flex-col group rounded-2xl"
          >
            <div className="relative h-40 bg-slate-100 overflow-hidden">
              <img 
                src="/images/kochi-water-metro.jpg" 
                alt="Kochi Water Metro Catamaran" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0284c7] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-display shadow-sm">
                <Ship size={11} /> 15 Jetties
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display mb-1 group-hover:text-[#0284c7] transition-colors">
                  Kochi Water Metro
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Electric hybrid catamarans connecting city islands and hubs across Vembanad backwaters.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#0284c7] pt-2.5 border-t border-slate-100">
                <span>High Court ➔ Fort Kochi</span>
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Feeder Bus Card */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'Kalamassery', destination: 'Infopark' })}
            className="transit-card-interactive overflow-hidden flex flex-col group rounded-2xl"
          >
            <div className="relative h-40 bg-slate-100 overflow-hidden">
              <img 
                src="/images/kochi-feeder-bus.jpg" 
                alt="Metro Feeder e-Bus" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#d97706] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-display shadow-sm">
                <Bus size={11} /> 18 Feeder Routes
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-display mb-1 group-hover:text-[#d97706] transition-colors">
                  Metro Feeder e-Buses
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Last-mile zero-emission connectivity to Infopark, SmartCity, and regional healthcare hubs.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#d97706] pt-2.5 border-t border-slate-100">
                <span>Kalamassery ➔ Infopark</span>
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Map & Stations Explorer Modal */}
      <NetworkMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectStation={handleSelectFromMap}
      />

    </div>
  );
}
