import type { Book } from "../lib/types";

interface GameOverViewProps {
  books: Book[] | null;
  onHome: () => void;
}

export function GameOverView({ books, onHome }: GameOverViewProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted">That&apos;s a wrap</p>
      <h1 className="mt-3 font-display text-5xl font-extrabold">Game over</h1>
      <p className="mt-4 text-muted">
        {books?.length ?? 0} album{(books?.length ?? 0) === 1 ? "" : "s"} made it
        through the showcase.
      </p>
      <button
        type="button"
        onClick={onHome}
        className="mt-10 rounded-xl bg-wave px-6 py-3 font-bold text-studio"
      >
        Back to entrance
      </button>
    </div>
  );
}
