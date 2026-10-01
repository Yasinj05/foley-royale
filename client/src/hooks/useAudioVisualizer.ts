import { useEffect, useRef } from "react";

export function useAudioVisualizer(
  analyser: AnalyserNode | null,
  active: boolean,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !active) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const bars = 48;
      const step = Math.floor(bufferLength / bars);
      const gap = 3;
      const barWidth = width / bars - gap;

      for (let i = 0; i < bars; i += 1) {
        const value = data[i * step] ?? 0;
        const barHeight = Math.max(4, (value / 255) * height * 0.9);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#2fd3c8");
        gradient.addColorStop(1, "#e11d2e");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, active]);

  return canvasRef;
}
