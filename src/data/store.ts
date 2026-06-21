import type { FamilyData, Person, RelationshipEdge } from "./types";
import { seedFamily } from "./seed";

// A tiny repository over localStorage. Shaped so it can later be swapped
// for a Supabase-backed implementation without changing the UI layer.

// Bump the data version when the seed shape changes so cached copies refresh.
const DATA_KEY = "family-routes:data:v2";
const EGO_KEY = "family-routes:ego:v1";
const AUDIT_KEY = "family-routes:audit:v1";
const UNDO_KEY = "family-routes:undo:v1";
const UNDO_LIMIT = 25;
const DEMO_KEY = "family-routes:demo:v1"; // "false" once the user starts their own
const FAMILY_NAME_KEY = "family-routes:familyName:v1";

export interface AuditEntry {
  id: string;
  ts: number;
  actor: string;
  summary: string;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function load(): FamilyData {
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) {
    localStorage.setItem(DATA_KEY, JSON.stringify(seedFamily));
    return structuredClone(seedFamily);
  }
  try {
    return JSON.parse(raw) as FamilyData;
  } catch {
    localStorage.setItem(DATA_KEY, JSON.stringify(seedFamily));
    return structuredClone(seedFamily);
  }
}

function saveData(data: FamilyData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function actorName(): string {
  const id = localStorage.getItem(EGO_KEY);
  if (!id) return "Someone";
  return load().people.find((p) => p.id === id)?.name ?? "Someone";
}

function pushUndo(prev: FamilyData): void {
  const stack = readJson<FamilyData[]>(UNDO_KEY, []);
  stack.push(prev);
  while (stack.length > UNDO_LIMIT) stack.shift();
  localStorage.setItem(UNDO_KEY, JSON.stringify(stack));
}

function pushAudit(summary: string): void {
  const log = readJson<AuditEntry[]>(AUDIT_KEY, []);
  log.unshift({ id: uid(), ts: Date.now(), actor: actorName(), summary });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 100)));
}

/** Snapshot the current data for undo, apply a change, save, and log it. */
function mutate(summary: string, fn: (d: FamilyData) => void): void {
  const cur = load();
  pushUndo(structuredClone(cur));
  fn(cur);
  saveData(cur);
  pushAudit(summary);
}

export interface RelationInput {
  parentIds: string[];
  spouseId: string | null;
  /** marriage date (ISO) for the spouse edge — drives anniversaries */
  anniversary?: string | null;
}

export const store = {
  getData(): FamilyData {
    return load();
  },
  getPeople(): Person[] {
    return load().people;
  },
  getPerson(id: string): Person | undefined {
    return load().people.find((p) => p.id === id);
  },
  getEdges(): RelationshipEdge[] {
    return load().edges;
  },

  getEgoId(): string | null {
    return localStorage.getItem(EGO_KEY);
  },
  setEgoId(id: string): void {
    localStorage.setItem(EGO_KEY, id);
  },
  clearEgo(): void {
    localStorage.removeItem(EGO_KEY);
  },

  /**
   * Create or update a person and reconcile their parent + current-spouse
   * edges. Returns the person's id. One undo step per save.
   */
  savePerson(person: Person, rel: RelationInput): string {
    let id = person.id || `p-${uid()}`;
    const summary = person.id ? `Updated ${person.name}` : `Added ${person.name}`;
    mutate(summary, (d) => {
      const next: Person = { ...person, id };
      const idx = d.people.findIndex((p) => p.id === id);
      if (idx >= 0) d.people[idx] = next;
      else d.people.push(next);

      // reconcile parents
      d.edges = d.edges.filter((e) => !(e.type === "parent_child" && e.to === id));
      for (const pid of rel.parentIds) {
        if (pid && pid !== id) d.edges.push({ id: `e-${uid()}`, type: "parent_child", from: pid, to: id });
      }

      // reconcile the *current* spouse (leave former spouses untouched)
      d.edges = d.edges.filter(
        (e) => !(e.type === "spouse" && e.status !== "former" && (e.from === id || e.to === id)),
      );
      if (rel.spouseId && rel.spouseId !== id) {
        d.edges.push({
          id: `e-${uid()}`,
          type: "spouse",
          from: rel.spouseId,
          to: id,
          status: "current",
          since: rel.anniversary || undefined,
        });
      }
    });
    return id;
  },

  removePerson(id: string): void {
    const name = this.getPerson(id)?.name ?? "someone";
    mutate(`Removed ${name}`, (d) => {
      d.people = d.people.filter((p) => p.id !== id);
      d.edges = d.edges.filter((e) => e.from !== id && e.to !== id);
    });
  },

  addHousehold(name: string): string {
    const hid = `h-${uid()}`;
    mutate(`Added household “${name}”`, (d) => {
      d.households.push({ id: hid, name });
    });
    return hid;
  },

  // --- audit + undo ---
  getAudit(): AuditEntry[] {
    return readJson<AuditEntry[]>(AUDIT_KEY, []);
  },
  canUndo(): boolean {
    return readJson<FamilyData[]>(UNDO_KEY, []).length > 0;
  },
  undo(): boolean {
    const stack = readJson<FamilyData[]>(UNDO_KEY, []);
    const prev = stack.pop();
    if (!prev) return false;
    localStorage.setItem(UNDO_KEY, JSON.stringify(stack));
    saveData(prev);
    pushAudit("Undid the last change");
    return true;
  },

  resetToSeed(): void {
    saveData(structuredClone(seedFamily));
    localStorage.removeItem(UNDO_KEY);
    localStorage.removeItem(AUDIT_KEY);
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(FAMILY_NAME_KEY);
    this.clearEgo();
  },

  // --- onboarding / personalisation ---

  /** True until the user has started their own family (still showing the demo). */
  isDemo(): boolean {
    return localStorage.getItem(DEMO_KEY) !== "false";
  },

  getFamilyName(): string {
    return localStorage.getItem(FAMILY_NAME_KEY) ?? "";
  },
  setFamilyName(name: string): void {
    const n = name.trim();
    if (n) localStorage.setItem(FAMILY_NAME_KEY, n);
    else localStorage.removeItem(FAMILY_NAME_KEY);
  },

  /**
   * Wipe the demo, start a blank family, plant the first person (you), and
   * make them the current identity. Returns the new person's id.
   */
  beginFamily(person: Person, familyName: string): string {
    const id = `p-${uid()}`;
    saveData({ people: [{ ...person, id }], edges: [], households: [] });
    localStorage.removeItem(UNDO_KEY);
    localStorage.removeItem(AUDIT_KEY);
    localStorage.setItem(DEMO_KEY, "false");
    this.setFamilyName(familyName);
    this.setEgoId(id);
    pushAudit(`Started the family with ${person.name}`);
    return id;
  },
};
