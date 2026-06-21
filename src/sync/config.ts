// --- Cloud sync configuration ---
//
// To enable live cross-device sync, create a free Supabase project and paste
// its values below, then commit + push (the site redeploys automatically).
// See the setup steps shared in chat. Until both are filled, the app works
// fully offline (per-device), and the offline "family code" transfer still works.

export const SUPABASE_URL = "https://cgyclhizrgptloihzgla.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNneWNsaGl6cmdwdGxvaWh6Z2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDU3NjMsImV4cCI6MjA5NzYyMTc2M30.OQnmCP4c30CRhYLf_sluI5MDo_2ocblbQR3HVjXO_NE";

export const cloudEnabled = (): boolean => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
