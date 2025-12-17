# FlexLease Backend

Backend server for handling Chainhook webhooks and providing real-time event streaming via WebSocket.

## Features

- ✅ Webhook endpoints for Chainhook events
- ✅ WebSocket server for real-time updates
- ✅ Event storage and retrieval
- ✅ REST API for event queries
- ✅ Authentication middleware

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

### Webhooks (Protected)
- `POST /webhooks/listing-created` - Listing created event
- `POST /webhooks/booking-created` - Booking created event
- `POST /webhooks/rental-started` - Rental started event

### Public API
- `GET /api/events` - Get all events
- `GET /api/events/type/:type` - Get events by type
- `GET /api/events/stats` - Get statistics

## WebSocket

Connect to `ws://localhost:3002` to receive real-time events.

## Development

```bash
npm run dev     # Start with nodemon
npm start       # Production start
```
