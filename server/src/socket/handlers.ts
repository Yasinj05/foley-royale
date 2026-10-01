import type { Server, Socket } from "socket.io";
import type { RoomManager } from "../game/RoomManager.js";
import {
  createRoomSchema,
  joinRoomSchema,
  submitStepSchema,
} from "./events.js";

function ackError(message: string) {
  return { ok: false as const, error: message };
}

export function registerSocketHandlers(
  io: Server,
  roomManager: RoomManager,
): void {
  io.on("connection", (socket: Socket) => {
    socket.on("room:create", (payload, ack) => {
      try {
        const data = createRoomSchema.parse(payload ?? {});
        const room = roomManager.createRoom(
          socket.id,
          data.username,
          data.avatarUrl || undefined,
        );
        void socket.join(room.code);
        ack?.({ ok: true, room: roomManager.sanitize(room) });
      } catch (err) {
        ack?.(ackError(err instanceof Error ? err.message : "Failed to create room"));
      }
    });

    socket.on("room:join", (payload, ack) => {
      try {
        const data = joinRoomSchema.parse(payload ?? {});
        const room = roomManager.joinRoom(
          socket.id,
          data.roomCode,
          data.username,
          data.avatarUrl || undefined,
        );
        void socket.join(room.code);
        ack?.({ ok: true, room: roomManager.sanitize(room) });
      } catch (err) {
        ack?.(ackError(err instanceof Error ? err.message : "Failed to join room"));
      }
    });

    socket.on("game:start", (_payload, ack) => {
      try {
        roomManager.startGame(socket.id);
        ack?.({ ok: true });
      } catch (err) {
        ack?.(ackError(err instanceof Error ? err.message : "Failed to start game"));
      }
    });

    socket.on("game:submit_step", (payload, ack) => {
      try {
        const data = submitStepSchema.parse(payload ?? {});
        roomManager.submitStep(socket.id, data);
        ack?.({ ok: true });
      } catch (err) {
        ack?.(ackError(err instanceof Error ? err.message : "Failed to submit"));
      }
    });

    socket.on("showcase:next", (_payload, ack) => {
      try {
        roomManager.showcaseNext(socket.id);
        ack?.({ ok: true });
      } catch (err) {
        ack?.(ackError(err instanceof Error ? err.message : "Failed to advance showcase"));
      }
    });

    socket.on("disconnect", () => {
      roomManager.handleDisconnect(socket.id);
    });
  });
}
