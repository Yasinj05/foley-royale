interface ErrorNoteProps {
  message: string | null;
}

export function ErrorNote({ message }: ErrorNoteProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-rec/15 px-3 py-2 text-sm font-semibold text-ink"
    >
      {message}
    </p>
  );
}
