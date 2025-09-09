import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettings = ({ onClose }) => {
  const {
    isDarkMode,
    selectedTeam,
    autoMode,
    animatedBackground,
    teamThemes,
    toggleDarkMode,
    changeTeamTheme,
    setAutoMode,
    setAnimatedBackground,
    setCustomColorScheme,
    resetToDefault,
  } = useTheme();

  const [showCustomColors, setShowCustomColors] = useState(false);
  const [customPrimary, setCustomPrimary] = useState('#10B981');
  const [customSecondary, setCustomSecondary] = useState('#059669');

  const handleCustomColorsApply = () => {
    setCustomColorScheme({
      primary: customPrimary,
      secondary: customSecondary,
    });
    setShowCustomColors(false);
  };

  const handleAutoModeToggle = (enabled) => {
    setAutoMode(enabled);
    if (!enabled && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // If turning off auto mode and system is dark, keep dark mode
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Theme-Einstellungen
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* Team Themes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Team-Themes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(teamThemes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => changeTeamTheme(key)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTeam === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Erscheinungsbild
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                Automatischer Modus
              </span>
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => handleAutoModeToggle(e.target.checked)}
                className="toggle"
              />
            </label>
            
            {!autoMode && (
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Dunkler Modus
                </span>
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                  className="toggle"
                />
              </label>
            )}
            
            <label className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">
                Animierte Hintergründe
              </span>
              <input
                type="checkbox"
                checked={animatedBackground}
                onChange={(e) => setAnimatedBackground(e.target.checked)}
                className="toggle"
              />
            </label>
          </div>
        </div>

        {/* Custom Colors */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Eigene Farben
          </h3>
          
          {!showCustomColors ? (
            <button
              onClick={() => setShowCustomColors(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              + Eigene Farben definieren
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primärfarbe
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#10B981"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sekundärfarbe
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customSecondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={customSecondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#059669"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCustomColorsApply}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Anwenden
                </button>
                <button
                  onClick={() => setShowCustomColors(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={resetToDefault}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Zurücksetzen
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;