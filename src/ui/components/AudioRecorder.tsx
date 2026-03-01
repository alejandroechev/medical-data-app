import { useState, useRef, useCallback } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => Promise<void>;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setPreviewUrl(null);
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError('No se pudo acceder al micrófono');
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSave = async () => {
    if (!blobRef.current) return;
    setSaving(true);
    setError(null);
    try {
      await onRecordingComplete(blobRef.current, duration);
      setPreviewUrl(null);
      setDuration(0);
      blobRef.current = null;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDuration(0);
    blobRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Preview state — show playback + save/discard
  if (previewUrl) {
    return (
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{formatTime(duration)}</span>
          <audio src={previewUrl} controls className="flex-1 h-8" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
          <button
            onClick={handleDiscard}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Descartar
          </button>
        </div>
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
        <button
          onClick={stopRecording}
          className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          ⏹ Detener
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
