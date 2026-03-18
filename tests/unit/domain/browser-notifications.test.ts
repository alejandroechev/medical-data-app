import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestNotificationPermission, showBrowserNotification, isNotificationSupported } from '../../../src/infra/browser-notifications';

describe('browser-notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isNotificationSupported', () => {
    it('returns true when Notification API is available', () => {
      vi.stubGlobal('Notification', { permission: 'default' });
      expect(isNotificationSupported()).toBe(true);
      vi.unstubAllGlobals();
    });

    it('returns false when Notification API is not available', () => {
      vi.stubGlobal('Notification', undefined);
      expect(isNotificationSupported()).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns granted when user accepts', async () => {
      const mockNotification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      };
      vi.stubGlobal('Notification', mockNotification);
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
      expect(mockNotification.requestPermission).toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('returns denied when user rejects', async () => {
      const mockNotification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      };
      vi.stubGlobal('Notification', mockNotification);
      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
      vi.unstubAllGlobals();
    });

    it('returns current permission if already granted', async () => {
      const mockNotification = {
        permission: 'granted',
        requestPermission: vi.fn(),
      };
      vi.stubGlobal('Notification', mockNotification);
      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
      expect(mockNotification.requestPermission).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('returns denied if not supported', async () => {
      vi.stubGlobal('Notification', undefined);
      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
      vi.unstubAllGlobals();
    });
  });

  describe('showBrowserNotification', () => {
    it('creates a Notification when permission is granted', () => {
      const mockConstructor = vi.fn();
      vi.stubGlobal('Notification', Object.assign(mockConstructor, { permission: 'granted' }));
      showBrowserNotification('Test Title', 'Test Body');
      expect(mockConstructor).toHaveBeenCalledWith('Test Title', expect.objectContaining({ body: 'Test Body' }));
      vi.unstubAllGlobals();
    });

    it('does not create a Notification when permission is denied', () => {
      const mockConstructor = vi.fn();
      vi.stubGlobal('Notification', Object.assign(mockConstructor, { permission: 'denied' }));
      showBrowserNotification('Test Title', 'Test Body');
      expect(mockConstructor).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('does not throw when Notification is not supported', () => {
      vi.stubGlobal('Notification', undefined);
      expect(() => showBrowserNotification('Title', 'Body')).not.toThrow();
      vi.unstubAllGlobals();
    });
  });
});
