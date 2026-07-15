import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import requestLogger from './middleware/logger.middleware.js';
import errorHandler from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'RepoMind API Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

app.use(errorHandler);

export default app;
