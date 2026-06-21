import { LANGUAGES, useI18n } from "../i18n";

/** Three pills to choose the page language: English · Tamil · Malayalam. */
export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          className={lang === l.id ? "on" : ""}
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
