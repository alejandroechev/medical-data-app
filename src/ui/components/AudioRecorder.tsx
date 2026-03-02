import { useState, useRef, useCallback, useEffect } from 'react';

const CHECKPOINT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => Promise<void>;
  onCheckpointSaved?: (blob: Blob, durationSeconds: number) => Promise<void>;
}

export function AudioRecorder({ onRecordingComplete, onCheckpointSaved }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkpointStatus, setCheckpointStatus] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkpointTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (checkpointTimerRef.current) {
      clearInterval(checkpointTimerRef.current);
      checkpointTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const saveCheckpoint = useCallback(async () => {
    if (chunksRef.current.length === 0 || !onCheckpointSaved) return;
    const blob = new Blob([...chunksRef.current], { type: 'audio/webm' });
    setCheckpointStatus('Guardando checkpoint...');
    try {
      await onCheckpointSaved(blob, durationRef.current);
      setCheckpointStatus('Checkpoint guardado ✓');
      setTimeout(() => setCheckpointStatus(null), 3000);
    } catch {
      setCheckpointStatus('Error en checkpoint');
      setTimeout(() => setCheckpointStatus(null), 3000);
    }
  }, [onCheckpointSaved]);

  const startRecording = useCallback(async () => {
    setError(null);
    setDuration(0);
    durationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const finalDuration = durationRef.current;
        cleanup();
        setRecording(false);
        setSaving(true);
        try {
          await onRecordingComplete(blob, finalDuration);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setSaving(false);
        }
      };

      // Request data every second so chunks accumulate for checkpoints
      mediaRecorder.start(1000);
      setRecording(true);

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration((d) => d + 1);
      }, 1000);

      // Checkpoint every 5 minutes
      if (onCheckpointSaved) {
        checkpointTimerRef.current = setInterval(() => {
          saveCheckpoint();
        }, CHECKPOINT_INTERVAL_MS);
      }
    } catch {
      setError('No se pudo acceder al micrófono');
    }
  }, [onRecordingComplete, onCheckpointSaved, saveCheckpoint, cleanup]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Saving state after stop
  if (saving) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 text-center space-y-2">
        <span className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-blue-700">Guardando grabación...</p>
      </div>
    );
  }

  // Recording state — show timer + stop
  if (recording) {
    return (
      <div className="bg-red-50 rounded-lg p-4 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-lg font-mono font-semibold text-red-700">{formatTime(duration)}</span>
        </div>
        {checkpointStatus && (
          <p className="text-xs text-gray-500">{checkpointStatus}</p>
        )}
        <button
          onClick={stopRecording}
          className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          ⏹ Detener y guardar
        </button>
      </div>
    );
  }

  // Idle state — show record button
  return (
    <div>
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">{error}</p>}
      <button
        onClick={startRecording}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
      >
        🎙 Grabar audio
      </button>
    </div>
  );
}
