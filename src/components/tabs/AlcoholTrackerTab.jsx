import { useState, useEffect } from 'react';
import AlcoholProgressionGraph from '../AlcoholProgressionGraph.jsx';

export default function AlcoholTrackerTab({ onNavigate }) { // eslint-disable-line no-unused-vars
  // Sub-navigation state
  const [activeSection, setActiveSection] = useState('alcohol');
  
  // Load manager data from localStorage (set via TeamSettingsTab)
  const [managers, setManagers] = useState({
    aek: { name: 'Alexander', age: 30, weight: 110 },
    real: { name: 'Philip', age: 30, weight: 105 }
  });
  
  const [beerConsumption, setBeerConsumption] = useState({
    alexander: 0,
    philip: 0
  });

  const [shotConsumption, setShotConsumption] = useState({
    alexander: { shots20: 0, shots40: 0 },
    philip: { shots20: 0, shots40: 0 }
  });

  const [drinkingStartTime, setDrinkingStartTime] = useState(null);

  // Blackjack game state
  const [blackjackGames, setBlackjackGames] = useState({
    alexander: { wins: 0, losses: 0, totalEarnings: 0 },
    philip: { wins: 0, losses: 0, totalEarnings: 0 },
    gameHistory: []
  });

  // Load saved values on component mount
  useEffect(() => {
    // Load manager settings
    const savedManagers = localStorage.getItem('teamManagers');
    if (savedManagers) {
      try {
        setManagers(JSON.parse(savedManagers));
      } catch (e) {
        console.error('Error loading manager settings:', e);
      }
    }

    // Load beer consumption
    const savedBeer = localStorage.getItem('beerConsumption');
    if (savedBeer) {
      try {
        setBeerConsumption(JSON.parse(savedBeer));
      } catch (e) {
        console.error('Error loading beer consumption:', e);
      }
    }

    // Load shot consumption
    const savedShots = localStorage.getItem('shotConsumption');
    if (savedShots) {
      try {
        setShotConsumption(JSON.parse(savedShots));
      } catch (e) {
        console.error('Error loading shot consumption:', e);
      }
    }

    // Load drinking start time
    const savedStartTime = localStorage.getItem('drinkingStartTime');
    if (savedStartTime) {
      setDrinkingStartTime(savedStartTime);
    }

    // Load blackjack game data
    const savedBlackjack = localStorage.getItem('blackjackGames');
    if (savedBlackjack) {
      try {
        setBlackjackGames(JSON.parse(savedBlackjack));
      } catch (e) {
        console.error('Error loading blackjack data:', e);
      }
    }

    // Listen for manager settings changes
    const handleManagerChange = () => {
      const savedManagers = localStorage.getItem('teamManagers');
      if (savedManagers) {
        try {
          setManagers(JSON.parse(savedManagers));
        } catch (e) {
          console.error('Error loading manager settings:', e);
        }
      }
    };

    window.addEventListener('managerSettingsChanged', handleManagerChange);
    return () => window.removeEventListener('managerSettingsChanged', handleManagerChange);
  }, []);

  // Save data to localStorage
  const saveBeerConsumption = (newConsumption) => {
    setBeerConsumption(newConsumption);
    localStorage.setItem('beerConsumption', JSON.stringify(newConsumption));
  };

  const saveShotConsumption = (newConsumption) => {
    setShotConsumption(newConsumption);
    localStorage.setItem('shotConsumption', JSON.stringify(newConsumption));
  };

  const addBeer = (person) => {
    const newConsumption = {
      ...beerConsumption,
      [person]: beerConsumption[person] + 1
    };
    saveBeerConsumption(newConsumption);
    
    // Set drinking start time if not already set
    if (!drinkingStartTime) {
      const startTime = new Date().toISOString();
      setDrinkingStartTime(startTime);
      localStorage.setItem('drinkingStartTime', startTime);
    }
  };

  const addBeerToBoth = () => {
    const newConsumption = {
      alexander: beerConsumption.alexander + 1,
      philip: beerConsumption.philip + 1
    };
    saveBeerConsumption(newConsumption);
    
    // Set drinking start time if not already set
    if (!drinkingStartTime) {
      const startTime = new Date().toISOString();
      setDrinkingStartTime(startTime);
      localStorage.setItem('drinkingStartTime', startTime);
    }
  };

  const addShot = (person, alcoholPercent) => {
    const shotType = alcoholPercent === 40 ? 'shots40' : 'shots20';
    const newConsumption = {
      ...shotConsumption,
      [person]: {
        ...shotConsumption[person],
        [shotType]: shotConsumption[person][shotType] + 1
      }
    };
    saveShotConsumption(newConsumption);
    
    // Set drinking start time if not already set
    if (!drinkingStartTime) {
      const startTime = new Date().toISOString();
      setDrinkingStartTime(startTime);
      localStorage.setItem('drinkingStartTime', startTime);
    }
  };

  const resetConsumption = () => {
    saveBeerConsumption({ alexander: 0, philip: 0 });
    saveShotConsumption({
      alexander: { shots20: 0, shots40: 0 },
      philip: { shots20: 0, shots40: 0 }
    });
    setDrinkingStartTime(null);
    localStorage.removeItem('drinkingStartTime');
  };

  // Blood Alcohol Content calculation using Widmark formula with time decay
  const calculateBloodAlcohol = (beerCount, shots, playerData, drinkingTime = null) => {
    if (!playerData.weight || (beerCount === 0 && (!shots || (shots.shots20 === 0 && shots.shots40 === 0)))) return '0.00';
    
    // Beer alcohol calculation: 0.5L beer = 500ml * 0.05 (5%) = 25ml pure alcohol
    // Density of ethanol = 0.789g/ml, so 25ml = 19.725g pure alcohol per beer
    const beerAlcoholGrams = beerCount * 25 * 0.789;
    
    // Shot alcohol calculation: 2cl shot = 20ml
    // 20% shot: 20ml * 0.20 * 0.789g/ml = 3.156g pure alcohol
    // 40% shot: 20ml * 0.40 * 0.789g/ml = 6.312g pure alcohol
    let shotAlcoholGrams = 0;
    if (shots) {
      shotAlcoholGrams = (shots.shots20 * 20 * 0.20 * 0.789) + (shots.shots40 * 20 * 0.40 * 0.789);
    }
    
    const totalAlcoholGrams = beerAlcoholGrams + shotAlcoholGrams;
    
    // Widmark factors (standard clinical values)
    const r = playerData.gender === 'male' ? 0.70 : 0.60;
    
    // Widmark formula: BAC = A / (r × m) where A=alcohol in grams, r=distribution factor, m=weight in kg
    let bac = totalAlcoholGrams / (r * playerData.weight);
    
    // Time-based alcohol elimination (0.15 promille per hour)
    if (drinkingTime) {
      const now = new Date();
      const startTime = new Date(drinkingTime);
      const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
      const eliminatedBac = hoursElapsed * 0.15;
      bac = Math.max(0, bac - eliminatedBac);
    }
    
    return bac.toFixed(2);
  };

  // Calculate when person will be sober again (BAC = 0)
  const calculateSoberTime = (beerCount, shots, playerData, drinkingTime) => {
    if (!playerData.weight || (beerCount === 0 && (!shots || (shots.shots20 === 0 && shots.shots40 === 0)))) return null;
    if (!drinkingTime) return null;
    
    // Calculate total alcohol without time decay
    const beerAlcoholGrams = beerCount * 25 * 0.789;
    let shotAlcoholGrams = 0;
    if (shots) {
      shotAlcoholGrams = (shots.shots20 * 20 * 0.20 * 0.789) + (shots.shots40 * 20 * 0.40 * 0.789);
    }
    const totalAlcoholGrams = beerAlcoholGrams + shotAlcoholGrams;
    
    const r = playerData.gender === 'male' ? 0.70 : 0.60;
    const maxBac = totalAlcoholGrams / (r * playerData.weight);
    
    // Hours needed to eliminate all alcohol (0.15‰ per hour)
    const hoursToSober = maxBac / 0.15;
    
    // Calculate sober time
    const startTime = new Date(drinkingTime);
    const soberTime = new Date(startTime.getTime() + (hoursToSober * 60 * 60 * 1000));
    
    return soberTime;
  };

  // Simple BAC visualization component
  const BACChart = ({ bac, name }) => {
    const bacValue = parseFloat(bac);
    const maxDisplay = 2.0; // Maximum BAC to display on chart
    const percentage = Math.min((bacValue / maxDisplay) * 100, 100);
    
    const getColorClass = (bac) => {
      if (bac >= 1.0) return 'bg-red-500';
      if (bac >= 0.5) return 'bg-orange-500';
      if (bac >= 0.3) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>0‰</span>
          <span>{name} BAC</span>
          <span>2‰</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 relative">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${getColorClass(bacValue)}`}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {bac}‰
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Nüchtern</span>
          <span>Betrunken</span>
        </div>
      </div>
    );
  };

  const getTimeSinceDrinking = () => {
    if (!drinkingStartTime) return null;
    
    const now = new Date();
    const startTime = new Date(drinkingStartTime);
    const hoursElapsed = (now - startTime) / (1000 * 60 * 60);
    
    if (hoursElapsed < 1) {
      const minutes = Math.floor(hoursElapsed * 60);
      return `${minutes} Minuten`;
    } else {
      return `${hoursElapsed.toFixed(1)} Stunden`;
    }
  };

  // Blackjack game functions
  const saveBlackjackData = (newData) => {
    setBlackjackGames(newData);
    localStorage.setItem('blackjackGames', JSON.stringify(newData));
  };

  const recordBlackjackGame = (winner, gameType, earnings) => {
    const loser = winner === 'alexander' ? 'philip' : 'alexander';
    const timestamp = new Date().toISOString();
    
    const newGameData = {
      ...blackjackGames,
      [winner]: {
        ...blackjackGames[winner],
        wins: blackjackGames[winner].wins + 1,
        totalEarnings: blackjackGames[winner].totalEarnings + earnings
      },
      [loser]: {
        ...blackjackGames[loser],
        losses: blackjackGames[loser].losses + 1,
        totalEarnings: blackjackGames[loser].totalEarnings - earnings
      },
      gameHistory: [
        ...blackjackGames.gameHistory,
        {
          id: Date.now(),
          timestamp,
          winner,
          loser,
          gameType,
          earnings,
          dateText: new Date().toLocaleString('de-DE')
        }
      ].slice(-20) // Keep only last 20 games
    };
    
    saveBlackjackData(newGameData);
  };

  const resetBlackjackData = () => {
    const resetData = {
      alexander: { wins: 0, losses: 0, totalEarnings: 0 },
      philip: { wins: 0, losses: 0, totalEarnings: 0 },
      gameHistory: []
    };
    saveBlackjackData(resetData);
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          🍺🃏 Alkohol & Blackjack Tracker
        </h2>
        <p className="text-text-muted">
          Alexander vs Philip - Getränke und Kartenspiele verfolgen
        </p>
      </div>

      {/* Sub-Navigation */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('alcohol')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeSection === 'alcohol'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🍺 Alkohol-Tracker
          </button>
          <button
            onClick={() => setActiveSection('blackjack')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeSection === 'blackjack'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🃏 Blackjack-Tracker
          </button>
        </div>
      </div>

      {/* Alcohol Section */}
      {activeSection === 'alcohol' && (
        <>
          {drinkingStartTime && (
            <div className="mb-4 text-sm text-text-muted">
              📅 Trinken gestartet vor: {getTimeSinceDrinking()}
            </div>
          )}

      {/* Quick Actions */}
      <div className="modern-card mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Schnell-Aktionen
          </span>
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={addBeerToBoth}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-4 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🍻</span>
            <span>Beiden ein Bier hinzufügen</span>
          </button>
          <button
            onClick={resetConsumption}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔄</span>
            <span>Zurücksetzen</span>
          </button>
        </div>
      </div>

      {/* Individual Beer Tracking */}
      <div className="space-y-6">
        {/* Alexander Section */}
        <div className="modern-card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-blue-700 flex items-center gap-2">
              <span className="text-2xl">🔵</span>
              <span>{managers.aek.name} (AEK Manager)</span>
            </h3>
            <div className="text-sm text-blue-600 bg-blue-200 px-3 py-1 rounded-full font-medium">
              {managers.aek.weight}kg
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => addBeer('alexander')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🍺 + Bier
            </button>
            <button
              onClick={() => addShot('alexander', 20)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🥃 Shot 20%
            </button>
            <button
              onClick={() => addShot('alexander', 40)}
              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🥃 Shot 40%
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center justify-center bg-white rounded-lg border border-blue-200 px-2 py-3">
              <span className="text-lg font-bold text-blue-700">
                {beerConsumption.alexander}
              </span>
              <span className="text-xs text-blue-600 ml-1">🍺</span>
            </div>
            <div className="flex items-center justify-center bg-white rounded-lg border border-blue-200 px-2 py-3">
              <span className="text-lg font-bold text-blue-700">
                {shotConsumption.alexander.shots20}
              </span>
              <span className="text-xs text-blue-600 ml-1">🥃20%</span>
            </div>
            <div className="flex items-center justify-center bg-white rounded-lg border border-blue-200 px-2 py-3">
              <span className="text-lg font-bold text-blue-700">
                {shotConsumption.alexander.shots40}
              </span>
              <span className="text-xs text-blue-600 ml-1">🥃40%</span>
            </div>
          </div>

          {/* Alexander's BAC */}
          <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-300 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {calculateBloodAlcohol(
                  beerConsumption.alexander,
                  shotConsumption.alexander,
                  { weight: managers.aek.weight, gender: 'male' },
                  drinkingStartTime
                )}‰
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Blutalkoholkonzentration (BAK)
              </div>
              {(beerConsumption.alexander > 0 || shotConsumption.alexander.shots20 > 0 || shotConsumption.alexander.shots40 > 0) && (
                <div className="text-xs text-blue-500 mt-1">
                  {beerConsumption.alexander > 0 && `${beerConsumption.alexander} × 0,5L Bier`}
                  {(beerConsumption.alexander > 0) && (shotConsumption.alexander.shots20 > 0 || shotConsumption.alexander.shots40 > 0) && ' + '}
                  {shotConsumption.alexander.shots20 > 0 && `${shotConsumption.alexander.shots20} × 2cl (20%)`}
                  {shotConsumption.alexander.shots20 > 0 && shotConsumption.alexander.shots40 > 0 && ' + '}
                  {shotConsumption.alexander.shots40 > 0 && `${shotConsumption.alexander.shots40} × 2cl (40%)`}
                </div>
              )}
            </div>
            
            {/* BAC Chart */}
            <BACChart 
              bac={calculateBloodAlcohol(
                beerConsumption.alexander,
                shotConsumption.alexander,
                { weight: managers.aek.weight, gender: 'male' },
                drinkingStartTime
              )}
              name="Alexander"
            />
            
            {/* Sober Time */}
            {drinkingStartTime && (beerConsumption.alexander > 0 || shotConsumption.alexander.shots20 > 0 || shotConsumption.alexander.shots40 > 0) && (
              <div className="mt-3 text-center text-sm text-blue-600">
                {(() => {
                  const soberTime = calculateSoberTime(
                    beerConsumption.alexander,
                    shotConsumption.alexander,
                    { weight: managers.aek.weight, gender: 'male' },
                    drinkingStartTime
                  );
                  if (soberTime && soberTime > new Date()) {
                    return `🕐 Wieder nüchtern: ${soberTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                  } else if (parseFloat(calculateBloodAlcohol(
                    beerConsumption.alexander,
                    shotConsumption.alexander,
                    { weight: managers.aek.weight, gender: 'male' },
                    drinkingStartTime
                  )) === 0) {
                    return '✅ Bereits nüchtern';
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Philip Section */}
        <div className="modern-card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-green-700 flex items-center gap-2">
              <span className="text-2xl">🟢</span>
              <span>{managers.real.name} (Real Manager)</span>
            </h3>
            <div className="text-sm text-green-600 bg-green-200 px-3 py-1 rounded-full font-medium">
              {managers.real.weight}kg
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => addBeer('philip')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🍺 + Bier
            </button>
            <button
              onClick={() => addShot('philip', 20)}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🥃 Shot 20%
            </button>
            <button
              onClick={() => addShot('philip', 40)}
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            >
              🥃 Shot 40%
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center justify-center bg-white rounded-lg border border-green-200 px-2 py-3">
              <span className="text-lg font-bold text-green-700">
                {beerConsumption.philip}
              </span>
              <span className="text-xs text-green-600 ml-1">🍺</span>
            </div>
            <div className="flex items-center justify-center bg-white rounded-lg border border-green-200 px-2 py-3">
              <span className="text-lg font-bold text-green-700">
                {shotConsumption.philip.shots20}
              </span>
              <span className="text-xs text-green-600 ml-1">🥃20%</span>
            </div>
            <div className="flex items-center justify-center bg-white rounded-lg border border-green-200 px-2 py-3">
              <span className="text-lg font-bold text-green-700">
                {shotConsumption.philip.shots40}
              </span>
              <span className="text-xs text-green-600 ml-1">🥃40%</span>
            </div>
          </div>

          {/* Philip's BAC */}
          <div className="p-4 bg-gradient-to-r from-green-100 to-green-50 border border-green-300 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">
                {calculateBloodAlcohol(
                  beerConsumption.philip,
                  shotConsumption.philip,
                  { weight: managers.real.weight, gender: 'male' },
                  drinkingStartTime
                )}‰
              </div>
              <div className="text-sm text-green-600 font-medium">
                Blutalkoholkonzentration (BAK)
              </div>
              {(beerConsumption.philip > 0 || shotConsumption.philip.shots20 > 0 || shotConsumption.philip.shots40 > 0) && (
                <div className="text-xs text-green-500 mt-1">
                  {beerConsumption.philip > 0 && `${beerConsumption.philip} × 0,5L Bier`}
                  {(beerConsumption.philip > 0) && (shotConsumption.philip.shots20 > 0 || shotConsumption.philip.shots40 > 0) && ' + '}
                  {shotConsumption.philip.shots20 > 0 && `${shotConsumption.philip.shots20} × 2cl (20%)`}
                  {shotConsumption.philip.shots20 > 0 && shotConsumption.philip.shots40 > 0 && ' + '}
                  {shotConsumption.philip.shots40 > 0 && `${shotConsumption.philip.shots40} × 2cl (40%)`}
                </div>
              )}
            </div>
            
            {/* BAC Chart */}
            <BACChart 
              bac={calculateBloodAlcohol(
                beerConsumption.philip,
                shotConsumption.philip,
                { weight: managers.real.weight, gender: 'male' },
                drinkingStartTime
              )}
              name="Philip"
            />
            
            {/* Sober Time */}
            {drinkingStartTime && (beerConsumption.philip > 0 || shotConsumption.philip.shots20 > 0 || shotConsumption.philip.shots40 > 0) && (
              <div className="mt-3 text-center text-sm text-green-600">
                {(() => {
                  const soberTime = calculateSoberTime(
                    beerConsumption.philip,
                    shotConsumption.philip,
                    { weight: managers.real.weight, gender: 'male' },
                    drinkingStartTime
                  );
                  if (soberTime && soberTime > new Date()) {
                    return `🕐 Wieder nüchtern: ${soberTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
                  } else if (parseFloat(calculateBloodAlcohol(
                    beerConsumption.philip,
                    shotConsumption.philip,
                    { weight: managers.real.weight, gender: 'male' },
                    drinkingStartTime
                  )) === 0) {
                    return '✅ Bereits nüchtern';
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="modern-card mt-6">
        <h3 className="font-bold text-lg mb-4">📊 Zusammenfassung</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-text-primary">
              {beerConsumption.alexander + beerConsumption.philip}
            </div>
            <div className="text-sm text-text-muted">Biere gesamt</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-text-primary">
              {((beerConsumption.alexander + beerConsumption.philip) * 0.5).toFixed(1)}L
            </div>
            <div className="text-sm text-text-muted">Biervolumen</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-text-primary">
              {shotConsumption.alexander.shots20 + shotConsumption.alexander.shots40 + 
               shotConsumption.philip.shots20 + shotConsumption.philip.shots40}
            </div>
            <div className="text-sm text-text-muted">Shots gesamt</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-text-primary">
              {((shotConsumption.alexander.shots20 + shotConsumption.alexander.shots40 + 
                 shotConsumption.philip.shots20 + shotConsumption.philip.shots40) * 2)}cl
            </div>
            <div className="text-sm text-text-muted">Shot-Volumen</div>
          </div>
        </div>
      </div>

      {/* Alcohol Progression Graph */}
      <AlcoholProgressionGraph 
        managers={managers}
        beerConsumption={beerConsumption}
        shotConsumption={shotConsumption}
        drinkingStartTime={drinkingStartTime}
      />

      {/* Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">ℹ️ Hinweise</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• BAK-Berechnung basiert auf der Widmark-Formel</li>
          <li>• Annahme: 0,5L Bier mit 5% Alkoholgehalt</li>
          <li>• Shots: 2cl mit 20% oder 40% Alkoholgehalt</li>
          <li>• Abbau: 0,15‰ pro Stunde</li>
          <li>• Farbkodierung: Grün (0-0,3‰), Gelb (0,3-0,5‰), Orange (0,5-1,0‰), Rot (&gt;1,0‰)</li>
          <li>• Manager-Daten können unter Admin → Team-Verwaltung angepasst werden</li>
        </ul>
      </div>
        </>
      )}

      {/* Blackjack Section */}
      {activeSection === 'blackjack' && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              🃏 Blackjack Arena: Alexander vs Philip
            </h3>
            <p className="text-text-muted text-sm">
              Grundeinsatz: 5€ pro Spiel • Blackjack: 1,5x Auszahlung (7,50€) • Sieg: 1x Auszahlung (5€)
            </p>
          </div>

          {/* Game Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Alexander Stats */}
            <div className="modern-card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-blue-700 flex items-center gap-2">
                  🔵 {managers.aek.name}
                </h4>
                <div className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                  AEK Manager
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Siege:</span>
                  <span className="font-bold text-green-600">{blackjackGames.alexander.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Niederlagen:</span>
                  <span className="font-bold text-red-600">{blackjackGames.alexander.losses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Bilanz:</span>
                  <span className={`font-bold ${blackjackGames.alexander.totalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {blackjackGames.alexander.totalEarnings >= 0 ? '+' : ''}{blackjackGames.alexander.totalEarnings}€
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Siegesrate:</span>
                  <span className="font-bold text-blue-700">
                    {blackjackGames.alexander.wins + blackjackGames.alexander.losses > 0 
                      ? Math.round((blackjackGames.alexander.wins / (blackjackGames.alexander.wins + blackjackGames.alexander.losses)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Philip Stats */}
            <div className="modern-card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-green-700 flex items-center gap-2">
                  🟢 {managers.real.name}
                </h4>
                <div className="text-xs text-green-600 bg-green-200 px-2 py-1 rounded-full">
                  Real Manager
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Siege:</span>
                  <span className="font-bold text-green-600">{blackjackGames.philip.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Niederlagen:</span>
                  <span className="font-bold text-red-600">{blackjackGames.philip.losses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Bilanz:</span>
                  <span className={`font-bold ${blackjackGames.philip.totalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {blackjackGames.philip.totalEarnings >= 0 ? '+' : ''}{blackjackGames.philip.totalEarnings}€
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Siegesrate:</span>
                  <span className="font-bold text-green-700">
                    {blackjackGames.philip.wins + blackjackGames.philip.losses > 0 
                      ? Math.round((blackjackGames.philip.wins / (blackjackGames.philip.wins + blackjackGames.philip.losses)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Action Buttons */}
          <div className="modern-card mb-6 bg-gradient-to-r from-red-50 to-yellow-50 border-2 border-red-200">
            <h4 className="font-bold text-lg mb-4 text-red-700 flex items-center gap-2">
              🎰 Spiel Ausgang eingeben
            </h4>
            
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-2xl mb-2">🃏 vs 🃏</div>
                <div className="text-sm text-gray-600">Wer hat gewonnen?</div>
              </div>
              
              {/* Alexander Win Buttons */}
              <div className="space-y-2">
                <div className="font-medium text-blue-700 text-center">🔵 {managers.aek.name} gewinnt:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => recordBlackjackGame('alexander', 'Blackjack', 7.5)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    🃏 Blackjack (+7,50€)
                  </button>
                  <button
                    onClick={() => recordBlackjackGame('alexander', 'Einfacher Sieg', 5)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    🏆 Sieg (+5€)
                  </button>
                  <button
                    onClick={() => recordBlackjackGame('alexander', 'Double/Split', 10)}
                    className="bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    💎 Double/Split (+10€)
                  </button>
                </div>
              </div>

              {/* Philip Win Buttons */}
              <div className="space-y-2">
                <div className="font-medium text-green-700 text-center">🟢 {managers.real.name} gewinnt:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => recordBlackjackGame('philip', 'Blackjack', 7.5)}
                    className="bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    🃏 Blackjack (+7,50€)
                  </button>
                  <button
                    onClick={() => recordBlackjackGame('philip', 'Einfacher Sieg', 5)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    🏆 Sieg (+5€)
                  </button>
                  <button
                    onClick={() => recordBlackjackGame('philip', 'Double/Split', 10)}
                    className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    💎 Double/Split (+10€)
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={resetBlackjackData}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                >
                  🔄 Statistiken zurücksetzen
                </button>
              </div>
            </div>
          </div>

          {/* Game History */}
          {blackjackGames.gameHistory.length > 0 && (
            <div className="modern-card">
              <h4 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
                📜 Spielverlauf (letzte 20 Spiele)
              </h4>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blackjackGames.gameHistory.slice().reverse().map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${game.winner === 'alexander' ? 'text-blue-600' : 'text-green-600'}`}>
                        {game.winner === 'alexander' ? '🔵' : '🟢'}
                      </span>
                      <div>
                        <div className="font-medium">
                          {game.winner === 'alexander' ? managers.aek.name : managers.real.name} gewinnt
                        </div>
                        <div className="text-xs text-gray-500">{game.dateText}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+{game.earnings}€</div>
                      <div className="text-xs text-gray-500">{game.gameType}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blackjack Info */}
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">🃏 Blackjack Regeln</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Grundeinsatz: 5€ pro Spiel</li>
              <li>• Blackjack (21 mit 2 Karten): 1,5x Auszahlung = 7,50€ Gewinn</li>
              <li>• Einfacher Sieg: 1x Auszahlung = 5€ Gewinn</li>
              <li>• Double Down/Split Sieg: 2x Auszahlung = 10€ Gewinn</li>
              <li>• Der Verlierer zahlt den entsprechenden Betrag</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}