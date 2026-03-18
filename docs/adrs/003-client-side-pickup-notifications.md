# ADR 003: Client-Side Prescription Pickup Notifications

## Status
Accepted

## Context
Users need to be reminded when a prescription (receta) pickup date approaches. The `PatientDrug` model already has a `nextPickupDate` field, but there was no notification mechanism. The app is a PWA used primarily on mobile (Chrome Android).

## Decision
Implement a **fully client-side** notification system with three layers:

1. **In-app banner** (`PickupAlertBanner`): Color-coded dismissible alerts shown at the top of all pages. Blue = reminder (1-3 days before), Yellow = due today, Red = overdue (1 day after).

2. **Browser Notification API**: OS-level notifications fired when the app is open and detects approaching pickups. Permission requested once.

3. **Service Worker Periodic Background Sync**: Extends the PWA service worker to check for pickups when the app is closed. Uses the Periodic Background Sync API (Chrome Android only).

### Notification trigger rules
- 3 days before `nextPickupDate` → reminder
- On `nextPickupDate` → due
- 1 day after `nextPickupDate` → overdue

### Architecture choices
- **No server-side push**: Avoids the complexity of a push notification server (web-push protocol, VAPID keys, Supabase Edge Functions). The app is personal/family-use with a small number of users.
- **localStorage for state**: Tracks which alerts have been seen/dismissed to avoid spamming. Simple and sufficient for a single-device use case.
- **Custom event for reactivity**: `store-provider` emits `medapp:drugs-changed` when drugs are created/updated/deleted. The `usePickupAlerts` hook listens and re-checks immediately.
- **Pure domain checker**: `checkPickupAlerts()` is a pure function with no side effects, making it fully testable and reusable across UI, CLI, and service worker.
- **VitePWA injectManifest**: Switched from `autoUpdate` to `injectManifest` mode to support custom service worker logic (periodic sync handler).

## Consequences

### Positive
- Zero backend infrastructure added
- Works offline (in-app alerts use cached data)
- CLI parity via `npm run cli -- notificaciones`
- Fully testable domain logic

### Negative
- Background notifications only work on Chrome Android (Periodic Background Sync API)
- Safari/Firefox users only see alerts when opening the app
- No cross-device sync of dismissed state (localStorage is per-device)

### Future considerations
- If background notifications on iOS become critical, consider adding a Supabase Edge Function with web-push
- Could add configurable reminder days per drug
- Could auto-advance `nextPickupDate` after confirming pickup
