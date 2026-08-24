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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-10">
      
      {/* Official KMRL Transit Header / Hero */}
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E6F6F5] border border-[#99DEDB] text-[#007E7A] text-xs font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-[#00A19C]" />
          KMRL Integrated Mobility Network
        </div>
        <h1 className="font-display font-bold text-2xl md:text-4xl text-slate-900 tracking-tight mb-2">
          Kochi Multimodal Journey Planner
        </h1>
        <p className="text-slate-600 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
          Integrated schedule and routing across Kochi Metro Blue Line, Water Metro ferries, and electric feeder buses.
        </p>
      </div>

      {/* Main Search Planner Card */}
      <div className="transit-card p-5 md:p-7 relative bg-white">
        
        {/* Card Header Actions (Stations Explorer + Settings) */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A19C]" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-800">
              Trip Coordinator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E8F3F0] hover:bg-[#D5EAE4] text-[#134439] text-xs font-bold border border-[#A3CCBE] transition-colors cursor-pointer"
              title="Open full network station explorer"
            >
              <Compass size={13} /> Stations Explorer
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 cursor-pointer"
              title="Configure Engine Settings"
              aria-label="Configure Engine Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Engine Settings Drawer */}
        {showSettings && (
          <div className="mb-5 p-4 rounded-lg bg-slate-50 border border-slate-200 text-left">
            <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5 font-display">
              <Settings size={13} className="text-[#007E7A]" /> Router Engine Settings
            </h3>
            <div className="flex bg-slate-200 p-1 rounded-md max-w-sm">
              <button
                type="button"
                onClick={() => setUseSimulator(true)}
                className={`flex-1 py-1 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  useSimulator ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                <WifiOff size={12} /> Offline Graph
              </button>
              <button
                type="button"
                onClick={() => setUseSimulator(false)}
                className={`flex-1 py-1 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                  !useSimulator ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                <Wifi size={12} /> Live AI Proxy
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inputs Row with Center Swap Button */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-end">
            
            {/* Origin Input */}
            <div ref={originRef} className="relative text-left">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="origin-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-display">
                  Origin Station / Jetty
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[#007E7A] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <LocateFixed size={11} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'Locating...' : 'Use GPS'}
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00A19C]" size={15} aria-hidden="true" />
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
                  className="w-full transit-input pl-9 pr-8 py-2.5 font-medium"
                />
                {origin && (
                  <button
                    type="button"
                    onClick={() => setOrigin('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
              {locationError && (
                <p role="alert" className="text-[10px] text-rose-600 mt-1 font-medium">{locationError}</p>
              )}

              {/* Suggestions Dropdown */}
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div role="listbox" className="absolute top-[100%] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto scrollbar-thin z-50 divide-y divide-slate-100">
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
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#E6F6F5] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        s.type.includes('Metro Station') 
                          ? 'bg-[#E6F6F5] text-[#007E7A] border border-[#99DEDB]' 
                          : s.type.includes('Water') 
                            ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]' 
                            : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
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
                className="w-9 h-9 rounded-md bg-slate-100 hover:bg-[#E6F6F5] hover:text-[#007E7A] text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer font-bold text-sm"
              >
                ⇄
              </button>
            </div>

            {/* Destination Input */}
            <div ref={destRef} className="relative text-left">
              <label htmlFor="destination-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider font-display mb-1">
                Destination Station / Jetty
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B5E4F]" size={15} aria-hidden="true" />
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
                  className="w-full transit-input pl-9 pr-8 py-2.5 font-medium"
                />
                {destination && (
                  <button
                    type="button"
                    onClick={() => setDestination('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div role="listbox" className="absolute top-[100%] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto scrollbar-thin z-50 divide-y divide-slate-100">
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
                      className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#E8F3F0] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        s.type.includes('Metro Station') 
                          ? 'bg-[#E6F6F5] text-[#007E7A] border border-[#99DEDB]' 
                          : s.type.includes('Water') 
                            ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]' 
                            : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                      }`}>
                        {s.type.replace('Kochi ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Trip Preferences (Solid Badges) */}
          <div className="text-left">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider font-display mb-1.5">
              Routing Criteria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => toggleConstraint('speed')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  constraints.speed
                    ? 'bg-[#00A19C] text-white border-[#008F8A]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Activity size={13} /> Fastest Route
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('luggage')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  constraints.luggage
                    ? 'bg-[#1B5E4F] text-white border-[#14493D]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Briefcase size={13} /> Luggage Friendly
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('scenic')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  constraints.scenic
                    ? 'bg-[#0284C7] text-white border-[#0369A1]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Compass size={13} /> Water Metro
              </button>
              <button
                type="button"
                onClick={() => toggleConstraint('lowCost')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  constraints.lowCost
                    ? 'bg-slate-800 text-white border-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TrendingDown size={13} /> Lowest Fare
              </button>
            </div>
          </div>

          {/* Plan Error Message */}
          {planError && (
            <div role="alert" className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 text-left">
              <p className="font-semibold">{planError.message}</p>
              {planError.suggestions?.length > 0 && (
                <p className="mt-1 text-rose-600">
                  Available stops: {planError.suggestions.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-kmrl-primary text-xs uppercase tracking-wider font-display font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Calculating Optimal Multimodal Route...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Search size={14} /> Plan Integrated Transit Route
              </span>
            )}
          </button>
        </form>

        {/* Popular Route Shortcuts */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display">Frequent Routes:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestClick(s)}
              className="text-xs bg-slate-50 hover:bg-[#E6F6F5] border border-slate-200 hover:border-[#99DEDB] text-slate-700 hover:text-[#007E7A] px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium inline-flex items-center gap-1.5"
            >
              <span>{s.label}</span>
              <span className="text-[9px] font-bold text-[#007E7A] bg-[#E6F6F5] px-1.5 py-0.5 rounded border border-[#99DEDB]">{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {recentTrips.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-left flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-display">Recent:</span>
              {recentTrips.slice(0, 3).map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => handleSuggestClick({ origin: trip.origin, destination: trip.destination })}
                  className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer font-medium"
                >
                  {trip.origin} ➔ {trip.destination}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

      </div>

      {/* Kochi Integrated Transit Infrastructure Showcase */}
      <div className="mt-10 text-left">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
            KMRL Integrated Infrastructure
          </h3>
          <p className="text-xs text-slate-500">
            Official operational corridors under the unified Kochi transit framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metro Card */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'Aluva', destination: 'Maharajas College' })}
            className="transit-card-interactive overflow-hidden flex flex-col cursor-pointer"
          >
            <div className="relative h-36 bg-slate-100 overflow-hidden">
              <img 
                src="/images/kochi-metro.jpg" 
                alt="Kochi Metro Blue Line" 
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#00A19C] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 font-display">
                <Train size={10} /> 25 Stations
              </span>
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-display mb-1">
                  Kochi Metro Blue Line
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal mb-2">
                  Aluva to Tripunithura spine. High-frequency elevated rapid transit.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#007E7A] pt-2 border-t border-slate-100">
                <span>Aluva ➔ Maharajas</span>
                <ArrowRight size={11} />
              </div>
            </div>
          </div>

          {/* Water Metro Card */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'High Court Jetty', destination: 'Fort Kochi Jetty' })}
            className="transit-card-interactive overflow-hidden flex flex-col cursor-pointer"
          >
            <div className="relative h-36 bg-slate-100 overflow-hidden">
              <img 
                src="/images/kochi-water-metro.jpg" 
                alt="Kochi Water Metro Catamaran" 
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0284C7] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 font-display">
                <Ship size={10} /> 15 Jetties
              </span>
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-display mb-1">
                  Kochi Water Metro
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal mb-2">
                  Electric hybrid catamarans connecting city hubs across Vembanad backwaters.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#0284C7] pt-2 border-t border-slate-100">
                <span>High Court ➔ Fort Kochi</span>
                <ArrowRight size={11} />
              </div>
            </div>
          </div>

          {/* Feeder Bus Card */}
          <div 
            onClick={() => handleSuggestClick({ origin: 'Kalamassery', destination: 'Infopark' })}
            className="transit-card-interactive overflow-hidden flex flex-col cursor-pointer"
          >
            <div className="relative h-36 bg-slate-100 overflow-hidden">
              <img 
                src="/images/kochi-feeder-bus.jpg" 
                alt="Metro Feeder e-Bus" 
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#D97706] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 font-display">
                <Bus size={10} /> 18 Feeder Routes
              </span>
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-display mb-1">
                  Metro Feeder e-Buses
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal mb-2">
                  Last-mile connectivity to Infopark, SmartCity, and regional healthcare hubs.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#D97706] pt-2 border-t border-slate-100">
                <span>Kalamassery ➔ Infopark</span>
                <ArrowRight size={11} />
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
