export interface EventRecording {
  id: string;
  eventId: string;
  recordingUrl: string;
  fileName: string;
  durationSeconds?: number;
  description?: string;
  createdAt: string;
}

export interface CreateRecordingInput {
  eventId: string;
  recordingUrl: string;
  fileName: string;
  durationSeconds?: number;
  description?: string;
}
