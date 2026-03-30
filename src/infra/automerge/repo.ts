import { Repo } from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import type { MedAppDoc } from "./schema.js";
import { getAuthenticatedWsUrl } from "./auth.js";

const DOC_URL_KEY = "medapp-automerge-doc-url";
const IDB_NAME = "medapp-automerge";

let repoInstance: Repo | null = null;
let docHandleInstance: DocHandle<MedAppDoc> | null = null;

function createInitialDoc(): MedAppDoc {
  return {
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
    repoInstance = new Repo({
      network: [new BrowserWebSocketClientAdapter(wsUrl)],
      storage: new IndexedDBStorageAdapter(IDB_NAME),
    });
  }
  return repoInstance;
}

export function getDocHandle(): DocHandle<MedAppDoc> {
  if (docHandleInstance) return docHandleInstance;

  const repo = getRepo();
  const savedUrl = localStorage.getItem(DOC_URL_KEY);

  if (savedUrl) {
    docHandleInstance = repo.find<MedAppDoc>(savedUrl as AutomergeUrl);
  } else {
    docHandleInstance = repo.create<MedAppDoc>(createInitialDoc());
    localStorage.setItem(DOC_URL_KEY, docHandleInstance.url);
  }

  return docHandleInstance;
}

/** Wait for the document to be ready (loaded from storage or network) */
export async function waitForDoc(): Promise<MedAppDoc> {
  const handle = getDocHandle();
  const doc = await handle.doc();
  if (!doc) throw new Error("Failed to load Automerge document");
  return doc;
}
