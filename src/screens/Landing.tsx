import { Link } from "react-router-dom";
import { store } from "../data/store";
import { BrandMark } from "../components/BrandMark";
import { Pookalam } from "../components/Pookalam";
import { FloatingMotifs } from "../components/FloatingMotifs";
import { Toran } from "../components/Toran";

const RELATIONS = [
  "Amma", "Achan", "Ammamma", "Periyappa", "Chithappa",
  "Maama", "Athai", "Cheriyamma", "Valyamma", "Paati",
];

export function Landing() {
  const isDemo = store.isDemo();
  const egoId = store.getEgoId();
  // First-time visitors go to setup; returning family members go to their home.
  const enterHref = isDemo ? "/start" : egoId ? "/home" : "/who";
  const enterLabel = isDemo ? "Set up our family" : "Enter our home";
  return (
    <>
      <div className="kasavu-frame" />
      <FloatingMotifs />
      <Toran />
      {isDemo && (
        <Link to="/start" className="demo-banner">
          ✦ You’re exploring a demo family — <b>start your own&nbsp;→</b>
        </Link>
      )}
      <div className="wrap">
        <nav className="site-nav">
          <span className="reveal d1"><BrandMark /></span>
          <div className="links reveal d2">
            <a href="#features">What it does</a>
            <a href="#occasions">Occasions</a>
          </div>
          <Link to={enterHref} className="btn btn-terracotta reveal d3">{enterLabel}</Link>
        </nav>

        <section className="hero">
          <div>
            <span className="eyebrow reveal d1">◈ Oru kudumbam, oru veedu — one family, one home</span>
            <h1 className="reveal d2">
              Every <em>root</em>,<br />every <em>route</em>,<br />back to family.
            </h1>
            <p className="lede reveal d3">
              From a Kerala <i>tharavadu</i> with Tamil Nadu roots — Family Routes gathers
              everyone under one roof. See how you’re related to anyone, remember every
              birthday, and never forget a name at the wedding again.
            </p>
            <div className="hero-cta reveal d4">
              <Link to={enterHref} className="btn btn-solid">{enterLabel}</Link>
              {isDemo && <Link to="/who" className="btn btn-ghost">Explore the demo</Link>}
            </div>
          </div>

          <div className="pookalam-wrap reveal d4">
            <Pookalam size={420} />
            <div className="pookalam-center">
              <div className="big ml-label" style={{ fontStyle: "normal" }}>കുടുംബം</div>
              <div className="small">kudumbam · family</div>
            </div>
          </div>
        </section>
      </div>

      <div className="relstrip reveal d5">
        <div className="track">
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "inline-flex", gap: 50 }}>
              {RELATIONS.map((r) => (
                <span key={r + dup}>{r} <b>◈</b></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="wrap">
        <section className="section" id="features">
          <div className="sec-head">
            <h2>A home that remembers everyone</h2>
            <p>
              Add a person, point to their parents and partner, and the whole family
              arranges itself — the way the old folks could recite it from memory.
            </p>
          </div>
          <div className="cards">
            <div className="feature-card">
              <div className="ic">⌖</div>
              <h3>Living family tree <span className="ml ml-label">വൃക്ഷം</span></h3>
              <p>Pick your name and the tree blooms around you — parents, cousins, in-laws, all in their rightful place.</p>
            </div>
            <div className="feature-card">
              <div className="ic">⟡</div>
              <h3>How am I related? <span className="ml ml-label">ബന്ധം</span></h3>
              <p>Tap any two people. We’ll tell you plainly — your father’s younger brother, your maternal aunt — side and seniority and all.</p>
            </div>
            <div className="feature-card">
              <div className="ic">✉</div>
              <h3>Wedding invite lists <span className="ml ml-label">ക്ഷണം</span></h3>
              <p>Choose the occasion, set a headcount, and we suggest who to call — closest family first, ready to share on WhatsApp.</p>
            </div>
            <div className="feature-card">
              <div className="ic">✿</div>
              <h3>Birthdays & anniversaries <span className="ml ml-label">പിറന്നാൾ</span></h3>
              <p>See who’s celebrating next and how old they’re turning — so the phone call always comes on time.</p>
            </div>
          </div>
        </section>

        <section className="closing" id="occasions">
          <h2>Light the lamp. Gather everyone.</h2>
          <p>
            Built for our family, by our family — private, warm, and free. No passwords to
            remember, just pick your name and step inside.
          </p>
          <Link to={enterHref} className="btn btn-terracotta">{enterLabel} →</Link>
        </section>
      </div>

      <footer className="site-footer">
        <div className="mark"><BrandMark size={22} /></div>
        <div>Made with love, turmeric &amp; a little nostalgia · Kerala × Tamil Nadu</div>
      </footer>
    </>
  );
}
