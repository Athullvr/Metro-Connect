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
      setReroutedItinerary(null);
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

  const handleAcceptReroute = (newPlan) => {
    setItinerary(newPlan);
    setReroutedItinerary(null);
    setScreen('itinerary');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans select-none">
      
      {/* Official KMRL Transit Header */}
      <header className="transit-header sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between border-b border-slate-200">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-left group"
          onClick={() => setScreen('home')}
          aria-label="Go to journey planner"
        >
          {/* KMRL Aquamarine Badge Logo */}
          <div className="w-8 h-8 rounded-lg bg-[#00A19C] flex items-center justify-center text-white font-bold text-xs tracking-tight font-display shadow-xs" aria-hidden="true">
            MC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight font-display">
                Metro Connect
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E6F6F5] text-[#007E7A] border border-[#99DEDB]">
                KMRL Network
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Kochi Rail • Water Metro • Feeder</p>
          </div>
        </button>

        {/* Center Navigation Tabs (Citymapper / Transit Signage Style) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              screen === 'home' || screen === 'itinerary'
                ? 'bg-white text-[#007E7A] shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Journey Planner
          </button>
          <button
            type="button"
            onClick={() => {
              if (!itinerary) {
                handlePlanRoute('Aluva', 'Fort Kochi', { speed: true }).then(() => {
                  setScreen('disruption');
                });
              } else {
                setScreen('disruption');
              }
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              screen === 'disruption'
                ? 'bg-[#DC2626] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disruption Simulator
          </button>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
          <span
            className={`w-2 h-2 rounded-full ${useSimulator ? 'bg-amber-500' : 'bg-emerald-600'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-medium text-slate-600">
            {useSimulator ? 'Simulator' : 'Live Engine'}
          </span>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-grow flex flex-col items-center justify-start relative z-10">
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
            onAcceptReroute={handleAcceptReroute}
            loading={loading}
            replanError={replanError}
            useSimulator={useSimulator}
          />
        )}
      </main>

      {/* Bottom Footer (Clean Official Transit Footer) */}
      <footer className="py-5 text-center text-[11px] font-medium text-slate-500 bg-white border-t border-slate-200">
        <p className="font-display font-semibold text-slate-700">Kochi Metro Rail Limited (KMRL) Multimodal Integrated Network</p>
        <p className="text-slate-400 mt-0.5">Blue Line (25 Stations) • Water Metro (15 Jetties) • KSRTC Feeder e-Buses</p>
      </footer>
    </div>
  );
}
