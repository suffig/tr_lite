import { useState, Suspense, lazy, useEffect } from 'react';
import * as React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { OfflineIndicator } from './hooks/useOfflineManager.jsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { LiveUpdatesProvider } from './contexts/LiveUpdatesContext';
import { ReportsProvider } from './contexts/ReportsContext';
import Login from './components/Login';
import BottomNavigation from './components/BottomNavigation';
import LoadingSpinner, { FullScreenLoader } from './components/LoadingSpinner';
import GlobalSearch from './components/GlobalSearch';
import PerformanceMonitor from './components/PerformanceMonitor';
import NotificationSystem from './components/NotificationSystem';
import LiveScoreWidget from './components/LiveScoreWidget';
import ThemeSettings from './components/ThemeSettings';
import SlotMachine from './components/SlotMachine';

// Lazy load tab components for better performance
const MatchesTab = lazy(() => import('./components/tabs/MatchesTab'));
const KaderTab = lazy(() => import('./components/tabs/KaderTab'));
const BansTab = lazy(() => import('./components/tabs/BansTab'));
const FinanzenTab = lazy(() => import('./components/tabs/FinanzenTab'));
const StatsTab = lazy(() => import('./components/tabs/StatsTab'));
const AlcoholTrackerTab = lazy(() => import('./components/tabs/AlcoholTrackerTab'));
const AdminTab = lazy(() => import('./components/tabs/AdminTab'));

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('matches');
  const [tabLoading, setTabLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showLiveScores, setShowLiveScores] = useState(true);
  const [isLiveScoresMinimized, setIsLiveScoresMinimized] = useState(false);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [accountBalance, setAccountBalance] = useState(1000); // Mock account balance

  // Load account balance from localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem('fifa-tracker-account-balance');
    if (savedBalance) {
      setAccountBalance(parseFloat(savedBalance));
    }
  }, []);

  // Save account balance
  useEffect(() => {
    localStorage.setItem('fifa-tracker-account-balance', accountBalance.toString());
  }, [accountBalance]);

  // Check if we're in demo mode
  useEffect(() => {
    const checkDemoMode = () => {
      // Check if user has demo metadata or if there are demo-related console logs
      const demoMode = user?.user_metadata?.demo_mode || 
                       localStorage.getItem('supabase.auth.token')?.includes('demo-token');
      setIsDemoMode(demoMode);
    };
    
    checkDemoMode();
    
    // Listen for demo mode changes
    const interval = setInterval(checkDemoMode, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleTabChange = async (newTab, options = {}) => {
    if (newTab === activeTab && !options.force) return;
    
    setTabLoading(true);
    // Add small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    setActiveTab(newTab);
    setTabLoading(false);

    // Handle navigation options
    if (options.action) {
      // Pass action to the tab component somehow
      setTimeout(() => {
        if (options.action === 'add') {
          // Trigger add action in the respective tab
          const event = new CustomEvent('fifa-tracker-action', { 
            detail: { tab: newTab, action: 'add', ...options } 
          });
          window.dispatchEvent(event);
        }
      }, 300);
    }
  };

  // Global search shortcut and event listener - only work on admin page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k' && activeTab === 'admin') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      // Theme settings shortcut
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setShowThemeSettings(true);
      }
      // Slot machine shortcut
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setShowSlotMachine(true);
      }
    };

    const handleGlobalSearchToggle = () => {
      if (activeTab === 'admin') {
        setShowGlobalSearch(true);
      }
    };

    // Listen for custom events
    const handleShowSlotMachine = () => setShowSlotMachine(true);
    const handleShowThemeSettings = () => setShowThemeSettings(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('global-search-toggle', handleGlobalSearchToggle);
    window.addEventListener('show-slot-machine', handleShowSlotMachine);
    window.addEventListener('show-theme-settings', handleShowThemeSettings);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('global-search-toggle', handleGlobalSearchToggle);
      window.removeEventListener('show-slot-machine', handleShowSlotMachine);
      window.removeEventListener('show-theme-settings', handleShowThemeSettings);
    };
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGlobalSearchNavigate = (tab, action) => {
    handleTabChange(tab, action);
    setShowGlobalSearch(false);
  };

  const renderTabContent = () => {
    const showHints = activeTab === 'admin';
    const props = { 
      onNavigate: handleTabChange, 
      showHints,
      accountBalance,
      onShowSlotMachine: () => setShowSlotMachine(true),
      onShowThemeSettings: () => setShowThemeSettings(true),
    };
    
    switch (activeTab) {
      case 'matches':
        return <MatchesTab {...props} />;
      case 'bans':
        return <BansTab {...props} />;
      case 'finanzen':
        return <FinanzenTab {...props} />;
      case 'squad':
        return <KaderTab {...props} />;
      case 'stats':
        return <StatsTab {...props} />;
      case 'alcohol':
        return <AlcoholTrackerTab {...props} />;
      case 'admin':
        return <AdminTab onLogout={handleLogout} onShowSlotMachine={() => setShowSlotMachine(true)} onShowThemeSettings={() => setShowThemeSettings(true)} {...props} />;
      default:
        return <MatchesTab {...props} />;
    }
  };

  if (authLoading) {
    return <FullScreenLoader message="Lade Anwendung..." />;
  }

  if (!user) {
    return (
      <ThemeProvider>
        <Login />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LiveUpdatesProvider>
        <ReportsProvider>
          <div className="flex flex-col min-h-screen bg-bg-primary">
            {/* Offline Status Indicator - Only show on admin page */}
            {activeTab === 'admin' && <OfflineIndicator />}
            
            {/* Connection Status Indicator - Only show on admin page */}
            {isDemoMode && activeTab === 'admin' && (
              <div className="bg-warning border-yellow-400 text-yellow-900 px-4 py-2 text-center text-sm font-medium" role="alert">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">⚠️</span>
                  Demo-Modus aktiv - Supabase CDN blockiert
                </span>
              </div>
            )}
            
            {/* Live Score Widget */}
            {showLiveScores && (
              <LiveScoreWidget
                isMinimized={isLiveScoresMinimized}
                onToggleMinimize={() => setIsLiveScoresMinimized(!isLiveScoresMinimized)}
              />
            )}
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto scroll-smooth" role="main">
              <Suspense fallback={<LoadingSpinner message="Lade Tab..." />}>
                {tabLoading ? (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <LoadingSpinner message="Wechsle Tab..." />
                  </div>
                ) : (
                  <ErrorBoundary>
                    {renderTabContent()}
                  </ErrorBoundary>
                )}
              </Suspense>
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation 
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {/* Toast Notifications */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#FFFFFF',
                  color: '#1E293B',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                success: {
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#6B7280',
                    secondary: '#FFFFFF',
                  },
                },
              }}
              containerStyle={{
                zIndex: 9999,
              }}
            />

            {/* Global Search Modal - Only available on admin page */}
            {showGlobalSearch && activeTab === 'admin' && (
              <GlobalSearch 
                onNavigate={handleGlobalSearchNavigate}
                onClose={() => setShowGlobalSearch(false)}
              />
            )}

            {/* Theme Settings Modal */}
            {showThemeSettings && (
              <ThemeSettings onClose={() => setShowThemeSettings(false)} />
            )}

            {/* Slot Machine Modal */}
            {showSlotMachine && (
              <SlotMachine
                isOpen={showSlotMachine}
                onClose={() => setShowSlotMachine(false)}
                accountBalance={accountBalance}
                onBalanceUpdate={setAccountBalance}
              />
            )}

            {/* Performance Monitor - Only show on admin page */}
            {activeTab === 'admin' && <PerformanceMonitor />}

            {/* Global Notification System */}
            <NotificationSystem />
          </div>
        </ReportsProvider>
      </LiveUpdatesProvider>
    </ThemeProvider>
  );
}

// Error Boundary Component
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="alert alert-error max-w-md text-center">
          <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Etwas ist schiefgelaufen</h3>
          <p className="text-sm mb-4">
            Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
            aria-label="Seite neu laden"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default App;