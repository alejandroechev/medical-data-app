import { useState, useEffect } from "react";
import {
  checkForUpdate,
  dismissUpdate,
  openUpdateLink,
  type UpdateInfo,
} from "../../infra/update-checker.js";
import { commonIcons } from "./icons";

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    checkForUpdate().then(setUpdate);
  }, []);

  if (!update) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex-1">
        <span className="inline-flex items-center gap-1.5 text-amber-800">
          <commonIcons.info className="h-4 w-4" aria-hidden="true" />
          Nueva versión <strong>v{update.version}</strong> disponible
        </span>
      </div>
      <div className="flex gap-2 ml-2">
        <button
          type="button"
          onClick={() => {
            void openUpdateLink(update);
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
        >
          Descargar
        </button>
        <button
          onClick={() => {
            dismissUpdate(update.version);
            setUpdate(null);
          }}
          className="px-2 py-1 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <commonIcons.close className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
