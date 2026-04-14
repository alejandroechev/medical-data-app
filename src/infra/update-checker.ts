/**
 * Auto-update checker for sideloaded Android/desktop builds.
 * Checks GitHub Releases for a newer version on app startup.
 */

const GITHUB_REPO = "alejandroechev/medical-data-app";
const CURRENT_VERSION = __APP_VERSION__;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day
const LAST_CHECK_KEY = "medapp-update-last-check";
const DISMISSED_VERSION_KEY = "medapp-update-dismissed";

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseUrl: string;
  publishedAt: string;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  // Skip if checked recently
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  if (lastCheck && Date.now() - parseInt(lastCheck) < CHECK_INTERVAL_MS) {
    return null;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return null;

    const release = await res.json();
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

    const latestVersion = (release.tag_name as string).replace(/^v/, "");

    if (!isNewer(latestVersion, CURRENT_VERSION)) return null;

    // Check if user already dismissed this version
    const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
    if (dismissed === latestVersion) return null;

    // Find APK asset
    const apkAsset = (release.assets as any[])?.find(
      (a: any) => a.name.endsWith(".apk")
    );

    return {
      version: latestVersion,
      downloadUrl: apkAsset?.browser_download_url || release.html_url,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
    };
  } catch {
    return null; // network error — silently skip
  }
}

export function dismissUpdate(version: string): void {
  localStorage.setItem(DISMISSED_VERSION_KEY, version);
}

export async function openUpdateLink(update: UpdateInfo): Promise<void> {
  const targetUrl = update.releaseUrl || update.downloadUrl;

  if (typeof window === "undefined") return;

  if (isTauri()) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(targetUrl);
      return;
    } catch (error) {
      console.warn("Failed to open update link with Tauri opener", error);
    }
  }

  const popup = window.open(targetUrl, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.assign(targetUrl);
  }
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}
