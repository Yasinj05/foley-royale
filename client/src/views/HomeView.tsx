import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mic2, Radio } from "lucide-react";
import { ErrorNote } from "../components/ErrorNote";
import { HowToPlay } from "../components/HowToPlay";

interface HomeViewProps {
  connected: boolean;
  error: string | null;
  onCreate: (username: string) => Promise<boolean>;
  onJoin: (roomCode: string, username: string) => Promise<boolean>;
}

export function HomeView({ connected, error, onCreate, onJoin }: HomeViewProps) {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || busy) return;
    setBusy(true);
    if (mode === "create") {
      await onCreate(username.trim());
    } else {
      await onJoin(roomCode.trim().toUpperCase(), username.trim());
    }
    setBusy(false);
  };

  const needsCode = mode === "join" && roomCode.trim().length < 6;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="min-w-0 flex-1"
      >
        <p className="text-sm font-bold text-wave">Play together, in the same room or online</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
          Foley
          <br />
          <span className="text-wave">Royale</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
          Write a silly scene. Someone else makes the sound. The next person
          guesses. Then everyone hears how mixed up the story got.
        </p>
        <div className="mt-6">
          <HowToPlay />
        </div>
      </motion.div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45 }}
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-panel/90 p-5 shadow-xl sm:p-6"
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-base font-bold ${
              mode === "create" ? "bg-wave text-studio" : "bg-studio text-ink"
            }`}
          >
            <Mic2 size={18} aria-hidden />
            New game
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-base font-bold ${
              mode === "join" ? "bg-wave text-studio" : "bg-studio text-ink"
            }`}
          >
            <Radio size={18} aria-hidden />
            Join game
          </button>
        </div>

        <p className="text-sm text-muted">
          {mode === "create"
            ? "You'll get a code to share with friends."
            : "Ask the host for the 6-character code."}
        </p>

        <label className="block space-y-2">
          <span className="text-sm font-bold">Your name</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-studio px-4 py-3 text-base outline-none ring-wave focus:ring-2"
            placeholder="Sam"
            maxLength={20}
            autoComplete="nickname"
            required
          />
        </label>

        {mode === "join" ? (
          <label className="block space-y-2">
            <span className="text-sm font-bold">Game code</span>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-white/15 bg-studio px-4 py-3 font-mono text-lg tracking-[0.25em] outline-none ring-wave focus:ring-2"
              placeholder="FUN234"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
            />
          </label>
        ) : null}

        <ErrorNote message={error} />
        {!connected ? (
          <p className="text-sm font-semibold text-amber" role="status">
            Connecting… one moment.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!connected || busy || !username.trim() || needsCode}
          className="min-h-12 w-full rounded-2xl bg-rec py-3 text-base font-extrabold text-white disabled:cursor-not-allowed disabled:bg-studio disabled:text-muted"
        >
          {busy
            ? "One moment…"
            : mode === "create"
              ? "Start a new game"
              : "Join the game"}
        </button>
      </motion.form>
    </div>
  );
}
