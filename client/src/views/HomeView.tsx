import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mic2, Radio } from "lucide-react";

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

  return (
    <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rec/40 bg-rec/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rec">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rec" />
          On air
        </div>
        <h1 className="font-display text-6xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
          Foley
          <br />
          <span className="text-wave">Royale</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted">
          Write a scene, pass mouth-sounds around the circle, then watch every
          album mutate in the showcase.
        </p>
      </motion.div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-12 w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-panel/80 p-6 backdrop-blur"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
              mode === "create" ? "bg-wave text-studio" : "bg-studio text-muted"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Mic2 size={16} /> Create room
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${
              mode === "join" ? "bg-wave text-studio" : "bg-studio text-muted"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Radio size={16} /> Join room
            </span>
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-widest text-muted">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-studio px-4 py-3 outline-none ring-wave focus:ring-2"
            placeholder="Sound wizard"
            maxLength={20}
            required
          />
        </label>

        {mode === "join" ? (
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-widest text-muted">Room code</span>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-white/10 bg-studio px-4 py-3 font-mono tracking-[0.3em] outline-none ring-wave focus:ring-2"
              placeholder="ABC123"
              maxLength={6}
              required
            />
          </label>
        ) : null}

        {error ? <p className="text-sm text-rec">{error}</p> : null}
        {!connected ? (
          <p className="text-sm text-amber">Connecting to studio…</p>
        ) : null}

        <button
          type="submit"
          disabled={!connected || busy}
          className="w-full rounded-xl bg-rec py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-40"
        >
          {mode === "create" ? "Open the booth" : "Enter the booth"}
        </button>
      </motion.form>
    </div>
  );
}
