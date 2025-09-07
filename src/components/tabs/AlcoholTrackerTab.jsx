import { useState, useEffect } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import { 
  loadCalculatorValues, 
  updateCalculatorValues, 
  getHoursSinceDrinkingStarted,
  updateCumulativeShotsFromMatches
} from '../../utils/alcoholCalculatorPersistence';

export default function AlcoholTrackerTab({ onNavigate }) { // eslint-disable-line no-unused-vars
  const [calculatorValues, setCalculatorValues] = useState({
    playerWeight: 70,
    playerGender: 'male',
    mode: 'automatic',
    aekGoals: 0,
    realGoals: 0,
    beerCount: {
      aek: 0,
      real: 0
    },
    // Individual tracking for Alexander and Philip
    alexanderShots: {
      cl40: 0, // 2cl shots at 40% alcohol
      cl20: 0  // 2cl shots at 20% alcohol
    },
    philipShots: {
      cl40: 0, // 2cl shots at 40% alcohol
      cl20: 0  // 2cl shots at 20% alcohol
    }
  });
  
  const { data: matches, loading } = useSupabaseQuery(
    'matches',
    '*',
    { order: { column: 'date', ascending: false } }
  );

  // Load saved values on component mount
  useEffect(() => {
    const savedValues = loadCalculatorValues();
    setCalculatorValues(prev => ({ ...prev, ...savedValues }));
    
    // Update cumulative shots from all matches
    if (matches) {
      updateCumulativeShotsFromMatches(matches);
    }
  }, [matches]);

  const handleValueChange = (key, value) => {
    const newValues = { ...calculatorValues, [key]: value };
    setCalculatorValues(newValues);
    updateCalculatorValues({ [key]: value }, calculatorValues);
  };

  // Function to add shots for specific person
  const addShotForPerson = (person, shotType) => {
    const newValues = { ...calculatorValues };
    newValues[`${person}Shots`][shotType] += 1;
    setCalculatorValues(newValues);
    updateCalculatorValues({ [`${person}Shots`]: newValues[`${person}Shots`] }, calculatorValues);
  };

  // Function to calculate individual alcohol consumption
  const calculatePersonAlcohol = (personShots) => {
    // 2cl at 40% = 2 * 0.4 = 0.8cl pure alcohol
    // 2cl at 20% = 2 * 0.2 = 0.4cl pure alcohol
    const alcohol40 = personShots.cl40 * 2 * 0.4;
    const alcohol20 = personShots.cl20 * 2 * 0.2;
    return alcohol40 + alcohol20;
  };

  // Helper function to get recent matches (last two days)
  const getRecentMatches = () => {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 2);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    yesterday.setHours(0, 0, 0, 0);
    
    return matches?.filter(match => {
      const matchDate = new Date(match.date);
      const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      return matchDateOnly >= yesterday && matchDateOnly <= today;
    }) || [];
  };

  // Helper functions for automatic calculation of team-specific alcohol
  const getAutomaticAekDrinks = () => {
    if (calculatorValues.mode === 'automatic') {
      const recentMatches = getRecentMatches();
      const realGoals = recentMatches.reduce((total, match) => total + (match.goalsb || 0), 0);
      return Math.floor(realGoals / 2) * 2;
    }
    return 0;
  };

  const getAutomaticRealDrinks = () => {
    if (calculatorValues.mode === 'automatic') {
      const recentMatches = getRecentMatches();
      const aekGoals = recentMatches.reduce((total, match) => total + (match.goalsa || 0), 0);
      return Math.floor(aekGoals / 2) * 2;
    }
    return 0;
  };

  const getTotalAlcoholCl = () => {
    if (calculatorValues.mode === 'automatic') {
      return getAutomaticAekDrinks() + getAutomaticRealDrinks();
    } else {
      return Math.floor((calculatorValues.aekGoals + calculatorValues.realGoals) / 2) * 2;
    }
  };

  // Blood Alcohol Content calculation using Widmark formula with time decay
  const calculateBloodAlcohol = (alcoholCl, playerData, drinkingTime = null, beerCount = 0) => {
    if (!playerData.weight || (alcoholCl === 0 && beerCount === 0)) return '0.00';
    
    // Convert cl of 40% alcohol to grams of pure alcohol
    // 1cl = 10ml, 40% alcohol content, density of ethanol = 0.789g/ml
    let alcoholGrams = (alcoholCl * 10) * 0.4 * 0.789;
    
    // Add beer alcohol: 0.5L beer = 500ml * 0.05 (5%) = 25ml pure alcohol, density 0.789g/ml
    alcoholGrams += (beerCount * 0.5 * 1000 * 0.05 * 0.789); // Already in grams
    
    // Widmark factors (standard clinical values)
    const r = playerData.gender === 'female' ? 0.60 : 0.70;
    
    // Widmark formula: BAC = A / (r × m) where A=alcohol in grams, r=distribution factor, m=weight in kg
    let bac = alcoholGrams / (r * playerData.weight);
    
    // Time-based alcohol elimination (0.15 promille per hour)
    if (drinkingTime) {
      const hoursElapsed = getHoursSinceDrinkingStarted(drinkingTime);
      const eliminatedBac = hoursElapsed * 0.15;
      bac = Math.max(0, bac - eliminatedBac);
    }
    
    return bac.toFixed(2);
  };

  if (loading) {
    return <LoadingSpinner message="Lade Alkohol-Tracker..." />;
  }

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          🍺 Alkohol-Tracker
        </h2>
        <p className="text-text-muted">
          Verfolgen Sie den Alkoholkonsum basierend auf den Spielregeln: Für jedes zweite Tor muss der Gegner 2cl Schnaps (40%) trinken.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="modern-card mb-6">
        <h3 className="font-bold text-lg mb-4">📱 Modus</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              value="automatic"
              checked={calculatorValues.mode === 'automatic'}
              onChange={(e) => handleValueChange('mode', e.target.value)}
              className="w-4 h-4 text-primary-green"
            />
            <div>
              <div className="font-medium text-text-primary">🤖 Automatisch</div>
              <div className="text-sm text-text-muted">Berechnung basierend auf Spielen der letzten 2 Tage</div>
            </div>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              value="manual"
              checked={calculatorValues.mode === 'manual'}
              onChange={(e) => handleValueChange('mode', e.target.value)}
              className="w-4 h-4 text-primary-green"
            />
            <div>
              <div className="font-medium text-text-primary">✋ Manuell</div>
              <div className="text-sm text-text-muted">Manuelle Eingabe der Tor-Anzahl</div>
            </div>
          </label>
        </div>
      </div>

      {/* Goal Input (Manual Mode) */}
      {calculatorValues.mode === 'manual' && (
        <div className="modern-card mb-6">
          <h3 className="font-bold text-lg mb-4">⚽ Tore eingeben</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">🔵 AEK Tore</label>
              <input
                type="number"
                min="0"
                value={calculatorValues.aekGoals}
                onChange={(e) => handleValueChange('aekGoals', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">🔴 Real Tore</label>
              <input
                type="number"
                min="0"
                value={calculatorValues.realGoals}
                onChange={(e) => handleValueChange('realGoals', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        </div>
      )}

      {/* Alcohol Calculation */}
      <div className="modern-card mb-6">
        <h3 className="font-bold text-lg mb-4">🥃 Alkohol-Berechnung</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-l-4 border-blue-400 pl-4">
            <h4 className="font-semibold text-blue-600 mb-2">🔵 AEK muss trinken</h4>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {getAutomaticAekDrinks()}cl
            </div>
            <div className="text-sm text-text-muted">
              Durch Real-Tore verursacht ({calculatorValues.mode === 'automatic' 
                ? getRecentMatches().reduce((total, match) => total + (match.goalsb || 0), 0) 
                : calculatorValues.realGoals} Tore)
            </div>
          </div>
          
          <div className="border-l-4 border-red-400 pl-4">
            <h4 className="font-semibold text-red-600 mb-2">🔴 Real muss trinken</h4>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {getAutomaticRealDrinks()}cl
            </div>
            <div className="text-sm text-text-muted">
              Durch AEK-Tore verursacht ({calculatorValues.mode === 'automatic' 
                ? getRecentMatches().reduce((total, match) => total + (match.goalsa || 0), 0) 
                : calculatorValues.aekGoals} Tore)
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-text-primary">
              Gesamt: {getTotalAlcoholCl()}cl Schnaps
            </div>
            <div className="text-sm text-text-muted">
              Das entspricht {Math.floor(getTotalAlcoholCl() / 2)} Shots à 2cl
            </div>
          </div>
        </div>
      </div>

      {/* Individual Schnaps Tracking for Alexander and Philip */}
      <div className="modern-card mb-6">
        <h3 className="font-bold text-lg mb-4">👨‍🍻 Individuelle Schnaps-Tracker</h3>
        
        {/* Alexander Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-700 mb-3">🔵 Alexander</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <button
              onClick={() => addShotForPerson('alexander', 'cl40')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              + 2cl (40%)
            </button>
            <button
              onClick={() => addShotForPerson('alexander', 'cl20')}
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              + 2cl (20%)
            </button>
          </div>
          <div className="text-sm text-blue-700">
            <div>40% Shots: {calculatorValues.alexanderShots.cl40} × 2cl</div>
            <div>20% Shots: {calculatorValues.alexanderShots.cl20} × 2cl</div>
            <div className="font-semibold mt-1">
              Gesamt: {calculatePersonAlcohol(calculatorValues.alexanderShots).toFixed(1)}cl reiner Alkohol
            </div>
          </div>
        </div>

        {/* Philip Section */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-700 mb-3">🟢 Philip</h4>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <button
              onClick={() => addShotForPerson('philip', 'cl40')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              + 2cl (40%)
            </button>
            <button
              onClick={() => addShotForPerson('philip', 'cl20')}
              className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              + 2cl (20%)
            </button>
          </div>
          <div className="text-sm text-green-700">
            <div>40% Shots: {calculatorValues.philipShots.cl40} × 2cl</div>
            <div>20% Shots: {calculatorValues.philipShots.cl20} × 2cl</div>
            <div className="font-semibold mt-1">
              Gesamt: {calculatePersonAlcohol(calculatorValues.philipShots).toFixed(1)}cl reiner Alkohol
            </div>
          </div>
        </div>
      </div>

      {/* BAC Calculator */}
      <div className="modern-card">
        <h3 className="font-bold text-lg mb-4">🩸 Blutalkohol-Rechner (BAK)</h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Körpergewicht (kg)</label>
            <input
              type="number"
              min="40"
              max="200"
              value={calculatorValues.playerWeight}
              onChange={(e) => handleValueChange('playerWeight', parseInt(e.target.value) || 70)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Geschlecht</label>
            <select
              value={calculatorValues.playerGender}
              onChange={(e) => handleValueChange('playerGender', e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-primary mb-2">Zusätzliche Biere (0,5L)</label>
          <input
            type="number"
            min="0"
            value={(calculatorValues.beerCount?.aek || 0) + (calculatorValues.beerCount?.real || 0)}
            onChange={(e) => {
              const totalBeers = parseInt(e.target.value) || 0;
              const halfBeers = Math.floor(totalBeers / 2);
              const remainder = totalBeers % 2;
              handleValueChange('beerCount', {
                aek: halfBeers + remainder,
                real: halfBeers
              });
            }}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-red-50 to-yellow-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {calculateBloodAlcohol(
                getTotalAlcoholCl(), 
                { weight: calculatorValues.playerWeight, gender: calculatorValues.playerGender },
                null,
                (calculatorValues.beerCount?.aek || 0) + (calculatorValues.beerCount?.real || 0)
              )}‰
            </div>
            <div className="text-sm text-red-700 font-medium">
              Geschätzte Blutalkoholkonzentration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}