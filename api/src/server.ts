import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import topicRoutes from './routes/topicRoutes';
import cardRoutes from './routes/cardRoutes';
import reviewRoutes from './routes/reviewRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

connectDB();

app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '40mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/topics/:topicId/cards', cardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', reviewRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`StuhDee API running on port ${PORT}`));

export default app;
