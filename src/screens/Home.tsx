import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor, ageOf } from "../lib/people";
import { BrandMark } from "../components/BrandMark";
import { FloatingMotifs } from "../components/FloatingMotifs";
import { Toran } from "../components/Toran";

export function Home() {
  const navigate = useNavigate();
  const egoId = store.getEgoId();
  const me = useMemo(() => (egoId ? store.getPerson(egoId) : undefined), [egoId]);
  const totalPeople = useMemo(() => store.getPeople().length, []);
  const familyName = store.getFamilyName();
  const isDemo = store.isDemo();

  if (!me) {
    // No identity selected yet — send them to the picker.
    navigate("/who", { replace: true });
    return null;
  }

  const age = ageOf(me);
  const justStarted = !isDemo && totalPeople <= 1;

  function switchPerson() {
    store.clearEgo();
    navigate("/who");
  }

  return (
    <>
      <div className="kasavu-frame" />
      <FloatingMotifs />
      <Toran />
      <div className="wrap">
        <div className="home-top">
          <BrandMark />
          <button className="home-switch" onClick={switchPerson}>
            ↺ Not {me.name.split(" ")[0]}? Switch
          </button>
        </div>

        {isDemo && (
          <Link to="/start" className="demo-banner inline">
            ✦ This is the demo family — <b>start your own&nbsp;→</b>
          </Link>
        )}

        <header className="greeting">
          {familyName && <div className="family-name">{familyName}</div>}
          <div className="namaskaram">Namaskaram,</div>
          <h1>
            <span style={{ marginRight: 12 }}>{avatarFor(me)}</span>
            {me.name}
          </h1>
          <div className="meta">
            {me.place ? `${me.place}` : ""}
            {age !== null ? `  ·  ${age} years` : ""}
            {`  ·  one of ${totalPeople} in the family`}
          </div>
        </header>

        {justStarted && (
          <Link to="/family" className="start-hint">
            🌱 Your tree has just you so far. <b>Add your parents, partner, and children →</b>
          </Link>
        )}

        <section className="home-hub">
          <Link to="/tree" className="hub-card live">
            <span className="soon">Open</span>
            <div className="ic">⌖</div>
            <h3>Our family tree</h3>
            <p>See everyone arranged around you — generation by generation.</p>
          </Link>
          <Link to="/relate" className="hub-card live">
            <span className="soon">Open</span>
            <div className="ic">⟡</div>
            <h3>How am I related?</h3>
            <p>Pick anyone and learn exactly how the two of you connect.</p>
          </Link>
          <Link to="/invite" className="hub-card live">
            <span className="soon">Open</span>
            <div className="ic">✉</div>
            <h3>Plan an occasion</h3>
            <p>Build a warm, well-judged invite list for the next function.</p>
          </Link>
          <Link to="/events" className="hub-card live">
            <span className="soon">Open</span>
            <div className="ic">✿</div>
            <h3>Upcoming celebrations</h3>
            <p>Whose birthday or anniversary is coming next, and their age.</p>
          </Link>
          <Link to="/family" className="hub-card live">
            <span className="soon">Open</span>
            <div className="ic">✛</div>
            <h3>Add &amp; manage family</h3>
            <p>Add new relatives, edit details, and tend the family records.</p>
          </Link>
        </section>
      </div>

      <footer className="site-footer">
        <div className="mark"><BrandMark size={22} /></div>
        <div>You’re signed in as <b>{me.name}</b> · Kerala × Tamil Nadu</div>
      </footer>
    </>
  );
}
