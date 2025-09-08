import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Real-time notification system for FIFA Tracker
export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const notificationId = useRef(0);

  // Initialize notification system
  useEffect(() => {
    // Check if notifications are supported and request permission
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setIsEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setIsEnabled(permission === 'granted');
        });
      }
    }

    // Listen for custom events to trigger notifications
    const handleNotificationEvent = (event) => {
      const { type, data } = event.detail;
      showNotification(type, data);
    };

    window.addEventListener('fifa-notification', handleNotificationEvent);
    return () => window.removeEventListener('fifa-notification', handleNotificationEvent);
  }, []);

  const showNotification = (type, data) => {
    const id = ++notificationId.current;
    const notification = {
      id,
      type,
      title: getNotificationTitle(type, data),
      message: getNotificationMessage(type, data),
      timestamp: new Date(),
      read: false,
      data
    };

    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep max 10 notifications

    // Show browser notification if enabled
    if (isEnabled && document.hidden) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icon-180.png',
        badge: '/assets/icon-180.png',
        tag: `fifa-tracker-${type}`,
        requireInteraction: type === 'match-result',
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      });
    }

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const getNotificationTitle = (type, data) => {
    switch (type) {
      case 'match-created':
        return '⚽ Neues Spiel erstellt';
      case 'match-result':
        return `🏆 Spielergebnis: AEK ${data.goalsa} - ${data.goalsb} Real`;
      case 'player-ban':
        return '🚫 Spieler gesperrt';
      case 'financial-milestone':
        return '💰 Finanzmeilenstein erreicht';
      case 'achievement-unlocked':
        return '🏅 Achievement freigeschaltet';
      case 'system-update':
        return '🔄 System aktualisiert';
      default:
        return '📢 FIFA Tracker';
    }
  };

  const getNotificationMessage = (type, data) => {
    switch (type) {
      case 'match-created':
        return `Spiel vom ${new Date(data.date).toLocaleDateString('de-DE')} wurde hinzugefügt`;
      case 'match-result':
        return data.manofthematch ? `Spieler des Spiels: ${data.manofthematch}` : 'Spiel beendet';
      case 'player-ban':
        return `${data.playerName} wurde für ${data.games} Spiele gesperrt`;
      case 'financial-milestone':
        return `${data.team} hat ${data.amount}M € erreicht`;
      case 'achievement-unlocked':
        return `"${data.name}" - ${data.description}`;
      case 'system-update':
        return data.message || 'Die Anwendung wurde aktualisiert';
      default:
        return 'Neue Aktivität im FIFA Tracker';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            pointer-events-auto max-w-sm w-full bg-white rounded-lg shadow-lg border
            transform transition-all duration-300 ease-out
            ${notification.read ? 'opacity-70' : 'opacity-100'}
            hover:scale-105 hover:shadow-xl
          `}
          onClick={() => markAsRead(notification.id)}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`
                  w-3 h-3 rounded-full mt-1
                  ${notification.read ? 'bg-gray-400' : getNotificationColor(notification.type)}
                `} />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {notification.timestamp.toLocaleTimeString('de-DE')}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                }}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {notifications.length > 1 && (
        <div className="pointer-events-auto flex justify-end">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 bg-white px-2 py-1 rounded shadow"
          >
            Alle löschen
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

const getNotificationColor = (type) => {
  switch (type) {
    case 'match-created':
    case 'match-result':
      return 'bg-green-500';
    case 'player-ban':
      return 'bg-red-500';
    case 'financial-milestone':
      return 'bg-yellow-500';
    case 'achievement-unlocked':
      return 'bg-purple-500';
    case 'system-update':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper function to trigger notifications from anywhere in the app
export const triggerNotification = (type, data) => {
  const event = new CustomEvent('fifa-notification', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
};