import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ErrorNote } from "../components/ErrorNote";
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
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_0.7fr]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-center"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-wave">
              Round {room.currentStepIndex + 1} of {room.totalSteps}
            </p>
            <h1 className="font-display text-4xl font-extrabold">Write a scene</h1>
            <p className="mt-2 text-lg text-muted">
              Describe something someone else can make with their mouth. Keep it short.
            </p>
          </div>
          <TimerRing timeLeft={room.timeLeft} max={room.timerMax || 25} />
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/10 bg-panel/80 p-6"
        >
          <label className="block space-y-2">
            <span className="text-sm font-bold">Your scene</span>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={Boolean(submitted) || busy}
              rows={4}
              maxLength={160}
              placeholder="A dog shaking off water"
              className="w-full resize-none rounded-2xl border border-white/15 bg-studio px-4 py-3 text-lg outline-none ring-wave focus:ring-2 disabled:opacity-50"
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted">{value.length}/160</span>
            <button
              type="submit"
              disabled={Boolean(submitted) || busy || !value.trim()}
              className="min-h-12 rounded-2xl bg-wave px-6 py-3 text-base font-extrabold text-studio disabled:cursor-not-allowed disabled:bg-studio disabled:text-muted"
            >
              {submitted ? "Sent — waiting for the others" : "Send"}
            </button>
          </div>
          <div className="mt-3">
            <ErrorNote message={error} />
          </div>
        </form>
      </motion.div>

      <aside className="rounded-3xl border border-white/10 bg-panel/60 p-5">
        <h2 className="mb-4 text-lg font-extrabold">
          Who's done
          <span className="ml-2 text-sm font-bold text-muted">
            {room.submittedCount} of {room.playerCount}
          </span>
        </h2>
        <PlayerList players={room.players} selfId={selfId} />
      </aside>
    </div>
  );
}
