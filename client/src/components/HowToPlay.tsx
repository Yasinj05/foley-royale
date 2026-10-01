import { Ear, Mic, PenLine } from "lucide-react";

const steps = [
  {
    icon: PenLine,
    title: "Write a scene",
    text: "Something short and silly that someone else can act out.",
  },
  {
    icon: Mic,
    title: "Make the sound",
    text: "Use your mouth only. No words.",
  },
  {
    icon: Ear,
    title: "Guess",
    text: "Listen, then write what you think you heard.",
  },
] as const;

export function HowToPlay() {
  return (
    <ol className="max-w-lg space-y-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex items-start gap-3 rounded-2xl border border-white/10 bg-panel/70 p-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wave/15 text-sm font-extrabold text-wave">
            <step.icon size={20} aria-hidden />
          </div>
          <div>
            <p className="font-extrabold">
              {index + 1}. {step.title}
            </p>
            <p className="text-sm leading-snug text-muted">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
