export interface UploadResult {
  url: string;
  fileName: string;
}

export interface PhotoUploader {
  upload(eventId: string, file: File): Promise<UploadResult>;
  delete(url: string): Promise<void>;
}
