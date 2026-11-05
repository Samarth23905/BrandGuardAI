import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { geminiClient } from './ai/geminiClient';
import mongoose from 'mongoose';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Health check endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'BrandGuard AI API',
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      aiEngine: {
        provider: 'Google Gemini',
        model: env.GEMINI_MODEL,
        embeddingModel: env.GEMINI_EMBEDDING_MODEL,
        isConfigured: geminiClient.isAvailable(),
      },
    });
  });

  // Mount API v1
  app.use('/api/v1', apiRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
};
