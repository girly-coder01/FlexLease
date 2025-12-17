import express from 'express';
import { wss } from '../server.js';
import { EventStore } from '../services/eventStore.js';
import { processListingCreated } from '../handlers/listingHandlers.js';
import { processBookingCreated, processBookingApproved, processBookingRejected } from '../handlers/bookingHandlers.js';
import { processRentalStarted, processRentalCompleted } from '../handlers/rentalHandlers.js';

const router = express.Router();
const eventStore = new EventStore();

// Broadcast event to all WebSocket clients
function broadcastEvent(eventType, data) {
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Generic marketplace event handler (catches all contract calls)
router.post('/marketplace-event', async (req, res) => {
  try {
    const event = req.body;
    console.log('📥 Received marketplace event:', JSON.stringify(event, null, 2));

    // Store event
    await eventStore.storeEvent(event);

    // Route to specific handler based on function name
    const functionName = event?.apply?.[0]?.transaction?.metadata?.method;
    
    if (functionName) {
      // Broadcast to WebSocket clients
      broadcastEvent('marketplace-event', {
        function: functionName,
        txId: event?.apply?.[0]?.transaction?.transaction_identifier?.hash,
        ...event
      });
    }

    res.status(200).json({ success: true, message: 'Event received' });
  } catch (error) {
    console.error('Error processing marketplace event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listing created webhook
router.post('/listing-created', async (req, res) => {
  try {
    const event = req.body;
    console.log('📝 New listing created:', JSON.stringify(event, null, 2));

    // Process the event
    const processedData = await processListingCreated(event);

    // Store event
    await eventStore.storeEvent({
      type: 'listing-created',
      ...event,
      processedData
    });

    // Broadcast to WebSocket clients
    broadcastEvent('listing-created', processedData);

    res.status(200).json({ 
      success: true, 
      message: 'Listing created event processed',
      data: processedData 
    });
  } catch (error) {
    console.error('Error processing listing-created:', error);
    res.status(500).json({ error: error.message });
  }
});

// Booking created webhook
router.post('/booking-created', async (req, res) => {
  try {
    const event = req.body;
    console.log('📅 New booking created:', JSON.stringify(event, null, 2));

    const processedData = await processBookingCreated(event);

    await eventStore.storeEvent({
      type: 'booking-created',
      ...event,
      processedData
    });

    broadcastEvent('booking-created', processedData);

    res.status(200).json({ 
      success: true, 
      message: 'Booking created event processed',
      data: processedData 
    });
  } catch (error) {
    console.error('Error processing booking-created:', error);
    res.status(500).json({ error: error.message });
  }
});

// Booking approved webhook
router.post('/booking-approved', async (req, res) => {
  try {
    const event = req.body;
    console.log('✅ Booking approved:', JSON.stringify(event, null, 2));

    const processedData = await processBookingApproved(event);

    await eventStore.storeEvent({
      type: 'booking-approved',
      ...event,
      processedData
    });

    broadcastEvent('booking-approved', processedData);

    res.status(200).json({ 
      success: true, 
      message: 'Booking approved event processed',
      data: processedData 
    });
  } catch (error) {
    console.error('Error processing booking-approved:', error);
    res.status(500).json({ error: error.message });
  }
});

// Booking rejected webhook
router.post('/booking-rejected', async (req, res) => {
  try {
    const event = req.body;
    console.log('❌ Booking rejected:', JSON.stringify(event, null, 2));

    const processedData = await processBookingRejected(event);

    await eventStore.storeEvent({
      type: 'booking-rejected',
      ...event,
      processedData
    });

    broadcastEvent('booking-rejected', processedData);

    res.status(200).json({ 
      success: true, 
      message: 'Booking rejected event processed',
      data: processedData 
    });
  } catch (error) {
    console.error('Error processing booking-rejected:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rental started webhook
router.post('/rental-started', async (req, res) => {
  try {
    const event = req.body;
    console.log('🚀 Rental started:', JSON.stringify(event, null, 2));

    const processedData = await processRentalStarted(event);

    await eventStore.storeEvent({
      type: 'rental-started',
      ...event,
      processedData
    });

    broadcastEvent('rental-started', processedData);

    res.status(200).json({ 
      success: true, 
      message: 'Rental started event processed',
      data: processedData 
    });
  } catch (error) {
    console.error('Error processing rental-started:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rental completed webhook
router.post('/rental-completed', async (req, res) => {
  try {
    const event = req.body;
    console.log('🎉 Rental completed:', JSON.stringify(event, null, 2));

    const processedData = await processRentalCompleted(event);

    await eventStore.storeEvent({
      type: 'rental-completed',
      ...event,
      processedData
    });

    broadcastEvent('rental-completed', processedData);

    res.status(200).json({ 
      success: true, 
      message: 'Rental completed event processed',
      data: processedData 
    });
  } catch (error) {
    console.error('Error processing rental-completed:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as webhookRouter };
