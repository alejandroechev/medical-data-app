import { Repo } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import type { MedAppDoc } from "./schema.js";
import { CURRENT_SCHEMA_VERSION } from "./schema.js";
import { getAuthenticatedWsUrl, getStoredToken } from "./auth.js";
import { migrateDocument } from "./migrations.js";
import { startBlobSyncListener } from "./blob-sync.js";

const DOC_URL_KEY = "medapp-automerge-doc-url";
const IDB_NAME = "medapp-automerge";

// Default shared document URL — all devices connect to this same document.
// Set via env var, or falls back to the migrated document.
const DEFAULT_DOC_URL = import.meta.env.VITE_AUTOMERGE_DOC_URL || "";

let repoInstance: Repo | null = null;
let docHandleInstance: DocHandle<MedAppDoc> | null = null;

function createInitialDoc(): MedAppDoc {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    medicalEvents: {},
    eventPhotos: {},
    eventRecordings: {},
    professionals: {},
    locations: {},
    prescriptionDrugs: {},
    patientDrugs: {},
  };
}

export function getRepo(): Repo {
  if (!repoInstance) {
    const wsUrl = getAuthenticatedWsUrl();
    const isLocalSyncServer = wsUrl.includes("localhost") || wsUrl.includes("127.0.0.1");
    const canUseNetwork =
      !import.meta.env.VITEST &&
      typeof WebSocket !== "undefined" &&
      (Boolean(getStoredToken()) || isLocalSyncServer);
    const network = canUseNetwork ? [new BrowserWebSocketClientAdapter(wsUrl)] : [];
    const storage =
      typeof indexedDB !== "undefined" ? new IndexedDBStorageAdapter(IDB_NAME) : undefined;

    repoInstance = new Repo({
      network,
      storage,
    });
  }
  return repoInstance;
}

export async function getDocHandle(): Promise<DocHandle<MedAppDoc>> {
  if (docHandleInstance) return docHandleInstance;

  const repo = getRepo();
  const savedUrl = localStorage.getItem(DOC_URL_KEY) || DEFAULT_DOC_URL;

  if (savedUrl) {
    try {
      docHandleInstance = await repo.find<MedAppDoc>(savedUrl as AutomergeUrl);
      localStorage.setItem(DOC_URL_KEY, savedUrl);
      // Run schema migrations if needed
      migrateDocument(docHandleInstance);
    } catch {
      docHandleInstance = repo.create<MedAppDoc>(createInitialDoc());
      localStorage.setItem(DOC_URL_KEY, docHandleInstance.url);
    }
  } else {
    docHandleInstance = repo.create<MedAppDoc>(createInitialDoc());
    localStorage.setItem(DOC_URL_KEY, docHandleInstance.url);
  }

  // Start blob sync retry listener
  startBlobSyncListener();

  // Emit custom event on document changes (enables real-time UI updates from remote edits)
  docHandleInstance.on("change", () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("medapp:doc-changed"));
    }
  });

  return docHandleInstance;
}

/** Wait for the document to be ready (loaded from storage or network) */
export async function waitForDoc(): Promise<MedAppDoc> {
  const handle = await getDocHandle();
  const doc = handle.doc();
  if (!doc) throw new Error("Failed to load Automerge document");
  return doc;
}
