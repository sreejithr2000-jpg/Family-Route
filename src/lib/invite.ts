import type { FamilyData, Person } from "../data/types";
import { circleForAll, describeRelationship } from "./relationship";

export interface EventType {
  id: string;
  label: string;
  emoji: string;
  /** default outermost circle to invite */
  maxCircle: number;
  /** default headcount cap */
  cap: number;
  note: string;
}

// Each occasion has a sensible default scope; the host can still adjust both.
export const EVENT_TYPES: EventType[] = [
  { id: "wedding", label: "Wedding", emoji: "💍", maxCircle: 3, cap: 60, note: "The big one — immediate to extended family." },
  { id: "reception", label: "Reception", emoji: "🎊", maxCircle: 4, cap: 120, note: "Cast the net wide; everyone’s welcome." },
  { id: "engagement", label: "Engagement", emoji: "💞", maxCircle: 2, cap: 30, note: "Close family gathering." },
  { id: "housewarming", label: "Housewarming", emoji: "🏡", maxCircle: 3, cap: 40, note: "Gruhapravesam — bless the new home." },
  { id: "naming", label: "Naming ceremony", emoji: "🍼", maxCircle: 2, cap: 25, note: "Welcome the little one." },
  { id: "birthday", label: "Birthday", emoji: "🎂", maxCircle: 1, cap: 15, note: "An intimate celebration." },
  { id: "anniversary", label: "Anniversary", emoji: "💐", maxCircle: 2, cap: 25, note: "Close family togetherness." },
  { id: "remembrance", label: "Remembrance", emoji: "🪔", maxCircle: 3, cap: 50, note: "A gathering to remember and pray." },
];

export const CIRCLE_NAMES: Record<number, string> = {
  0: "You",
  1: "Immediate family",
  2: "Close family",
  3: "Extended family",
  4: "Wider family",
};
export const circleName = (c: number) => CIRCLE_NAMES[c] ?? "Distant family";

export interface Candidate {
  person: Person;
  circle: number;
  term: string;
}

/** Everyone eligible to invite, with their circle and relationship label. */
export function buildCandidates(
  data: FamilyData,
  hostId: string,
  includeDeceased: boolean,
): Candidate[] {
  const circles = circleForAll(data, hostId);
  const out: Candidate[] = [];
  for (const p of data.people) {
    if (p.isDeceased && !includeDeceased) continue;
    const circle = circles.get(p.id) ?? 99;
    const term = p.id === hostId ? "you" : describeRelationship(data, hostId, p.id).term;
    out.push({ person: p, circle, term });
  }
  // closest first; within a circle, a stable name order
  return out.sort((a, b) => a.circle - b.circle || a.person.name.localeCompare(b.person.name));
}

/**
 * Auto-fill the guest list: the host, then closest circles outward, until the
 * cap is reached. Only people within [1, maxCircle] (plus the host) qualify.
 */
export function autoSelect(
  candidates: Candidate[],
  hostId: string,
  maxCircle: number,
  cap: number,
): Set<string> {
  const selected = new Set<string>([hostId]);
  for (const c of candidates) {
    if (c.person.id === hostId) continue;
    if (c.circle < 1 || c.circle > maxCircle) continue;
    if (selected.size >= cap) break;
    selected.add(c.person.id);
  }
  return selected;
}

/** A WhatsApp-friendly plain-text guest list, grouped by circle. */
export function buildExportText(
  event: EventType,
  host: Person,
  selected: Candidate[],
): string {
  const lines: string[] = [];
  lines.push(`${event.emoji} ${event.label} — guest list`);
  lines.push(`Hosted by ${host.name} · ${selected.length} people`);
  lines.push("");

  const groups = new Map<number, Candidate[]>();
  for (const c of selected) {
    (groups.get(c.circle) ?? groups.set(c.circle, []).get(c.circle)!).push(c);
  }
  for (const circle of [...groups.keys()].sort((a, b) => a - b)) {
    lines.push(`— ${circleName(circle)} —`);
    for (const c of groups.get(circle)!) {
      const who = c.person.id === host.id ? `${c.person.name} (host)` : `${c.person.name} (${c.term})`;
      lines.push(`• ${who}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
