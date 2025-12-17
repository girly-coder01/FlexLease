import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useEvents(options = {}) {
  const { type, limit = 50, autoRefresh = false } = options;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = type 
        ? `${API_URL}/api/events/type/${type}?limit=${limit}`
        : `${API_URL}/api/events?limit=${limit}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [type, limit, autoRefresh]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents
  };
}

export async function fetchEventById(eventId) {
  const response = await fetch(`${API_URL}/api/events/${eventId}`);
  const data = await response.json();
  return data;
}

export async function fetchEventStats() {
  const response = await fetch(`${API_URL}/api/events/stats`);
  const data = await response.json();
  return data;
}
