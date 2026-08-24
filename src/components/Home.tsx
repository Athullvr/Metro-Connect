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
  LocateFixed
} from 'lucide-react';
import transitData from '../data.json';
import { detectNearestStation } from '../lib/geolocation.js';
import { getTrips, clearTrips } from '../lib/tripHistory.js';

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
            aria-label="Configure AI Agent API Settings"
            aria-expanded={showSettings}
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Engine Settings */}
        {showSettings && (
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 animate-fadeIn">
            <h3 className="text-xs font-bold text-charcoal mb-3 flex items-center gap-2">
              <Settings size={14} className="text-metro-text" /> Copilot Agent Configuration
            </h3>

            <div>
              <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase">Copilot Engine Mode</label>
              <div className="flex bg-gray-200/50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setUseSimulator(true)}
                  aria-pressed={useSimulator}
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
                  aria-pressed={!useSimulator}
                  className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    !useSimulator
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Wifi size={11} /> Live Copilot
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Live Copilot calls our server-side planning agent — no API key needed on your end.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inputs Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            
            {/* Origin Autocomplete Input */}
            <div ref={originRef} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="origin-input" className="block text-[10px] text-metro-text font-bold tracking-wider uppercase">Starting Station</label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="flex items-center gap-1 text-[9px] font-bold text-metro-text hover:text-charcoal transition-all cursor-pointer disabled:opacity-50"
                  title="Detect the nearest station from your current location"
                >
                  <LocateFixed size={11} className={locating ? 'animate-pulse' : ''} />
                  {locating ? 'Locating...' : 'Use my location'}
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-metro-text" size={16} aria-hidden="true" />
                <input
                  id="origin-input"
                  type="text"
                  required
                  role="combobox"
                  aria-expanded={showOriginDropdown && originSuggestions.length > 0}
                  aria-haspopup="listbox"
                  aria-controls="origin-listbox"
                  aria-autocomplete="list"
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
                  onKeyDown={(e) => handleDropdownKeyDown(e, () => setShowOriginDropdown(false))}
                  className="w-full bg-white border border-gray-200 focus:border-metro-border rounded-xl pl-11 pr-4 py-3.5 text-charcoal text-xs focus:outline-none transition-all"
                />
              </div>
              {locationError && (
                <p role="alert" className="text-[10px] text-red-500 mt-1">{locationError}</p>
              )}

              {/* Suggestions Dropdown overlay */}
              {showOriginDropdown && originSuggestions.length > 0 && (
                <div id="origin-listbox" role="listbox" aria-label="Starting station suggestions" className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto scrollbar-thin z-50">
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
                      className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-gray-50 focus:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 cursor-pointer"
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
              <label htmlFor="destination-input" className="block text-[10px] text-water-text font-bold tracking-wider uppercase mb-1.5">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-water-text" size={16} aria-hidden="true" />
                <input
                  id="destination-input"
                  type="text"
                  required
                  role="combobox"
                  aria-expanded={showDestDropdown && destSuggestions.length > 0}
                  aria-haspopup="listbox"
                  aria-controls="destination-listbox"
                  aria-autocomplete="list"
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
                  onKeyDown={(e) => handleDropdownKeyDown(e, () => setShowDestDropdown(false))}
                  className="w-full bg-white border border-gray-200 focus:border-water-border rounded-xl pl-11 pr-4 py-3.5 text-charcoal text-xs focus:outline-none transition-all"
                />
              </div>

              {/* Suggestions Dropdown overlay */}
              {showDestDropdown && destSuggestions.length > 0 && (
                <div id="destination-listbox" role="listbox" aria-label="Destination suggestions" className="absolute top-[100%] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto scrollbar-thin z-50">
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
                      className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-gray-50 focus:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 cursor-pointer"
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
                aria-pressed={constraints.speed}
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
                aria-pressed={constraints.luggage}
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
                aria-pressed={constraints.scenic}
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
                aria-pressed={constraints.lowCost}
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

          {/* Plan error banner */}
          {planError && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <p className="font-semibold">{planError.message}</p>
              {planError.suggestions?.length > 0 && (
                <p className="mt-1 text-red-600">
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
            className="w-full py-4 bg-charcoal hover:bg-black text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span role="status" aria-live="polite" className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
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

        {/* Recent Trips */}
        {recentTrips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Recent Trips:</span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {recentTrips.map((trip) => (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => handleSuggestClick({ origin: trip.origin, destination: trip.destination })}
                  className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-charcoal-light px-3 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  {trip.origin} ➔ {trip.destination}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
