import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Mic, Square } from "lucide-react";
import { PlayerList } from "../components/PlayerList";
import { TimerRing } from "../components/TimerRing";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import type { RoomState, TurnPayload } from "../lib/types";

interface AudioTurnViewProps {
  room: RoomState;
  selfId: string | null;
  turn: TurnPayload;
  error: string | null;
  onSubmit: (audioData: string, mimeType: string) => Promise<boolean>;
}

export function AudioTurnView({
  room,
  selfId,
  turn,
  error,
  onSubmit,
}: AudioTurnViewProps) {
  const maxMs = turn.recordMaxMs || 5000;
  const { isRecording, error: recError, start, stop } = useAudioRecorder(maxMs);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const already = room.players.find((p) => p.id === selfId)?.hasSubmitted || submitted;

  const promptText = turn.previousStep?.content || "…";

  const toggle = async () => {
    if (already || busy) return;
    if (!isRecording) {
      await start();
      return;
    }
    setBusy(true);
    const result = await stop();
    if (result) {
      const ok = await onSubmit(result.audioData, result.mimeType);
      if (ok) setSubmitted(true);
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1.3fr_0.7fr]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-sm text-amber">
          <AlertTriangle size={16} />
          Mouth sounds only — no speaking words
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Foley step {room.currentStepIndex + 1} / {room.totalSteps}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          {promptText}
        </h1>

        <div className="mt-8">
          <TimerRing
            timeLeft={room.timeLeft}
            max={room.timerMax || 10}
            label="record"
            danger
          />
        </div>

        <motion.button
          type="button"
          onClick={toggle}
          disabled={Boolean(already) || busy}
          whileTap={{ scale: 0.96 }}
          animate={isRecording ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={isRecording ? { repeat: Infinity, duration: 0.9 } : undefined}
          className={`mt-10 flex h-36 w-36 items-center justify-center rounded-full text-white shadow-lg disabled:opacity-40 ${
            isRecording ? "bg-rec" : "bg-wave text-studio"
          }`}
        >
          {isRecording ? <Square size={40} fill="currentColor" /> : <Mic size={48} />}
        </motion.button>
        <p className="mt-4 font-mono text-sm text-muted">
          {already
            ? "Submitted — waiting for everyone"
            : isRecording
              ? `Recording… tap to stop (max ${Math.round(maxMs / 1000)}s)`
              : `Tap to record (max ${Math.round(maxMs / 1000)}s)`}
        </p>
        {recError || error ? (
          <p className="mt-3 text-sm text-rec">{recError || error}</p>
        ) : null}
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
