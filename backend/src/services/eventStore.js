// In-memory event store (replace with database in production)
class EventStore {
  constructor() {
    this.events = [];
    this.maxEvents = 10000; // Keep last 10k events in memory
  }

  async storeEvent(event) {
    const eventRecord = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...event
    };

    this.events.unshift(eventRecord);

    // Trim if exceeds max
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    return eventRecord;
  }

  async getEvents({ type, limit = 50, offset = 0 }) {
    let filtered = this.events;

    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }

    return filtered.slice(offset, offset + limit);
  }

  async getEventByTxId(txId) {
    return this.events.find(e => 
      e?.apply?.[0]?.transaction?.transaction_identifier?.hash === txId
    );
  }

  async getEventsByType(type, { limit = 50, offset = 0 }) {
    const filtered = this.events.filter(e => e.type === type);
    return filtered.slice(offset, offset + limit);
  }

  async getRecentEvents(hours = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return this.events.filter(e => 
      new Date(e.timestamp) >= cutoffTime
    );
  }

  async getStats() {
    const stats = {
      total: this.events.length,
      byType: {},
      last24Hours: 0
    };

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    this.events.forEach(event => {
      // Count by type
      const type = event.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count last 24 hours
      if (new Date(event.timestamp) >= cutoffTime) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { EventStore };
