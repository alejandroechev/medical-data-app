import { v4 as uuidv4 } from "uuid";
import { getDocHandle, waitForDoc } from "./repo.js";
import type {
  EventRecording,
  CreateRecordingInput,
} from "../../domain/models/event-recording.js";

export async function createRecording(input: CreateRecordingInput): Promise<EventRecording> {
  const handle = getDocHandle();
  const id = uuidv4();
  const now = new Date().toISOString();

  const recording: EventRecording = {
    id,
    eventId: input.eventId,
    recordingUrl: input.recordingUrl,
    fileName: input.fileName,
    durationSeconds: input.durationSeconds,
    description: input.description,
    createdAt: now,
  };

  handle.change((d) => {
    if (!d.eventRecordings) d.eventRecordings = {};
    d.eventRecordings[id] = recording;
  });

  return { ...recording };
}

export async function listRecordingsByEvent(eventId: string): Promise<EventRecording[]> {
  const doc = await waitForDoc();
  return Object.values(doc.eventRecordings || {})
    .filter((r) => r.eventId === eventId)
    .map((r) => ({ ...r }));
}

export async function deleteRecording(id: string): Promise<void> {
  const handle = getDocHandle();
  handle.change((d) => {
    delete d.eventRecordings[id];
  });
}
