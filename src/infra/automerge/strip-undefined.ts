/**
 * Strip properties whose value is `undefined`. Automerge does not allow
 * assigning `undefined` — fields must be omitted (or set to `null`) instead.
 */
export function stripUndefined<T>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const k in obj as Record<string, unknown>) {
    if ((obj as Record<string, unknown>)[k] !== undefined) out[k] = (obj as Record<string, unknown>)[k];
  }
  return out as T;
}
