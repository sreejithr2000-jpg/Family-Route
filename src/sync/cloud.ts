import { store } from "../data/store";
import { SUPABASE_URL, SUPABASE_ANON_KEY, cloudEnabled } from "./config";

// Live family sync over Supabase's REST (PostgREST) API — no SDK dependency.
// One row per family: { code, data (jsonb), family_name, updated_at }.
// The family code is the shared key; last-write-wins on the whole blob.

export type SyncStatus =
  | { ok: true; message: string }
  | { ok: false; message: string };

const TABLE = "families";

function headers(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Friendly random code, avoiding ambiguous characters (no 0/O/1/I). */
export function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += alphabet[Math.floor(Math.random() * alphabet.length)];
  return c;
}

export { cloudEnabled };

/** Create a brand-new shared family from the current local tree. */
export async function createFamily(): Promise<SyncStatus & { code?: string }> {
  if (!cloudEnabled()) return { ok: false, message: "Cloud sync isn’t set up yet." };
  const code = makeCode();
  const snap = store.exportSnapshot();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify({
        code,
        data: snap.data,
        family_name: snap.familyName || null,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) return { ok: false, message: `Couldn’t create family (${res.status}).` };
    store.setFamilyCode(code);
    store.setSyncedAt(Date.now());
    return { ok: true, message: "Family created and synced.", code };
  } catch {
    return { ok: false, message: "Network error — couldn’t reach the cloud." };
  }
}

/** Join an existing shared family by its code, replacing the local tree. */
export async function joinFamily(rawCode: string): Promise<SyncStatus> {
  if (!cloudEnabled()) return { ok: false, message: "Cloud sync isn’t set up yet." };
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: "Please enter a family code." };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?code=eq.${encodeURIComponent(code)}&select=*`,
      { headers: headers() },
    );
    if (!res.ok) return { ok: false, message: `Couldn’t look up that code (${res.status}).` };
    const rows = (await res.json()) as { data: unknown; family_name: string | null }[];
    if (rows.length === 0) return { ok: false, message: "No family found with that code." };
    const row = rows[0];
    store.applySnapshot({ data: row.data as never, familyName: row.family_name ?? "" }, true);
    store.setFamilyCode(code);
    store.setSyncedAt(Date.now());
    return { ok: true, message: "Joined the family — pick who you are to continue." };
  } catch {
    return { ok: false, message: "Network error — couldn’t reach the cloud." };
  }
}

/** Push the local tree up to the shared family row. */
export async function push(): Promise<SyncStatus> {
  const code = store.getFamilyCode();
  if (!cloudEnabled() || !code) return { ok: false, message: "Not connected to a family." };
  const snap = store.exportSnapshot();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?code=eq.${encodeURIComponent(code)}`,
      {
        method: "PATCH",
        headers: { ...headers(), Prefer: "return=minimal" },
        body: JSON.stringify({
          data: snap.data,
          family_name: snap.familyName || null,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    if (!res.ok) return { ok: false, message: `Sync up failed (${res.status}).` };
    store.setSyncedAt(Date.now());
    return { ok: true, message: "Saved to the cloud." };
  } catch {
    return { ok: false, message: "Network error — changes saved on this device only." };
  }
}

/** Pull the latest shared tree down to this device. */
export async function pull(): Promise<SyncStatus> {
  const code = store.getFamilyCode();
  if (!cloudEnabled() || !code) return { ok: false, message: "Not connected to a family." };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?code=eq.${encodeURIComponent(code)}&select=*`,
      { headers: headers() },
    );
    if (!res.ok) return { ok: false, message: `Sync down failed (${res.status}).` };
    const rows = (await res.json()) as { data: unknown; family_name: string | null }[];
    if (rows.length === 0) return { ok: false, message: "This family no longer exists in the cloud." };
    store.applySnapshot({ data: rows[0].data as never, familyName: rows[0].family_name ?? "" }, true);
    store.setSyncedAt(Date.now());
    return { ok: true, message: "Up to date." };
  } catch {
    return { ok: false, message: "Network error — couldn’t reach the cloud." };
  }
}

// --- automatic sync wiring ---
let pushTimer: ReturnType<typeof setTimeout> | undefined;

/** Pull on startup, and push (debounced) whenever local data changes. */
export function startAutoSync(): void {
  if (!cloudEnabled() || !store.getFamilyCode()) return;
  pull();
  store.onChange((local) => {
    if (!local) return; // ignore writes that came from a pull
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(), 1500);
  });
  // catch others' edits when returning to the tab
  window.addEventListener("focus", () => pull());
}
