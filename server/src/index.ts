import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { connectDb } from "./db/connect.js";
import { RoomManager } from "./game/RoomManager.js";
import { registerSocketHandlers } from "./socket/handlers.js";

async function main(): Promise<void> {
  if (config.enableMongo) {
    try {
      await connectDb();
    } catch (err) {
      console.warn(
        "[db] ENABLE_MONGO=true but Mongo unavailable — continuing without it",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const app = express();
  app.use(cors({ origin: config.clientOrigin }));
  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "foley-royale" });
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: config.clientOrigin },
    maxHttpBufferSize: config.maxPayloadBytes,
  });

  const roomManager = new RoomManager(io);
  registerSocketHandlers(io, roomManager);

  httpServer.listen(config.port, () => {
    console.log(`[server] Foley Royale listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal", err);
  process.exit(1);
});
