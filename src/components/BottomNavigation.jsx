import { useState, useEffect } from 'react';

const baseTabs = [
  { id: 'matches', icon: '⚽', label: 'Spiele', ariaLabel: 'Zu Spiele-Übersicht wechseln' },
  { id: 'bans', icon: '🚫', label: 'Bans', ariaLabel: 'Zu Bans-Übersicht wechseln' },
  { id: 'finanzen', icon: '€', label: 'Finanzen', ariaLabel: 'Zu Finanzen-Übersicht wechseln' },
  { id: 'squad', icon: '👥', label: 'Kader', ariaLabel: 'Zu Kader-Übersicht wechseln' },
  { id: 'stats', icon: '📊', label: 'Stats', ariaLabel: 'Zu Statistik-Übersicht wechseln' },
  { id: 'events', icon: '🎉', label: 'Events', ariaLabel: 'Zu Events-Übersicht wechseln' },
  { id: 'alcohol', icon: '🍺🃏', label: 'Alkohol & Blackjack', ariaLabel: 'Zu Alkohol & Blackjack-Tracker wechseln' },
  { id: 'admin', icon: '⚙️', label: 'Verwaltung', ariaLabel: 'Zu Verwaltung wechseln' },
];

export default function BottomNavigation({ activeTab, onTabChange }) {
  const [tabs, setTabs] = useState(baseTabs);

  useEffect(() => {
    // Check if events tab should be shown
    const eventsEnabled = localStorage.getItem('eventsTabEnabled');
    const showEvents = eventsEnabled !== null ? JSON.parse(eventsEnabled) : false;
    
    if (showEvents) {
      setTabs(baseTabs);
    } else {
      // Filter out the events tab
      setTabs(baseTabs.filter(tab => tab.id !== 'events'));
    }
  }, []);

  return (
    <nav 
      className="enhanced-bottom-nav fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-light shadow-lg z-50 safe-area-bottom ios-touch"
      role="navigation"
      aria-label="Hauptnavigation"
    >
      <div className="nav-background-glow"></div>
      <div className="flex items-center px-1 py-2 overflow-x-auto scrollbar-hide bottom-nav-container relative ios-scroll-smooth">
        <div className="nav-active-indicator" style={{
          transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`,
          width: `${100 / tabs.length}%`
        }}></div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item-enhanced flex flex-col items-center justify-center rounded-lg transition-all duration-300 hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-opacity-50 ios-touch-button touch-target flex-shrink-0 relative overflow-hidden ${
              activeTab === tab.id ? 'active text-primary-green' : 'text-text-muted'
            }`}
            aria-label={tab.ariaLabel}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            style={{ minHeight: '56px', minWidth: '56px' }}
          >
            <div className="nav-ripple"></div>
            <div className={`nav-icon text-lg mb-1 select-none transition-transform duration-300 ${
              activeTab === tab.id ? 'scale-110 animate-bounce-gentle' : 'scale-100'
            }`} aria-hidden="true">{tab.icon}</div>
            <span className={`nav-label text-xs font-medium select-none text-center truncate max-w-[60px] transition-all duration-300 ${
              activeTab === tab.id ? 'opacity-100 transform translate-y-0' : 'opacity-70 transform translate-y-1'
            }`}>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="nav-active-dot absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary-green rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}