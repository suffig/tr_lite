import { useState, useMemo } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';
import LoadingSpinner from './LoadingSpinner';

export default function DashboardWidgets() {
  const [selectedWidgets, setSelectedWidgets] = useState([
    'quick-stats',
    'recent-matches',
    'top-scorers',
    'team-comparison'
  ]);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const { data: matches, loading: matchesLoading } = useSupabaseQuery('matches', '*', {
    order: { column: 'date', ascending: false }
  });
  const { data: players, loading: playersLoading } = useSupabaseQuery('players', '*');
  const { data: transactions, loading: transactionsLoading } = useSupabaseQuery('transactions', '*');

  const loading = matchesLoading || playersLoading || transactionsLoading;

  // Available widgets
  const availableWidgets = [
    { id: 'quick-stats', name: 'Schnellstatistiken', icon: 'fas fa-chart-line' },
    { id: 'recent-matches', name: 'Letzte Spiele', icon: 'fas fa-futbol' },
    { id: 'top-scorers', name: 'Top Torschützen', icon: 'fas fa-crown' },
    { id: 'team-comparison', name: 'Team Vergleich', icon: 'fas fa-balance-scale' },
    { id: 'financial-overview', name: 'Finanzübersicht', icon: 'fas fa-euro-sign' },
    { id: 'form-tracker', name: 'Formkurve', icon: 'fas fa-chart-area' },
    { id: 'achievements', name: 'Achievements', icon: 'fas fa-trophy' },
    { id: 'upcoming-events', name: 'Anstehende Events', icon: 'fas fa-calendar' }
  ];

  // Calculate dashboard data
  const dashboardData = useMemo(() => {
    if (!matches || !players || !transactions) return {};

    const recentMatches = matches.slice(0, 10);
    const aekPlayers = players.filter(p => p.team === 'AEK');
    const realPlayers = players.filter(p => p.team === 'Real');

    // Team statistics
    const aekStats = {
      totalGoals: aekPlayers.reduce((sum, p) => sum + (p.goals || 0), 0),
      totalValue: aekPlayers.reduce((sum, p) => sum + (p.value || 0), 0),
      playerCount: aekPlayers.length
    };

    const realStats = {
      totalGoals: realPlayers.reduce((sum, p) => sum + (p.goals || 0), 0),
      totalValue: realPlayers.reduce((sum, p) => sum + (p.value || 0), 0),
      playerCount: realPlayers.length
    };

    // Form calculation (last 5 matches)
    const calculateForm = () => {
      const last5 = recentMatches.slice(0, 5);
      let aekForm = [];
      let realForm = [];

      last5.forEach(match => {
        if (match.goalsa > match.goalsb) {
          aekForm.push('W');
          realForm.push('L');
        } else if (match.goalsa < match.goalsb) {
          aekForm.push('L');
          realForm.push('W');
        } else {
          aekForm.push('D');
          realForm.push('D');
        }
      });

      return { aekForm, realForm };
    };

    // Top scorers
    const topScorers = [...players]
      .sort((a, b) => (b.goals || 0) - (a.goals || 0))
      .slice(0, 5);

    // Financial data
    const aekTransactions = transactions.filter(t => t.team === 'AEK');
    const realTransactions = transactions.filter(t => t.team === 'Real');
    
    const aekBalance = aekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const realBalance = realTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      recentMatches,
      aekStats,
      realStats,
      form: calculateForm(),
      topScorers,
      aekBalance,
      realBalance,
      totalMatches: matches.length,
      totalPlayers: players.length
    };
  }, [matches, players, transactions]);

  const toggleWidget = (widgetId) => {
    setSelectedWidgets(prev => 
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Lade Dashboard..." />;
  }

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'quick-stats':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-chart-line text-blue-500 mr-2" />
              Schnellstatistiken
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.totalMatches}</div>
                <div className="text-sm text-gray-600">Gesamt Spiele</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardData.totalPlayers}</div>
                <div className="text-sm text-gray-600">Gesamt Spieler</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dashboardData.aekStats.totalGoals + dashboardData.realStats.totalGoals}
                </div>
                <div className="text-sm text-gray-600">Gesamt Tore</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {dashboardData.aekBalance + dashboardData.realBalance}M €
                </div>
                <div className="text-sm text-gray-600">Gesamt Wert</div>
              </div>
            </div>
          </div>
        );

      case 'recent-matches':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-futbol text-green-500 mr-2" />
              Letzte Spiele
            </h3>
            <div className="space-y-3">
              {dashboardData.recentMatches.slice(0, 5).map((match, index) => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">
                    {new Date(match.date).toLocaleDateString('de-DE')}
                  </div>
                  <div className="font-medium">
                    AEK {match.goalsa || 0} - {match.goalsb || 0} Real
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    match.goalsa > match.goalsb ? 'bg-blue-500' :
                    match.goalsa < match.goalsb ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'top-scorers':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-crown text-yellow-500 mr-2" />
              Top Torschützen
            </h3>
            <div className="space-y-3">
              {dashboardData.topScorers.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-600">{player.team}</div>
                  </div>
                  <div className="font-bold text-lg">
                    {player.goals || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'team-comparison':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-balance-scale text-purple-500 mr-2" />
              Team Vergleich
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Tore</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded"
                      style={{ 
                        width: `${(dashboardData.aekStats.totalGoals / (dashboardData.aekStats.totalGoals + dashboardData.realStats.totalGoals)) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-center">
                    {dashboardData.aekStats.totalGoals} : {dashboardData.realStats.totalGoals}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div 
                      className="bg-red-500 h-3 rounded ml-auto"
                      style={{ 
                        width: `${(dashboardData.realStats.totalGoals / (dashboardData.aekStats.totalGoals + dashboardData.realStats.totalGoals)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>AEK</span>
                  <span>Real</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Spieler</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded"
                      style={{ 
                        width: `${(dashboardData.aekStats.playerCount / (dashboardData.aekStats.playerCount + dashboardData.realStats.playerCount)) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-center">
                    {dashboardData.aekStats.playerCount} : {dashboardData.realStats.playerCount}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div 
                      className="bg-red-500 h-3 rounded ml-auto"
                      style={{ 
                        width: `${(dashboardData.realStats.playerCount / (dashboardData.aekStats.playerCount + dashboardData.realStats.playerCount)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Marktwert</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded"
                      style={{ 
                        width: `${(dashboardData.aekStats.totalValue / (dashboardData.aekStats.totalValue + dashboardData.realStats.totalValue)) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-center">
                    {dashboardData.aekStats.totalValue}M : {dashboardData.realStats.totalValue}M
                  </span>
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div 
                      className="bg-red-500 h-3 rounded ml-auto"
                      style={{ 
                        width: `${(dashboardData.realStats.totalValue / (dashboardData.aekStats.totalValue + dashboardData.realStats.totalValue)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'financial-overview':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-euro-sign text-green-500 mr-2" />
              Finanzübersicht
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.aekBalance}M €
                </div>
                <div className="text-sm text-blue-800">AEK Saldo</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData.realBalance}M €
                </div>
                <div className="text-sm text-red-800">Real Saldo</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-medium">
                Gesamtsaldo: {dashboardData.aekBalance + dashboardData.realBalance}M €
              </div>
            </div>
          </div>
        );

      case 'form-tracker':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-chart-area text-indigo-500 mr-2" />
              Formkurve (Letzte 5 Spiele)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">AEK</span>
                  <div className="flex space-x-1">
                    {dashboardData.form.aekForm.map((result, index) => (
                      <div 
                        key={index}
                        className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                          result === 'W' ? 'bg-green-500 text-white' :
                          result === 'L' ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-600">Real</span>
                  <div className="flex space-x-1">
                    {dashboardData.form.realForm.map((result, index) => (
                      <div 
                        key={index}
                        className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                          result === 'W' ? 'bg-green-500 text-white' :
                          result === 'L' ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-trophy text-yellow-500 mr-2" />
              Letzte Achievements
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
                <i className="fas fa-star text-yellow-500" />
                <div>
                  <div className="font-medium">Torjäger</div>
                  <div className="text-sm text-gray-600">10 Tore erreicht</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded">
                <i className="fas fa-futbol text-blue-500" />
                <div>
                  <div className="font-medium">Spielmacher</div>
                  <div className="text-sm text-gray-600">50 Spiele gespielt</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded">
                <i className="fas fa-crown text-purple-500" />
                <div>
                  <div className="font-medium">Champion</div>
                  <div className="text-sm text-gray-600">Siegesserie erreicht</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'upcoming-events':
        return (
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <i className="fas fa-calendar text-orange-500 mr-2" />
              Anstehende Events
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded">
                <i className="fas fa-futbol text-orange-500" />
                <div>
                  <div className="font-medium">Nächstes Spiel</div>
                  <div className="text-sm text-gray-600">Bereit für das nächste Match</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded">
                <i className="fas fa-chart-line text-green-500" />
                <div>
                  <div className="font-medium">Monatsstatistik</div>
                  <div className="text-sm text-gray-600">Auswertung verfügbar</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Dashboard
        </h2>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="btn-secondary"
        >
          <i className="fas fa-cog mr-2" />
          Anpassen
        </button>
      </div>

      {/* Widget Customization */}
      {isCustomizing && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-bold mb-4">Widgets anpassen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableWidgets.map(widget => (
              <label key={widget.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedWidgets.includes(widget.id)}
                  onChange={() => toggleWidget(widget.id)}
                  className="rounded"
                />
                <i className={`${widget.icon} text-gray-600`} />
                <span className="text-sm">{widget.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedWidgets.map(widgetId => (
          <div key={widgetId}>
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>

      {selectedWidgets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-puzzle-piece text-4xl mb-4" />
          <p>Keine Widgets ausgewählt. Klicken Sie auf "Anpassen" um Widgets hinzuzufügen.</p>
        </div>
      )}
    </div>
  );
}