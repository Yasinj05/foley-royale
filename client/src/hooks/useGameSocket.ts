import { useCallback, useEffect, useState } from "react";
import { getSocket } from "../lib/socket";
import type {
  AckResponse,
  Book,
  RoomState,
  ShowcasePayload,
  TurnPayload,
} from "../lib/types";

export function useGameSocket() {
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [turn, setTurn] = useState<TurnPayload | null>(null);
  const [showcase, setShowcase] = useState<ShowcasePayload | null>(null);
  const [gameOverBooks, setGameOverBooks] = useState<Book[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      setSelfId(socket.id ?? null);
    };
    const onDisconnect = () => setConnected(false);
    const onState = (state: RoomState) => setRoom(state);
    const onTurn = (payload: TurnPayload) => setTurn(payload);
    const onShowcase = (payload: ShowcasePayload) => setShowcase(payload);
    const onGameOver = (payload: { books: Book[] }) => {
      setGameOverBooks(payload.books);
      setTurn(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state_update", onState);
    socket.on("room:turn_start", onTurn);
    socket.on("showcase:step_change", onShowcase);
    socket.on("game:over", onGameOver);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state_update", onState);
      socket.off("room:turn_start", onTurn);
      socket.off("showcase:step_change", onShowcase);
      socket.off("game:over", onGameOver);
    };
  }, []);

  const emitAck = useCallback(
    <T>(event: string, payload: unknown): Promise<AckResponse<T>> => {
      const socket = getSocket();
      return new Promise((resolve) => {
        socket
          .timeout(8000)
          .emit(event, payload, (err: Error | null, res: AckResponse<T>) => {
            if (err) {
              resolve({ ok: false, error: err.message || "Request timed out" });
              return;
            }
            resolve(res);
          });
      });
    },
    [],
  );

  const createRoom = useCallback(
    async (username: string) => {
      setError(null);
      setGameOverBooks(null);
      setShowcase(null);
      setTurn(null);
      const res = await emitAck("room:create", { username });
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      if (res.room) setRoom(res.room);
      return true;
    },
    [emitAck],
  );

  const joinRoom = useCallback(
    async (roomCode: string, username: string) => {
      setError(null);
      setGameOverBooks(null);
      setShowcase(null);
      setTurn(null);
      const res = await emitAck("room:join", { roomCode, username });
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      if (res.room) setRoom(res.room);
      return true;
    },
    [emitAck],
  );

  const startGame = useCallback(async () => {
    setError(null);
    const res = await emitAck("game:start", {});
    if (!res.ok) setError(res.error);
    return res.ok;
  }, [emitAck]);

  const submitStep = useCallback(
    async (payload: {
      bookId: string;
      type: "TEXT" | "AUDIO";
      content: string;
      mimeType?: string;
    }) => {
      setError(null);
      const res = await emitAck("game:submit_step", payload);
      if (!res.ok) setError(res.error);
      return res.ok;
    },
    [emitAck],
  );

  const showcaseNext = useCallback(async () => {
    setError(null);
    const res = await emitAck("showcase:next", {});
    if (!res.ok) setError(res.error);
    return res.ok;
  }, [emitAck]);

  const resetToHome = useCallback(() => {
    setRoom(null);
    setTurn(null);
    setShowcase(null);
    setGameOverBooks(null);
    setError(null);
  }, []);

  return {
    connected,
    room,
    selfId,
    turn,
    showcase,
    gameOverBooks,
    error,
    createRoom,
    joinRoom,
    startGame,
    submitStep,
    showcaseNext,
    resetToHome,
  };
}
