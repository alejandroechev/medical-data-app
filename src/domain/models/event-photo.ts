export interface EventPhoto {
  id: string;
  eventoId: string;
  googlePhotosUrl: string;
  googlePhotosId: string;
  descripcion?: string;
  creadoEn: string; // ISO timestamp
}

export interface LinkPhotoInput {
  eventoId: string;
  googlePhotosUrl: string;
  googlePhotosId: string;
  descripcion?: string;
}
