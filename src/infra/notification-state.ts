export interface NotificationStateTracker {
  hasSeen(key: string): boolean;
  markSeen(key: string): void;
  isDismissed(key: string): boolean;
  dismiss(key: string): void;
  clearAll(): void;
}

const STORAGE_KEY_SEEN = 'medapp:notification:seen';
const STORAGE_KEY_DISMISSED = 'medapp:notification:dismissed';

export class InMemoryNotificationStateTracker implements NotificationStateTracker {
  private seen = new Set<string>();
  private dismissed = new Set<string>();

  hasSeen(key: string): boolean {
    return this.seen.has(key);
  }

  markSeen(key: string): void {
    this.seen.add(key);
  }

  isDismissed(key: string): boolean {
    return this.dismissed.has(key);
  }

  dismiss(key: string): void {
    this.dismissed.add(key);
  }

  clearAll(): void {
    this.seen.clear();
    this.dismissed.clear();
  }
}

export class LocalStorageNotificationStateTracker implements NotificationStateTracker {
  private loadSet(storageKey: string): Set<string> {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveSet(storageKey: string, set: Set<string>): void {
    localStorage.setItem(storageKey, JSON.stringify([...set]));
  }

  hasSeen(key: string): boolean {
    return this.loadSet(STORAGE_KEY_SEEN).has(key);
  }

  markSeen(key: string): void {
    const set = this.loadSet(STORAGE_KEY_SEEN);
    set.add(key);
    this.saveSet(STORAGE_KEY_SEEN, set);
  }

  isDismissed(key: string): boolean {
    return this.loadSet(STORAGE_KEY_DISMISSED).has(key);
  }

  dismiss(key: string): void {
    const set = this.loadSet(STORAGE_KEY_DISMISSED);
    set.add(key);
    this.saveSet(STORAGE_KEY_DISMISSED, set);
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY_SEEN);
    localStorage.removeItem(STORAGE_KEY_DISMISSED);
  }
}
