import { useState } from 'react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';

export default function MatchesTab({ onNavigate, showHints = false }) { // eslint-disable-line no-unused-vars
  const [expandedMatches, setExpandedMatches] = useState(new Set());
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [timeFilter, setTimeFilter] = useState('4weeks'); // '1week', '4weeks', '3months', 'all'
  const [dateFilter, setDateFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('all'); // 'all', 'aek-wins', 'real-wins'
  const [goalFilter, setGoalFilter] = useState('all'); // 'all', 'high-scoring', 'low-scoring'
  
  const { data: allMatches, loading, error, refetch } = useSupabaseQuery(
    'matches',
    '*',
    { order: { column: 'date', ascending: false } }
  );
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  
  // Calculate date based on time filter
  const getTimeFilterDate = () => {
    const now = new Date();
    switch (timeFilter) {
      case '1week':
        now.setDate(now.getDate() - 7);
        break;
      case '4weeks':
        now.setDate(now.getDate() - 28);
        break;
      case '3months':
        now.setMonth(now.getMonth() - 3);
        break;
      default:
        return null;
    }
    return now.toISOString().split('T')[0];
  };

  // Filter matches based on current settings
  const getFilteredMatches = () => {
    if (!allMatches) return [];
    
    let filtered = allMatches;
    
    // Apply date filter if set (exact date)
    if (dateFilter) {
      filtered = filtered.filter(match => match.date === dateFilter);
    } else if (timeFilter !== 'all') {
      // Apply time period filter
      const filterDate = getTimeFilterDate();
      if (filterDate) {
        filtered = filtered.filter(match => match.date >= filterDate);
      }
    }
    
    // Apply result filter
    if (resultFilter !== 'all') {
      filtered = filtered.filter(match => {
        const aekGoals = match.goalsa || 0;
        const realGoals = match.goalsb || 0;
        
        switch (resultFilter) {
          case 'aek-wins':
            return aekGoals > realGoals;
          case 'real-wins':
            return realGoals > aekGoals;
          default:
            return true;
        }
      });
    }
    
    // Apply goal filter
    if (goalFilter !== 'all') {
      filtered = filtered.filter(match => {
        const totalGoals = (match.goalsa || 0) + (match.goalsb || 0);
        
        switch (goalFilter) {
          case 'high-scoring':
            return totalGoals > 10; // Many goals: >10
          case 'low-scoring':
            return totalGoals < 5; // Few goals: <5
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };
  
  const matches = getFilteredMatches();
  
  const isLoading = loading || playersLoading;

  // Helper function to get player name and value
  const getPlayerInfo = (playerId, playerName) => {
    if (!players) return { name: playerName || 'Unbekannt', value: 0 };
    const player = players.find(p => p.id === playerId || p.name === playerName);
    return {
      name: player?.name || playerName || 'Unbekannt',
      value: player?.value || 0,
      team: player?.team || 'Unbekannt'
    };
  };

  const toggleMatchDetails = (matchId) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  // Group matches by date
  const groupMatchesByDate = () => {
    if (!matches) return [];
    
    const groups = {};
    matches.forEach(match => {
      const dateKey = match.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(match);
    });
    
    // Sort dates descending and return as array
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        matches: groups[date].sort((a, b) => b.id - a.id) // Sort matches by ID descending
      }));
  };

  // Generate color schemes for different dates
  const getDateColorScheme = (index) => {
    const colorSchemes = [
      {
        container: "border-blue-400 bg-blue-50 dark:bg-blue-900",
        header: "text-blue-800 dark:text-blue-100",
        accent: "blue-500"
      },
      {
        container: "border-green-500 bg-green-50 dark:bg-green-900", 
        header: "text-green-800 dark:text-green-100",
        accent: "green-500"
      },
      {
        container: "border-purple-500 bg-purple-50 dark:bg-purple-900",
        header: "text-purple-800 dark:text-purple-100", 
        accent: "purple-500"
      },
      {
        container: "border-red-500 bg-red-50 dark:bg-red-900",
        header: "text-red-800 dark:text-red-100", 
        accent: "red-500"
      },
      {
        container: "border-yellow-500 bg-yellow-50 dark:bg-yellow-900",
        header: "text-yellow-800 dark:text-yellow-100",
        accent: "yellow-500"
      }
    ];
    
    return colorSchemes[index % colorSchemes.length];
  };

  if (isLoading) {
    return <LoadingSpinner message="Lade Spiele..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-accent-red mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <p className="text-text-muted mb-4">Fehler beim Laden der Spiele</p>
        <button onClick={refetch} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    );
  }

  const dateGroups = groupMatchesByDate();

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-text-primary">
            Spiele-Übersicht
          </h2>
        </div>
        <p className="text-text-muted">
          {matches?.length || 0} Spiele gefunden, gruppiert nach Datum
        </p>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="mb-6 modern-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">🔍 Filter & Suche</h3>
            <p className="text-sm text-text-muted">Finde schnell die Spiele, die dich interessieren</p>
          </div>
          <button
            onClick={() => setFilterExpanded(!filterExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary hover:bg-bg-tertiary border border-border-light rounded-lg transition-all"
          >
            <span>{filterExpanded ? 'Einklappen' : 'Erweitern'}</span>
            <span className={`text-lg transition-transform duration-200 ${filterExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          </button>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ${filterExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Time Period Filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                📅 Zeitraum
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue transition-colors"
              >
                <option value="1week">Letzte Woche</option>
                <option value="4weeks">Letzte 4 Wochen</option>
                <option value="3months">Letzte 3 Monate</option>
                <option value="all">Alle Spiele</option>
              </select>
            </div>
            
            {/* Result Filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                🏆 Ergebnis
              </label>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue transition-colors"
              >
                <option value="all">Alle Ergebnisse</option>
                <option value="aek-wins">🔵 AEK Siege</option>
                <option value="real-wins">🔴 Real Siege</option>
              </select>
            </div>
            
            {/* Goal Filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                ⚽ Tore
              </label>
              <select
                value={goalFilter}
                onChange={(e) => setGoalFilter(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue transition-colors"
              >
                <option value="all">Alle Spiele</option>
                <option value="high-scoring">🔥 Torreich (&gt;10 Tore)</option>
                <option value="low-scoring">🛡️ Torarm (&lt;5 Tore)</option>
              </select>
            </div>
            
            {/* Specific Date Filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                📆 Datum
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue transition-colors"
              />
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-sm text-text-muted">
              {(() => {
                const count = matches.length;
                const total = allMatches?.length || 0;
                if (count === total) return `Zeige alle ${count} Spiele`;
                return `${count} von ${total} Spielen gefiltert`;
              })()}
            </div>
            <button
              onClick={() => {
                setTimeFilter('4weeks');
                setDateFilter('');
                setResultFilter('all');
                setGoalFilter('all');
              }}
              className="px-4 py-2 text-sm bg-accent-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              🔄 Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {dateGroups && dateGroups.length > 0 ? (
        <div className="space-y-4">
          {dateGroups.map((dateGroup, groupIndex) => {
            const colorScheme = getDateColorScheme(groupIndex);
            
            return (
              <div key={dateGroup.date} className={`border-2 ${colorScheme.container} rounded-lg shadow-lg`}>
                <div className="p-4 border-b border-opacity-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 bg-${colorScheme.accent} rounded-full mr-3 flex-shrink-0`}></div>
                      <div>
                        <h3 className={`text-lg font-bold ${colorScheme.header}`}>
                          {new Date(dateGroup.date).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className={`text-sm opacity-75 ${colorScheme.header}`}>
                          {dateGroup.matches.length} Spiel{dateGroup.matches.length !== 1 ? 'e' : ''}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs bg-${colorScheme.accent} text-white px-3 py-1 rounded-full font-semibold`}>
                      Spieltag
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {dateGroup.matches.map((match) => {
                    const isExpanded = expandedMatches.has(match.id);
                    
                    return (
                      <div key={match.id} className="bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                        <button
                          onClick={() => toggleMatchDetails(match.id)}
                          className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-all duration-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-text-primary">
                                {match.teama || 'AEK'} {match.goalsa || 0} : {match.goalsb || 0} {match.teamb || 'Real'}
                              </div>
                              {match.status && (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                  match.status === 'finished' 
                                    ? 'bg-primary-green/10 text-primary-green'
                                    : 'bg-accent-orange/10 text-accent-orange'
                                }`}>
                                  {match.status === 'finished' ? 'Beendet' : 'Laufend'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Details</span>
                            <span className={`text-lg transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              ▶
                            </span>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              
                              {/* Goal Scorers */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  ⚽ Torschützen
                                </h4>
                                <div className="space-y-2">
                                  {(() => {
                                    // Safely parse goalslista - it might be a JSON string or already an array
                                    let goalsList = [];
                                    try {
                                      if (typeof match.goalslista === 'string') {
                                        goalsList = JSON.parse(match.goalslista);
                                      } else if (Array.isArray(match.goalslista)) {
                                        goalsList = match.goalslista;
                                      }
                                    } catch (e) {
                                      console.warn('Failed to parse goalslista:', e);
                                      goalsList = [];
                                    }
                                    
                                    return goalsList && goalsList.length > 0 ? (
                                      <div>
                                        <p className="text-xs text-blue-600 font-medium mb-1">AEK:</p>
                                        {goalsList.map((goal, idx) => {
                                          const isObject = typeof goal === 'object' && goal !== null;
                                          const playerInfo = isObject 
                                            ? getPlayerInfo(goal.player_id, goal.player)
                                            : getPlayerInfo(null, goal);
                                          return (
                                            <div key={idx} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                              <div className="font-medium text-blue-800">
                                                {playerInfo.name}
                                                {isObject && goal.count > 1 && (
                                                  <span className="ml-1 text-xs bg-blue-200 px-1 rounded">
                                                    {goal.count}x
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs text-blue-600">
                                                Marktwert: {playerInfo.value}M €
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : <p className="text-xs text-text-muted">AEK: Keine Tore</p>;
                                  })()}
                                  
                                  {(() => {
                                    // Safely parse goalslistb - it might be a JSON string or already an array
                                    let goalsList = [];
                                    try {
                                      if (typeof match.goalslistb === 'string') {
                                        goalsList = JSON.parse(match.goalslistb);
                                      } else if (Array.isArray(match.goalslistb)) {
                                        goalsList = match.goalslistb;
                                      }
                                    } catch (e) {
                                      console.warn('Failed to parse goalslistb:', e);
                                      goalsList = [];
                                    }
                                    
                                    return goalsList && goalsList.length > 0 ? (
                                      <div>
                                        <p className="text-xs text-red-600 font-medium mb-1">Real:</p>
                                        {goalsList.map((goal, idx) => {
                                          const isObject = typeof goal === 'object' && goal !== null;
                                          const playerInfo = isObject 
                                            ? getPlayerInfo(goal.player_id, goal.player)
                                            : getPlayerInfo(null, goal);
                                          return (
                                            <div key={idx} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-400">
                                              <div className="font-medium text-red-800">
                                                {playerInfo.name}
                                                {isObject && goal.count > 1 && (
                                                  <span className="ml-1 text-xs bg-red-200 px-1 rounded">
                                                    {goal.count}x
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs text-red-600">
                                                Marktwert: {playerInfo.value}M €
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : <p className="text-xs text-text-muted">Real: Keine Tore</p>;
                                  })()}
                                </div>
                              </div>
                              
                              {/* Player of the Match (SdS) */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  ⭐ Spieler des Spiels
                                </h4>
                                <div className="space-y-1">
                                  {match.manofthematch ? (
                                    <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                                      <div className="font-medium text-yellow-800">
                                        {match.manofthematch}
                                      </div>
                                      {(() => {
                                        const playerInfo = getPlayerInfo(match.manofthematch_player_id, match.manofthematch);
                                        return (
                                          <div className="text-xs text-yellow-600">
                                            Team: {playerInfo.team} | Marktwert: {playerInfo.value}M €
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-text-muted">Kein Spieler des Spiels ausgewählt</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Cards */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  🟨🟥 Karten
                                </h4>
                                <div className="space-y-1">
                                  <div>
                                    <p className="text-xs text-blue-600 font-medium">AEK:</p>
                                    <p className="text-sm text-text-muted">🟨 {match.yellowa || 0} Gelb</p>
                                    <p className="text-sm text-text-muted">🟥 {match.reda || 0} Rot</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-red-600 font-medium">Real:</p>
                                    <p className="text-sm text-text-muted">🟨 {match.yellowb || 0} Gelb</p>
                                    <p className="text-sm text-text-muted">🟥 {match.redb || 0} Rot</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Prize Money */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-text-primary flex items-center">
                                  💰 Preisgelder
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm text-text-muted">
                                    <span className="text-blue-600">AEK:</span> {match.prizeaek ? `€${match.prizeaek}` : '€0'}
                                  </p>
                                  <p className="text-sm text-text-muted">
                                    <span className="text-red-600">Real:</span> {match.prizereal ? `€${match.prizereal}` : '€0'}
                                  </p>
                                </div>
                              </div>
                              
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-text-muted mb-4">
            <i className="fas fa-futbol text-4xl opacity-50"></i>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Keine Spiele gefunden
          </h3>
          <p className="text-text-muted">
            Es wurden noch keine Spiele hinzugefügt.
          </p>
        </div>
      )}

      {/* Info Card - Only show on admin page */}
      {showHints && (
        <div className="mt-6 modern-card bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <div className="text-blue-600 mr-3">
              <i className="fas fa-info-circle"></i>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Hinweis</h4>
              <p className="text-blue-700 text-sm">
                Klicken Sie auf ein Spiel, um detaillierte Statistiken wie Torschützen, Karten und Preisgelder anzuzeigen. Neue Spiele können im Verwaltungsbereich hinzugefügt werden.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}