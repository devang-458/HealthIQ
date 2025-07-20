import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Redis from 'ioredis';

// Load environment variables
dotenv.config({ path: '../../.env' });

// Import routes
import healthRoutes from './routes/health';
import activityRoutes from './routes/activity';
import predictionRoutes from './routes/prediction';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notification';
import labResultsRoutes from './routes/lab-results';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/lab-results', authMiddleware, labResultsRoutes);

// Make io and redis accessible to routes
app.use((req, res, next) => {
  req.io = io;
  req.redis = redis;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/health', authMiddleware, healthRoutes);
app.use('/api/activities', authMiddleware, activityRoutes);
app.use('/api/predictions', authMiddleware, predictionRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// Error handling
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      // Verify JWT token
      const decoded = await verifyToken(token);
      if (decoded && decoded.userId) {
        // Join user-specific room
        socket.join(`user:${decoded.userId}`);
        socket.emit('authenticated', { userId: decoded.userId });
        
        // Store connection in Redis
        await redis.set(`socket:${decoded.userId}`, socket.id, 'EX', 3600);
      }
    } catch (error) {
      socket.emit('authentication_error', { message: 'Invalid token' });
    }
  });

  socket.on('subscribe_health_updates', (userId) => {
    socket.join(`health:${userId}`);
  });

  socket.on('disconnect', async () => {
    console.log('WebSocket disconnected:', socket.id);
    // Clean up Redis connection data
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 Redis connected to ${process.env.REDIS_HOST || 'localhost'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    redis.disconnect();
  });
});

// Helper function to verify JWT
async function verifyToken(token: string): Promise<any> {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
}