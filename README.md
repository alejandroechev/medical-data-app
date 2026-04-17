# MedTracker — Family Medical Records

> **v0.5.3** — PWA (web) · Native Desktop (Tauri/Windows) · Native Android (Tauri)

Personal app to record and browse family medical events. Runs as an installable PWA on the web, a native desktop app on Windows, and a native Android app — all from the same React codebase.

**Production URL:** https://medical-data-app.vercel.app
**Sync server:** sync.stormlab.app

## Features

- 📋 Medical event tracking (consultations, emergencies, surgeries, exams, etc.)
- 👨‍👩‍👧‍👦 Associate events with family members
- 📎 Event documents via Supabase Storage (cloud) or sync server blobs (local-first)
- 💰 Reimbursement tracking (ISAPRE and Complementary Insurance)
- 📦 Event archiving with archive-aware history filters
- 💊 Treatment tracking with drug schedules and progress
- ⓘ In-app info panel with version/backend/sync status
- Heroicons-based navigation and action icons across the app UI
- Reliable in-app update banner download/release opening on web and Tauri builds
- Three-section navigation: Inicio (dashboard), Eventos (unified event list + creation), Tratamientos
- Swipe-to-action event cards with archive and duplicate actions
- Collapsible filters on the Eventos page
- Reembolso info integrated into event detail card alongside doctor/place/cost
- Automerge document size displayed in the app info panel
- Tratamientos page shows all patients by default with patient labels and filtering
- Sticky "Nuevo" buttons on Eventos and Tratamientos pages — always visible without scrolling
- 🔔 Prescription pickup notifications (in-app alerts + browser notifications)
- 📱 Mobile-first design (installable PWA + native Android APK)
- 🖥️ Native Windows desktop app (Tauri)
- 🔄 Offline-first with CRDT sync (Automerge)
- 🔍 Search and filter by patient, type, and date range

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| PWA | vite-plugin-pwa (Workbox) |
| Desktop/Mobile | Tauri 2.0 (Windows + Android) |
| Styling | Tailwind CSS |
| Cloud Backend | Supabase (PostgreSQL + Storage) |
| Local-First Backend | Automerge CRDTs + sync server |
| Tests | Vitest + Playwright |
| CLI | Commander.js |

## Deployment Modes

The app runs in two parallel backends during the local-first migration. See [ADR-004](docs/adrs/004-local-first-automerge-migration.md) for the full architecture and rationale.

| Mode | Backend | Activated by |
|------|---------|-------------|
| **Cloud-First** (Vercel) | Supabase PostgreSQL | Default (no env var) |
| **Local-First** (Native apps) | Automerge CRDTs → `sync.stormlab.app` | `VITE_STORAGE_BACKEND=automerge` |

Both coexist via the `store-provider.ts` adapter. Goal: validate local-first with real usage before removing Supabase.

## Requirements

- Node.js 22+
- npm
- Rust toolchain (optional — only for native desktop/Android builds)

## Setup

1. Clone the repository
2. `npm install`
3. Copy `.env.example` to `.env` and configure the variables
4. `npm run dev`

## Commands

```bash
npm run dev          # Development server (web)
npm run build        # Production build
npm run test         # Unit tests
npm run test:coverage # Tests with coverage
npm run test:e2e     # E2E tests (Playwright)
npm run cli          # CLI (feature parity)
```

## Native Apps

```bash
npx tauri dev        # Run desktop app (Windows) in development mode
npx tauri build      # Build desktop app for production
```

The Android APK is built automatically by GitHub Actions on push to master and attached to the corresponding GitHub Release.

## CLI

```bash
npm run cli -- miembros listar
npm run cli -- evento crear --tipo "Consulta Médica" --paciente "Juan" --fecha "2024-01-15" --descripcion "Control anual"
npm run cli -- evento listar
npm run cli -- evento ver <id>
npm run cli -- notificaciones          # Check upcoming prescription pickups
```

## License

Private use.
