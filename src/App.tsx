import React, { useState } from 'react';
import Home from './components/Home';
import Itinerary from './components/Itinerary';
import DisruptionSimulator from './components/DisruptionSimulator';
import { planRoute, replanRoute } from './services/openai';
import { saveTrip } from './lib/tripHistory.js';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'itinerary' | 'disruption'
  const [itinerary, setItinerary] = useState(null);
  const [reroutedItinerary, setReroutedItinerary] = useState(null);

  const [useSimulator, setUseSimulator] = useState(true);
  const [loading, setLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [replanError, setReplanError] = useState(null);

  const handlePlanRoute = async (src, dest, activeConstraints) => {
    setLoading(true);
    setPlanError(null);

    try {
      const plan = await planRoute(src, dest, activeConstraints, useSimulator);
      setItinerary(plan);
      setReroutedItinerary(null); // Clear any old reroutes
      setScreen('itinerary');
      saveTrip({ origin: src, destination: dest, constraints: activeConstraints, itinerary: plan, timestamp: Date.now() });
    } catch (err) {
      console.error(err);
      setPlanError({ message: err.message, suggestions: err.suggestions || [] });
    } finally {
      setLoading(false);
    }
  };

  const handleReplanRoute = async (disruptionText) => {
    setLoading(true);
    setReplanError(null);
    try {
      const replan = await replanRoute(itinerary, disruptionText, useSimulator);
      setReroutedItinerary(replan);
    } catch (err) {
      console.error(err);
      setReplanError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-800 flex flex-col font-sans select-none relative">
      {/* Atmospheric Ambient Glow Layer */}
      <div className="ambient-bg" aria-hidden="true" />

      {/* Top Navbar with Frosted Glass */}
      <header className="glass-header sticky top-0 z-50 px-5 md:px-8 py-3.5 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-left group transition-all"
          onClick={() => setScreen('home')}
          aria-label="Go to home screen"
        >
          {/* Kochi Transit Compass Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 via-teal-700 to-sky-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform" aria-hidden="true">
            MC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight font-display">
                Metro Connect
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Copilot
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Kochi Multimodal Transit Network</p>
          </div>
        </button>

        {/* Live Engine Status Badge */}
        <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-xs">
          <span
            className={`w-2 h-2 rounded-full ${useSimulator ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}
            aria-hidden="true"
          />
          <span className="text-[10px] font-semibold text-slate-600">
            {useSimulator ? 'Offline Simulator' : 'Live AI Engine'}
          </span>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10">
        {screen === 'home' && (
          <Home
            onPlan={handlePlanRoute}
            useSimulator={useSimulator}
            setUseSimulator={setUseSimulator}
            planError={planError}
          />
        )}

        {screen === 'itinerary' && (
          <Itinerary 
            itinerary={itinerary}
            onBack={() => setScreen('home')}
            onTriggerDisruptionSim={() => setScreen('disruption')}
          />
        )}

        {screen === 'disruption' && (
          <DisruptionSimulator
            itinerary={itinerary}
            reroutedItinerary={reroutedItinerary}
            onBack={() => setScreen('itinerary')}
            onReplan={handleReplanRoute}
            loading={loading}
            replanError={replanError}
            useSimulator={useSimulator}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="py-6 text-center text-[11px] font-medium text-slate-400 bg-white/40 border-t border-slate-200/60 backdrop-blur-xs relative z-10">
        <p>Kochi Metro Blue Line • Water Metro Routes • Feeder e-Buses</p>
      </footer>
    </div>
  );
}
