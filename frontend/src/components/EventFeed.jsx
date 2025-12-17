import { useWebSocket } from '../hooks/useWebSocket';
import './EventFeed.css';

export function EventFeed() {
  const { isConnected, events } = useWebSocket();

  const getEventIcon = (type) => {
    switch (type) {
      case 'listing-created': return '📝';
      case 'booking-created': return '📅';
      case 'booking-approved': return '✅';
      case 'booking-rejected': return '❌';
      case 'rental-started': return '🚀';
      case 'rental-completed': return '🎉';
      case 'connection': return '🔌';
      default: return '📡';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="event-feed">
      <div className="event-feed-header">
        <h2>Live Event Feed</h2>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="events-list">
        {events.length === 0 ? (
          <div className="no-events">
            <p>Waiting for events...</p>
            <p className="hint">Events will appear here in real-time when contract calls are made.</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div key={index} className="event-item">
              <div className="event-icon">{getEventIcon(event.type)}</div>
              <div className="event-content">
                <div className="event-type">{event.type}</div>
                <div className="event-timestamp">{formatTimestamp(event.timestamp)}</div>
                {event.data && (
                  <div className="event-details">
                    <pre>{JSON.stringify(event.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
