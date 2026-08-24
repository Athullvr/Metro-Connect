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
    <div className="min-h-screen bg-cream-bg text-gray-700 flex flex-col font-sans select-none relative">
      {/* Top Navbar */}
      <header className="glass bg-white/70 sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#eef0e5]">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-left"
          onClick={() => setScreen('home')}
          aria-label="Go to home screen"
        >
          <div className="w-8 h-8 rounded-xl bg-charcoal flex items-center justify-center text-white font-serif font-semibold text-sm" aria-hidden="true">
            N
          </div>
          <div>
            <h1 className="text-sm font-semibold text-charcoal tracking-tight flex items-center gap-1.5 font-sans m-0">
              Metro Connect <span className="text-water-text font-bold">Copilot</span>
              {/* Active Engine Status Indicator Dot */}
              <span
                className={`inline-block w-2 h-2 rounded-full ${useSimulator ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`}
                title={useSimulator ? 'Engine: Offline Simulator' : 'Engine: OpenAI Live'}
                role="status"
                aria-label={useSimulator ? 'Engine: Offline Simulator' : 'Engine: OpenAI Live'}
              ></span>
            </h1>
            <p className="text-[10px] text-gray-500">multimodal transit reasoning layer</p>
          </div>
        </button>


      </header>

      {/* Main Content Viewport */}
      <main className="flex-grow flex flex-col items-center justify-center">
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

      {/* Bottom Footer - Simplified & Elegant */}
      <footer className="py-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/40 border-t border-[#eef0e5]/50">
        <p>Metro Connect Copilot</p>
      </footer>
    </div>
  );
}
