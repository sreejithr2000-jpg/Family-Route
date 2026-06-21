import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor } from "../lib/people";
import { describeRelationship } from "../lib/relationship";
import { PersonSelect } from "../components/PersonSelect";
import { BrandMark } from "../components/BrandMark";

/** Pull small descriptive chips out of a relationship term. */
function chipsFor(term: string): string[] {
  const t = term.toLowerCase();
  const chips: string[] = [];
  if (t.includes("paternal")) chips.push("Paternal side");
  else if (t.includes("maternal")) chips.push("Maternal side");
  if (t.includes("elder")) chips.push("Elder");
  else if (t.includes("younger")) chips.push("Younger");
  if (t.includes("in-law") || t.includes("by marriage")) chips.push("By marriage");
  else if (!["you", "family"].includes(t)) chips.push("By blood");
  return chips;
}

export function Relate() {
  const navigate = useNavigate();
  const egoId = store.getEgoId();
  const data = useMemo(() => store.getData(), []);
  const people = data.people;

  const [fromId, setFromId] = useState<string | null>(egoId);
  const [toId, setToId] = useState<string | null>(null);

  if (!egoId) {
    navigate("/who", { replace: true });
    return null;
  }

  const result = fromId && toId ? describeRelationship(data, fromId, toId) : null;
  const reverse = fromId && toId && fromId !== toId ? describeRelationship(data, toId, fromId) : null;
  const fromPerson = fromId ? people.find((p) => p.id === fromId) : undefined;
  const toPerson = toId ? people.find((p) => p.id === toId) : undefined;
  const fromIsYou = fromId === egoId;

  return (
    <div className="relate-screen">
      <div className="kasavu-frame" />
      <header className="tree-bar">
        <BrandMark to="/home" />
        <div className="tree-title">
          <span className="ml-label">ബന്ധം</span> How am I related?
        </div>
        <button className="home-switch" onClick={() => navigate("/home")}>← Home</button>
      </header>

      <div className="relate2">
        <div className="relate2-pickers">
          <PersonSelect
            label="From"
            hint={fromIsYou ? "you" : undefined}
            people={people}
            value={fromId}
            onChange={(v) => setFromId(v)}
          />
          <button
            className="swap-btn"
            title="Swap"
            onClick={() => { setFromId(toId); setToId(fromId); }}
          >
            ⇄
          </button>
          <PersonSelect label="To" people={people} value={toId} onChange={(v) => setToId(v)} />
        </div>

        <div className="relate2-stage">
          {!toPerson ? (
            <div className="relate2-empty">
              <div className="flourish">✦</div>
              <p>Pick the second person and we’ll trace the bond between them.</p>
            </div>
          ) : (
            result && fromPerson && (
              <div className="relate2-result">
                <span className="ava">{avatarFor(toPerson)}</span>
                <div className="rr-body">
                  <div className="rr-head">
                    <b>{toPerson.name}</b> {fromIsYou ? "is your" : `is ${fromPerson.name.split(" ")[0]}’s`}
                  </div>
                  <div className="rr-term">{result.term}</div>

                  {chipsFor(result.term).length > 0 && (
                    <div className="rel-chips">
                      {chipsFor(result.term).map((c) => (
                        <span key={c} className="rel-chip">{c}</span>
                      ))}
                    </div>
                  )}

                  {reverse && (
                    <p className="relate2-reverse">
                      …and {fromIsYou ? "you are" : `${fromPerson.name.split(" ")[0]} is`}{" "}
                      {toPerson.name.split(" ")[0]}’s <b>{reverse.term}</b>
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
