import type { RelationshipEdge } from "../data/types";

export interface GraphIndex {
  parentsOf: Map<string, string[]>;
  childrenOf: Map<string, string[]>;
  spousesOf: Map<string, { id: string; status?: "current" | "former" }[]>;
}

/** Build fast adjacency lookups from the flat edge list. */
export function buildIndex(edges: RelationshipEdge[]): GraphIndex {
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, { id: string; status?: "current" | "former" }[]>();

  const push = <T,>(m: Map<string, T[]>, k: string, v: T) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };

  for (const e of edges) {
    if (e.type === "parent_child") {
      push(childrenOf, e.from, e.to);
      push(parentsOf, e.to, e.from);
    } else if (e.type === "spouse") {
      push(spousesOf, e.from, { id: e.to, status: e.status });
      push(spousesOf, e.to, { id: e.from, status: e.status });
    }
  }

  return { parentsOf, childrenOf, spousesOf };
}

export const parents = (g: GraphIndex, id: string) => g.parentsOf.get(id) ?? [];
export const children = (g: GraphIndex, id: string) => g.childrenOf.get(id) ?? [];
export const spouses = (g: GraphIndex, id: string) => g.spousesOf.get(id) ?? [];
