import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor, subtitleFor } from "../lib/people";
import { BrandMark } from "../components/BrandMark";
import { FloatingMotifs } from "../components/FloatingMotifs";

export function WhoAreYou() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const people = useMemo(() => store.getPeople(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? people
      : people.filter((p) =>
          [p.name, ...(p.nicknames ?? []), p.place ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [people, query]);

  function choose(id: string) {
    store.setEgoId(id);
    navigate("/home");
  }

  return (
    <>
      <div className="kasavu-frame" />
      <FloatingMotifs />
      <div className="wrap whoami">
        <BrandMark />
        <div className="kicker reveal d1" style={{ marginTop: 34 }}>Namaskaram</div>
        <h1 className="reveal d2">Who’s coming home?</h1>
        <p className="sub reveal d2">
          Find your name below. The whole family will arrange itself around you.
        </p>

        {store.isDemo() && (
          <Link to="/start" className="demo-banner inline reveal d2">
            ✦ This is a demo family — <b>set up your own&nbsp;→</b>
          </Link>
        )}

        <input
          className="search reveal d3"
          type="search"
          placeholder="Search your name, nickname or place…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="people-grid reveal d4">
          {filtered.map((p) => (
            <button key={p.id} className="person-pick" onClick={() => choose(p.id)}>
              <span className="ava">{avatarFor(p)}</span>
              <span>
                <div className="nm">
                  {p.name}
                  {p.nicknames?.length ? (
                    <span className="mt"> · {p.nicknames[0]}</span>
                  ) : null}
                </div>
                <div className="mt">{subtitleFor(p) || "—"}</div>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: "var(--ink-soft)", gridColumn: "1 / -1", textAlign: "center" }}>
              No one by that name yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
