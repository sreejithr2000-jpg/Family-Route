import type { FamilyData, Gender, Person } from "../data/types";
import { buildIndex, parents, spouses, type GraphIndex } from "./graph";

// --- ancestor walk (blood only — parent_child edges) ---
type AncMap = Map<string, { dist: number; firstStep?: string }>;

function ancestors(g: GraphIndex, id: string): AncMap {
  const res: AncMap = new Map([[id, { dist: 0 }]]);
  const queue: { id: string; dist: number; firstStep?: string }[] = [{ id, dist: 0 }];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const p of parents(g, cur.id)) {
      if (!res.has(p)) {
        // Remember which of `id`'s own parents this lineage passes through,
        // so we can later tell maternal vs paternal.
        const firstStep = cur.dist === 0 ? p : cur.firstStep;
        const node = { dist: cur.dist + 1, firstStep };
        res.set(p, node);
        queue.push({ id: p, ...node });
      }
    }
  }
  return res;
}

interface Blood {
  kind: "self" | "ancestor" | "descendant" | "sibling" | "pibling" | "nibling" | "cousin";
  up?: number;
  down?: number;
  degree?: number;
  removed?: number;
  /** ego's parent (father/mother) on the path — drives side & seniority. */
  firstStepA?: string;
}

/** Classify the blood relationship of `b` relative to `a`, or null if none. */
function bloodRelation(g: GraphIndex, a: string, b: string): Blood | null {
  if (a === b) return { kind: "self" };
  const A = ancestors(g, a);
  const B = ancestors(g, b);

  let best: { d1: number; d2: number; sum: number; max: number; firstStepA?: string } | null = null;
  for (const [anc, ai] of A) {
    const bi = B.get(anc);
    if (!bi) continue;
    const sum = ai.dist + bi.dist;
    const max = Math.max(ai.dist, bi.dist);
    if (!best || sum < best.sum || (sum === best.sum && max < best.max)) {
      best = { d1: ai.dist, d2: bi.dist, sum, max, firstStepA: ai.firstStep };
    }
  }
  if (!best) return null;

  const { d1, d2, firstStepA } = best;
  if (d1 === 0 && d2 === 0) return { kind: "self" };
  if (d1 === 0) return { kind: "descendant", down: d2 };
  if (d2 === 0) return { kind: "ancestor", up: d1, firstStepA };
  if (d1 === 1 && d2 === 1) return { kind: "sibling" };
  if (d1 === 1) return { kind: "nibling", down: d2 - 1 };
  if (d2 === 1) return { kind: "pibling", up: d1 - 1, firstStepA };
  return { kind: "cousin", degree: Math.min(d1, d2) - 1, removed: Math.abs(d1 - d2), firstStepA };
}

// --- small language helpers ---
const pick = (g: Gender | undefined, m: string, f: string, n: string) =>
  g === "male" ? m : g === "female" ? f : n;

const sideOf = (p?: Person) =>
  p?.gender === "male" ? "paternal" : p?.gender === "female" ? "maternal" : "";

function seniority(target?: Person, ref?: Person): string {
  if (!target?.dob || !ref?.dob) return "";
  return new Date(target.dob) < new Date(ref.dob) ? "elder" : "younger";
}

const greats = (n: number) => "great-".repeat(Math.max(0, n));
const ordinal = (n: number) =>
  ["zeroth", "first", "second", "third", "fourth", "fifth"][n] ?? `${n}th`;
const removedWord = (n: number) =>
  n === 0 ? "" : n === 1 ? " once removed" : n === 2 ? " twice removed" : ` ${n} times removed`;

type ById = Map<string, Person>;

/** Build the noun phrase for a blood relation, from `ego`'s perspective. */
function coreTerm(rel: Blood, target: Person, ego: Person, byId: ById): string {
  const tg = target.gender;
  switch (rel.kind) {
    case "self":
      return "yourself";
    case "ancestor": {
      const up = rel.up!;
      if (up === 1) return pick(tg, "father", "mother", "parent");
      const side = sideOf(byId.get(rel.firstStepA!));
      const base = pick(tg, "grandfather", "grandmother", "grandparent");
      return `${side ? side + " " : ""}${greats(up - 2)}${base}`;
    }
    case "descendant": {
      const d = rel.down!;
      if (d === 1) return pick(tg, "son", "daughter", "child");
      const base = pick(tg, "grandson", "granddaughter", "grandchild");
      return `${greats(d - 2)}${base}`;
    }
    case "sibling": {
      const sen = seniority(target, ego);
      return `${sen ? sen + " " : ""}${pick(tg, "brother", "sister", "sibling")}`;
    }
    case "pibling": {
      const up = rel.up!;
      const linkingParent = byId.get(rel.firstStepA!);
      const side = sideOf(linkingParent);
      if (up === 1) {
        const sen = seniority(target, linkingParent);
        const base = pick(tg, "uncle", "aunt", "uncle/aunt");
        return `${side ? side + " " : ""}${base}${sen ? ` (${sen})` : ""}`;
      }
      const base = pick(tg, "granduncle", "grandaunt", "grand-uncle/aunt");
      return `${side ? side + " " : ""}${greats(up - 2)}${base}`;
    }
    case "nibling": {
      const d = rel.down!;
      if (d === 1) return pick(tg, "nephew", "niece", "nibling");
      const base = pick(tg, "grand-nephew", "grand-niece", "grand-nibling");
      return `${greats(d - 2)}${base}`;
    }
    case "cousin": {
      const side = sideOf(byId.get(rel.firstStepA!));
      return `${side ? side + " " : ""}${ordinal(rel.degree!)} cousin${removedWord(rel.removed!)}`;
    }
  }
}

export interface RelResult {
  term: string;
  sentence: string;
}

/** Describe how `targetId` is related to `egoId`, in warm plain English. */
export function describeRelationship(
  data: FamilyData,
  egoId: string,
  targetId: string,
): RelResult {
  const g = buildIndex(data.edges);
  const byId: ById = new Map(data.people.map((p) => [p.id, p] as const));
  const ego = byId.get(egoId);
  const target = byId.get(targetId);
  if (!ego || !target) return { term: "—", sentence: "Someone we can’t place yet." };

  const youAre = (t: string) => `${target.name} is your ${t}.`;

  if (egoId === targetId)
    return { term: "you", sentence: `That’s you, ${ego.name.split(" ")[0]}.` };

  // 1) blood
  const blood = bloodRelation(g, egoId, targetId);
  if (blood) {
    const term = coreTerm(blood, target, ego, byId);
    return { term, sentence: youAre(term) };
  }

  // 2) direct spouse (supports remarriage / former)
  const sp = spouses(g, egoId).find((s) => s.id === targetId);
  if (sp) {
    const base = pick(target.gender, "husband", "wife", "spouse");
    const term = sp.status === "former" ? `former ${base}` : base;
    return { term, sentence: youAre(term) };
  }

  // 3) target is the spouse of someone blood-related to ego (by marriage)
  for (const x of spouses(g, targetId)) {
    const rel = bloodRelation(g, egoId, x.id);
    if (!rel) continue;
    const tg = target.gender;
    let term: string;
    if (rel.kind === "sibling") term = pick(tg, "brother-in-law", "sister-in-law", "sibling-in-law");
    else if (rel.kind === "ancestor" && rel.up === 1) term = pick(tg, "father-in-law", "mother-in-law", "parent-in-law");
    else if (rel.kind === "descendant" && rel.down === 1) term = pick(tg, "son-in-law", "daughter-in-law", "child-in-law");
    else term = `${coreTerm(rel, target, ego, byId)} (by marriage)`;
    return { term, sentence: youAre(term) };
  }

  // 4) ego's spouse is blood-related to target (in-law on your partner's side)
  for (const y of spouses(g, egoId)) {
    const yPerson = byId.get(y.id);
    const rel = bloodRelation(g, y.id, targetId);
    if (!rel || !yPerson) continue;
    const tg = target.gender;
    let term: string;
    if (rel.kind === "sibling") term = pick(tg, "brother-in-law", "sister-in-law", "sibling-in-law");
    else if (rel.kind === "ancestor" && rel.up === 1) term = pick(tg, "father-in-law", "mother-in-law", "parent-in-law");
    else if (rel.kind === "descendant" && rel.down === 1) term = pick(tg, "step-son", "step-daughter", "step-child");
    else term = `${coreTerm(rel, target, yPerson, byId)} (in-law)`;
    return { term, sentence: youAre(term) };
  }

  // 5) fallback — connected, but not by a simple named line
  return {
    term: "family",
    sentence: `${target.name} is family — connected to you, though not by a single simple line.`,
  };
}

// --- Family circles (person-relative), for invite suggestions ---

/** Map a blood relationship to a circle ring (1 = immediate, outward). */
function circleFromBlood(b: Blood): number {
  switch (b.kind) {
    case "self": return 0;
    case "ancestor": return b.up!;        // parent=1, grandparent=2 …
    case "descendant": return b.down!;    // child=1, grandchild=2 …
    case "sibling": return 1;
    case "pibling": return b.up! + 1;     // uncle/aunt=2, grand-uncle=3
    case "nibling": return b.down! + 1;   // niece/nephew=2 …
    case "cousin": return b.degree! + 2;  // first cousin=3, second=4
  }
}

function circleOf(g: GraphIndex, hostId: string, personId: string): number {
  if (hostId === personId) return 0;
  const blood = bloodRelation(g, hostId, personId);
  if (blood) return circleFromBlood(blood);
  if (spouses(g, hostId).some((s) => s.id === personId)) return 1;
  // in-laws sit one ring beyond the blood relative they're attached to
  for (const x of spouses(g, personId)) {
    const r = bloodRelation(g, hostId, x.id);
    if (r) return circleFromBlood(r) + 1;
  }
  for (const y of spouses(g, hostId)) {
    const r = bloodRelation(g, y.id, personId);
    if (r) return circleFromBlood(r) + 1;
  }
  return 99; // connected only distantly / not at all
}

/** Circle ring for every person relative to `hostId` (index built once). */
export function circleForAll(data: FamilyData, hostId: string): Map<string, number> {
  const g = buildIndex(data.edges);
  const out = new Map<string, number>();
  for (const p of data.people) out.set(p.id, circleOf(g, hostId, p.id));
  return out;
}

// --- Paternal / maternal side, relative to the viewer (for tree filtering) ---
export type Side = "core" | "paternal" | "maternal" | "other";

function sideOfPerson(g: GraphIndex, byId: ById, ego: string, person: string): Side {
  if (ego === person) return "core";
  const b = bloodRelation(g, ego, person);
  if (b) {
    // direct line up/down and siblings are "core" (no side)
    if (b.kind === "self") return "core";
    if (b.kind === "ancestor" && b.up === 1) return "core";
    if (b.kind === "descendant") return "core";
    if (b.kind === "sibling") return "core";
    const fs = b.firstStepA ? byId.get(b.firstStepA) : undefined;
    const s = sideOf(fs);
    return s === "paternal" ? "paternal" : s === "maternal" ? "maternal" : "core";
  }
  if (spouses(g, ego).some((s) => s.id === person)) return "core";
  return "other"; // in-laws / married-in branches
}

/** Side classification for every person relative to `egoId`. */
export function sideForAll(data: FamilyData, egoId: string): Map<string, Side> {
  const g = buildIndex(data.edges);
  const byId: ById = new Map(data.people.map((p) => [p.id, p] as const));
  const out = new Map<string, Side>();
  for (const p of data.people) out.set(p.id, sideOfPerson(g, byId, egoId, p.id));
  return out;
}
