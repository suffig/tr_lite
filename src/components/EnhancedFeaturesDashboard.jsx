import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveUpdates } from '../contexts/LiveUpdatesContext';
import { useReports } from '../contexts/ReportsContext';
import fifaApiService from '../services/fifaApiService';
import { toast } from 'react-hot-toast';

const EnhancedFeaturesDashboard = ({ onShowSlotMachine, onShowThemeSettings }) => {
  const { theme, selectedTeam, changeTeamTheme, isDarkMode, toggleDarkMode } = useTheme();
  const { liveMatches, isConnected } = useLiveUpdates();
  const { reports, generateWeeklyReport, generateMonthlyReport } = useReports();
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handlePlayerSearch = async () => {
    if (!playerSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await fifaApiService.searchPlayers(playerSearch, { limit: 5 });
      setSearchResults(results.players);
      toast.success(`${results.total} Spieler gefunden`);
    } catch (error) {
      toast.error('Fehler bei der Spielersuche');
      console.error('Player search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateReport = async (type) => {
    try {
      if (type === 'weekly') {
        await generateWeeklyReport();
      } else {
        await generateMonthlyReport();
      }
    } catch (error) {
      toast.error('Fehler beim Erstellen des Berichts');
    }
  };

  return (
    <div className="p-6 space-y-8" style={{ backgroundColor: theme.background, color: theme.text }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">
          Erweiterte Features
        </h1>
        <p className="text-lg" style={{ color: theme.textSecondary }}>
          Neue Funktionen und Verbesserungen des FIFA Trackers
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={onShowThemeSettings}
          className="theme-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
        >
          <div className="text-2xl mb-2">🎨</div>
          <div className="font-semibold">Themes</div>
        </button>
        
        <button
          onClick={onShowSlotMachine}
          className="theme-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
        >
          <div className="text-2xl mb-2">🎰</div>
          <div className="font-semibold">Slot Machine</div>
        </button>
        
        <button
          onClick={() => handleGenerateReport('weekly')}
          className="theme-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">Wochenbericht</div>
        </button>
        
        <button
          onClick={toggleDarkMode}
          className="theme-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
        >
          <div className="text-2xl mb-2">{isDarkMode ? '☀️' : '🌙'}</div>
          <div className="font-semibold">{isDarkMode ? 'Hell' : 'Dunkel'}</div>
        </button>
      </div>

      {/* Live Scores Overview */}
      <div className="report-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Live Scores</h2>
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 live-indicator' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Verbunden' : 'Getrennt'}
            </span>
          </div>
        </div>
        
        {liveMatches.length > 0 ? (
          <div className="space-y-3">
            {liveMatches.map(match => (
              <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold">{match.homeTeam} vs {match.awayTeam}</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>
                    {match.status === 'LIVE' ? `${match.minute}'` : match.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {match.homeScore} - {match.awayScore}
                  </div>
                  {match.status === 'LIVE' && (
                    <div className="text-xs text-red-500 font-medium">LIVE</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: theme.textSecondary }}>
            <div className="text-4xl mb-2">⚽</div>
            <p>Keine Live-Spiele verfügbar</p>
          </div>
        )}
      </div>

      {/* Team Themes */}
      <div className="report-card p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Team Themes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(theme.teamThemes || {}).map(([key, teamTheme]) => (
            <button
              key={key}
              onClick={() => changeTeamTheme(key)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedTeam === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: teamTheme.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: teamTheme.secondary }}
                />
              </div>
              <span className="text-sm font-medium">{teamTheme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FIFA Player Search */}
      <div className="report-card p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">FIFA Spieler Suche</h2>
        <div className="flex space-x-3 mb-4">
          <input
            type="text"
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Spieler suchen..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            style={{ color: theme.text }}
            onKeyPress={(e) => e.key === 'Enter' && handlePlayerSearch()}
          />
          <button
            onClick={handlePlayerSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSearching ? '🔍' : 'Suchen'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm" style={{ color: theme.textSecondary }}>
                    {player.club} • {player.position}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: theme.primary }}>
                    {player.overallRating}
                  </div>
                  <div className="text-xs" style={{ color: theme.textSecondary }}>
                    Overall
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div className="report-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Berichte</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleGenerateReport('weekly')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Woche
            </button>
            <button
              onClick={() => handleGenerateReport('monthly')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Monat
            </button>
          </div>
        </div>
        
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.slice(0, 3).map(report => (
              <div key={report.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{report.title}</div>
                    <div className="text-sm" style={{ color: theme.textSecondary }}>
                      {new Date(report.generatedAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: theme.primary }}>
                      {report.type === 'weekly' ? 'Woche' : 'Monat'}
                    </div>
                    <div className="text-xs" style={{ color: theme.textSecondary }}>
                      {report.insights?.length || 0} Insights
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4" style={{ color: theme.textSecondary }}>
            <div className="text-3xl mb-2">📊</div>
            <p>Noch keine Berichte erstellt</p>
          </div>
        )}
      </div>

      {/* Feature Info */}
      <div className="report-card p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Neue Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">✅ Implementiert</h3>
            <ul className="text-sm space-y-1" style={{ color: theme.textSecondary }}>
              <li>• Live Score Updates mit Benachrichtigungen</li>
              <li>• Team-spezifische Themes (AEK, Real, etc.)</li>
              <li>• Dark/Light Mode mit Auto-Switch</li>
              <li>• Custom Color Schemes</li>
              <li>• Animierte Hintergründe</li>
              <li>• FIFA API Integration (Mock)</li>
              <li>• Virtual Slot Machine</li>
              <li>• Automatische Berichte</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-600">🎯 Tastenkürzel</h3>
            <ul className="text-sm space-y-1" style={{ color: theme.textSecondary }}>
              <li>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+T</kbd> Theme-Einstellungen</li>
              <li>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+S</kbd> Slot Machine</li>
              <li>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+K</kbd> Globale Suche (Admin)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeaturesDashboard;