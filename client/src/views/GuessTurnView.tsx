import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { PlayerList } from "../components/PlayerList";
import { TimerRing } from "../components/TimerRing";
import { WaveformCanvas } from "../components/WaveformCanvas";
import { useAudioVisualizer } from "../hooks/useAudioVisualizer";
import type { RoomState, TurnPayload } from "../lib/types";

interface GuessTurnViewProps {
  room: RoomState;
  selfId: string | null;
  turn: TurnPayload;
  error: string | null;
  onSubmit: (text: string) => Promise<boolean>;
}

export function GuessTurnView({
  room,
  selfId,
  turn,
  error,
  onSubmit,
}: GuessTurnViewProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useAudioVisualizer(analyser, playing);
  const submitted = room.players.find((p) => p.id === selfId)?.hasSubmitted;

  useEffect(() => {
    const prev = turn.previousStep;
    if (!prev || prev.type !== "AUDIO" || !prev.content) {
      setNeedsGesture(false);
      return;
    }

    let cancelled = false;

    const setup = async () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

      const binary = atob(prev.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: prev.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const el = new Audio(url);
      audioElRef.current = el;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(el);
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      source.connect(node);
      node.connect(ctx.destination);
      setAnalyser(node);
      el.onended = () => setPlaying(false);

      try {
        if (ctx.state === "suspended") await ctx.resume();
        await el.play();
        if (!cancelled) {
          setPlaying(true);
          setNeedsGesture(false);
        }
      } catch {
        if (!cancelled) {
          setNeedsGesture(true);
          setPlaying(false);
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      audioElRef.current?.pause();
      audioElRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setAnalyser(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [turn]);

  const playWithGesture = async () => {
    const el = audioElRef.current;
    const ctx = audioCtxRef.current;
    if (!el) return;
    try {
      if (ctx?.state === "suspended") await ctx.resume();
      el.currentTime = 0;
      await el.play();
      setPlaying(true);
      setNeedsGesture(false);
    } catch {
      setNeedsGesture(true);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || submitted || !value.trim()) return;
    setBusy(true);
    await onSubmit(value.trim());
    setBusy(false);
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl gap-6 px-6 py-10 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Guess step {room.currentStepIndex + 1} / {room.totalSteps}
            </p>
            <h1 className="font-display text-3xl font-extrabold">
              What was that sound?
            </h1>
          </div>
          <TimerRing
            timeLeft={room.timeLeft}
            max={room.timerMax || 20}
            label="guess"
          />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-panel/60 p-4">
          {turn.previousStep?.isPlaceholder || !turn.previousStep?.content ? (
            <div className="flex h-40 items-center justify-center text-muted">
              No audio — previous player skipped
            </div>
          ) : (
            <WaveformCanvas canvasRef={canvasRef} />
          )}
          {needsGesture ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={playWithGesture}
              className="absolute inset-4 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-studio/90 text-center backdrop-blur"
            >
              <Volume2 size={40} className="text-wave" />
              <span className="font-display text-2xl font-bold">Tap to Play Sound</span>
              <span className="text-sm text-muted">Browser blocked autoplay</span>
            </motion.button>
          ) : null}
        </div>

        <form
          onSubmit={submit}
          className="mt-6 rounded-3xl border border-white/10 bg-panel/80 p-5"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={Boolean(submitted) || busy}
            placeholder="Describe what you heard…"
            maxLength={160}
            className="w-full rounded-xl border border-white/10 bg-studio px-4 py-3 outline-none ring-wave focus:ring-2 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={Boolean(submitted) || busy || !value.trim()}
            className="mt-4 w-full rounded-xl bg-wave py-3 text-sm font-bold text-studio disabled:opacity-40"
          >
            {submitted ? "Submitted — waiting" : "Submit guess"}
          </button>
          {error ? <p className="mt-3 text-sm text-rec">{error}</p> : null}
        </form>
      </div>

      <aside className="rounded-3xl border border-white/10 bg-panel/60 p-5">
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted">
          Progress {room.submittedCount}/{room.playerCount}
        </h2>
        <PlayerList players={room.players} selfId={selfId} />
      </aside>
    </div>
  );
}
