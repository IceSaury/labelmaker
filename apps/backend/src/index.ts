import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import itemRoutes from './routes/items';
import containerRoutes from './routes/containers';
import translateRoutes from './routes/translate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/translate', translateRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`Serving frontend from ${frontendDist}`);
} else {
  console.log('Frontend dist not found, running API-only mode');
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
