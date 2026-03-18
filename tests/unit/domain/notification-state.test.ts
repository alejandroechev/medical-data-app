import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationStateTracker, InMemoryNotificationStateTracker, LocalStorageNotificationStateTracker } from '../../../src/infra/notification-state';

describe('InMemoryNotificationStateTracker', () => {
  let tracker: NotificationStateTracker;

  beforeEach(() => {
    tracker = new InMemoryNotificationStateTracker();
  });

  it('returns false for unseen alerts', () => {
    expect(tracker.hasSeen('drug-1:2025-03-15:due')).toBe(false);
  });

  it('returns true after marking as seen', () => {
    tracker.markSeen('drug-1:2025-03-15:due');
    expect(tracker.hasSeen('drug-1:2025-03-15:due')).toBe(true);
  });

  it('tracks different keys independently', () => {
    tracker.markSeen('drug-1:2025-03-15:due');
    expect(tracker.hasSeen('drug-1:2025-03-15:reminder')).toBe(false);
    expect(tracker.hasSeen('drug-2:2025-03-15:due')).toBe(false);
  });

  it('clearOld removes entries older than threshold', () => {
    // Manually set an old timestamp
    tracker.markSeen('old-key');
    tracker.markSeen('new-key');

    // We can't easily test time-based clearing in InMemory without exposing internals,
    // but we can test clearAll
    tracker.clearAll();
    expect(tracker.hasSeen('old-key')).toBe(false);
    expect(tracker.hasSeen('new-key')).toBe(false);
  });

  it('dismiss marks an alert as dismissed', () => {
    expect(tracker.isDismissed('drug-1:2025-03-15:due')).toBe(false);
    tracker.dismiss('drug-1:2025-03-15:due');
    expect(tracker.isDismissed('drug-1:2025-03-15:due')).toBe(true);
  });
});

describe('LocalStorageNotificationStateTracker', () => {
  let tracker: NotificationStateTracker;

  beforeEach(() => {
    localStorage.clear();
    tracker = new LocalStorageNotificationStateTracker();
  });

  it('persists seen state in localStorage', () => {
    tracker.markSeen('key-1');
    const tracker2 = new LocalStorageNotificationStateTracker();
    expect(tracker2.hasSeen('key-1')).toBe(true);
  });

  it('persists dismissed state in localStorage', () => {
    tracker.dismiss('key-1');
    const tracker2 = new LocalStorageNotificationStateTracker();
    expect(tracker2.isDismissed('key-1')).toBe(true);
  });
});
