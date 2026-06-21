import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor, ageOf } from "../lib/people";
import { layoutFamily, NODE_W, NODE_H } from "../lib/treeLayout";
import { buildIndex, parents } from "../lib/graph";
import { sideForAll, type Side } from "../lib/relationship";
import { layoutLineage, type LSide } from "../lib/lineageLayout";
import type { Person } from "../data/types";
import { BrandMark } from "../components/BrandMark";

type SideFilter = "all" | "paternal" | "maternal";
type ViewMode = "whole" | "lineage";

const sideColour = (s: LSide) =>
  s === "paternal" ? "var(--terracotta)" : s === "maternal" ? "var(--leaf)" : "var(--brass)";

/** A small, muted lotus — a gentle, respectful mark for someone who has passed. */
function MemorialLotus() {
  return (
    <svg viewBox="0 0 24 18" aria-hidden="true">
      <path d="M12 1 C 10 7, 10 12, 12 17 C 14 12, 14 7, 12 1 Z" fill="#b58a4e" />
      <path d="M12 17 C 7 14, 4 10, 4 5 C 8.5 6, 11 11, 12 17 Z" fill="#cda877" />
      <path d="M12 17 C 17 14, 20 10, 20 5 C 15.5 6, 13 11, 12 17 Z" fill="#cda877" />
    </svg>
  );
}

/** A little marigold flower used as a spouse "knot" — festive, like a garland. */
function KnotFlower({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-5.5} rx={2.8} ry={4.8} fill="#F4A300" transform={`rotate(${a})`} />
      ))}
      <circle r={3} fill="#9C3A22" />
    </g>
  );
}

interface Transform { x: number; y: number; k: number; }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function Tree() {
  const navigate = useNavigate();
  const egoId = store.getEgoId();

  const data = useMemo(() => store.getData(), []);
  const peopleById = useMemo(() => {
    const m = new Map<string, Person>();
    for (const p of data.people) m.set(p.id, p);
    return m;
  }, [data]);

  const layout = useMemo(() => {
    if (!egoId) return null;
    return layoutFamily(
      egoId,
      data.people.map((p) => p.id),
      data.edges,
    );
  }, [egoId, data]);

  const gIndex = useMemo(() => buildIndex(data.edges), [data]);
  const sideMap = useMemo(
    () => (egoId ? sideForAll(data, egoId) : new Map<string, Side>()),
    [data, egoId],
  );

  const lineageData = useMemo(
    () => (egoId ? layoutLineage(egoId, data) : null),
    [egoId, data],
  );

  const [mode, setMode] = useState<ViewMode>("whole");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [householdFilter, setHouseholdFilter] = useState<string>("all");

  // Descent links: one line per child, drawn from the parents' midpoint.
  // (Declared here — before any early return — to respect the Rules of Hooks.)
  const descents = useMemo(() => {
    const out: { key: string; d: string; sx: number; sy: number; cx: number; cy: number }[] = [];
    if (!layout) return out;
    for (const child of layout.nodes.values()) {
      const ps = parents(gIndex, child.id)
        .map((pid) => layout.nodes.get(pid))
        .filter(Boolean) as { x: number; y: number }[];
      if (ps.length === 0) continue;
      const sx = ps.reduce((s, p) => s + p.x + NODE_W / 2, 0) / ps.length;
      const sy = Math.max(...ps.map((p) => p.y + NODE_H));
      const cx = child.x + NODE_W / 2;
      const cy = child.y;
      const midY = (sy + cy) / 2;

      let d: string;
      if (Math.abs(cx - sx) > NODE_W * 1.2) {
        // Distant link (e.g. a married-in person to their faraway parents):
        // a smooth S-curve so it never merges with the sibling brackets.
        d = `M ${sx} ${sy} C ${sx} ${midY}, ${cx} ${midY}, ${cx} ${cy}`;
      } else {
        // Child sits under its parents → clean bracket that comes down distinctly.
        const dir = cx >= sx ? 1 : -1;
        const r = Math.min(10, Math.max(0, midY - sy - 1), Math.max(0, cy - midY - 1));
        d =
          `M ${sx} ${sy} L ${sx} ${midY - r} Q ${sx} ${midY} ${sx + dir * r} ${midY} ` +
          `L ${cx - dir * r} ${midY} Q ${cx} ${midY} ${cx} ${midY + r} L ${cx} ${cy}`;
      }
      out.push({ key: child.id, d, sx, sy, cx, cy });
    }
    return out;
  }, [layout, gIndex]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<Transform>({ x: 0, y: 0, k: 0.85 });
  const [selected, setSelected] = useState<string | null>(egoId);
  const drag = useRef<{ active: boolean; sx: number; sy: number; ox: number; oy: number; moved: boolean }>({
    active: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false,
  });

  // Centre the view on "me" once we know the viewport size, and whenever the
  // view (whole-family vs lineage) changes.
  useLayoutEffect(() => {
    const v = mode === "lineage" ? lineageData : layout;
    if (!v || !egoId || !viewportRef.current) return;
    const me = v.nodes.get(egoId);
    const rect = viewportRef.current.getBoundingClientRect();
    if (!me) return;
    const k = 0.85;
    setTf({
      x: rect.width / 2 - (me.x + NODE_W / 2) * k,
      y: rect.height * 0.42 - (me.y + NODE_H / 2) * k,
      k,
    });
  }, [layout, lineageData, egoId, mode]);

  // Native wheel listener so we can preventDefault (zoom toward cursor).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setTf((t) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const k = clamp(t.k * factor, 0.3, 2.2);
        const wx = (cx - t.x) / t.k;
        const wy = (cy - t.y) / t.k;
        return { k, x: cx - wx * k, y: cy - wy * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (!egoId || !layout || !lineageData) {
    navigate("/who", { replace: true });
    return null;
  }

  // Active view: the whole-family network, or the ego-centric lineage hourglass.
  const isLineage = mode === "lineage";
  const view = isLineage ? lineageData : layout;
  const activeNodes = view.nodes;
  const activeWidth = view.width;
  const activeHeight = view.height;

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: tf.x, oy: tf.y, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    setTf((t) => ({ ...t, x: drag.current.ox + dx, y: drag.current.oy + dy }));
  }
  function onPointerUp() {
    drag.current.active = false;
  }

  const zoom = (factor: number) =>
    setTf((t) => {
      const el = viewportRef.current!;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const k = clamp(t.k * factor, 0.3, 2.2);
      const wx = (cx - t.x) / t.k;
      const wy = (cy - t.y) / t.k;
      return { k, x: cx - wx * k, y: cy - wy * k };
    });

  const centerOnMe = () => {
    const me = activeNodes.get(egoId);
    const rect = viewportRef.current!.getBoundingClientRect();
    if (!me) return;
    const k = 0.9;
    setTf({ x: rect.width / 2 - (me.x + NODE_W / 2) * k, y: rect.height * 0.42 - (me.y + NODE_H / 2) * k, k });
  };

  // Filters apply to the whole-family view only (lineage already splits sides).
  const matches = (id: string): boolean => {
    if (sideFilter !== "all") {
      const s = sideMap.get(id);
      if (s !== "core" && s !== sideFilter) return false;
    }
    if (householdFilter !== "all") {
      if (peopleById.get(id)?.householdId !== householdFilter) return false;
    }
    return true;
  };
  const filtering = !isLineage && (sideFilter !== "all" || householdFilter !== "all");

  // Print / Save as PDF: fit the whole tree to the page, then open the dialog.
  const printTree = () => {
    const fit = Math.min(1, 1040 / activeWidth);
    setTf({ x: 0, y: 0, k: fit });
    document.body.classList.add("printing-tree");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("printing-tree");
    }, 120);
  };

  const sel = selected ? peopleById.get(selected) : undefined;

  return (
    <div className="tree-screen">
      <div className="kasavu-frame" />

      <header className="tree-bar">
        <BrandMark to="/home" />
        <div className="tree-title">
          <span className="ml-label">കുടുംബവൃക്ഷം</span> Our family tree
        </div>
        <button className="home-switch" onClick={() => navigate("/home")}>← Home</button>
      </header>

      <div className="tree-filterbar">
        <div className="seg">
          {(["whole", "lineage"] as ViewMode[]).map((m) => (
            <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {m === "whole" ? "Whole family" : "My lineage"}
            </button>
          ))}
        </div>

        {!isLineage && (
          <>
            <div className="seg">
              {(["all", "paternal", "maternal"] as SideFilter[]).map((s) => (
                <button key={s} className={sideFilter === s ? "on" : ""} onClick={() => setSideFilter(s)}>
                  {s === "all" ? "Everyone" : s === "paternal" ? "Father’s side" : "Mother’s side"}
                </button>
              ))}
            </div>
            {data.households.length > 0 && (
              <select value={householdFilter} onChange={(e) => setHouseholdFilter(e.target.value)}>
                <option value="all">All households</option>
                {data.households.map((h) => (
                  <option key={h.id} value={h.id}>🏠 {h.name}</option>
                ))}
              </select>
            )}
          </>
        )}

        {isLineage && (
          <div className="side-legend">
            <span><i style={{ background: "var(--terracotta)" }} /> Father’s line</span>
            <span><i style={{ background: "var(--leaf)" }} /> Mother’s line</span>
          </div>
        )}

        <button className="ghost-mini" onClick={() => navigate("/family")}>+ Add / manage</button>
      </div>

      <div
        className="tree-viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="tree-canvas"
          style={{
            transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.k})`,
            width: activeWidth,
            height: activeHeight,
          }}
        >
          <svg className="tree-links" width={activeWidth} height={activeHeight}>
            {!isLineage && layout.links
              .filter((l) => l.type === "spouse")
              .map((l, i) => {
                const a = layout.nodes.get(l.from)!;
                const b = layout.nodes.get(l.to)!;
                const left = a.x <= b.x ? a : b;
                const right = a.x <= b.x ? b : a;
                const y = left.y + NODE_H / 2;
                const x1 = left.x + NODE_W;
                const x2 = right.x;
                const midX = (x1 + x2) / 2;
                const dim = filtering && !(matches(l.from) && matches(l.to));
                return (
                  <g key={`s${i}`} opacity={dim ? 0.1 : 1}>
                    <line
                      x1={x1} y1={y} x2={x2} y2={y}
                      stroke="var(--terracotta)" strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeDasharray={l.status === "former" ? "4 7" : undefined}
                    />
                    {l.status === "former" ? (
                      <circle cx={midX} cy={y} r={4} fill="var(--cream)" stroke="var(--terracotta)" strokeWidth={1.4} />
                    ) : (
                      <KnotFlower x={midX} y={y} />
                    )}
                  </g>
                );
              })}
            {!isLineage && descents.map((p) => {
              const dim = filtering && !matches(p.key);
              return (
                <g key={p.key} opacity={dim ? 0.1 : 1}>
                  <path d={p.d} fill="none" stroke="var(--leaf)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={p.sx} cy={p.sy} r={3} fill="var(--leaf-deep)" />
                  <circle cx={p.cx} cy={p.cy} r={3.6} fill="#F4A300" stroke="var(--cream)" strokeWidth={1.2} />
                </g>
              );
            })}

            {/* lineage links: side-coloured pedigree lines + spouse knot */}
            {isLineage && lineageData.links.map((l, i) => {
              const a = lineageData.nodes.get(l.from)!;
              const b = lineageData.nodes.get(l.to)!;
              if (l.spouse) {
                const left = a.x <= b.x ? a : b;
                const right = a.x <= b.x ? b : a;
                const y = left.y + NODE_H / 2;
                return (
                  <g key={`l${i}`}>
                    <line x1={left.x + NODE_W} y1={y} x2={right.x} y2={y} stroke="var(--terracotta)" strokeWidth={2.2} strokeLinecap="round" />
                    <KnotFlower x={(left.x + NODE_W + right.x) / 2} y={y} />
                  </g>
                );
              }
              // a is the parent (higher up), b the child (lower)
              const px = a.x + NODE_W / 2;
              const py = a.y + NODE_H;
              const cx = b.x + NODE_W / 2;
              const cy = b.y;
              const midY = (py + cy) / 2;
              const dir = cx >= px ? 1 : -1;
              const r = Math.min(10, Math.max(0, midY - py - 1), Math.max(0, cy - midY - 1));
              const d =
                `M ${px} ${py} L ${px} ${midY - r} Q ${px} ${midY} ${px + dir * r} ${midY} ` +
                `L ${cx - dir * r} ${midY} Q ${cx} ${midY} ${cx} ${midY + r} L ${cx} ${cy}`;
              return (
                <g key={`l${i}`}>
                  <path d={d} fill="none" stroke={sideColour(l.side)} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={cx} cy={cy} r={3.4} fill={sideColour(l.side)} stroke="var(--cream)" strokeWidth={1.2} />
                </g>
              );
            })}
          </svg>

          {[...activeNodes.values()].map((n) => {
            const person = peopleById.get(n.id)!;
            const isEgo = n.id === egoId;
            const isSel = n.id === selected;
            const a = ageOf(person);
            return (
              <button
                key={n.id}
                className={`tree-node g-${person.gender ?? "other"}${isEgo ? " ego" : ""}${isSel ? " selected" : ""}${filtering && !matches(n.id) ? " dim" : ""}${isLineage && "side" in n ? ` lineage-${n.side}` : ""}`}
                style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!drag.current.moved) setSelected(n.id);
                }}
              >
                <span className="ava">
                  {avatarFor(person)}
                  {person.isDeceased && (
                    <span className="memorial" title="In loving memory">
                      <MemorialLotus />
                    </span>
                  )}
                </span>
                <span className="who">
                  <span className="nm">{person.name}</span>
                  <span className="mt">
                    {person.place ? person.place.split(",")[0] : ""}
                    {a !== null && !person.isDeceased ? ` · ${a}` : ""}
                  </span>
                </span>
                {isEgo && <span className="you-tag">you</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* zoom controls */}
      <div className="tree-controls">
        <button onClick={() => zoom(1.15)} aria-label="Zoom in">＋</button>
        <button onClick={() => zoom(0.87)} aria-label="Zoom out">－</button>
        <button onClick={centerOnMe} aria-label="Centre on me">⌖</button>
        <button onClick={printTree} aria-label="Save as PDF" title="Print / Save as PDF">⎙</button>
      </div>

      {/* detail drawer */}
      {sel && (
        <aside className="person-drawer">
          <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
          <div className="drawer-ava">{avatarFor(sel)}</div>
          <h2>{sel.name}</h2>
          {sel.nicknames?.length ? <div className="drawer-nick">“{sel.nicknames.join("”, “")}”</div> : null}
          <hr className="rule" />
          <dl className="drawer-meta">
            {sel.place && (<><dt>Lives in</dt><dd>{sel.place}</dd></>)}
            {sel.nativePlace && (<><dt>Native place</dt><dd>{sel.nativePlace}</dd></>)}
            {sel.gotra && (<><dt>Gotra</dt><dd>{sel.gotra}</dd></>)}
            {/* Deceased blends in: shown only here, gently, as years — no stark badge. */}
            {sel.isDeceased
              ? (<><dt>Years</dt><dd className="years">{sel.dob ? new Date(sel.dob).getFullYear() : "?"} – {sel.dateOfDeath ? new Date(sel.dateOfDeath).getFullYear() : "?"}</dd></>)
              : sel.dob && (<><dt>Born</dt><dd>{new Date(sel.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}{ageOf(sel) !== null ? ` · ${ageOf(sel)} years` : ""}</dd></>)}
            {sel.contact?.phone && (<><dt>Phone</dt><dd>{sel.contact.phone}</dd></>)}
          </dl>
          {sel.id === egoId && <div className="drawer-youline">This is you ✦</div>}
        </aside>
      )}

      <div className="tree-hint">Drag to move · scroll to zoom · tap anyone for details</div>
    </div>
  );
}
