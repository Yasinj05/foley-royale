import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED_MIME = "audio/webm;codecs=opus";
const FALLBACK_MIME = "audio/mp4";

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return FALLBACK_MIME;
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) return PREFERRED_MIME;
  if (MediaRecorder.isTypeSupported(FALLBACK_MIME)) return FALLBACK_MIME;
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return "";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to encode audio"));
        return;
      }
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read audio"));
    reader.readAsDataURL(blob);
  });
}

export function useAudioRecorder(maxMs = 5000) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState(() => pickMimeType());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      mediaRecorderRef.current?.stop();
      cleanupStream();
    };
  }, [cleanupStream]);

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    const selected = pickMimeType();
    setMimeType(selected);

    if (typeof MediaRecorder === "undefined") {
      setError("This browser can't record sound. Try Chrome or Safari.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = selected
        ? new MediaRecorder(stream, { mimeType: selected })
        : new MediaRecorder(stream);

      const actualMime = recorder.mimeType || selected || "audio/webm";
      setMimeType(actualMime);

      recorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) chunksRef.current.push(evt.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);

      stopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, maxMs);

      return true;
    } catch {
      setError("We need your microphone. Allow it in the browser, then try again.");
      cleanupStream();
      return false;
    }
  }, [cleanupStream, maxMs]);

  const stop = useCallback(async (): Promise<{
    audioData: string;
    mimeType: string;
  } | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      cleanupStream();
      return null;
    }

    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const result = await new Promise<{ audioData: string; mimeType: string } | null>(
      (resolve) => {
        recorder.onstop = async () => {
          try {
            const type = recorder.mimeType || mimeType || "audio/webm";
            const blob = new Blob(chunksRef.current, { type });
            const audioData = await blobToBase64(blob);
            resolve({ audioData, mimeType: type });
          } catch {
            resolve(null);
          } finally {
            cleanupStream();
            setIsRecording(false);
          }
        };
        recorder.stop();
      },
    );

    mediaRecorderRef.current = null;
    return result;
  }, [cleanupStream, mimeType]);

  return { isRecording, error, mimeType, start, stop };
}
