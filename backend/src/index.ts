import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { carsRouter } from './routes/cars';
import { matchesRouter } from './routes/matches';
import { messagesRouter } from './routes/messages';
import { searchRouter } from './routes/search';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/cars', carsRouter);
app.use('/matches', matchesRouter);
app.use('/messages', messagesRouter);
app.use('/search', searchRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
