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

### Local-First Core Principles (NON-NEGOTIABLE)

1. **Instant startup** — App renders from IndexedDB in <100ms. No network calls block the UI.
2. **Offline-capable** — App works fully without internet. Sync happens opportunistically.
3. **Background sync, never blocking** — Syncing is invisible. Notify but NEVER block.
4. **No server dependency** — If the sync server is down, app is 100% functional.
5. **Conflict-free** — CRDTs handle concurrent edits. No conflict resolution dialogs.
6. **Progressive data loading** — Show data as soon as available. Compute expensive things in background.
7. **Defensive data access** — Always use `?? []`, `?? {}`, optional chaining.

### Tauri & Local-First Hard Rules

1. Library name MUST be `tauri_app_lib` in Cargo.toml
2. NEVER use `native-tls-vendored`
3. No Node-only npm packages in WebView
4. Use Tauri HTTP plugin for external requests (CORS)
5. Schema migrations MUST default undefined fields — always `?? []` in UI
6. CDP remote debugging always enabled (port 9222)
7. Vite port must match Tauri config (5173)
8. Windows console window fix in main.rs
9. Shared Automerge doc URL hardcoded in .env and CI
10. Upsert must preserve user state
11. minSdkVersion 28
12. Avoid `undefined` in Automerge — use null

### Validation — Automated Enforcement

Validation is enforced automatically by two layers — no manual steps required:

1. **Copilot CLI Extension** (`.github/extensions/local-first-guardian/`) — Intercepts agent actions in real time:
   - Blocks `git commit` if source files lack corresponding test files
   - Blocks `git push` if version wasn't bumped (Tauri apps)
   - Injects schema migration and Cargo.toml warnings on file edits
   - Reminds to monitor CI/CD pipeline after every push

2. **Git Hooks** (`.husky/pre-commit` and `.husky/pre-push`) — Runs actual validation commands:
   - Pre-commit: `tsc -b` + `vitest run --coverage` + `eslint`
   - Pre-push: E2E tests + CDP visual validation on real Tauri app

These two layers complement each other: the extension catches mistakes instantly (state checks), hooks run thorough validation (actual test execution).

### Debugging Mobile Crashes

**Android (adb logcat)**:
```bash
# Filter for Tauri/WebView crashes
adb logcat -s "tauri" "chromium" "AndroidRuntime" | grep -i -E "error|crash|fatal|exception"

# Full crash log
adb logcat *:E
```

**CDP on Android** (WebView remote debugging):
1. Enable USB debugging on device
2. Connect via `chrome://inspect` in desktop Chrome
3. Or use Playwright: `chromium.connectOverCDP('http://localhost:9222')`

**Common crash patterns**:
- `UnsatisfiedLinkError` → Wrong library name in Cargo.toml (must be `tauri_app_lib`)
- White screen → Missing `?? []` fallback on new schema fields
- `native-tls` errors → Remove `native-tls-vendored`, use rustls
- CORS errors → Use Tauri HTTP plugin instead of fetch

### Documentation
- **README** Update readme file with any relevant public change to the app
- **System Diagram** Keep always up to date a mermaid system level diagram of the app architecture in docs/system-diagram.md
- **ADR** For every major design and architecture decision add an Architecture Decision Record in docs/adrs

### Commit Checklist

Before running `git commit`, mentally verify:
- [ ] Every new function/component was built with TDD (red → green → refactor)?
- [ ] ⚡ Every new source file has a corresponding test file? *(enforced by local-first-guardian)*
- [ ] E2E tests exist for every new user-facing feature?
- [ ] CLI scenarios exist and have been executed for every new feature?
- [ ] ⚡ `npx vitest run --coverage` shows ≥ 90% statement coverage? *(enforced by pre-commit hook)*
- [ ] `npx playwright test` — all E2E tests pass?
- [ ] ⚡ `npx tsc -b` — zero type errors? *(enforced by pre-commit hook)*
- [ ] ⚡ `npx eslint src/ --max-warnings 0` — zero lint warnings? *(enforced by pre-commit hook)*
- [ ] Visual validation done via CDP or Playwright MCP?
- [ ] README updated (if public-facing change)?
- [ ] System diagram updated (if architecture changed)?
- [ ] ADR written (if major design decision)?
- [ ] ⚡ Version bumped in package.json AND tauri.conf.json? *(enforced by pre-push hook + extension)*
- [ ] ⚡ Monitor CI/CD pipeline after push? *(enforced by extension reminder)*

### Deployment
- **CI/CD** is handled by GitHub Actions. See [README.md](README.md) for production URLs and deployment modes.
- Push to `master` triggers: TypeScript check → unit tests with coverage → E2E tests → build → deploy to Vercel.
- **Vercel auto-deploy is disabled** (`vercel.json` → `github.enabled: false`). Deployments ONLY happen through CI after all tests pass.
- **If any CI step fails, deployment is skipped.** The previous production deployment stays live.
- **Never deploy manually** with `vercel deploy`. Always push to `master` and let CI/CD handle it.

### Backup
- **Weekly DB backup** runs every Sunday 3:00 AM UTC via GitHub Actions (`.github/workflows/backup.yml`).
- **Monthly file backup** runs 1st of each month at 4:00 AM UTC.
- Exports to an orphan `backups` branch. Can be triggered manually.
- Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` GitHub secrets.

## Release & Update Flow

To publish a new version of MedTracker:
1. Bump the version in both `package.json` and `src-tauri/tauri.conf.json`
2. Push to master
3. CI will build the Android APK and create a GitHub Release with the APK attached
4. The app checks for updates on startup (once/day) and shows a banner if a newer version is available

## Dual Backend Mode

The app runs two parallel backends during migration. See [ADR-004](docs/adrs/004-local-first-automerge-migration.md) for architecture details and [README.md](README.md#deployment-modes) for configuration.
