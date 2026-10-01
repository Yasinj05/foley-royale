import { motion } from "framer-motion";

interface TimerRingProps {
  timeLeft: number;
  max: number;
  label?: string;
  danger?: boolean;
}

export function TimerRing({ timeLeft, max, label, danger }: TimerRingProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? timeLeft / max : 0;
  const offset = circumference * (1 - progress);

  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center"
      role="timer"
      aria-label={`${timeLeft} seconds left`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(139,154,171,0.2)"
          strokeWidth="6"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={danger || timeLeft <= 3 ? "#e11d2e" : "#2fd3c8"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.35, ease: "linear" }}
        />
      </svg>
      <div className="text-center">
        <div className="font-mono text-3xl font-semibold tabular-nums">{timeLeft}</div>
        <div className="text-xs font-bold text-muted">{label ?? "seconds"}</div>
      </div>
    </div>
  );
}
