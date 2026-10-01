import type { RefObject } from "react";

interface WaveformCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  className?: string;
}

export function WaveformCanvas({ canvasRef, className }: WaveformCanvasProps) {
  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={160}
      className={className ?? "h-40 w-full rounded-2xl bg-studio/80"}
    />
  );
}
