export interface EventPhoto {
  id: string;
  eventId: string;
  googlePhotosUrl: string;
  googlePhotosId: string;
  description?: string;
  createdAt: string; // ISO timestamp
}

export interface LinkPhotoInput {
  eventId: string;
  googlePhotosUrl: string;
  googlePhotosId: string;
  description?: string;
}
