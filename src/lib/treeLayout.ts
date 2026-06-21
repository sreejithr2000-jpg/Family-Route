import type { RelationshipEdge } from "../data/types";
import { buildIndex, parents, children, spouses } from "./graph";

export interface LaidOutNode {
  id: string;
  x: number;
  y: number;
  gen: number;
}

export interface LayoutLink {
  from: string;
  to: string;
  type: "parent_child" | "spouse";
  status?: "current" | "former";
}

export interface TreeLayout {
  nodes: Map<string, LaidOutNode>;
  links: LayoutLink[];
  width: number;
  height: number;
}

// Node + spacing geometry (px).
export const NODE_W = 194;
export const NODE_H = 104;
const X_GAP = 54; // breathing room between separate people in a row
const SPOUSE_GAP = 48; // married couples sit a little apart, joined by the knot
const X_SPACING = NODE_W + X_GAP;
const Y_SPACING = NODE_H + 128;

/**
 * Layered family-tree layout, centred on `egoId`.
 *
 * 1. Assign each reachable person a generation (ego = 0, parents = -1, etc.).
 * 2. Order people within each generation to reduce edge crossings (barycenter sweeps).
 * 3. Assign x-coordinates with a median/averaging pass so parents sit over children,
 *    resolving overlaps to keep a minimum gap.
 */
export function layoutFamily(
  egoId: string,
  allIds: string[],
  edges: RelationshipEdge[],
): TreeLayout {
  const g = buildIndex(edges);

  // --- 1. Generation assignment (BFS over the connected component) ---
  const gen = new Map<string, number>();
  gen.set(egoId, 0);
  const queue = [egoId];
  while (queue.length) {
    const cur = queue.shift()!;
    const cg = gen.get(cur)!;
    const visit = (id: string, ng: number) => {
      if (!gen.has(id)) {
        gen.set(id, ng);
        queue.push(id);
      }
    };
    for (const p of parents(g, cur)) visit(p, cg - 1);
    for (const c of children(g, cur)) visit(c, cg + 1);
    for (const s of spouses(g, cur)) visit(s.id, cg);
  }

  // Include any disconnected people in a far bottom row so nothing vanishes.
  let maxGen = 0;
  for (const v of gen.values()) maxGen = Math.max(maxGen, v);
  for (const id of allIds) if (!gen.has(id)) gen.set(id, maxGen + 2);

  // Normalise so the topmost generation is 0.
  let minGen = Infinity;
  for (const v of gen.values()) minGen = Math.min(minGen, v);
  for (const [id, v] of gen) gen.set(id, v - minGen);

  // --- 2. Build layers and reduce crossings ---
  const layers: string[][] = [];
  for (const [id, gv] of gen) {
    (layers[gv] ??= []).push(id);
  }
  for (const layer of layers) layer?.sort(); // deterministic start

  const orderIndex = (layer: string[]) => {
    const m = new Map<string, number>();
    layer.forEach((id, i) => m.set(id, i));
    return m;
  };

  const neighborsInAdjacent = (id: string): string[] => [
    ...parents(g, id),
    ...children(g, id),
    ...spouses(g, id).map((s) => s.id),
  ];

  // Barycenter sweeps (alternate top-down / bottom-up).
  for (let iter = 0; iter < 10; iter++) {
    const order = layers.map((l) => (l ? orderIndex(l) : new Map()));
    const downward = iter % 2 === 0;
    const range = downward
      ? [...layers.keys()]
      : [...layers.keys()].reverse();

    for (const gv of range) {
      const layer = layers[gv];
      if (!layer) continue;
      const bary = new Map<string, number>();
      for (const id of layer) {
        const ns = neighborsInAdjacent(id);
        let sum = 0;
        let count = 0;
        for (const n of ns) {
          const ng = gen.get(n)!;
          const idx = order[ng]?.get(n);
          if (idx !== undefined) {
            sum += idx;
            count++;
          }
        }
        bary.set(id, count ? sum / count : order[gv].get(id)!);
      }
      layer.sort((a, b) => bary.get(a)! - bary.get(b)!);
    }
  }

  // Keep current spouses sitting next to each other.
  for (const layer of layers) {
    if (!layer) continue;
    const placed = new Set<string>();
    const result: string[] = [];
    for (const id of layer) {
      if (placed.has(id)) continue;
      result.push(id);
      placed.add(id);
      for (const s of spouses(g, id)) {
        if (gen.get(s.id) === gen.get(id) && !placed.has(s.id) && layer.includes(s.id)) {
          result.push(s.id);
          placed.add(s.id);
        }
      }
    }
    layer.length = 0;
    layer.push(...result);
  }

  // --- 3. X-coordinate assignment ---
  const x = new Map<string, number>();
  for (const layer of layers) {
    if (!layer) continue;
    layer.forEach((id, i) => x.set(id, i * X_SPACING));
  }

  for (let iter = 0; iter < 22; iter++) {
    const downward = iter % 2 === 0;
    const range = downward ? [...layers.keys()] : [...layers.keys()].reverse();
    for (const gv of range) {
      const layer = layers[gv];
      if (!layer) continue;

      // desired x = average of each node's neighbours (else keep current)
      const desired = new Map<string, number>();
      for (const id of layer) {
        const ns = neighborsInAdjacent(id);
        let sum = 0;
        let count = 0;
        for (const n of ns) {
          const nx = x.get(n);
          if (nx !== undefined) {
            sum += nx;
            count++;
          }
        }
        desired.set(id, count ? sum / count : x.get(id)!);
      }

      // Group married couples into rigid units so nothing slips between them
      // and they always move toward their children together.
      const used = new Set<string>();
      const units: string[][] = [];
      for (const id of [...layer].sort((a, b) => desired.get(a)! - desired.get(b)!)) {
        if (used.has(id)) continue;
        const partner = spouses(g, id).find(
          (s) => s.status !== "former" && desired.has(s.id) && !used.has(s.id),
        );
        if (partner) {
          const pair = desired.get(id)! <= desired.get(partner.id)! ? [id, partner.id] : [partner.id, id];
          units.push(pair);
          used.add(id);
          used.add(partner.id);
        } else {
          units.push([id]);
          used.add(id);
        }
      }

      const unitCentre = (u: string[]) => u.reduce((s, id) => s + desired.get(id)!, 0) / u.length;
      units.sort((a, b) => unitCentre(a) - unitCentre(b));

      // pack units left-to-right; couples glued at SPOUSE_GAP, units at X_GAP
      let prevRight = -Infinity;
      for (const u of units) {
        const width = u.length === 2 ? 2 * NODE_W + SPOUSE_GAP : NODE_W;
        let x0 = unitCentre(u) - (width - NODE_W) / 2;
        if (x0 < prevRight + X_GAP) x0 = prevRight + X_GAP;
        u.forEach((id, i) => x.set(id, x0 + i * (NODE_W + SPOUSE_GAP)));
        prevRight = x0 + width;
      }

      // re-centre the whole row on the average desired position so it doesn't
      // drift sideways (this is what kept stray couples far from everyone else)
      let shift = 0;
      for (const id of layer) shift += desired.get(id)! - x.get(id)!;
      shift /= layer.length;
      for (const id of layer) x.set(id, x.get(id)! + shift);
    }
  }

  // --- assemble nodes ---
  let minX = Infinity;
  let maxX = -Infinity;
  for (const v of x.values()) {
    minX = Math.min(minX, v);
    maxX = Math.max(maxX, v);
  }

  const nodes = new Map<string, LaidOutNode>();
  for (const [id, gv] of gen) {
    nodes.set(id, {
      id,
      x: (x.get(id) ?? 0) - minX,
      y: gv * Y_SPACING,
      gen: gv,
    });
  }

  const links: LayoutLink[] = [];
  const seenSpouse = new Set<string>();
  for (const e of edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
    if (e.type === "spouse") {
      const key = [e.from, e.to].sort().join("|");
      if (seenSpouse.has(key)) continue;
      seenSpouse.add(key);
    }
    links.push({ from: e.from, to: e.to, type: e.type, status: e.status });
  }

  return {
    nodes,
    links,
    width: maxX - minX + NODE_W,
    height: (layers.length - 1) * Y_SPACING + NODE_H,
  };
}
