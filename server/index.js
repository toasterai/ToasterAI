import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { getDb } from './db/setup.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import scanRoutes from './routes/scan.js';
import feedbackRoutes from './routes/feedback.js';

const PORT = process.env.PORT || 3001;

const app = express();

// --- Middleware ---
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(u => u.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(morgan('tiny'));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// --- Initialize database ---
getDb();

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/feedback', feedbackRoutes);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'toasty', timestamp: new Date().toISOString() });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\n  ToasterAI server is warming up on port ${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log(`  Health: http://localhost:${PORT}/api/health\n`);
});
