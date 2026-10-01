import type { Server } from "socket.io";
import { config } from "../config.js";
import type {
  Book,
  ChainStep,
  GameState,
  Player,
  Room,
  SanitizedRoomState,
  StepType,
  TurnPayload,
} from "./types.js";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function avatarFor(username: string): string {
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
}

function stepTypeForIndex(stepIndex: number): StepType {
  return stepIndex % 2 === 0 ? "TEXT" : "AUDIO";
}

/** N≥3 → N steps; 2 players need Text→Audio→Guess so each album has a full pass. */
function chainLength(playerCount: number): number {
  return playerCount === 2 ? 3 : playerCount;
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketRoom = new Map<string, string>();
  private purgeInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly io: Server) {
    this.purgeInterval = setInterval(() => this.purgeInactiveRooms(), 60_000);
  }

  dispose(): void {
    if (this.purgeInterval) clearInterval(this.purgeInterval);
    for (const room of this.rooms.values()) this.clearTimers(room);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const code = this.socketRoom.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  createRoom(socketId: string, username: string, avatarUrl?: string): Room {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const player: Player = {
      id: socketId,
      username: username.trim().slice(0, 20),
      avatarUrl: avatarUrl?.trim() || avatarFor(username),
      isHost: true,
      connected: true,
    };

    const room: Room = {
      code,
      hostId: socketId,
      state: "LOBBY",
      players: new Map([[socketId, player]]),
      playerOrder: [socketId],
      books: [],
      currentStepIndex: 0,
      totalSteps: 0,
      playerBookMap: new Map(),
      playerSubmissions: new Set(),
      timer: null,
      timeLeft: 0,
      timerMax: 0,
      phaseEndsAt: null,
      lastActivityAt: Date.now(),
      showcase: { bookIndex: 0, stepIndex: 0 },
    };

    this.rooms.set(code, room);
    this.socketRoom.set(socketId, code);
    this.broadcastState(room);
    return room;
  }

  joinRoom(
    socketId: string,
    roomCode: string,
    username: string,
    avatarUrl?: string,
  ): Room {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) throw new Error("Room not found");
    if (room.state !== "LOBBY") throw new Error("Game already started");
    if (room.players.size >= 8) throw new Error("Room is full");

    const name = username.trim().slice(0, 20);
    for (const p of room.players.values()) {
      if (p.username.toLowerCase() === name.toLowerCase()) {
        throw new Error("Username already taken in this room");
      }
    }

    const player: Player = {
      id: socketId,
      username: name,
      avatarUrl: avatarUrl?.trim() || avatarFor(name),
      isHost: false,
      connected: true,
    };

    room.players.set(socketId, player);
    room.playerOrder.push(socketId);
    this.socketRoom.set(socketId, room.code);
    this.touch(room);
    this.broadcastState(room);
    return room;
  }

  startGame(socketId: string): void {
    const room = this.requireRoom(socketId);
    if (room.hostId !== socketId) throw new Error("Only the host can start");
    if (room.state !== "LOBBY") throw new Error("Game already started");
    if (room.players.size < 2) throw new Error("Need at least 2 players");

    room.playerOrder = [...room.players.keys()];
    room.totalSteps = chainLength(room.playerOrder.length);
    room.books = room.playerOrder.map((playerId) => {
      const player = room.players.get(playerId)!;
      return {
        id: playerId,
        creatorId: playerId,
        creatorName: player.username,
        steps: [],
      } satisfies Book;
    });

    room.currentStepIndex = 0;
    room.showcase = { bookIndex: 0, stepIndex: 0 };
    this.beginStep(room);
  }

  submitStep(
    socketId: string,
    payload: {
      bookId: string;
      type: StepType;
      content: string;
      mimeType?: string;
    },
  ): void {
    const room = this.requireRoom(socketId);
    if (!this.isActiveTurnState(room.state)) {
      throw new Error("Not accepting submissions right now");
    }
    if (room.playerSubmissions.has(socketId)) {
      throw new Error("Already submitted");
    }

    const assignedBookId = room.playerBookMap.get(socketId);
    if (!assignedBookId || assignedBookId !== payload.bookId) {
      throw new Error("This book is not assigned to you");
    }

    const expectedType = stepTypeForIndex(room.currentStepIndex);
    if (payload.type !== expectedType) {
      throw new Error(`Expected a ${expectedType} submission`);
    }

    const player = room.players.get(socketId);
    if (!player) throw new Error("Player not found");

    const book = room.books.find((b) => b.id === payload.bookId);
    if (!book) throw new Error("Book not found");

    if (expectedType === "AUDIO") {
      const data = payload.content ?? "";
      const approxBytes = Math.ceil((data.length * 3) / 4);
      if (data && approxBytes > config.maxAudioBytes) {
        throw new Error("Audio too large (max 100KB)");
      }
    }

    const content =
      expectedType === "TEXT"
        ? payload.content.trim().slice(0, 160)
        : payload.content;

    if (expectedType === "TEXT" && !content) {
      throw new Error("Prompt cannot be empty");
    }

    book.steps.push({
      stepIndex: room.currentStepIndex,
      type: expectedType,
      authorId: player.id,
      authorName: player.username,
      authorAvatar: player.avatarUrl,
      content: expectedType === "TEXT" ? content : content || "",
      mimeType:
        expectedType === "AUDIO" ? payload.mimeType || "audio/webm" : undefined,
      isPlaceholder: expectedType === "AUDIO" && !content,
    });

    room.playerSubmissions.add(socketId);
    this.touch(room);
    this.broadcastState(room);

    if (this.allRequiredSubmitted(room)) {
      this.advanceAfterStep(room);
    }
  }

  showcaseNext(socketId: string): void {
    const room = this.requireRoom(socketId);
    if (room.hostId !== socketId) throw new Error("Only the host can advance showcase");
    if (room.state !== "SHOWCASE") throw new Error("Not in showcase");

    const book = room.books[room.showcase.bookIndex];
    if (!book) {
      this.finishGame(room);
      return;
    }

    if (room.showcase.stepIndex + 1 < book.steps.length) {
      room.showcase.stepIndex += 1;
    } else if (room.showcase.bookIndex + 1 < room.books.length) {
      room.showcase.bookIndex += 1;
      room.showcase.stepIndex = 0;
    } else {
      this.finishGame(room);
      return;
    }

    this.touch(room);
    this.emitShowcase(room);
    this.broadcastState(room);
  }

  handleDisconnect(socketId: string): void {
    const room = this.getRoomBySocket(socketId);
    if (!room) return;

    this.socketRoom.delete(socketId);
    const player = room.players.get(socketId);

    if (room.state === "LOBBY") {
      room.players.delete(socketId);
      room.playerOrder = room.playerOrder.filter((id) => id !== socketId);
      if (room.players.size === 0) {
        this.clearTimers(room);
        this.rooms.delete(room.code);
        return;
      }
      if (room.hostId === socketId) {
        const nextHost = room.players.values().next().value;
        if (nextHost) {
          room.hostId = nextHost.id;
          nextHost.isHost = true;
        }
      }
      this.broadcastState(room);
      return;
    }

    if (player) player.connected = false;

    if (room.hostId === socketId) {
      const nextHost = [...room.players.values()].find((p) => p.connected);
      if (nextHost) {
        room.hostId = nextHost.id;
        for (const p of room.players.values()) p.isHost = p.id === nextHost.id;
      }
    }

    if (this.isActiveTurnState(room.state) && room.playerBookMap.has(socketId)) {
      if (!room.playerSubmissions.has(socketId)) {
        this.fillPlaceholder(room, socketId, "Skipped due to disconnect");
        room.playerSubmissions.add(socketId);
        this.broadcastState(room);
        if (this.allRequiredSubmitted(room)) {
          this.advanceAfterStep(room);
          return;
        }
      }
    }

    this.touch(room);
    this.broadcastState(room);
  }

  sanitize(room: Room): SanitizedRoomState {
    return {
      code: room.code,
      hostId: room.hostId,
      state: room.state,
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        username: p.username,
        avatarUrl: p.avatarUrl,
        isHost: p.isHost,
        connected: p.connected,
        hasSubmitted: room.playerSubmissions.has(p.id),
      })),
      currentStepIndex: room.currentStepIndex,
      totalSteps: room.totalSteps || chainLength(room.playerOrder.length || room.players.size),
      timeLeft: room.timeLeft,
      timerMax: room.timerMax,
      submittedCount: room.playerSubmissions.size,
      playerCount: room.playerOrder.length || room.players.size,
      showcase: { ...room.showcase },
      books: room.books.map((b) => ({
        id: b.id,
        creatorId: b.creatorId,
        creatorName: b.creatorName,
        stepCount: b.steps.length,
      })),
    };
  }

  private requireRoom(socketId: string): Room {
    const room = this.getRoomBySocket(socketId);
    if (!room) throw new Error("Not in a room");
    return room;
  }

  private touch(room: Room): void {
    room.lastActivityAt = Date.now();
  }

  private isActiveTurnState(state: GameState): boolean {
    return (
      state === "INITIAL_PROMPT" ||
      state === "AUDIO_STEP" ||
      state === "TEXT_STEP"
    );
  }

  private clearTimers(room: Room): void {
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
    room.phaseEndsAt = null;
  }

  private broadcastState(room: Room): void {
    this.io.to(room.code).emit("room:state_update", this.sanitize(room));
  }

  private allRequiredSubmitted(room: Room): boolean {
    return [...room.playerBookMap.keys()].every((id) =>
      room.playerSubmissions.has(id),
    );
  }

  private beginStep(room: Room): void {
    this.clearTimers(room);
    room.playerSubmissions = new Set();
    room.playerBookMap = new Map();

    const n = room.playerOrder.length;
    const stepIndex = room.currentStepIndex;
    const type = stepTypeForIndex(stepIndex);

    room.state =
      stepIndex === 0
        ? "INITIAL_PROMPT"
        : type === "AUDIO"
          ? "AUDIO_STEP"
          : "TEXT_STEP";

    for (let creatorIndex = 0; creatorIndex < n; creatorIndex += 1) {
      const assigneeIndex = (creatorIndex + stepIndex) % n;
      const assigneeId = room.playerOrder[assigneeIndex];
      const book = room.books[creatorIndex];
      room.playerBookMap.set(assigneeId, book.id);
    }

    const duration =
      stepIndex === 0
        ? config.initialPromptSeconds
        : type === "AUDIO"
          ? config.audioStepSeconds
          : config.textStepSeconds;

    this.touch(room);
    this.broadcastState(room);
    this.emitTurns(room);

    this.startPhaseTimer(
      room,
      duration,
      () => this.broadcastState(room),
      () => this.onPhaseTimeout(room),
    );
  }

  private emitTurns(room: Room): void {
    const type = stepTypeForIndex(room.currentStepIndex);

    for (const [playerId, bookId] of room.playerBookMap) {
      const book = room.books.find((b) => b.id === bookId);
      if (!book) continue;

      // Only the immediate previous step — never earlier steps (no original-text leak on guess).
      const rawPrevious =
        room.currentStepIndex === 0
          ? null
          : (book.steps[room.currentStepIndex - 1] ?? null);

      const previousStep = rawPrevious
        ? {
            stepIndex: rawPrevious.stepIndex,
            type: rawPrevious.type,
            authorId: rawPrevious.authorId,
            authorName: rawPrevious.authorName,
            authorAvatar: rawPrevious.authorAvatar,
            content: rawPrevious.content,
            mimeType: rawPrevious.mimeType,
            isPlaceholder: rawPrevious.isPlaceholder,
          }
        : null;

      const payload: TurnPayload = {
        bookId,
        stepIndex: room.currentStepIndex,
        type,
        previousStep,
        recordMaxMs: config.audioRecordMaxMs,
      };

      this.io.to(playerId).emit("room:turn_start", payload);
    }
  }

  private onPhaseTimeout(room: Room): void {
    if (!this.isActiveTurnState(room.state)) return;

    for (const playerId of room.playerBookMap.keys()) {
      if (!room.playerSubmissions.has(playerId)) {
        this.fillPlaceholder(room, playerId, "Skipped due to timeout");
        room.playerSubmissions.add(playerId);
      }
    }

    this.advanceAfterStep(room);
  }

  private fillPlaceholder(room: Room, playerId: string, reason: string): void {
    const bookId = room.playerBookMap.get(playerId);
    if (!bookId) return;
    const book = room.books.find((b) => b.id === bookId);
    const player = room.players.get(playerId);
    if (!book || !player) return;
    if (book.steps.some((s) => s.stepIndex === room.currentStepIndex)) return;

    const type = stepTypeForIndex(room.currentStepIndex);
    const step: ChainStep = {
      stepIndex: room.currentStepIndex,
      type,
      authorId: player.id,
      authorName: player.username,
      authorAvatar: player.avatarUrl,
      content: type === "TEXT" ? reason : "",
      isPlaceholder: true,
    };
    book.steps.push(step);
  }

  private advanceAfterStep(room: Room): void {
    this.clearTimers(room);

    if (room.currentStepIndex + 1 >= room.totalSteps) {
      this.enterShowcase(room);
      return;
    }

    room.currentStepIndex += 1;
    this.beginStep(room);
  }

  private enterShowcase(room: Room): void {
    this.clearTimers(room);
    room.state = "SHOWCASE";
    room.timeLeft = 0;
    room.timerMax = 0;
    room.playerSubmissions = new Set();
    room.playerBookMap = new Map();
    room.showcase = { bookIndex: 0, stepIndex: 0 };
    this.touch(room);
    this.emitShowcase(room);
    this.broadcastState(room);
  }

  private emitShowcase(room: Room): void {
    const book = room.books[room.showcase.bookIndex];
    const step = book?.steps[room.showcase.stepIndex] ?? null;

    this.io.to(room.code).emit("showcase:step_change", {
      bookIndex: room.showcase.bookIndex,
      stepIndex: room.showcase.stepIndex,
      totalBooks: room.books.length,
      book: book
        ? {
            id: book.id,
            creatorId: book.creatorId,
            creatorName: book.creatorName,
            steps: book.steps,
          }
        : null,
      step,
    });
  }

  private finishGame(room: Room): void {
    this.clearTimers(room);
    room.state = "GAME_OVER";
    room.timeLeft = 0;
    room.timerMax = 0;
    this.touch(room);
    this.io.to(room.code).emit("game:over", { books: room.books });
    this.broadcastState(room);
  }

  private startPhaseTimer(
    room: Room,
    seconds: number,
    onTick: (timeLeft: number) => void,
    onDone: () => void,
  ): void {
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }

    room.timerMax = seconds;
    room.phaseEndsAt = Date.now() + seconds * 1000;
    room.timeLeft = seconds;
    onTick(seconds);

    room.timer = setInterval(() => {
      if (!room.phaseEndsAt) return;
      const left = Math.max(0, Math.ceil((room.phaseEndsAt - Date.now()) / 1000));
      if (left !== room.timeLeft) {
        room.timeLeft = left;
        onTick(left);
      }
      if (left <= 0) {
        if (room.timer) {
          clearInterval(room.timer);
          room.timer = null;
        }
        room.phaseEndsAt = null;
        onDone();
      }
    }, 200);
  }

  private purgeInactiveRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivityAt > config.inactiveRoomMs) {
        this.clearTimers(room);
        for (const playerId of room.players.keys()) {
          this.socketRoom.delete(playerId);
        }
        this.rooms.delete(code);
        console.log(`[rooms] purged inactive room ${code}`);
      }
    }
  }
}
