import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccess } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:5173'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const payload = verifyAccess(token as string);
        socket.userId = payload.sub;
        socket.role = payload.role;
      } catch {
        // Anonymous connection allowed
      }
    }
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId || 'anonymous'})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-specific rooms
    if (socket.role === 'admin' || socket.role === 'police' || socket.role === 'rab') {
      socket.join('admins');
      socket.join(`role:${socket.role}`);
    }

    // Join location-based room
    socket.on('join:area', (lat: number, lng: number, radiusKm: number = 5) => {
      const areaKey = `${Math.round(lat * 10)}_${Math.round(lng * 10)}`;
      socket.join(`area:${areaKey}`);
      logger.debug(`Socket ${socket.id} joined area:${areaKey}`);
    });

    socket.on('leave:area', (lat: number, lng: number) => {
      const areaKey = `${Math.round(lat * 10)}_${Math.round(lng * 10)}`;
      socket.leave(`area:${areaKey}`);
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

// Emit helpers
export function emitNewAlert(alert: any) {
  if (!io) return;
  io.emit('alert:new', alert);
  logger.debug(`Emitted alert:new: ${alert._id}`);
}

export function emitAlertUpdate(alert: any) {
  if (!io) return;
  io.emit('alert:update', alert);
}

export function emitSighting(sighting: any, alertId: string) {
  if (!io) return;
  io.emit('sighting:new', { ...sighting, alertId });
}

export function emitNotification(userId: string, notification: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
}

export function broadcastNotification(notification: any) {
  if (!io) return;
  io.emit('notification:new', notification);
}

export function emitAdminEvent(event: string, data: any) {
  if (!io) return;
  io.to('admins').emit(event, data);
}
