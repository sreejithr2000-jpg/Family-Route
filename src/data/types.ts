// --- Core domain model for Family Routes ---
// We store only ATOMIC relationship edges (parent_child, spouse).
// Every other relationship (cousin, uncle, in-law, maternal/paternal,
// elder/younger) is DERIVED by walking the graph from the "ego" person.

export type Gender = "male" | "female" | "other";

export interface Contact {
  phone?: string;
  email?: string;
  address?: string;
}

export interface Person {
  id: string;
  name: string;
  nicknames?: string[];
  gender?: Gender;
  /** ISO date string, e.g. "1958-04-12" */
  dob?: string;
  place?: string;
  nativePlace?: string;
  gotra?: string;
  contact?: Contact;
  /** Deceased members blend in visually; status shows only on their own profile. */
  isDeceased?: boolean;
  dateOfDeath?: string;
  householdId?: string;
}

export type EdgeType = "parent_child" | "spouse";

export interface RelationshipEdge {
  id: string;
  type: EdgeType;
  /** parent_child: `from` is the parent. spouse: either spouse. */
  from: string;
  /** parent_child: `to` is the child. spouse: the other spouse. */
  to: string;
  /** spouse only — supports remarriage / 2nd marriage. */
  status?: "current" | "former";
  /** spouse only — marriage date (ISO), used for anniversaries. */
  since?: string;
}

export interface Household {
  id: string;
  name: string;
}

export interface FamilyData {
  people: Person[];
  edges: RelationshipEdge[];
  households: Household[];
}
