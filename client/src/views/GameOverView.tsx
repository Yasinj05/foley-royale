import type { Book } from "../lib/types";

interface GameOverViewProps {
  books: Book[] | null;
  onHome: () => void;
}

export function GameOverView({ books, onHome }: GameOverViewProps) {
  const count = books?.length ?? 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-bold text-wave">All done</p>
      <h1 className="mt-3 font-display text-5xl font-extrabold">That was fun</h1>
      <p className="mt-4 text-lg text-muted">
        You went through {count} {count === 1 ? "story" : "stories"}.
      </p>
      <button
        type="button"
        onClick={onHome}
        className="mt-10 min-h-12 rounded-2xl bg-wave px-8 py-3 text-base font-extrabold text-studio"
      >
        Play again
      </button>
    </div>
  );
}
