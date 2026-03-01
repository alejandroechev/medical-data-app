import { v4 as uuidv4 } from 'uuid';
import type { EventRecording, CreateRecordingInput } from '../../domain/models/event-recording.js';

export class InMemoryRecordingStore {
  private recordings: Map<string, EventRecording> = new Map();

  async create(input: CreateRecordingInput): Promise<EventRecording> {
    const recording: EventRecording = {
      id: uuidv4(),
      eventId: input.eventId,
      recordingUrl: input.recordingUrl,
      fileName: input.fileName,
      durationSeconds: input.durationSeconds,
      description: input.description,
      createdAt: new Date().toISOString(),
    };
    this.recordings.set(recording.id, recording);
    return { ...recording };
  }

  async listByEvent(eventId: string): Promise<EventRecording[]> {
    return Array.from(this.recordings.values())
      .filter((r) => r.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((r) => ({ ...r }));
  }

  async delete(id: string): Promise<void> {
    this.recordings.delete(id);
  }
}
