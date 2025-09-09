import React, { useState } from 'react';
import { useLiveUpdates } from '../contexts/LiveUpdatesContext';
import { useTheme } from '../contexts/ThemeContext';

const LiveScoreWidget = ({ isMinimized = false, onToggleMinimize }) => {
  const { liveMatches, isConnected, lastUpdate, notifications } = useLiveUpdates();
  const { theme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const formatTime = (date) => {
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE':
        return 'text-green-500';
      case 'FINISHED':
        return 'text-gray-500';
      default:
        return 'text-blue-500';
    }
  };

  const getStatusText = (match) => {
    if (match.status === 'LIVE') {
      return `${match.minute}'`;
    }
    if (match.status === 'FINISHED') {
      return 'FINAL';
    }
    return match.status;
  };

  if (isMinimized) {
    return (
      <div 
        className="fixed top-4 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 cursor-pointer"
        onClick={onToggleMinimize}
        style={{ backgroundColor: theme.surface }}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium" style={{ color: theme.text }}>
            {liveMatches.filter(m => m.status === 'LIVE').length} Live
          </span>
          {notifications.length > 0 && (
            <div className="w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed top-4 right-4 z-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-80 max-h-96 overflow-hidden"
      style={{ backgroundColor: theme.surface }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="font-bold text-lg" style={{ color: theme.text }}>
            Live Scores
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-lg">🔔</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </div>
            </button>
          )}
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-500">−</span>
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
          <h4 className="font-semibold text-sm mb-2" style={{ color: theme.text }}>
            Benachrichtigungen
          </h4>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">Keine neuen Benachrichtigungen</p>
          ) : (
            <div className="space-y-1">
              {notifications.slice(-3).reverse().map(notification => (
                <div key={notification.id} className="text-xs p-2 bg-white dark:bg-gray-600 rounded">
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-gray-500">{formatTime(notification.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Matches */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {liveMatches.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⚽</div>
            <p className="text-gray-500">Keine Live-Spiele</p>
          </div>
        ) : (
          liveMatches.map(match => (
            <div 
              key={match.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4"
              style={{ 
                borderLeftColor: match.status === 'LIVE' ? theme.primary : theme.textSecondary 
              }}
            >
              {/* Match Header */}
              <div className="flex items-center justify-between mb-2">
                <span 
                  className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(match.status)}`}
                  style={{ 
                    backgroundColor: match.status === 'LIVE' ? `${theme.primary}20` : 'transparent' 
                  }}
                >
                  {getStatusText(match)}
                </span>
                {match.status === 'LIVE' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-red-500 font-medium">LIVE</span>
                  </div>
                )}
              </div>

              {/* Teams and Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: theme.text }}>
                    {match.homeTeam}
                  </span>
                  <span className="font-bold text-lg" style={{ color: theme.text }}>
                    {match.homeScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: theme.text }}>
                    {match.awayTeam}
                  </span>
                  <span className="font-bold text-lg" style={{ color: theme.text }}>
                    {match.awayScore}
                  </span>
                </div>
              </div>

              {/* Recent Events */}
              {match.events.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="space-y-1">
                    {match.events.slice(-2).map((event, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <span>⚽</span>
                        <span style={{ color: theme.textSecondary }}>
                          {event.minute}' {event.player}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs" style={{ color: theme.textSecondary }}>
          <span>Letzte Aktualisierung</span>
          <span>{formatTime(lastUpdate)}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveScoreWidget;