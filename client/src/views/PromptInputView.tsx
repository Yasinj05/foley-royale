import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { PlayerList } from "../components/PlayerList";
import { TimerRing } from "../components/TimerRing";
import type { RoomState, TurnPayload } from "../lib/types";

interface PromptInputViewProps {
  room: RoomState;
  selfId: string | null;
  turn: TurnPayload;
  error: string | null;
  onSubmit: (text: string) => Promise<boolean>;
}

export function PromptInputView({
  room,
  selfId,
  turn,
  error,
  onSubmit,
}: PromptInputViewProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const submitted = room.players.find((p) => p.id === selfId)?.hasSubmitted;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || submitted || !value.trim()) return;
    setBusy(true);
    await onSubmit(value.trim());
    setBusy(false);
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1.3fr_0.7fr]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Step {room.currentStepIndex + 1} / {room.totalSteps}
            </p>
            <h1 className="font-display text-4xl font-extrabold">Seed the album</h1>
            <p className="mt-2 text-muted">
              Write a quirky scene or action. No spoilers — this starts your book.
            </p>
          </div>
          <TimerRing
            timeLeft={room.timeLeft}
            max={room.timerMax || 25}
            label="write"
          />
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/10 bg-panel/80 p-6"
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={Boolean(submitted) || busy}
            rows={4}
            maxLength={160}
            placeholder='e.g. "A cold car failing to start in winter"'
            className="w-full resize-none rounded-2xl border border-white/10 bg-studio px-4 py-3 text-lg outline-none ring-wave focus:ring-2 disabled:opacity-50"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-muted">{value.length}/160</span>
            <button
              type="submit"
              disabled={Boolean(submitted) || busy || !value.trim()}
              className="rounded-xl bg-wave px-5 py-3 text-sm font-bold text-studio disabled:opacity-40"
            >
              {submitted ? "Submitted — waiting" : "Lock it in"}
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-rec">{error}</p> : null}
          <p className="mt-3 text-xs text-muted">Book id: {turn.bookId.slice(0, 8)}…</p>
        </form>
      </motion.div>

      <aside className="rounded-3xl border border-white/10 bg-panel/60 p-5">
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted">
          Progress {room.submittedCount}/{room.playerCount}
        </h2>
        <PlayerList players={room.players} selfId={selfId} />
      </aside>
    </div>
  );
}
