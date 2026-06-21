// --- Cloud sync configuration ---
//
// To enable live cross-device sync, create a free Supabase project and paste
// its values below, then commit + push (the site redeploys automatically).
// See the setup steps shared in chat. Until both are filled, the app works
// fully offline (per-device), and the offline "family code" transfer still works.

export const SUPABASE_URL = ""; // e.g. "https://abcdxyz.supabase.co"
export const SUPABASE_ANON_KEY = ""; // the project's public anon key

export const cloudEnabled = (): boolean => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
