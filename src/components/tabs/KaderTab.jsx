import { useState } from 'react';
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabase';
import LoadingSpinner from '../LoadingSpinner';
import ExportImportManager from '../ExportImportManager';
import PlayerDetailModal from '../PlayerDetailModal';
import EnhancedSearch from '../EnhancedSearch';
import { POSITIONS } from '../../utils/errorHandling';
import toast from 'react-hot-toast';

export default function KaderTab({ onNavigate }) { // eslint-disable-line no-unused-vars
  const [openPanel, setOpenPanel] = useState(null);
  const [showExportImport, setShowExportImport] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDetail, setShowPlayerDetail] = useState(false);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: players, loading, error, refetch } = useSupabaseQuery('players', '*');
  const { update } = useSupabaseMutation('players');
  
  const POSITION_ORDER = {
    "TH": 0, "IV": 1, "LV": 2, "RV": 3, "ZDM": 4, "ZM": 5,
    "ZOM": 6, "LM": 7, "RM": 8, "LF": 9, "RF": 10, "ST": 11
  };

  const getPositionBadgeClass = (pos) => {
    if (pos === "TH") return "inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200";
    if (["IV", "LV", "RV", "ZDM"].includes(pos)) return "inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200";
    if (["ZM", "ZOM", "LM", "RM"].includes(pos)) return "inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200";
    if (["LF", "RF", "ST"].includes(pos)) return "inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200";
    return "inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getTeamPlayers = (teamName) => {
    // Use filtered players if search is active, otherwise use all players
    const playersToUse = filteredPlayers.length > 0 ? filteredPlayers : (players || []);
    return playersToUse
      .filter(p => p.team === teamName)
      .sort((a, b) => (POSITION_ORDER[a.position] || 99) - (POSITION_ORDER[b.position] || 99));
  };

  const getTeamSquadValue = (teamName) => {
    if (!players) return 0;
    return players
      .filter(p => p.team === teamName)
      .reduce((sum, p) => sum + (p.value || 0), 0);
  };

  const formatCurrencyInMillions = (amount) => {
    // Value is already in millions, just format it
    return `${(amount || 0).toFixed(1)}M €`;
  };

  const getTeamCardClass = (teamName) => {
    const baseClass = "modern-card transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1";
    if (teamName === "AEK") return `${baseClass} border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200`;
    if (teamName === "Real") return `${baseClass} border-l-4 border-red-400 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200`;
    if (teamName === "Ehemalige") return `${baseClass} border-l-4 border-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200`;
    return baseClass;
  };

  // Team analysis functions
  const generatePlayerReport = () => {
    if (!players || players.length === 0) {
      alert('Keine Spieler für Report verfügbar');
      return;
    }
    
    const report = players.map(p => 
      `${p.name} (${p.team}): ${p.goals || 0} Tore, ${p.position || 'Unbekannt'}, Wert: ${formatCurrencyInMillions(p.value || 0)}`
    ).join('\n');
    
    alert(`📊 Spieler-Report:\n\n${report}`);
  };

  const getTeamColor = (teamName) => {
    if (teamName === "AEK") return "text-blue-700 font-semibold";
    if (teamName === "Real") return "text-red-700 font-semibold";
    if (teamName === "Ehemalige") return "text-slate-700 font-semibold";
    return "text-gray-600";
  };

  // Minimal CRUD functions without changing the design
  const handleEditPlayer = async (player) => {
    setEditingPlayer(player);
  };
  
  const handleSavePlayer = async (playerData) => {
    try {
      await update(playerData, editingPlayer.id);
      toast.success(`Spieler ${playerData.name} erfolgreich aktualisiert`);
      setEditingPlayer(null);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Spielers: ' + error.message);
    }
  };

  // FIFA functionality
  const handleShowPlayerDetail = (player) => {
    setSelectedPlayer(player);
    setShowPlayerDetail(true);
  };

  const handleClosePlayerDetail = () => {
    setShowPlayerDetail(false);
    setSelectedPlayer(null);
  };

  // Search configuration
  const searchFields = ['name', 'position', 'team', 'value'];
  const filterOptions = [
    {
      key: 'team',
      label: 'Team',
      options: [
        { value: 'AEK', label: 'AEK Athen' },
        { value: 'Real', label: 'Real Madrid' },
        { value: 'Ehemalige', label: 'Ehemalige' }
      ]
    },
    {
      key: 'position',
      label: 'Position',
      options: [
        { value: 'TH', label: 'Torwart' },
        { value: 'IV', label: 'Innenverteidiger' },
        { value: 'LV', label: 'Linksverteidiger' },
        { value: 'RV', label: 'Rechtsverteidiger' },
        { value: 'ZDM', label: 'Defensives Mittelfeld' },
        { value: 'ZM', label: 'Zentrales Mittelfeld' },
        { value: 'ZOM', label: 'Offensives Mittelfeld' },
        { value: 'LM', label: 'Linkes Mittelfeld' },
        { value: 'RM', label: 'Rechtes Mittelfeld' },
        { value: 'LF', label: 'Linker Flügel' },
        { value: 'RF', label: 'Rechter Flügel' },
        { value: 'ST', label: 'Stürmer' }
      ]
    }
  ];

  const handleSearchResults = (results) => {
    setFilteredPlayers(results);
  };

  if (loading) {
    return <LoadingSpinner message="Lade Kader..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-accent-red mb-4">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <p className="text-text-muted mb-4">Fehler beim Laden des Kaders</p>
        <button onClick={refetch} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    );
  }

  const aekPlayers = getTeamPlayers("AEK");
  const realPlayers = getTeamPlayers("Real");
  const ehemaligePlayers = getTeamPlayers("Ehemalige");

  const teams = [
    { 
      id: 'aek', 
      name: 'AEK', 
      displayName: 'AEK Athen', 
      players: aekPlayers,
      squadValue: getTeamSquadValue('AEK'),
      icon: '🔵'
    },
    { 
      id: 'real', 
      name: 'Real', 
      displayName: 'Real Madrid', 
      players: realPlayers,
      squadValue: getTeamSquadValue('Real'),
      icon: '🔴'
    },
    { 
      id: 'ehemalige', 
      name: 'Ehemalige', 
      displayName: 'Ehemalige', 
      players: ehemaligePlayers,
      squadValue: getTeamSquadValue('Ehemalige'),
      icon: '⚪'
    }
  ];

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Kader-Übersicht
        </h2>
        <p className="text-text-muted">
          {players?.length || 0} Spieler insgesamt
        </p>
      </div>

      {/* Enhanced Search Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center">
            <span className="mr-2 text-2xl">🔍</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Spieler-Suche
            </span>
          </h3>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              showSearch 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{showSearch ? '🙈' : '👁️'}</span>
              <span>{showSearch ? 'Suche verbergen' : 'Suche anzeigen'}</span>
            </div>
          </button>
        </div>
        
        {showSearch && (
          <div className="transform transition-all duration-500 ease-in-out">
            <EnhancedSearch
              data={players || []}
              searchFields={searchFields}
              filterOptions={filterOptions}
              onResults={handleSearchResults}
              placeholder="🔍 Spieler durchsuchen (Name, Position, Team...)"
              showCount={true}
            />
          </div>
        )}
      </div>

      {/* Search Results Summary */}
      {showSearch && filteredPlayers.length > 0 && filteredPlayers.length !== players?.length && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
          <div className="flex items-center text-blue-800">
            <span className="mr-3 text-2xl">🎯</span>
            <div className="flex-1">
              <span className="font-semibold text-lg">
                {filteredPlayers.length} von {players?.length || 0} Spielern gefunden
              </span>
              <div className="text-sm text-blue-600 mt-1">
                Filter aktiv - Zeige nur relevante Ergebnisse
              </div>
            </div>
            <button
              onClick={() => setFilteredPlayers([])}
              className="ml-auto bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105 transform"
            >
              <span className="mr-1">🔄</span>
              Filter zurücksetzen
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Quick Actions Panel */}
      <div className="modern-card mb-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <span className="mr-3 text-2xl">⚡</span>
          <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Kader-Management
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`group flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 text-sm font-medium transform hover:scale-105 hover:shadow-lg ${
              showSearch 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
            }`}
          >
            <span className="text-lg group-hover:animate-bounce">{showSearch ? '🙈' : '🔍'}</span>
            <span>{showSearch ? 'Suche verbergen' : 'Spieler suchen'}</span>
          </button>
          
          {/* Existing Actions with Enhanced Styling */}
          <button
            onClick={generatePlayerReport}
            className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium transform hover:scale-105 hover:shadow-lg"
          >
            <span className="text-lg group-hover:animate-pulse">📊</span>
            <span>Spieler-Report</span>
          </button>
          
          <button
            onClick={() => setShowExportImport(true)}
            className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-sm font-medium transform hover:scale-105 hover:shadow-lg"
          >
            <span className="text-lg group-hover:animate-bounce">📦</span>
            <span>Export/Import</span>
          </button>
          
          <button
            onClick={() => {
              const totalValue = (getTeamSquadValue('AEK') + getTeamSquadValue('Real') + getTeamSquadValue('Ehemalige'));
              const avgValue = players?.length ? totalValue / players.length : 0;
              toast.success(
                `📈 Kader-Analyse:\n\n` +
                `Gesamtwert: ${formatCurrencyInMillions(totalValue)}\n` +
                `Durchschnitt: ${formatCurrencyInMillions(avgValue)}\n` +
                `Spieler gesamt: ${players?.length || 0}`,
                { duration: 5000 }
              );
            }}
            className="group flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-sm font-medium transform hover:scale-105 hover:shadow-lg"
          >
            <span className="text-lg group-hover:animate-pulse">📈</span>
            <span>Kader-Analyse</span>
          </button>
        </div>
      </div>

      {/* Team Accordions */}
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className={getTeamCardClass(team.name)}>
            {/* Enhanced Team Header */}
            <button
              onClick={() => setOpenPanel(openPanel === team.id ? null : team.id)}
              className="w-full text-left p-4 focus:outline-none transition-all duration-200 hover:bg-opacity-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl transform transition-transform duration-200 hover:scale-110">{team.icon}</span>
                  <div>
                    <h3 className={`font-bold text-xl ${getTeamColor(team.name)} transition-colors duration-200`}>
                      {team.displayName}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">
                      <span className="inline-flex items-center">
                        <span className="mr-1">👥</span>
                        {team.players.length} Spieler
                      </span>
                      {team.squadValue > 0 && (
                        <span className="ml-3 inline-flex items-center">
                          <span className="mr-1">💰</span>
                          Kaderwert: {formatCurrencyInMillions(team.squadValue)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary bg-white bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                      {team.players.length}
                    </div>
                  </div>
                  <i className={`fas fa-chevron-${openPanel === team.id ? 'up' : 'down'} transition-transform duration-300 text-text-muted ${openPanel === team.id ? 'transform rotate-180' : ''}`}></i>
                </div>
              </div>
            </button>

            {/* Team Players */}
            {openPanel === team.id && (
              <div className="px-4 pb-4 border-t border-border-light mt-4 pt-4">
                {team.players.length > 0 ? (
                  <div className="grid gap-3">
                    {team.players.map((player) => (
                      <div key={player.id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 hover:from-gray-50 hover:to-gray-100 transition-all duration-300 cursor-pointer relative group shadow-sm hover:shadow-md transform hover:-translate-y-0.5 border border-gray-200"
                           onClick={() => handleShowPlayerDetail(player)}>
                        {/* FIFA Indicator with enhanced styling */}
                        <div className="absolute top-3 right-3 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg">
                          <span className="mr-1">🎮</span>
                          FIFA Stats
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-semibold text-lg text-text-primary group-hover:text-blue-600 transition-colors duration-300">
                                  {player.name}
                                </h4>
                                <div className="flex items-center space-x-3 mt-2">
                                  <span className={`${getPositionBadgeClass(player.position)} shadow-sm`}>
                                    {player.position}
                                  </span>
                                  {player.staerke && (
                                    <span className="text-sm text-text-muted bg-gray-100 px-2 py-1 rounded-md">
                                      💪 {player.staerke}
                                    </span>
                                  )}
                                  {player.value && (
                                    <span className="text-sm text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-md">
                                      💰 {formatCurrencyInMillions(player.value)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                  <i className="fas fa-info-circle mr-1"></i>
                                  Klicken für FIFA-Statistiken
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowPlayerDetail(player);
                              }}
                              className="text-blue-500 hover:text-blue-600 transition-all duration-200 p-2 rounded-full hover:bg-blue-50 transform hover:scale-110"
                              title="FIFA Statistics"
                            >
                              <i className="fas fa-chart-bar text-lg"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPlayer(player);
                              }}
                              className="text-gray-500 hover:text-green-600 transition-all duration-200 p-2 rounded-full hover:bg-green-50 transform hover:scale-110"
                              title="Bearbeiten"
                            >
                              <i className="fas fa-edit text-lg"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">{team.icon}</div>
                    <p className="text-text-muted">
                      Keine Spieler in {team.displayName}
                    </p>
                  </div>
                )}


              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enhanced Summary Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="modern-card text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105">
          <div className="text-3xl font-bold text-green-700 mb-1">
            {players?.length || 0}
          </div>
          <div className="text-sm text-green-600 font-medium flex items-center justify-center">
            <span className="mr-1">👥</span>
            Gesamt Spieler
          </div>
        </div>
        <div className="modern-card text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105">
          <div className="text-3xl font-bold text-orange-700 mb-1">
            {POSITIONS.length}
          </div>
          <div className="text-sm text-orange-600 font-medium flex items-center justify-center">
            <span className="mr-1">⚽</span>
            Positionen
          </div>
        </div>
      </div>

      {/* New Feature Modals */}
      {showExportImport && (
        <ExportImportManager onClose={() => setShowExportImport(false)} />
      )}
      
      {/* Player Detail Modal with FIFA Stats */}
      {showPlayerDetail && selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={showPlayerDetail}
          onClose={handleClosePlayerDetail}
        />
      )}
      
      {/* Player Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Spieler bearbeiten</h3>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <PlayerForm
                player={editingPlayer}
                onSave={handleSavePlayer}
                onCancel={() => setEditingPlayer(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Player form component for editing
function PlayerForm({ player, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: player.name || '',
    position: player.position || '',
    value: player.value || 0,
    team: player.team || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.position || !formData.team) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          placeholder="Spielername"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Position *
        </label>
        <select
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          required
        >
          <option value="">Position wählen</option>
          {POSITIONS.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Team *
        </label>
        <select
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          required
        >
          <option value="">Team wählen</option>
          <option value="AEK">AEK Athen</option>
          <option value="Real">Real Madrid</option>
          <option value="Ehemalige">Ehemalige</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Marktwert (in Millionen €)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          onFocus={(e) => e.target.select()}
          className="w-full px-3 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
          placeholder="0.0"
        />
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-green text-white py-2 px-4 rounded-lg hover:bg-primary-green/90 transition-colors"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-bg-secondary text-text-muted py-2 px-4 rounded-lg hover:bg-bg-tertiary transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}