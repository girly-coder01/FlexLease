import express from 'express';
import { EventStore } from '../services/eventStore.js';

const router = express.Router();
const eventStore = new EventStore();

// Get all events with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    
    const events = await eventStore.getEvents({
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: events,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: events.length
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events by transaction ID
router.get('/tx/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    const event = await eventStore.getEventByTxId(txId);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get events by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const events = await eventStore.getEventsByType(type, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: events,
      type,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent events (last 24 hours)
router.get('/recent', async (req, res) => {
  try {
    const events = await eventStore.getRecentEvents(24);

    res.json({
      success: true,
      data: events,
      period: '24 hours',
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get event statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await eventStore.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as eventsRouter };
