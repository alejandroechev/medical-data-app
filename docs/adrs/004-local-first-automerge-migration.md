# ADR-004: Local-First Architecture with Automerge and Sync Engine

**Status:** Accepted

**Date:** 2026-03-30

## Context

The app was built cloud-first with Supabase PostgreSQL as the sole data backend. This created dependencies on:
- Supabase service availability for all reads/writes
- Vercel for hosting the web app
- Network connectivity for any data access
- Third-party servers storing sensitive medical records

The Ink & Switch "Local-First Software" principles advocate for user data ownership, offline-first operation, and optional sync — a better fit for a personal medical records app.

## Decision

Migrate from cloud-first (Supabase) to local-first (Automerge CRDTs) with a self-hosted sync server.

### Architecture

- **Data layer:** Automerge CRDT documents stored locally in IndexedDB, synced via WebSocket to a central sync server
- **Sync server:** Custom Node.js server running `automerge-repo` with WebSocket sync + HTTP blob endpoint, deployed on Vultr VPS (São Paulo) at `sync.stormlab.app`
- **Blob storage:** Content-addressed files stored locally (IndexedDB) and on the sync server via HTTP (photos, audio recordings)
- **Auth:** JWT device registration — each device registers once with a shared registration key, receives a long-lived token
- **Store adapter:** `store-provider.ts` routes between three backends: `supabase`, `automerge`, or `memory` based on `VITE_STORAGE_BACKEND` env var
- **Native apps:** Tauri 2.0 wraps the existing React frontend for Windows desktop and Android, connecting to the Automerge backend
- **Auto-update:** Android APK published to GitHub Releases; app checks for updates on startup

### Migration Strategy

Non-destructive, parallel operation:
1. Both Supabase and Automerge backends coexist via the store adapter
2. Vercel deployment continues using Supabase (unchanged)
3. Native apps (desktop/Android) use Automerge backend
4. Data migrated via one-time script (`scripts/migrate/supabase-to-automerge.ts`)
5. After validation with real usage, Supabase dependency will be removed

### Infrastructure

| Component | Technology | Cost |
|-----------|-----------|------|
| Sync server | Node.js + automerge-repo + Express | $5/mo (Vultr São Paulo) |
| TLS | Nginx + Let's Encrypt | Free |
| DNS | sync.stormlab.app | Existing domain |
| Backups | Vultr automatic snapshots | $1/mo |
| CI/CD | GitHub Actions | Free |

## Consequences

### Positive
- Medical records stored locally on user devices — full data ownership
- App works fully offline — reads and writes without network
- Sub-10ms data access (no network round-trips)
- No dependency on Supabase or Vercel for core functionality
- Multi-device sync via CRDT merge (automatic conflict resolution)
- Native desktop and mobile apps (smaller, faster than browser)
- Total infrastructure cost: ~$6/month vs Supabase + Vercel

### Negative
- Schema evolution is harder (no ALTER TABLE — must handle in client code)
- Automerge document history grows over time (needs periodic compaction)
- Blob sync retry not yet implemented (blobs added offline don't auto-upload)
- More infrastructure to maintain (VPS, TLS renewal, Docker)
- No SQL queries — filtering done in-memory on the client

### Risks
- Automerge ecosystem is younger than Supabase — fewer tools, less documentation
- Single sync server is a single point of failure for multi-device sync (but not for local data access)

## Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| **Yjs** | Better for collaborative text editing, not structured records |
| **ElectricSQL** | Requires central Postgres — doesn't fully eliminate cloud dependency |
| **Triplit** | Newer, smaller ecosystem |
| **PouchDB/CouchDB** | Older technology, less active development |
| **Keep Supabase** | Doesn't address data ownership, offline, or vendor dependency goals |
