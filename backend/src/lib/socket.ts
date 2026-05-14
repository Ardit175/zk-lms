import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from './jwt';
import { config } from '../config';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketServer | null = null;

export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.userId = payload.id;
    socket.userRole = payload.role;
    next();
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
