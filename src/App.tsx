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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* Official KMRL Transit Header */}
      <header className="transit-header sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/80 shadow-xs">
        <button
          type="button"
          className="flex items-center gap-3.5 cursor-pointer text-left group transition-transform duration-200 hover:scale-[1.01]"
          onClick={() => setScreen('home')}
          aria-label="Go to journey planner"
        >
          {/* KMRL Chevron Emblem Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#009999] to-[#007A7A] flex items-center justify-center text-white font-bold text-xs tracking-tight font-display shadow-md shadow-teal-700/20 group-hover:shadow-teal-600/30 transition-all duration-300">
            <svg viewBox="-258 191.7 441.7 178.3" className="w-6 h-6 fill-white" aria-hidden="true">
              <path d="M-170.9,315.8c-15.5,15.3-31,30.7-46.5,46c-6.5,6.5-14.1,9.2-23.2,6.8c-9.6-2.6-16.4-11.3-16.4-21.4c-0.1-44.1-0.1-88.2,0-132.4c0-12.6,10-22.2,22.8-22.2c12.5,0,22.3,9.4,22.4,22c0.1,23.5,0.1,47,0.1,70.5c0,1.8,0,3.5,0,6.5c2.1-1.9,3.4-2.9,4.5-4c28.7-28.9,57.6-57.7,86.5-86.6c11.4-11.3,24.2-11.4,35.5-0.2c15,14.9,29.9,29.9,44.9,44.8c1.2,1.2,2.5,2.1,3.8,3.1c10.6,10.6,21.1,21.2,31.7,31.8c9.7,9.8,19.3,19.7,29,29.5c6.6,6.6,13.2,13.1,19.8,19.7c9.5,9.5,10,23.4,1,32.6c-9.3,9.5-23.2,9.5-33-0.2c-14.8-14.7-29.5-29.4-44.2-44.1c-1.7-1.7-3.8-3.2-5.6-4.8c-2.6-2.9-5.1-6-7.9-8.7c-7.9-7.7-15.9-15.3-23.8-23c-6.1-6.3-12.1-12.6-18.2-19c-4.9-5.1-9.6-10.4-13.8-14.8c-10.5,10-20,19-29.5,28.1c-0.7,0.6-1.3,1.3-2,1.9c-2,2-4,4-6.1,6.1c-8.8,8.8-17.6,17.6-26.4,26.4c-1.1,1.1-2.2,2.2-3.3,3.2C-169.3,314.2-170.1,315-170.9,315.8z" />
              <path d="M-4.8,280.6c-10.6-10.6-21.1-21.2-31.7-31.8c16.9-17,33.7-34.1,50.9-50.8c7.9-7.7,21.7-7.1,30,1c21.1,20.8,42,41.8,63,62.7c22.7,22.7,45.5,45.4,68.2,68.1c6.9,6.8,9.3,15,6.4,24.2c-2.9,8.8-9.4,14.1-18.6,15.3c-8,1.1-14.5-2-20.2-7.7c-21-21.1-42.1-42.2-63.2-63.2c-15.8-15.8-31.6-31.5-47.4-47.2c-1.1-1.1-2.5-2.1-4-3.3C17.2,258.9,6.2,269.7-4.8,280.6z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                KOCHI METRO
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e6f8f7] text-[#009999] border border-[#99dedb]">
                CONNECT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Rail • Water Metro • Feeder Network</p>
          </div>
        </button>

        {/* Center Navigation Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              screen === 'home' || screen === 'itinerary'
                ? 'bg-[#009999] text-white shadow-sm font-bold scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              screen === 'disruption'
                ? 'bg-[#dc2626] text-white shadow-sm font-bold scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Disruption Simulator
          </button>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/90 px-3 py-1.5 rounded-full text-xs shadow-2xs">
          <span
            className={`w-2 h-2 rounded-full ${useSimulator ? 'bg-amber-500 animate-pulse' : 'bg-[#22c55e]'}`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold text-slate-700">
            {useSimulator ? 'Offline Graph' : 'Live AI Engine'}
          </span>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-grow flex flex-col items-center justify-start relative z-10 w-full">
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

      {/* Bottom Footer (KMRL Multimodal Transit Branding) */}
      <footer className="py-6 px-4 text-center text-xs font-medium text-slate-500 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-display font-bold text-slate-800 text-sm">Kochi Metro Rail Limited (KMRL)</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Unified Multimodal Transport Network • Kerala, India</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-[#009999]">
            <span>Blue Line (25 Stations)</span>
            <span>•</span>
            <span>Water Metro (15 Jetties)</span>
            <span>•</span>
            <span>Feeder e-Buses</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
