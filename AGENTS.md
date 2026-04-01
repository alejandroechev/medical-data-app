# MedicalData App

## Description

An app to keep records of personal medical events from me and my family

## Code Implementation Flow

### Pre-Development
- **Read ADRs** Before starting any development work, read all Architecture Decision Records in `docs/adrs/` to understand existing design decisions and constraints. Do not contradict or duplicate existing ADRs without explicit user approval.

### Architecture
- **Typescript** Use Typescript as default language, unless told otherwise
- **Tauri** For desktop apps use Tauri framework
- **PWA** For mobile apps, build them as Progressive WebApps
- **Domain Logic Separation** Separate domain logic from CLI/UI/WebAPI
- **CLI** Always implement a CLI with feature parity to WebAPI/UI layer. This is a tool for you as an agent to validate your work
- **Language Convention** UI text visible to users is in Spanish. All code (variables, functions, types, comments), documentation, and test descriptions must be in English.
- **In-Memory Stubs for External Integrations** For every external service integration (databases, APIs, third-party services), implement an in-memory stub that conforms to the same interface. Use a provider/factory that auto-selects the real implementation when credentials are configured, and falls back to the in-memory stub when they are not. This ensures E2E tests, CLI validation, and local development work fully offline without external dependencies.

### Git Workflow
- **Work directly on master** — solo developer, no branch overhead
- **Commit after every completed unit of work** — never leave working code uncommitted
- **Push after each work session** — remote backup is non-negotiable. Remote for this repo at https://github.com/alejandroechev/medical-data-app.git
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint
- **Branch only for risky experiments** you might discard — delete after merge or abandon

### Coding — TDD Workflow (strict, per-function)

1. **RED** — Write a failing test FIRST. Run it. Confirm it fails. Show the failure output.
2. **GREEN** — Write the MINIMUM implementation code to make the test pass. Run the test. Confirm it passes.
3. **REFACTOR** — Clean up if needed. Run the test again to confirm it still passes.
4. Repeat for the next behavior/function.

### Coding — E2E and CLI Tests (per-feature, not batched)

For every user-facing feature, before considering it complete:
- **E2E Test** — Write a Playwright E2E test that exercises the feature end-to-end. Run it. Confirm it passes.
- **CLI Scenario** — Write a CLI scenario AND execute it using the CLI. Confirm the output matches expectations.

### Validation — Pre-Commit Gate

```bash
# 1. All unit tests pass with coverage above 90%
npx vitest run --coverage
# STOP if coverage < 90%. Add tests until coverage ≥ 90%.

# 2. All E2E tests pass
npx playwright test
# STOP if any E2E test fails. Fix the issue.

# 3. TypeScript compiles cleanly
npx tsc -b
# STOP if there are type errors. Fix them.

# 4. Visual validation (UI features only)
# Take screenshots using Playwright MCP of every screen affected by the change.
# Review each screenshot visually. Store in screenshots/ folder.
# If Playwright MCP is not available, STOP and tell the user.
```

### Documentation
- **README** Update readme file with any relevant public change to the app
- **System Diagram** Keep always up to date a mermaid system level diagram of the app architecture in docs/system-diagram.md
- **ADR** For every major design and architecture decision add an Architecture Decision Record in docs/adrs

### Commit Checklist

Before running `git commit`, mentally verify:
- [ ] Every new function/component was built with TDD (red → green → refactor)?
- [ ] E2E tests exist for every new user-facing feature?
- [ ] CLI scenarios exist and have been executed for every new feature?
- [ ] `npx vitest run --coverage` shows ≥ 90% statement coverage?
- [ ] `npx playwright test` — all E2E tests pass?
- [ ] `npx tsc -b` — zero type errors?
- [ ] Visual screenshots taken and reviewed (if UI feature)?
- [ ] README updated (if public-facing change)?
- [ ] System diagram updated (if architecture changed)?
- [ ] ADR written (if major design decision)?

### Deployment
- **CI/CD** is handled by GitHub Actions (`.github/workflows/ci-cd.yml`). Push to `master` triggers: TypeScript check → unit tests with coverage → E2E tests → build → deploy to Vercel.
- **Vercel auto-deploy is disabled** (`vercel.json` → `github.enabled: false`). Deployments ONLY happen through the GitHub Actions pipeline after all tests pass.
- **If any CI step fails, deployment is skipped.** No manual rollback needed — the previous production deployment stays live.
- **Production URL:** https://medical-data-app.vercel.app
- **Never deploy manually** with `vercel deploy`. Always push to `master` and let CI/CD handle it.

### Backup
- **Weekly DB backup** runs every Sunday 3:00 AM UTC via GitHub Actions (`.github/workflows/backup.yml`).
- **Monthly file backup** runs 1st of each month at 4:00 AM UTC — downloads all files from Supabase Storage.
- Exports all DB tables as JSON to an orphan `backups` branch (not on main).
- Can be triggered manually from GitHub Actions → "Weekly DB Backup" → "Run workflow" (with optional file backup checkbox).
- Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` GitHub secrets.

## Release & Update Flow

To publish a new version of MedTracker:
1. Bump the version in both `package.json` and `src-tauri/tauri.conf.json`
2. Push to master
3. CI will build the Android APK and create a GitHub Release with the APK attached
4. The app checks for updates on startup (once/day) and shows a banner if a newer version is available

## Dual Backend Mode

The app currently runs in two parallel modes during the local-first migration:

### Cloud-First (Production — Vercel)
- **URL:** https://medical-data-app.vercel.app
- **Backend:** Supabase PostgreSQL
- **Storage:** Supabase Storage (event-photos bucket)
- **How:** No `VITE_STORAGE_BACKEND` env var set → defaults to Supabase

### Local-First (Testing — Native Apps)
- **Backend:** Automerge CRDTs synced via `sync.stormlab.app`
- **Storage:** IndexedDB (local) + blob HTTP endpoint on sync server
- **Auth:** JWT device registration
- **How:** Set `VITE_STORAGE_BACKEND=automerge` + `VITE_SYNC_SERVER_URL=wss://sync.stormlab.app` + `VITE_AUTOMERGE_DOC_URL=automerge:3KG1BsgCVwhJp6BLwYTnCPGjBmtU`

Both backends coexist via the `store-provider.ts` adapter. The Vercel deployment is untouched — it keeps using Supabase. The native desktop (Tauri Windows) and mobile (Tauri Android) apps use the Automerge backend.

**Goal:** Test the local-first flow with real medical events before removing Supabase entirely.
