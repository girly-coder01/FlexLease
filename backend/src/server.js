import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { webhookRouter } from './routes/webhooks.js';
import { eventsRouter } from './routes/events.js';
import { verifyWebhookAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'flexlease-backend'
  });
});

// Webhook routes (protected with auth middleware)
app.use('/webhooks', verifyWebhookAuth, webhookRouter);

// Public events API routes
app.use('/api/events', eventsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 FlexLease Backend Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Stacks Network: ${process.env.STACKS_NETWORK || 'testnet'}`);
});

// WebSocket Server for real-time updates
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to FlexLease real-time events',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Export WebSocket server for use in webhook handlers
export { wss };

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
});

export default app;
