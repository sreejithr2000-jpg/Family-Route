import type { FamilyData } from "../data/types";
import { buildIndex, parents, children, spouses } from "./graph";
import { NODE_W, NODE_H } from "./treeLayout";

// An "hourglass" lineage layout centred on the viewer:
//   • ancestors fan UP as a pedigree — father to the left, mother to the right,
//     recursively, so the whole paternal line drifts left and maternal right;
//   • you, your spouse and siblings sit in the middle row;
//   • descendants fan DOWN as a tidy tree.
// Every node carries a `side` (paternal / maternal / core) for colour-coding.

export type LSide = "core" | "paternal" | "maternal";

export interface LNode {
  id: string;
  x: number; // top-left, normalised
  y: number;
  side: LSide;
}

export interface LLink {
  from: string; // the parent (always higher up)
  to: string;
  side: LSide;
  spouse?: boolean;
}

export interface LineageLayout {
  nodes: Map<string, LNode>;
  links: LLink[];
  width: number;
  height: number;
}

const ROW = NODE_H + 96;
const SLOT = NODE_W + 56;

export function layoutLineage(egoId: string, data: FamilyData): LineageLayout {
  const g = buildIndex(data.edges);
  const byId = new Map(data.people.map((p) => [p.id, p] as const));
  const centre = new Map<string, LNode>();

  const genderedParents = (id: string) => {
    const ps = parents(g, id);
    let father: string | undefined;
    let mother: string | undefined;
    for (const p of ps) {
      const gp = byId.get(p);
      if (gp?.gender === "male" && father === undefined) father = p;
      else if (gp?.gender === "female" && mother === undefined) mother = p;
    }
    for (const p of ps) {
      if (p === father || p === mother) continue;
      if (father === undefined) father = p;
      else if (mother === undefined) mother = p;
    }
    return { father, mother };
  };

  // depth of the ancestor tree (to size the horizontal span)
  const depthOf = (id: string, seen: Set<string>): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    const ps = parents(g, id);
    return ps.length === 0 ? 0 : 1 + Math.max(...ps.map((p) => depthOf(p, seen)));
  };
  const maxUp = depthOf(egoId, new Set());
  const W = Math.max(1, 2 ** maxUp) * SLOT;

  // recursive pedigree placement of ancestors
  const placeAnc = (id: string, level: number, xLeft: number, xRight: number, side: LSide) => {
    if (centre.has(id)) return;
    const cx = (xLeft + xRight) / 2;
    centre.set(id, { id, x: cx, y: -level * ROW, side });
    const { father, mother } = genderedParents(id);
    if (father) placeAnc(father, level + 1, xLeft, cx, side);
    if (mother) placeAnc(mother, level + 1, cx, xRight, side);
  };

  centre.set(egoId, { id: egoId, x: 0, y: 0, side: "core" });
  const egoParents = genderedParents(egoId);
  if (egoParents.father) placeAnc(egoParents.father, 1, -W / 2, 0, "paternal");
  if (egoParents.mother) placeAnc(egoParents.mother, 1, 0, W / 2, "maternal");

  // spouse, to the right of you
  const egoSpouse = spouses(g, egoId).find((s) => s.status !== "former")?.id;
  let spouseX = 0;
  if (egoSpouse && !centre.has(egoSpouse)) {
    spouseX = SLOT * 0.92;
    centre.set(egoSpouse, { id: egoSpouse, x: spouseX, y: 0, side: "core" });
  }

  // siblings, to the left of you
  const sibs = new Set<string>();
  for (const par of [egoParents.father, egoParents.mother]) {
    if (!par) continue;
    for (const c of children(g, par)) if (c !== egoId) sibs.add(c);
  }
  let sibX = -SLOT;
  for (const sib of sibs) {
    if (centre.has(sib)) continue;
    centre.set(sib, { id: sib, x: sibX, y: 0, side: "core" });
    sibX -= SLOT;
  }

  // descendants, tidy tree downward from your children
  let cursor = 0;
  const placeDesc = (id: string, depth: number): number => {
    const kids = children(g, id).filter((k) => !centre.has(k));
    const y = depth * ROW;
    if (kids.length === 0) {
      const cx = cursor;
      cursor += SLOT;
      centre.set(id, { id, x: cx, y, side: "core" });
      return cx;
    }
    const kc = kids.map((k) => placeDesc(k, depth + 1));
    const cx = (kc[0] + kc[kc.length - 1]) / 2;
    centre.set(id, { id, x: cx, y, side: "core" });
    return cx;
  };
  const egoKids = children(g, egoId).filter((k) => !centre.has(k));
  if (egoKids.length) {
    cursor = 0;
    const kc = egoKids.map((k) => placeDesc(k, 1));
    const blockCentre = (kc[0] + kc[kc.length - 1]) / 2;
    const shift = spouseX / 2 - blockCentre; // centre under the you–spouse midpoint
    for (const n of centre.values()) if (n.y > 0) n.x += shift;
  }

  // links: every placed node to its placed parents (coloured by the parent's side)
  const links: LLink[] = [];
  for (const n of centre.values()) {
    for (const p of parents(g, n.id)) {
      const pn = centre.get(p);
      if (pn) links.push({ from: p, to: n.id, side: pn.side });
    }
  }
  if (egoSpouse && centre.has(egoSpouse)) {
    links.push({ from: egoId, to: egoSpouse, side: "core", spouse: true });
  }

  // normalise to positive top-left coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of centre.values()) {
    minX = Math.min(minX, n.x - NODE_W / 2);
    maxX = Math.max(maxX, n.x + NODE_W / 2);
    minY = Math.min(minY, n.y - NODE_H / 2);
    maxY = Math.max(maxY, n.y + NODE_H / 2);
  }
  const nodes = new Map<string, LNode>();
  for (const n of centre.values()) {
    nodes.set(n.id, { id: n.id, x: n.x - NODE_W / 2 - minX, y: n.y - NODE_H / 2 - minY, side: n.side });
  }
  return { nodes, links, width: maxX - minX, height: maxY - minY };
}
