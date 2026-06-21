import type { Person } from "../data/types";

/** Age in whole years from a DOB (or age at death for deceased members). */
export function ageOf(person: Person): number | null {
  if (!person.dob) return null;
  const birth = new Date(person.dob);
  const end =
    person.isDeceased && person.dateOfDeath ? new Date(person.dateOfDeath) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export type AgeBand = "infant" | "child" | "teen" | "adult" | "elder";

export function ageBand(person: Person): AgeBand {
  const a = ageOf(person);
  if (a === null) return "adult";
  if (a < 3) return "infant";
  if (a < 13) return "child";
  if (a < 20) return "teen";
  if (a < 60) return "adult";
  return "elder";
}

// Auto-assigned avatar icon based on age band + gender (no photo uploads).
// Deliberately gentle/cute so the tree feels homely.
const AVATARS: Record<AgeBand, Record<string, string>> = {
  infant: { male: "👶", female: "👶", other: "👶" },
  child: { male: "🧒", female: "👧", other: "🧒" },
  teen: { male: "👦", female: "👩", other: "🧑" },
  adult: { male: "👨", female: "👩", other: "🧑" },
  elder: { male: "👴", female: "👵", other: "🧓" },
};

export function avatarFor(person: Person): string {
  const band = ageBand(person);
  const g = person.gender ?? "other";
  return AVATARS[band][g] ?? "🧑";
}

/** Short display line: "Kochi · 21" style. */
export function subtitleFor(person: Person): string {
  const bits: string[] = [];
  if (person.place) bits.push(person.place.split(",")[0].trim());
  const a = ageOf(person);
  if (a !== null && !person.isDeceased) bits.push(`${a}`);
  return bits.join(" · ");
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Likely duplicates of `name` among existing people (same/contained name). */
export function findDuplicates(people: Person[], name: string, excludeId?: string): Person[] {
  const n = normalize(name);
  if (n.length < 2) return [];
  return people.filter((p) => {
    if (p.id === excludeId) return false;
    const pn = normalize(p.name);
    const nicks = (p.nicknames ?? []).map(normalize);
    return pn === n || pn.includes(n) || n.includes(pn) || nicks.includes(n);
  });
}
