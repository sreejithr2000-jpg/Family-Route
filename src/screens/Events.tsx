import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor } from "../lib/people";
import { upcomingEvents, whenLabel, formatDate, type UpcomingEvent } from "../lib/events";
import { describeRelationship } from "../lib/relationship";
import { BrandMark } from "../components/BrandMark";

type Filter = "all" | "birthday" | "anniversary";

export function Events() {
  const navigate = useNavigate();
  const egoId = store.getEgoId();
  const data = useMemo(() => store.getData(), []);
  const [filter, setFilter] = useState<Filter>("all");

  const events = useMemo(() => upcomingEvents(data), [data]);

  if (!egoId) {
    navigate("/who", { replace: true });
    return null;
  }

  const shown = events.filter((e) => filter === "all" || e.kind === filter);

  const relationLine = (e: UpcomingEvent): string => {
    if (e.kind === "anniversary") return `${e.years} years together`;
    const person = e.people[0];
    const turning = e.years !== null ? `turning ${e.years}` : "";
    if (person.id === egoId) return turning ? `you, ${turning}!` : "you!";
    const term = describeRelationship(data, egoId, person.id).term;
    return [`your ${term}`, turning].filter(Boolean).join(" · ");
  };

  return (
    <div className="events-screen">
      <div className="kasavu-frame" />
      <header className="tree-bar">
        <BrandMark to="/home" />
        <div className="tree-title">
          <span className="ml-label">പിറന്നാൾ</span> Upcoming celebrations
        </div>
        <button className="home-switch" onClick={() => navigate("/home")}>← Home</button>
      </header>

      <div className="events-body">
        <div className="events-filters">
          {(["all", "birthday", "anniversary"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`pill${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Everything" : f === "birthday" ? "🎂 Birthdays" : "💐 Anniversaries"}
            </button>
          ))}
        </div>

        {shown.length === 0 && (
          <div className="relate-empty">No celebrations coming up just now. ✦</div>
        )}

        <div className="events-list">
          {shown.map((e) => {
            const soon = e.daysUntil <= 7;
            return (
              <div key={e.id} className={`event-card${e.daysUntil === 0 ? " today" : ""}`}>
                <div className="event-faces">
                  {e.kind === "anniversary" ? (
                    <span className="couple">
                      <span className="ava">{avatarFor(e.people[0])}</span>
                      <span className="ava overlap">{avatarFor(e.people[1])}</span>
                    </span>
                  ) : (
                    <span className="ava">{avatarFor(e.people[0])}</span>
                  )}
                  <span className="badge-kind">{e.kind === "birthday" ? "🎂" : "💐"}</span>
                </div>

                <div className="event-main">
                  <div className="event-name">
                    {e.kind === "anniversary"
                      ? `${e.people[0].name.split(" ")[0]} & ${e.people[1].name.split(" ")[0]}`
                      : e.people[0].name}
                  </div>
                  <div className="event-sub">{relationLine(e)}</div>
                  <div className="event-date">{formatDate(e.date)}</div>
                </div>

                <div className={`event-when${soon ? " soon" : ""}`}>
                  {e.daysUntil === 0 ? "today 🎉" : whenLabel(e.daysUntil)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
