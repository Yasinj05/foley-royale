import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Play } from "lucide-react";
import { ErrorNote } from "../components/ErrorNote";
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
  const ready = room.players.length >= 2;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center"
      >
        <p className="text-sm font-bold text-wave">Waiting room</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
          Invite your friends
        </h1>
        <p className="mt-3 max-w-md text-lg text-muted">
          Share this code. Everyone joins from the home screen, then you all
          play at the same time.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-3xl border border-wave/40 bg-panel px-6 py-5">
            <div className="text-sm font-bold text-muted">Game code</div>
            <div className="font-mono text-4xl font-semibold tracking-[0.28em] text-wave sm:text-5xl">
              {room.code}
            </div>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-studio px-5 py-3 text-base font-bold"
          >
            <Copy size={18} aria-hidden />
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>

        {isHost ? (
          <div className="mt-6 space-y-3 rounded-3xl border border-white/10 bg-panel/80 p-5">
            <button
              type="button"
              disabled={busy || !ready}
              onClick={async () => {
                setBusy(true);
                await onStart();
                setBusy(false);
              }}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rec py-3 text-base font-extrabold text-white disabled:cursor-not-allowed disabled:bg-studio disabled:text-muted"
            >
              <Play size={18} aria-hidden />
              {busy ? "Starting…" : "Start game"}
            </button>
            <p className="text-sm text-muted">
              {ready
                ? "When everyone is here, start the game."
                : "Invite at least one more person. You need 2 players to start."}
            </p>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-panel/80 px-4 py-3 text-base text-muted" role="status">
            You're in. The host will start when everyone is here.
          </p>
        )}
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-panel/70 p-5"
      >
        <h2 className="mb-4 text-lg font-extrabold">
          Who's here{" "}
          <span className="ml-2 text-sm font-bold text-muted">
            {room.players.length} {room.players.length === 1 ? "player" : "players"}
          </span>
        </h2>
        <PlayerList players={room.players} selfId={selfId} waitingLabel="Ready" />
      </motion.aside>
    </div>
  );
}
