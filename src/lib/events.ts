import type { FamilyData, Person } from "../data/types";

export interface UpcomingEvent {
  id: string;
  kind: "birthday" | "anniversary";
  /** next occurrence date (today or in the future) */
  date: Date;
  daysUntil: number;
  /** 1 person for a birthday, 2 for an anniversary */
  people: Person[];
  /** age they're turning, or years married */
  years: number | null;
}

const DAY = 86_400_000;

function startOfToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** The next time this month/day rolls around (today counts as upcoming). */
function nextOccurrence(iso: string, from: Date): { date: Date; yearsAt: number } | null {
  const src = new Date(iso);
  if (Number.isNaN(src.getTime())) return null;
  const month = src.getMonth();
  const day = src.getDate();
  let date = new Date(from.getFullYear(), month, day);
  if (date.getTime() < from.getTime()) date = new Date(from.getFullYear() + 1, month, day);
  const yearsAt = date.getFullYear() - src.getFullYear();
  return { date, yearsAt };
}

/**
 * All upcoming birthdays & anniversaries, soonest first.
 * Rules: deceased members are excluded from birthdays; an anniversary where
 * either spouse has passed is silently omitted (it never appears).
 */
export function upcomingEvents(data: FamilyData, withinDays = 366): UpcomingEvent[] {
  const today = startOfToday();
  const byId = new Map(data.people.map((p) => [p.id, p] as const));
  const events: UpcomingEvent[] = [];

  // --- birthdays ---
  for (const p of data.people) {
    if (p.isDeceased || !p.dob) continue;
    const occ = nextOccurrence(p.dob, today);
    if (!occ) continue;
    const daysUntil = Math.round((occ.date.getTime() - today.getTime()) / DAY);
    if (daysUntil > withinDays) continue;
    events.push({
      id: `b-${p.id}`,
      kind: "birthday",
      date: occ.date,
      daysUntil,
      people: [p],
      years: occ.yearsAt,
    });
  }

  // --- anniversaries ---
  for (const e of data.edges) {
    if (e.type !== "spouse" || e.status === "former" || !e.since) continue;
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    if (a.isDeceased || b.isDeceased) continue; // omit silently
    const occ = nextOccurrence(e.since, today);
    if (!occ) continue;
    const daysUntil = Math.round((occ.date.getTime() - today.getTime()) / DAY);
    if (daysUntil > withinDays) continue;
    events.push({
      id: `a-${e.id}`,
      kind: "anniversary",
      date: occ.date,
      daysUntil,
      people: [a, b],
      years: occ.yearsAt,
    });
  }

  return events.sort((x, y) => x.daysUntil - y.daysUntil);
}

/** Friendly relative phrase for a countdown. */
export function whenLabel(daysUntil: number): string {
  if (daysUntil <= 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil < 7) return `in ${daysUntil} days`;
  if (daysUntil < 14) return "next week";
  if (daysUntil < 45) return `in ${Math.round(daysUntil / 7)} weeks`;
  return `in ${Math.round(daysUntil / 30)} months`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
}
