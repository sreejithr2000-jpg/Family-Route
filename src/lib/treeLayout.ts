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
export const NODE_W = 168;
export const NODE_H = 96;
const X_SPACING = NODE_W + 46;
const Y_SPACING = NODE_H + 104;

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

  for (let iter = 0; iter < 14; iter++) {
    const downward = iter % 2 === 0;
    const range = downward ? [...layers.keys()] : [...layers.keys()].reverse();
    for (const gv of range) {
      const layer = layers[gv];
      if (!layer) continue;
      // desired x = average of neighbours' x
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
        if (count) x.set(id, sum / count);
      }
      // resolve overlaps left-to-right, preserving order
      const sorted = [...layer].sort((a, b) => x.get(a)! - x.get(b)!);
      for (let i = 1; i < sorted.length; i++) {
        const prev = x.get(sorted[i - 1])!;
        if (x.get(sorted[i])! < prev + X_SPACING) x.set(sorted[i], prev + X_SPACING);
      }
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
