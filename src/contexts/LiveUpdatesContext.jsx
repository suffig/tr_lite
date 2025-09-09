import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const LiveUpdatesContext = createContext();

// Mock live score data - in a real app this would come from an API
const MOCK_LIVE_MATCHES = [
  {
    id: 'live_1',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    minute: 67,
    events: [
      { minute: 23, type: 'GOAL', player: 'Benzema', team: 'home' },
      { minute: 45, type: 'GOAL', player: 'Pedri', team: 'away' },
      { minute: 58, type: 'GOAL', player: 'Vinicius Jr.', team: 'home' },
    ]
  },
  {
    id: 'live_2',
    homeTeam: 'Bayern München',
    awayTeam: 'Borussia Dortmund',
    homeScore: 0,
    awayScore: 0,
    status: 'LIVE',
    minute: 23,
    events: []
  }
];

export function LiveUpdatesProvider({ children }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [notifications, setNotifications] = useState([]);

  // Initialize with mock data
  useEffect(() => {
    setLiveMatches(MOCK_LIVE_MATCHES);
  }, []);

  // Simulate live updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateLiveScores();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const updateLiveScores = useCallback(() => {
    setLiveMatches(prevMatches => {
      return prevMatches.map(match => {
        if (match.status !== 'LIVE') return match;

        const updated = { ...match };
        updated.minute = Math.min(updated.minute + Math.floor(Math.random() * 5) + 1, 90);

        // Random chance for goals
        if (Math.random() < 0.1) { // 10% chance per update
          const scoringTeam = Math.random() < 0.5 ? 'home' : 'away';
          const players = {
            home: ['Benzema', 'Vinicius Jr.', 'Modric', 'Kroos'],
            away: ['Lewandowski', 'Pedri', 'Gavi', 'Raphinha']
          };
          
          const randomPlayer = players[scoringTeam][Math.floor(Math.random() * players[scoringTeam].length)];
          
          if (scoringTeam === 'home') {
            updated.homeScore += 1;
          } else {
            updated.awayScore += 1;
          }

          const goalEvent = {
            minute: updated.minute,
            type: 'GOAL',
            player: randomPlayer,
            team: scoringTeam
          };

          updated.events = [...updated.events, goalEvent];

          // Show goal notification
          showGoalAlert(updated, goalEvent);
        }

        // End match at 90+ minutes
        if (updated.minute >= 90) {
          updated.status = 'FINISHED';
          showMatchFinishedNotification(updated);
        }

        return updated;
      });
    });

    setLastUpdate(new Date());
  }, []);

  const showGoalAlert = (match, event) => {
    const teamName = event.team === 'home' ? match.homeTeam : match.awayTeam;
    const message = `⚽ GOAL! ${event.player} (${teamName}) - ${event.minute}'`;
    
    toast.success(message, {
      duration: 5000,
      icon: '⚽',
      style: {
        background: '#10B981',
        color: 'white',
        fontWeight: 'bold',
      }
    });

    // Add to notifications history
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'GOAL',
      message,
      timestamp: new Date(),
      match: match.id,
    }]);
  };

  const showMatchFinishedNotification = (match) => {
    const message = `🏁 Final: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`;
    
    toast(message, {
      duration: 8000,
      icon: '🏁',
      style: {
        background: '#6B7280',
        color: 'white',
      }
    });

    // Add to notifications history
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'MATCH_FINISHED',
      message,
      timestamp: new Date(),
      match: match.id,
    }]);
  };

  const addLiveMatch = (matchData) => {
    setLiveMatches(prev => [...prev, {
      ...matchData,
      id: `live_${Date.now()}`,
      status: 'LIVE',
      minute: 0,
      events: [],
      homeScore: 0,
      awayScore: 0,
    }]);
  };

  const removeLiveMatch = (matchId) => {
    setLiveMatches(prev => prev.filter(match => match.id !== matchId));
  };

  const getMatchSummary = (matchId) => {
    const match = liveMatches.find(m => m.id === matchId);
    if (!match) return null;

    return {
      ...match,
      summary: {
        totalGoals: match.homeScore + match.awayScore,
        goalScorers: match.events.filter(e => e.type === 'GOAL'),
        duration: match.status === 'FINISHED' ? '90+' : `${match.minute}'`,
      }
    };
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    // State
    liveMatches,
    isConnected,
    lastUpdate,
    notifications,
    
    // Actions
    addLiveMatch,
    removeLiveMatch,
    getMatchSummary,
    clearNotifications,
    updateLiveScores,
  };

  return (
    <LiveUpdatesContext.Provider value={value}>
      {children}
    </LiveUpdatesContext.Provider>
  );
}

export const useLiveUpdates = () => {
  const context = useContext(LiveUpdatesContext);
  if (!context) {
    throw new Error('useLiveUpdates must be used within a LiveUpdatesProvider');
  }
  return context;
};

export default LiveUpdatesContext;