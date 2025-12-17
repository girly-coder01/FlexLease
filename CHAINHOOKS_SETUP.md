# FlexLease Chainhooks Implementation

This guide explains how to set up and run the FlexLease application with Hiro Chainhooks for real-time blockchain event monitoring.

## 🏗️ Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────┐
│   Stacks    │─────▶│ Chainhooks   │─────▶│   Backend   │─────▶│ Frontend │
│ Blockchain  │      │   Service    │      │  (Webhooks) │      │   (WS)   │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────┘
     ▲                                             │
     │                                             ▼
     │                                      ┌─────────────┐
     └──────────────────────────────────────│  Event DB   │
                                            └─────────────┘
```

## 📋 Prerequisites

- Node.js v18+ and npm
- Docker and Docker Compose (for Chainhooks)
- Stacks contract deployed on testnet/mainnet
- Git

## 🚀 Quick Start

### 1. Install Chainhooks

```bash
# Using Docker (recommended)
docker pull hirosystems/chainhook:latest

# OR install from source
cargo install chainhook
```

### 2. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
nano .env  # Edit with your settings

# Start the backend server
npm run dev
```

The backend will run on:
- HTTP API: `http://localhost:3001`
- WebSocket: `ws://localhost:3002`

### 3. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Deploy Chainhooks

```bash
# Start Chainhooks service with Docker Compose
cd chainhooks
docker-compose up -d
```

Or manually:

```bash
# Register a chainhook predicate
chainhook predicates register \
  --predicate-path=./chainhooks/rental-marketplace.json \
  --network=testnet

# Start the chainhook service
chainhook service start \
  --predicate-path=./chainhooks \
  --network=testnet
```

## 📁 Project Structure

```
FlexLease/
├── chainhooks/
│   ├── rental-marketplace.json    # Listing events
│   ├── booking-events.json        # Booking events
│   ├── rental-lifecycle.json      # Rental lifecycle events
│   └── predicates.json            # All marketplace events
├── backend/
│   ├── src/
│   │   ├── server.js              # Main server + WebSocket
│   │   ├── routes/
│   │   │   ├── webhooks.js        # Chainhook webhook handlers
│   │   │   └── events.js          # Public API routes
│   │   ├── handlers/
│   │   │   ├── listingHandlers.js # Listing event processors
│   │   │   ├── bookingHandlers.js # Booking event processors
│   │   │   └── rentalHandlers.js  # Rental event processors
│   │   ├── services/
│   │   │   └── eventStore.js      # Event storage service
│   │   └── middleware/
│   │       └── auth.js            # Webhook authentication
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.tsx                # Main app component
    │   ├── components/
    │   │   ├── EventFeed.jsx      # Real-time event feed
    │   │   └── EventFeed.css
    │   └── hooks/
    │       ├── useWebSocket.js    # WebSocket hook
    │       └── useEvents.js       # Events API hook
    ├── package.json
    └── .env.example
```

## 🔧 Configuration

### Chainhook Predicates

Each predicate file defines what events to monitor:

```json
{
  "chain": "stacks",
  "uuid": "unique-identifier",
  "name": "Event Name",
  "networks": {
    "testnet": {
      "if_this": {
        "scope": "contract_call",
        "contract_identifier": "ST1XXX.rental-marketplace",
        "method": "create-listing"
      },
      "then_that": {
        "http_post": {
          "url": "http://localhost:3001/webhooks/listing-created",
          "authorization_header": "Bearer YOUR_SECRET_TOKEN"
        }
      }
    }
  }
}
```

### Environment Variables

**Backend (.env)**:
```env
PORT=3001
CHAINHOOK_SECRET_TOKEN=your-secret-token
STACKS_NETWORK=testnet
RENTAL_MARKETPLACE_CONTRACT=ST1XXX.rental-marketplace
WS_PORT=3002
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3002
VITE_STACKS_NETWORK=testnet
VITE_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

## 🎯 Event Flow

1. **User makes contract call** → Smart contract function executed
2. **Chainhooks detects event** → Matches predicate conditions
3. **Webhook triggered** → POST request to backend endpoint
4. **Backend processes** → Extracts data, stores event
5. **WebSocket broadcast** → Real-time push to connected clients
6. **Frontend updates** → UI automatically refreshes with new data

## 📡 API Endpoints

### Backend API

#### Health Check
```bash
GET /health
```

#### Webhook Endpoints (Protected)
```bash
POST /webhooks/marketplace-event
POST /webhooks/listing-created
POST /webhooks/booking-created
POST /webhooks/booking-approved
POST /webhooks/rental-started
POST /webhooks/rental-completed
```

#### Public API Endpoints
```bash
GET /api/events                    # Get all events
GET /api/events/type/:type         # Get events by type
GET /api/events/tx/:txId           # Get event by transaction ID
GET /api/events/recent             # Get recent events (24h)
GET /api/events/stats              # Get event statistics
```

## 🧪 Testing

### Test Contract Calls

```bash
# Create a listing (using Stacks CLI)
stx call_contract_func \
  ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.rental-marketplace \
  create-listing \
  -a u1 u1000000 u1 \
  --network testnet

# You should see the event appear in the frontend immediately!
```

### Manual Webhook Testing

```bash
# Test webhook endpoint directly
curl -X POST http://localhost:3001/webhooks/listing-created \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "apply": [{
      "transaction": {
        "transaction_identifier": {"hash": "0x123"},
        "metadata": {
          "sender": "ST1XXX",
          "method": "create-listing",
          "args": ["u1", "u1000000", "u1"]
        }
      },
      "block_identifier": {"index": 12345}
    }]
  }'
```

## 🔍 Monitoring

### View Chainhooks Logs
```bash
docker logs -f chainhooks
```

### View Backend Logs
```bash
cd backend
npm run dev  # Logs will show incoming webhooks
```

### WebSocket Connection Test
```javascript
const ws = new WebSocket('ws://localhost:3002');
ws.onmessage = (event) => console.log('Event:', JSON.parse(event.data));
```

## 🎨 Frontend Usage

The frontend automatically connects to the WebSocket server and displays events in real-time:

```jsx
import { EventFeed } from './components/EventFeed';

function App() {
  return <EventFeed />;
}
```

## 🚢 Production Deployment

### 1. Update Contract Identifiers

Replace testnet addresses with mainnet:
```json
"contract_identifier": "SP1XXX.rental-marketplace"
```

### 2. Secure Webhook Endpoints

- Use strong, random tokens
- Enable HTTPS
- Implement rate limiting
- Add request signing

### 3. Use Production Database

Replace in-memory storage with PostgreSQL/MongoDB:
```javascript
// In eventStore.js
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### 4. Deploy Services

- Backend: Heroku, Railway, AWS
- Frontend: Vercel, Netlify
- Chainhooks: Docker on VPS, AWS ECS

## 📚 Resources

- [Hiro Chainhooks Documentation](https://docs.hiro.so/chainhooks)
- [Stacks Blockchain API](https://docs.hiro.so/api)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

## 🐛 Troubleshooting

### Chainhook Not Triggering
- Verify contract address is correct
- Check predicate syntax
- Ensure Chainhook service is running
- Check authorization token matches

### WebSocket Not Connecting
- Verify WS_PORT is correct
- Check firewall rules
- Ensure backend is running
- Check CORS settings

### Events Not Showing
- Check backend logs for webhook receipts
- Verify WebSocket connection status
- Test with manual webhook call
- Check browser console for errors

## 🤝 Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## 📄 License

MIT License - see LICENSE file for details
