import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Mic, Play, Type, Volume2 } from "lucide-react";
import type { ChainStep, RoomState, ShowcasePayload } from "../lib/types";

interface ShowcaseViewProps {
  room: RoomState;
  selfId: string | null;
  showcase: ShowcasePayload | null;
  error: string | null;
  onNext: () => Promise<boolean>;
}

function playStepAudio(
  step: ChainStep,
): Promise<{ el: HTMLAudioElement; url: string }> {
  return new Promise((resolve, reject) => {
    try {
      const binary = atob(step.content);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: step.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      const el = new Audio(url);
      el.onended = () => undefined;
      resolve({ el, url });
    } catch (err) {
      reject(err);
    }
  });
}

function ChatBubble({
  step,
  isLatest,
  onReplay,
}: {
  step: ChainStep;
  isLatest: boolean;
  onReplay: (step: ChainStep) => void;
}) {
  const isText = step.type === "TEXT";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      className={`flex gap-3 ${isLatest ? "" : "opacity-90"}`}
    >
      <img
        src={step.authorAvatar}
        alt=""
        className="mt-1 h-10 w-10 shrink-0 rounded-full bg-studio"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{step.authorName}</span>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
            {isText ? <Type size={10} /> : <Mic size={10} />}
            {isText ? "wrote" : "sound"}
            {step.isPlaceholder ? " · skipped" : ""}
          </span>
        </div>

        {isText ? (
          <div
            className={`rounded-2xl rounded-tl-md px-4 py-3 text-lg leading-snug ${
              isLatest
                ? "bg-wave/15 text-wave ring-1 ring-wave/30"
                : "bg-studio/80 text-ink"
            }`}
          >
            {step.content || "—"}
          </div>
        ) : (
          <div
            className={`flex items-center gap-3 rounded-2xl rounded-tl-md px-4 py-3 ${
              isLatest
                ? "bg-rec/15 ring-1 ring-rec/30"
                : "bg-studio/80"
            }`}
          >
            {step.content ? (
              <button
                type="button"
                onClick={() => onReplay(step)}
                className="inline-flex items-center gap-2 rounded-full bg-rec px-4 py-2 text-sm font-bold text-white"
              >
                <Play size={14} fill="currentColor" />
                Play sound
              </button>
            ) : (
              <span className="text-sm text-muted">No recording</span>
            )}
            {isLatest && step.content ? (
              <span className="text-xs text-muted">Auto-playing…</span>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ShowcaseView({
  room,
  selfId,
  showcase,
  error,
  onNext,
}: ShowcaseViewProps) {
  const isHost = selfId === room.hostId;
  const book = showcase?.book ?? null;
  const stepIndex = showcase?.stepIndex ?? 0;
  const revealed = book?.steps.slice(0, stepIndex + 1) ?? [];
  const latest = revealed[revealed.length - 1] ?? null;

  const [needsGesture, setNeedsGesture] = useState(false);
  const [pendingAudio, setPendingAudio] = useState<ChainStep | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stopAudio = () => {
    audioElRef.current?.pause();
    audioElRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const startAudio = async (step: ChainStep) => {
    stopAudio();
    if (!step.content) return;
    try {
      const { el, url } = await playStepAudio(step);
      objectUrlRef.current = url;
      audioElRef.current = el;
      await el.play();
      setNeedsGesture(false);
      setPendingAudio(null);
    } catch {
      setNeedsGesture(true);
      setPendingAudio(step);
    }
  };

  useEffect(() => {
    feedRef.current?.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [showcase?.bookIndex, stepIndex, revealed.length]);

  useEffect(() => {
    if (!latest || latest.type !== "AUDIO" || !latest.content) {
      stopAudio();
      setNeedsGesture(false);
      setPendingAudio(null);
      return;
    }

    void startAudio(latest);

    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showcase?.bookIndex, stepIndex, latest?.authorId, latest?.type, latest?.content]);

  const replay = (step: ChainStep) => {
    void startAudio(step);
  };

  const playWithGesture = async () => {
    if (pendingAudio) await startAudio(pendingAudio);
  };

  const isLastStepOfBook =
    book != null && stepIndex >= book.steps.length - 1;
  const isLastBook =
    (showcase?.bookIndex ?? 0) >= (showcase?.totalBooks ?? 1) - 1;

  const nextLabel =
    isLastStepOfBook && isLastBook
      ? "Finish"
      : isLastStepOfBook
        ? "Next album"
        : "Next";

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8 sm:px-6">
      <header className="shrink-0">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Showcase</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
          {book ? `${book.creatorName}'s album` : "Album reveal"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Album {(showcase?.bookIndex ?? 0) + 1} /{" "}
          {showcase?.totalBooks ?? room.books.length}
          {book ? ` · revealing ${revealed.length}/${book.steps.length}` : ""}
        </p>
      </header>

      <div
        ref={feedRef}
        className="mt-6 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-white/10 bg-panel/50 p-4 sm:p-5"
      >
        {revealed.length === 0 ? (
          <p className="py-12 text-center text-muted">Waiting for host…</p>
        ) : (
          <AnimatePresence initial={false}>
            {revealed.map((step, i) => (
              <ChatBubble
                key={`${showcase?.bookIndex}-${step.stepIndex}-${step.authorId}`}
                step={step}
                isLatest={i === revealed.length - 1}
                onReplay={replay}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {needsGesture ? (
        <button
          type="button"
          onClick={() => void playWithGesture()}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-wave px-4 py-3 font-bold text-studio"
        >
          <Volume2 size={18} />
          Tap to Play Sound
        </button>
      ) : null}

      {isHost ? (
        <button
          type="button"
          onClick={() => void onNext()}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-rec px-6 py-3 font-bold uppercase tracking-wider"
        >
          {nextLabel} <ChevronRight size={18} />
        </button>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">
          Host is revealing the chain…
        </p>
      )}
      {error ? <p className="mt-3 text-center text-sm text-rec">{error}</p> : null}
    </div>
  );
}
