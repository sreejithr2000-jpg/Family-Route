import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor } from "../lib/people";
import {
  EVENT_TYPES,
  buildCandidates,
  autoSelect,
  buildExportText,
  circleName,
  type Candidate,
} from "../lib/invite";
import { BrandMark } from "../components/BrandMark";

export function Invite() {
  const navigate = useNavigate();
  const hostId = store.getEgoId();
  const data = useMemo(() => store.getData(), []);

  const [etId, setEtId] = useState(EVENT_TYPES[0].id);
  const event = EVENT_TYPES.find((e) => e.id === etId)!;

  const [maxCircle, setMaxCircle] = useState(event.maxCircle);
  const [cap, setCap] = useState(event.cap);
  const [includeDeceased, setIncludeDeceased] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // When the occasion changes, adopt its default scope.
  useEffect(() => {
    setMaxCircle(event.maxCircle);
    setCap(event.cap);
    setIncludeDeceased(false);
  }, [etId]); // eslint-disable-line react-hooks/exhaustive-deps

  const candidates = useMemo(
    () => (hostId ? buildCandidates(data, hostId, includeDeceased) : []),
    [data, hostId, includeDeceased],
  );

  // Recompute the suggestion whenever the scope changes (resets manual tweaks).
  useEffect(() => {
    if (!hostId) return;
    setSelected(autoSelect(candidates, hostId, maxCircle, cap));
    setCopied(false);
  }, [candidates, hostId, maxCircle, cap]);

  if (!hostId) {
    navigate("/who", { replace: true });
    return null;
  }
  const host = data.people.find((p) => p.id === hostId)!;

  // People shown in the list: host + everyone within the chosen circle range.
  const eligible = candidates.filter((c) => c.person.id === hostId || (c.circle >= 1 && c.circle <= maxCircle));
  const groups = new Map<number, Candidate[]>();
  for (const c of eligible) {
    if (!groups.has(c.circle)) groups.set(c.circle, []);
    groups.get(c.circle)!.push(c);
  }
  const orderedCircles = [...groups.keys()].sort((a, b) => a - b);

  const count = selected.size;
  const over = count > cap;

  const toggle = (id: string) => {
    if (id === hostId) return; // host always attends
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setCopied(false);
  };

  const selectedCandidates = candidates
    .filter((c) => selected.has(c.person.id))
    .sort((a, b) => a.circle - b.circle || a.person.name.localeCompare(b.person.name));

  const exportText = buildExportText(event, host, selectedCandidates);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
    } catch {
      setShowExport(true);
    }
  };

  return (
    <div className="invite-screen">
      <div className="kasavu-frame" />
      <header className="tree-bar">
        <BrandMark to="/home" />
        <div className="tree-title">
          <span className="ml-label">ക്ഷണം</span> Plan an occasion
        </div>
        <button className="home-switch" onClick={() => navigate("/home")}>← Home</button>
      </header>

      <div className="invite-body">
        <p className="relate-intro">Planning as <b>{host.name}</b>. Pick the occasion — we’ll gather the right people.</p>

        {/* event type cards */}
        <div className="event-types">
          {EVENT_TYPES.map((e) => (
            <button
              key={e.id}
              className={`et-card${e.id === etId ? " active" : ""}`}
              onClick={() => setEtId(e.id)}
            >
              <span className="et-emoji">{e.emoji}</span>
              <span className="et-label">{e.label}</span>
            </button>
          ))}
        </div>
        <p className="et-note">{event.note}</p>

        {/* controls */}
        <div className="invite-controls">
          <label className="ctrl">
            <span>Invite outward to</span>
            <select value={maxCircle} onChange={(e) => setMaxCircle(Number(e.target.value))}>
              <option value={1}>Immediate family</option>
              <option value={2}>Close family</option>
              <option value={3}>Extended family</option>
              <option value={4}>Wider family</option>
            </select>
          </label>
          <label className="ctrl">
            <span>Headcount cap</span>
            <input
              type="number"
              min={1}
              value={cap}
              onChange={(e) => setCap(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label className="ctrl checkbox">
            <input
              type="checkbox"
              checked={includeDeceased}
              onChange={(e) => setIncludeDeceased(e.target.checked)}
            />
            <span>Include those who’ve passed</span>
          </label>
        </div>

        {/* running count */}
        <div className={`invite-summary${over ? " over" : ""}`}>
          <div className="count">
            <b>{count}</b> / {cap} guests
            {over && <span className="over-tag">over cap</span>}
          </div>
          <div className="bar"><span style={{ width: `${Math.min(100, (count / cap) * 100)}%` }} /></div>
        </div>

        {/* guest list grouped by circle */}
        <div className="guest-list">
          {orderedCircles.map((circle) => (
            <div key={circle} className="guest-group">
              <div className="guest-group-head">
                <span>{circleName(circle)}</span>
                <span className="gc">
                  {groups.get(circle)!.filter((c) => selected.has(c.person.id)).length}/
                  {groups.get(circle)!.length}
                </span>
              </div>
              {groups.get(circle)!.map((c) => {
                const on = selected.has(c.person.id);
                const isHost = c.person.id === hostId;
                return (
                  <button
                    key={c.person.id}
                    className={`guest-row${on ? " on" : ""}${isHost ? " host" : ""}`}
                    onClick={() => toggle(c.person.id)}
                  >
                    <span className="check">{on ? "✓" : ""}</span>
                    <span className="ava">{avatarFor(c.person)}</span>
                    <span className="who">
                      <span className="nm">{c.person.name}</span>
                      <span className="mt">{isHost ? "you · host" : c.term}</span>
                    </span>
                    {isHost && <span className="pin">always</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* export */}
        <div className="invite-export">
          <button className="btn btn-solid" onClick={copy}>
            {copied ? "✓ Copied!" : "Copy WhatsApp list"}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowExport((s) => !s)}>
            {showExport ? "Hide preview" : "Preview list"}
          </button>
        </div>
        {showExport && <textarea className="export-area" readOnly value={exportText} rows={Math.min(20, exportText.split("\n").length + 1)} />}
      </div>
    </div>
  );
}
