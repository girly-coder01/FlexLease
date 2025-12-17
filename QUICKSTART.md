# FlexLease - Quick Start Guide

## 🎯 What You Have

A complete real-time blockchain event monitoring system for your FlexLease rental marketplace using Hiro Chainhooks.

## ⚡ Quick Start (3 Steps)

### Step 1: Install & Configure

```bash
# Clone and navigate to project
cd FlexLease

# Set up backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings

# Set up frontend
cd ../frontend
npm install
cp .env.example .env
```

### Step 2: Start Services

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend  
cd frontend
npm run dev

# Terminal 3: Start Chainhooks (with Docker)
docker run -v $(pwd)/chainhooks:/predicates \
  hirosystems/chainhook:latest \
  service start --predicate-path=/predicates --network=testnet
```

### Step 3: Test It!

Visit `http://localhost:5173` and make a contract call:

```bash
stx call_contract_func \
  ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.rental-marketplace \
  create-listing \
  -a u1 u1000000 u1 \
  --network testnet
```

You should see the event appear instantly in your frontend! 🎉

## 📖 Full Documentation

See [CHAINHOOKS_SETUP.md](./CHAINHOOKS_SETUP.md) for complete details.

## 🔧 What's Included

- ✅ Chainhook predicates for all marketplace events
- ✅ Backend webhook server with WebSocket support
- ✅ Event processing handlers
- ✅ Real-time frontend event feed
- ✅ API endpoints for querying events
- ✅ Docker Compose setup
- ✅ Complete documentation

## 📁 Key Files

```
chainhooks/          # Chainhook predicate configurations
backend/src/         # Backend server & event handlers
frontend/src/        # React frontend with WebSocket
docker-compose.yml   # Production deployment
CHAINHOOKS_SETUP.md  # Complete guide
```

## 🎨 Features

- 📡 Real-time event streaming
- 🔌 WebSocket live updates
- 📊 Event history & statistics
- 🔍 Event search & filtering
- 🐳 Docker deployment ready
- 🔒 Secure webhook authentication

## 🆘 Need Help?

Check the [Troubleshooting](./CHAINHOOKS_SETUP.md#-troubleshooting) section or open an issue.

Happy building! 🚀
