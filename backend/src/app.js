import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import logger from './config/logger.js';
import errorHandler from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import githubRoutes from './routes/github.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import chatRoutes from './routes/chat.routes.js';
import pmRoutes from './routes/pm.routes.js';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message) => logger.info(`[HTTP] ${message.trim()}`),
    },
  })
);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'RepoMind API Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pm', pmRoutes);

app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

app.use(errorHandler);

export default app;
