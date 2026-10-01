import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { ErrorNote } from "../components/ErrorNote";
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

  const previous = turn.previousStep;
  const promptText =
    previous && !previous.isPlaceholder && previous.content
      ? previous.content
      : "The last player didn't send a scene. Make any silly sound.";

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
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_0.7fr]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center"
      >
        <p className="rounded-full bg-amber/15 px-4 py-2 text-sm font-bold text-amber">
          Sounds only. Don't say the words.
        </p>
        <p className="mt-4 text-sm font-bold text-wave">
          Round {room.currentStepIndex + 1} of {room.totalSteps}
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          {promptText}
        </h1>
        <p className="mt-2 text-lg text-muted">Make this sound with your mouth.</p>

        <div className="mt-6">
          <TimerRing timeLeft={room.timeLeft} max={room.timerMax || 10} danger />
        </div>

        <motion.button
          type="button"
          onClick={toggle}
          disabled={Boolean(already) || busy}
          whileTap={{ scale: 0.96 }}
          animate={isRecording ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={isRecording ? { repeat: Infinity, duration: 0.9 } : undefined}
          aria-label={
            already
              ? "Sound sent"
              : isRecording
                ? "Stop and send your sound"
                : "Start recording"
          }
          className={`mt-8 flex h-36 w-36 items-center justify-center rounded-full shadow-lg disabled:opacity-40 ${
            isRecording ? "bg-rec text-white" : "bg-wave text-studio"
          }`}
        >
          {isRecording ? <Square size={40} fill="currentColor" /> : <Mic size={48} />}
        </motion.button>
        <p className="mt-4 max-w-xs text-base font-bold">
          {already
            ? "Sent. Waiting for everyone else."
            : isRecording
              ? "Recording… tap again to send."
              : `Tap the button, make the sound, then tap again. ${Math.round(maxMs / 1000)} seconds max.`}
        </p>
        <div className="mt-3">
          <ErrorNote message={recError || error} />
        </div>
      </motion.div>

      <aside className="rounded-3xl border border-white/10 bg-panel/70 p-5">
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
