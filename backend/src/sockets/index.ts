import type { Server as HttpServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";
import { env } from "../config/env.js";
import { verifyToken } from "../auth/jwt.js";

let io: SocketIoServer | undefined;

export function attachSocketServer(httpServer: HttpServer): SocketIoServer {
  io = new SocketIoServer(httpServer, {
    cors: { origin: env.webOrigin },
  });

  // Clients authenticate with their JWT (`io(url, { auth: { token } })`) and are
  // placed in a private room keyed by their user id. They can't pick the room.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string") return next(new Error("Authentication required."));
    try {
      socket.data.userId = verifyToken(token).sub;
      next();
    } catch {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

/** No-op when the socket server isn't running (e.g. in scripts and tests). */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
