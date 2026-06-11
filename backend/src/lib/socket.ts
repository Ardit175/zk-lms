import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyToken } from './jwt';
import { config } from '../config';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketServer | null = null;

export function initializeSocket(httpServer: HttpServer): SocketServer {
  const allowedOrigins = config.corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Redis adapter — lets Socket.io events fan out across multiple backend
  // instances behind a load balancer (a user connected to instance A still
  // receives notifications emitted from instance B). Fails open: if Redis is
  // unavailable we fall back to the default in-memory adapter so a single
  // instance keeps working in local dev.
  setupRedisAdapter();

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // verifyToken throws on an invalid/expired token — catch it and reject the
    // connection cleanly instead of letting it bubble as an unhandled error.
    try {
      const payload = verifyToken(token);
      socket.userId = payload.id;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected via Socket.io`);

    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('notification:markRead', async (notificationId: string) => {
      socket.emit('notification:read', { notificationId });
    });

    socket.on('session:join', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      const room = io?.sockets.adapter.rooms.get(`session:${sessionId}`);
      const participantCount = room ? room.size : 0;
      io?.to(`session:${sessionId}`).emit('session:participantCount', { count: participantCount });
      console.log(`User ${socket.userId} joined session ${sessionId}`);
    });

    socket.on('session:leave', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      const room = io?.sockets.adapter.rooms.get(`session:${sessionId}`);
      const participantCount = room ? room.size : 0;
      io?.to(`session:${sessionId}`).emit('session:participantCount', { count: participantCount });
      console.log(`User ${socket.userId} left session ${sessionId}`);
    });

    socket.on('chat:message', (data: { sessionId: string; message: string; userName: string }) => {
      io?.to(`session:${data.sessionId}`).emit('chat:message', {
        id: Date.now().toString(),
        userId: socket.userId,
        userName: data.userName,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}

function setupRedisAdapter(): void {
  if (process.env.NODE_ENV === 'test' || !io) return;

  // lazyConnect so we connect explicitly and can decide based on the result.
  // We only attach the adapter AFTER both clients are connected — otherwise the
  // adapter's psubscribe runs against a dead socket and rejects as an unhandled
  // promise (which would crash the process, not just hit a try/catch). If Redis
  // is unreachable we silently keep Socket.io's default in-memory adapter, which
  // is correct for a single instance.
  const opts = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 1000)),
  };

  const pubClient = new Redis(config.redisUrl, opts);
  const subClient = pubClient.duplicate();
  // Swallow post-connection errors so a later Redis blip never crashes the app.
  pubClient.on('error', () => {});
  subClient.on('error', () => {});

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io?.adapter(createAdapter(pubClient, subClient));
      console.log('[socket] Redis adapter connected');
    })
    .catch(() => {
      console.warn('[socket] Redis unavailable — using in-memory Socket.io adapter');
      pubClient.disconnect();
      subClient.disconnect();
    });
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToSession(sessionId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
  }
}
