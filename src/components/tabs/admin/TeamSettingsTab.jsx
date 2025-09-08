import { useState, useEffect } from 'react';
import { dataManager } from '../../../../dataManager.js';

export default function TeamSettingsTab() {
  const [managers, setManagers] = useState({
    aek: { name: 'Alexander', age: 30, weight: 110 },
    real: { name: 'Philip', age: 30, weight: 105 }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load manager settings from database
  useEffect(() => {
    loadManagersFromDatabase();
  }, []);

  const loadManagersFromDatabase = async () => {
    try {
      setLoading(true);
      const result = await dataManager.getManagers();
      
      if (result.data && result.data.length >= 2) {
        // Convert database format to component format
        // Assuming id=1 is AEK manager, id=2 is Real manager
        const aekManager = result.data.find(m => m.id === 1) || { name: 'Alexander', gewicht: 110 };
        const realManager = result.data.find(m => m.id === 2) || { name: 'Philip', gewicht: 105 };
        
        setManagers({
          aek: { name: aekManager.name, age: 30, weight: aekManager.gewicht },
          real: { name: realManager.name, age: 30, weight: realManager.gewicht }
        });
      }
    } catch (error) {
      console.error('Error loading manager settings from database:', error);
      // Fallback to defaults if database fails
    } finally {
      setLoading(false);
    }
  };

  const handleManagerChange = (team, field, value) => {
    setManagers(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [field]: field === 'name' ? value : parseInt(value) || 0
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Update both managers in the database
      const aekData = { name: managers.aek.name, gewicht: managers.aek.weight };
      const realData = { name: managers.real.name, gewicht: managers.real.weight };
      
      // Update AEK manager (id=1)
      await dataManager.update('managers', aekData, 1);
      
      // Update Real manager (id=2)
      await dataManager.update('managers', realData, 2);
      
      setHasChanges(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('managerSettingsChanged'));
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Manager-Einstellungen gespeichert!';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving manager settings:', error);
      
      // Show error message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = 'Fehler beim Speichern!';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setManagers({
      aek: { name: 'Alexander', age: 30, weight: 110 },
      real: { name: 'Philip', age: 30, weight: 105 }
    });
    setHasChanges(true);
  };

  return (
    <div className="p-4 space-y-6">
      {loading ? (
        <div className="modern-card">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"></div>
            <span className="ml-2 text-text-muted">Lade Manager-Einstellungen...</span>
          </div>
        </div>
      ) : (
        <div className="modern-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            🏆 Team-Manager Einstellungen
          </h3>
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">
              Ungespeicherte Änderungen
            </span>
          )}
        </div>
        
        <div className="text-sm text-text-muted mb-6">
          Hier können Sie die Daten der Team-Manager für die BAK-Berechnung anpassen.
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* AEK Manager */}
          <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-medium text-blue-800 flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded mr-2"></div>
              AEK Manager
            </h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={managers.aek.name}
                onChange={(e) => handleManagerChange('aek', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Manager Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Alter</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={managers.aek.age}
                  onChange={(e) => handleManagerChange('aek', 'age', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={managers.aek.weight}
                  onChange={(e) => handleManagerChange('aek', 'weight', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Real Manager */}
          <div className="space-y-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 flex items-center">
              <div className="w-6 h-6 bg-red-600 rounded mr-2"></div>
              Real Manager
            </h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={managers.real.name}
                onChange={(e) => handleManagerChange('real', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Manager Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Alter</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={managers.real.age}
                  onChange={(e) => handleManagerChange('real', 'age', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={managers.real.weight}
                  onChange={(e) => handleManagerChange('real', 'weight', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-border-light">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Standardwerte wiederherstellen
          </button>
          
          <button
            onClick={saveSettings}
            disabled={!hasChanges || loading}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              hasChanges && !loading
                ? 'bg-primary-green text-white hover:bg-green-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Hinweis:</strong> Diese Einstellungen werden für die BAK-Berechnung in der Statistik verwendet.
            Die Werte werden in der Datenbank gespeichert.
          </div>
        </div>
      </div>
      )}
    </div>
  );
}