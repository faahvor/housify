import type { Server as HttpServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";
import { env } from "../config/env.js";

let io: SocketIoServer | undefined;

export function attachSocketServer(httpServer: HttpServer): SocketIoServer {
  io = new SocketIoServer(httpServer, {
    cors: { origin: env.webOrigin },
  });

  io.on("connection", (socket) => {
    // Landlords/agents join a room keyed by their user id to receive
    // real-time inquiry/lead notifications once dashboards are wired up.
    socket.on("join", (userId: string) => {
      socket.join(userId);
    });
  });

  return io;
}

export function getSocketServer(): SocketIoServer {
  if (!io) {
    throw new Error("Socket.io server has not been initialized yet.");
  }
  return io;
}
