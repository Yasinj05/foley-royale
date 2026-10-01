import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Play } from "lucide-react";
import { PlayerList } from "../components/PlayerList";
import type { RoomState } from "../lib/types";

interface LobbyViewProps {
  room: RoomState;
  selfId: string | null;
  error: string | null;
  onStart: () => Promise<boolean>;
}

export function LobbyView({ room, selfId, error, onStart }: LobbyViewProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const isHost = selfId === room.hostId;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col justify-center"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Green room</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold">Lobby</h1>
        <p className="mt-3 max-w-md text-muted">
          Everyone plays every round with Foley sounds — then watch the albums warp
          in the showcase.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-wave/30 bg-panel px-6 py-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted">
              Room code
            </div>
            <div className="font-mono text-4xl tracking-[0.35em] text-wave">
              {room.code}
            </div>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-2 rounded-xl bg-studio px-4 py-3 text-sm"
          >
            <Copy size={16} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {isHost ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-panel/70 p-5">
            <button
              type="button"
              disabled={busy || room.players.length < 2}
              onClick={async () => {
                setBusy(true);
                await onStart();
                setBusy(false);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rec py-3 font-bold uppercase tracking-wider disabled:opacity-40"
            >
              <Play size={18} /> Start the chain
            </button>
            {room.players.length < 2 ? (
              <p className="text-sm text-amber">Need at least 2 players.</p>
            ) : (
              <p className="text-sm text-muted">
                {room.players.length} players →{" "}
                {room.players.length === 2 ? 3 : room.players.length} steps per
                album
                {room.players.length === 2
                  ? " (text → audio → guess)"
                  : ""}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted">Waiting for the host to start…</p>
        )}
        {error ? <p className="mt-4 text-sm text-rec">{error}</p> : null}
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-3xl border border-white/10 bg-panel/60 p-5"
      >
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted">Cast</h2>
        <PlayerList players={room.players} selfId={selfId} />
      </motion.aside>
    </div>
  );
}
