import { useMemo, useState } from "react";
import type { Person } from "../data/types";
import { avatarFor, subtitleFor } from "../lib/people";

/** A compact searchable single-person selector, reused across screens. */
export function PersonSelect({
  label,
  hint,
  people,
  value,
  onChange,
  exclude = [],
  clearable = false,
  placeholder = "Choose a person…",
}: {
  label?: string;
  hint?: string;
  people: Person[];
  value: string | null;
  onChange: (id: string | null) => void;
  exclude?: string[];
  clearable?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = value ? people.find((p) => p.id === value) : undefined;

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = people
      .filter((p) => !exclude.includes(p.id))
      .filter((p) =>
        !needle
          ? true
          : [p.name, ...(p.nicknames ?? []), p.place ?? ""].join(" ").toLowerCase().includes(needle),
      );
    return [...list].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 40);
  }, [people, q, exclude]);

  return (
    <div className="rel-field">
      {label && (
        <div className="rel-field-label">
          {label} {hint && <span className="rel-hint">{hint}</span>}
        </div>
      )}
      <button type="button" className="rel-selected" onClick={() => setOpen((o) => !o)}>
        {selected ? (
          <>
            <span className="ava">{avatarFor(selected)}</span>
            <span className="who">
              <span className="nm">{selected.name}</span>
              <span className="mt">{subtitleFor(selected) || "—"}</span>
            </span>
          </>
        ) : (
          <span className="rel-placeholder">{placeholder}</span>
        )}
        {clearable && selected ? (
          <span
            className="chev clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            ✕
          </span>
        ) : (
          <span className="chev">{open ? "▴" : "▾"}</span>
        )}
      </button>

      {open && (
        <div className="rel-pop">
          <input
            className="search"
            autoFocus
            placeholder="Search name, nickname, place…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="rel-list">
            {results.map((p) => (
              <button
                type="button"
                key={p.id}
                className="rel-list-item"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setQ("");
                }}
              >
                <span className="ava sm">{avatarFor(p)}</span>
                <span className="nm">{p.name}</span>
                <span className="mt">{subtitleFor(p)}</span>
              </button>
            ))}
            {results.length === 0 && <div className="rel-none">No one found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
