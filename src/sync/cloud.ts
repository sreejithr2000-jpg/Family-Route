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

/**
 * A friendly but unguessable family code. The code is the shared secret that
 * grants access to the family's cloud data, so it must be cryptographically
 * random with enough entropy to resist enumeration. 8 chars over a 32-symbol
 * alphabet = 40 bits (~1.1 trillion). The 32-char alphabet divides 256 evenly,
 * so `byte % 32` is unbiased. Pair with Supabase RLS/rate-limiting server-side.
 */
export function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  let c = "";
  for (const b of buf) c += alphabet[b % alphabet.length];
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

// Tracks whether this device has local edits not yet pushed to the cloud, so a
// download can never silently overwrite an un-uploaded change (e.g. a delete).
let dirty = false;

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
    dirty = false;
    store.setSyncedAt(Date.now());
    return { ok: true, message: "Saved to the cloud." };
  } catch {
    return { ok: false, message: "Network error — changes saved on this device only." };
  }
}

/**
 * Pull the latest shared tree down. Automatic pulls (focus/startup) refuse to
 * overwrite un-pushed local edits; an explicit Sync-down passes force=true.
 */
export async function pull(force = false): Promise<SyncStatus> {
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
    // Re-check dirty AFTER the round-trip: if we edited meanwhile, keep ours.
    if (dirty && !force) return { ok: false, message: "Kept your unsaved local changes." };
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
    dirty = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(), 1200);
  });
  // Returning to the tab: push our pending edits first, otherwise refresh.
  window.addEventListener("focus", () => {
    if (dirty) push();
    else pull();
  });
}
