# ADR-002: Replace Google Photos with Supabase Storage

## Status

Accepted

## Context

The app originally used the Google Photos Picker API to let users select photos from their Google Photos library and link them to medical events. However, we discovered two fundamental issues:

1. **Temporary URLs**: The Picker API's `baseUrl` expires after ~60 minutes and requires an OAuth token to access. These URLs cannot be stored permanently.
2. **No shareable link API**: Google deprecated programmatic shareable link creation in April 2025. There is no way to get a permanent, public URL for a Google Photos image via API.

## Decision

Replace Google Photos integration entirely with **Supabase Storage** for photo uploads.

### New flow:
- Users upload photos directly from their device (camera capture or gallery) via native `<input type="file">`
- Photos are stored in a Supabase Storage public bucket (`event-photos`)
- Permanent public URLs are stored in the database
- Manual URL paste remains as a fallback option

### Removed:
- Google Photos Picker API integration
- Google Identity Services (OAuth)
- `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` environment variables

## Consequences

### Positive
- Permanent, reliable photo URLs (no expiration)
- No OAuth complexity or token management
- Works offline-capable (upload when connected)
- Native camera capture on mobile devices
- No dependency on third-party API changes

### Negative
- Storage cost (Supabase free tier: 1GB, which is sufficient for medical documents)
- Photos are duplicated (not referencing existing library)
- Users must take/select photos specifically for the app

## Alternatives Considered

1. **Google Photos Picker API** — Rejected due to temporary URLs and no shareable link API (deprecated March 2025)
2. **Google Drive API** — Could provide permanent links but adds unnecessary complexity for photo storage
3. **Cloudinary/AWS S3** — Additional service to manage; Supabase Storage is already part of our stack
