import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import { config } from './config';
import { ApiResponse } from './utils/ApiResponse';
import routes from './routes';
import { initializeSocket } from './lib/socket';

const app: Express = express();
const httpServer = createServer(app);

const io = initializeSocket(httpServer);

app.use(helmet());

const allowedOrigins = config.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servimi i skedarëve statik për uploads.
// helmet() defaults Cross-Origin-Resource-Policy to "same-origin", which blocks
// the frontend (localhost:3000) from loading <video>/<img>/PDF resources from
// this origin (localhost:4000). Relax CORP to "cross-origin" for /uploads only.
app.use(
  '/uploads',
  (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(process.cwd(), 'uploads'))
);

app.get('/health', (_req: Request, res: Response) => {
  res.json(ApiResponse.success({ status: 'ok', timestamp: new Date().toISOString() }));
});

app.get('/', (_req: Request, res: Response) => {
  res.json(ApiResponse.success({ message: 'ZK-LMS API v1.0' }));
});

app.use('/api', routes);

app.use((_req: Request, res: Response) => {
  res.status(404).json(ApiResponse.error('Route not found'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json(ApiResponse.error(config.nodeEnv === 'development' ? err.message : 'Internal server error'));
});

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

export { app, io };
