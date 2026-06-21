import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { avatarFor, ageOf } from "../lib/people";
import { BrandMark } from "../components/BrandMark";
import { FloatingMotifs } from "../components/FloatingMotifs";
import { Toran } from "../components/Toran";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useI18n } from "../i18n";

export function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const egoId = store.getEgoId();
  const data = useMemo(() => store.getData(), []);
  const me = useMemo(() => data.people.find((p) => p.id === egoId), [data, egoId]);
  const totalPeople = data.people.length;
  const isDemo = store.isDemo();

  if (!me) {
    // No identity selected yet — send them to the picker.
    navigate("/who", { replace: true });
    return null;
  }

  const age = ageOf(me);
  const justStarted = !isDemo && totalPeople <= 1;

  // Banner name: prefer the household you assigned to yourself when adding
  // members; fall back to the onboarding family name.
  const myHousehold = me.householdId
    ? data.households.find((h) => h.id === me.householdId)?.name
    : undefined;
  const familyName = myHousehold || store.getFamilyName();

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
          <div className="home-left">
            <BrandMark />
            <button className="home-switch" onClick={switchPerson}>
              ↺ {t("home.switch", { name: me.name.split(" ")[0] })}
            </button>
          </div>
          <div className="home-right">
            <LanguageSwitcher />
            <Link to="/settings" className="home-switch settings-gear" title="Settings">⚙</Link>
          </div>
        </div>

        {isDemo && (
          <Link to="/start" className="demo-banner inline">
            ✦ {t("home.demo")}
          </Link>
        )}

        <header className="greeting">
          {familyName && <div className="family-name">{familyName}</div>}
          <div className="namaskaram">{t("home.namaskaram")}</div>
          <h1>
            <span style={{ marginRight: 12 }}>{avatarFor(me)}</span>
            {me.name}
          </h1>
          <div className="meta">
            {[
              me.place || "",
              age !== null ? t("home.years", { age }) : "",
              t("home.count", { n: totalPeople }),
            ].filter(Boolean).join("  ·  ")}
          </div>
          <p className="home-welcome">
            {familyName ? t("home.welcome", { house: familyName }) : t("home.welcome_generic")}
          </p>
        </header>

        {justStarted && (
          <Link to="/family" className="start-hint">
            🌱 {t("home.hint")}
          </Link>
        )}

        <section className="home-hub">
          <Link to="/tree" className="hub-card live">
            <span className="soon">{t("hub.open")}</span>
            <div className="ic">⌖</div>
            <h3>{t("hub.tree.title")}</h3>
            <p>{t("hub.tree.desc")}</p>
          </Link>
          <Link to="/relate" className="hub-card live">
            <span className="soon">{t("hub.open")}</span>
            <div className="ic">⟡</div>
            <h3>{t("hub.relate.title")}</h3>
            <p>{t("hub.relate.desc")}</p>
          </Link>
          <Link to="/invite" className="hub-card live">
            <span className="soon">{t("hub.open")}</span>
            <div className="ic">✉</div>
            <h3>{t("hub.invite.title")}</h3>
            <p>{t("hub.invite.desc")}</p>
          </Link>
          <Link to="/events" className="hub-card live">
            <span className="soon">{t("hub.open")}</span>
            <div className="ic">✿</div>
            <h3>{t("hub.events.title")}</h3>
            <p>{t("hub.events.desc")}</p>
          </Link>
          <Link to="/family" className="hub-card live">
            <span className="soon">{t("hub.open")}</span>
            <div className="ic">✛</div>
            <h3>{t("hub.family.title")}</h3>
            <p>{t("hub.family.desc")}</p>
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
