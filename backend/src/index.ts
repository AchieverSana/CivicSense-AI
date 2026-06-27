// dotenv MUST be configured before any local module that reads process.env
// at import time (e.g. middleware/auth.ts initializes Firebase Admin as soon
// as it's loaded). Because the project compiles to CommonJS, imports run in
// literal source order — so this has to come before the route imports below,
// not just before the rest of the file's logic.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import aiRoutes from './routes/ai';

const app = express();
const server = http.createServer(app);

// Socket.io for real-time updates
export const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Global error handler — catches any unhandled errors thrown in route handlers
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Socket events
io.on('connection', (socket) => {
  socket.on('join-city', (city: string) => socket.join(city));
  socket.on('disconnect', () => {});
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
