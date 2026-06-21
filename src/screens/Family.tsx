import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor, subtitleFor } from "../lib/people";
import type { Person } from "../data/types";
import { BrandMark } from "../components/BrandMark";
import { PersonForm } from "../components/PersonForm";

export function Family() {
  const navigate = useNavigate();
  const egoId = store.getEgoId();
  const [nonce, setNonce] = useState(0); // bump to refresh after mutations
  const refresh = () => setNonce((n) => n + 1);

  const data = useMemo(() => store.getData(), [nonce]);
  const audit = useMemo(() => store.getAudit(), [nonce]);
  const canUndo = useMemo(() => store.canUndo(), [nonce]);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Person | null>(null);
  const [adding, setAdding] = useState(false);

  if (!egoId) {
    navigate("/who", { replace: true });
    return null;
  }

  const householdName = (id?: string) => data.households.find((h) => h.id === id)?.name;

  const people = [...data.people]
    .filter((p) =>
      !query.trim()
        ? true
        : [p.name, ...(p.nicknames ?? []), p.place ?? ""].join(" ").toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  function remove(p: Person) {
    if (p.id === egoId) {
      alert("That’s you — switch to someone else before removing this profile.");
      return;
    }
    if (confirm(`Remove ${p.name} from the family? You can undo this.`)) {
      store.removePerson(p.id);
      refresh();
    }
  }

  return (
    <div className="family-screen">
      <div className="kasavu-frame" />
      <header className="tree-bar">
        <BrandMark to="/home" />
        <div className="tree-title">
          <span className="ml-label">കുടുംബം</span> Manage family
        </div>
        <button className="home-switch" onClick={() => navigate("/home")}>← Home</button>
      </header>

      <div className="family-body">
        <div className="family-actions">
          <input
            className="search"
            placeholder="Search the family…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="spacer" />
          {canUndo && (
            <button className="btn btn-ghost" onClick={() => { store.undo(); refresh(); }}>
              ↺ Undo
            </button>
          )}
          <button className="btn btn-solid" onClick={() => setAdding(true)}>+ Add person</button>
        </div>

        <div className="family-count">{data.people.length} people · {data.households.length} households</div>

        <div className="family-grid">
          {people.map((p) => (
            <div key={p.id} className={`family-card${p.id === egoId ? " me" : ""}`}>
              <span className="ava">{avatarFor(p)}</span>
              <div className="info">
                <div className="nm">
                  {p.name}
                  {p.id === egoId && <span className="me-tag">you</span>}
                </div>
                <div className="mt">{subtitleFor(p) || "—"}</div>
                {householdName(p.householdId) && <div className="hh">🏠 {householdName(p.householdId)}</div>}
              </div>
              <div className="row-actions">
                <button title="Edit" onClick={() => setEditing(p)}>✎</button>
                <button title="Remove" onClick={() => remove(p)}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {audit.length > 0 && (
          <section className="audit">
            <h3>Recent changes</h3>
            <ul>
              {audit.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <span className="a-when">{new Date(a.ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="a-text">{a.summary}</span>
                  <span className="a-who">— {a.actor}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {(adding || editing) && (
        <PersonForm
          editing={editing ?? undefined}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={() => { setAdding(false); setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}
