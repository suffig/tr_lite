import { useState, useEffect } from 'react';

export default function AlcoholTrackerTab({ onNavigate }) { // eslint-disable-line no-unused-vars
  // Load manager data from localStorage (set via TeamSettingsTab)
  const [managers, setManagers] = useState({
    aek: { name: 'Alexander', age: 30, weight: 100 },
    real: { name: 'Philip', age: 30, weight: 105 }
  });
  
  const [beerConsumption, setBeerConsumption] = useState({
    alexander: 0,
    philip: 0
  });

  const [drinkingStartTime, setDrinkingStartTime] = useState(null);

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

    // Load drinking start time
    const savedStartTime = localStorage.getItem('drinkingStartTime');
    if (savedStartTime) {
      setDrinkingStartTime(savedStartTime);
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

  const resetConsumption = () => {
    saveBeerConsumption({ alexander: 0, philip: 0 });
    setDrinkingStartTime(null);
    localStorage.removeItem('drinkingStartTime');
  };

  // Blood Alcohol Content calculation using Widmark formula with time decay
  const calculateBloodAlcohol = (beerCount, playerData, drinkingTime = null) => {
    if (!playerData.weight || beerCount === 0) return '0.00';
    
    // Beer alcohol calculation: 0.5L beer = 500ml * 0.05 (5%) = 25ml pure alcohol
    // Density of ethanol = 0.789g/ml, so 25ml = 19.725g pure alcohol per beer
    const alcoholGrams = beerCount * 25 * 0.789;
    
    // Widmark factors (standard clinical values)
    const r = playerData.gender === 'male' ? 0.70 : 0.60;
    
    // Widmark formula: BAC = A / (r × m) where A=alcohol in grams, r=distribution factor, m=weight in kg
    let bac = alcoholGrams / (r * playerData.weight);
    
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

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          🍺 Bier-Tracker (Alexander & Philip)
        </h2>
        <p className="text-text-muted">
          Verfolgen Sie den Bierkonsum von Alexander und Philip mit individueller BAK-Berechnung.
        </p>
        {drinkingStartTime && (
          <div className="mt-2 text-sm text-text-muted">
            📅 Trinken gestartet vor: {getTimeSinceDrinking()}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="modern-card mb-6">
        <h3 className="font-bold text-lg mb-4">⚡ Schnell-Aktionen</h3>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={addBeerToBoth}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium text-lg"
          >
            🍻 Beiden ein Bier hinzufügen
          </button>
          <button
            onClick={resetConsumption}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            🔄 Zurücksetzen
          </button>
        </div>
      </div>

      {/* Individual Beer Tracking */}
      <div className="space-y-6">
        {/* Alexander Section */}
        <div className="modern-card bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-blue-700">
              🔵 {managers.aek.name} (AEK Manager)
            </h3>
            <div className="text-sm text-blue-600">
              {managers.aek.weight}kg
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => addBeer('alexander')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              🍺 + Bier
            </button>
            <div className="flex items-center justify-center bg-white rounded-lg border border-blue-200 px-4 py-3">
              <span className="text-2xl font-bold text-blue-700">
                {beerConsumption.alexander}
              </span>
              <span className="text-sm text-blue-600 ml-2">Biere</span>
            </div>
          </div>

          {/* Alexander's BAC */}
          <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-300 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {calculateBloodAlcohol(
                  beerConsumption.alexander,
                  { weight: managers.aek.weight, gender: 'male' },
                  drinkingStartTime
                )}‰
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Blutalkoholkonzentration (BAK)
              </div>
              {beerConsumption.alexander > 0 && (
                <div className="text-xs text-blue-500 mt-1">
                  {beerConsumption.alexander} × 0,5L Bier
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Philip Section */}
        <div className="modern-card bg-green-50 border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-green-700">
              🟢 {managers.real.name} (Real Manager)
            </h3>
            <div className="text-sm text-green-600">
              {managers.real.weight}kg
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => addBeer('philip')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              🍺 + Bier
            </button>
            <div className="flex items-center justify-center bg-white rounded-lg border border-green-200 px-4 py-3">
              <span className="text-2xl font-bold text-green-700">
                {beerConsumption.philip}
              </span>
              <span className="text-sm text-green-600 ml-2">Biere</span>
            </div>
          </div>

          {/* Philip's BAC */}
          <div className="p-4 bg-gradient-to-r from-green-100 to-green-50 border border-green-300 rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 mb-2">
                {calculateBloodAlcohol(
                  beerConsumption.philip,
                  { weight: managers.real.weight, gender: 'male' },
                  drinkingStartTime
                )}‰
              </div>
              <div className="text-sm text-green-600 font-medium">
                Blutalkoholkonzentration (BAK)
              </div>
              {beerConsumption.philip > 0 && (
                <div className="text-xs text-green-500 mt-1">
                  {beerConsumption.philip} × 0,5L Bier
                </div>
              )}
            </div>
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
            <div className="text-sm text-text-muted">Gesamtvolumen</div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">ℹ️ Hinweise</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• BAK-Berechnung basiert auf der Widmark-Formel</li>
          <li>• Annahme: 0,5L Bier mit 5% Alkoholgehalt</li>
          <li>• Abbau: 0,15‰ pro Stunde</li>
          <li>• Manager-Daten können unter Admin → Team-Verwaltung angepasst werden</li>
        </ul>
      </div>
    </div>
  );
}