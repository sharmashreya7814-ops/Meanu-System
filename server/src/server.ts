import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/apiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

export function createExpressApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS / Logging in dev
  app.use((_req, res, next) => {
    res.setHeader('X-Powered-By', 'QR-Food-Order-System');
    next();
  });

  // API Routes
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-foundation',
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
}

export const app = createExpressApp();

// If run directly via node / tsx (not when imported as module by Vite)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QR Food Ordering Server] running on http://0.0.0.0:${PORT}`);
  });
}

