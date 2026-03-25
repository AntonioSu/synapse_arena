import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { db } from './db/client';
import { redisClient } from './services/redis-client';
import { topicCrawler } from './services/topic-crawler';

// Routes
import topicsRouter from './routes/topics';
import commentsRouter from './routes/comments';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/async-handler';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: true,  // 允许所有来源
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/topics', topicsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler (must be after routes)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_battle', (topicId: string) => {
    socket.join(`battle:${topicId}`);
    console.log(`Socket ${socket.id} joined battle:${topicId}`);
  });

  socket.on('leave_battle', (topicId: string) => {
    socket.leave(`battle:${topicId}`);
    console.log(`Socket ${socket.id} left battle:${topicId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
export { io };

// Start server
const startServer = async () => {
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Test Redis connection
    await redisClient.getClient().ping();
    console.log('✅ Redis connected');

    // Start topic crawler cron job
    topicCrawler.startCronJob();

    // Start HTTP server
    httpServer.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`📡 Frontend URL: ${config.frontendUrl}`);
      console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    await db.close();
    await redisClient.close();
    console.log('HTTP server closed');
    process.exit(0);
  });
});

startServer();
