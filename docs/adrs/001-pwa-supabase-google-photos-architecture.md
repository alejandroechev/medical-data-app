# ADR-001: PWA Architecture with Supabase and Google Photos

## Status

Accepted

## Context

A mobile-accessible application is needed to record family medical events, with support for linking photos of documents stored in Google Photos.

## Decision

### Frontend: PWA with React + Vite
- **React + TypeScript + Vite** as the frontend foundation
- **PWA** (Progressive Web App) for mobile access without app stores
- **Tailwind CSS** for mobile-first styling
- **vite-plugin-pwa** for service worker and manifest

### Backend: Supabase
- **Supabase** as serverless backend (PostgreSQL + REST API)
- No authentication — private family-use app
- RLS with open access policies

### Photos: Google Photos API
- Integration with **Google Photos API** to select photos
- Only references (URL + ID) are stored, not the images themselves
- OAuth for user library access authorization

### Layered Architecture
- **Domain** separated from UI/CLI — pure TypeScript with no framework dependencies
- **CLI** with feature parity for automated validation
- **Repository interfaces** in domain, implementations in infrastructure

## Consequences

### Positive
- Installable on mobile without app store
- Zero hosting cost (Supabase free tier)
- No photo duplication (references to Google Photos)
- Domain is testable without external dependencies
- CLI enables automated validation by AI agents

### Negative
- Dependency on Google Photos (if photos are deleted, references break)
- No full offline write capability (requires connection to Supabase)
- Google Photos OAuth adds complexity to initial setup

## Alternatives Considered

1. **Firebase** — Rejected in favor of Supabase due to PostgreSQL preference
2. **Local IndexedDB** — Rejected due to lack of cross-device synchronization
3. **Native app (React Native)** — Rejected due to development overhead; PWA is sufficient
4. **Store photos directly** — Rejected to avoid duplication and storage costs
