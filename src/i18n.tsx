import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "ta" | "ml";
const LANG_KEY = "family-routes:lang:v1";

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ta", label: "தமிழ்" },
  { id: "ml", label: "മലയാളം" },
];

type Entry = Record<Lang, string>;

// Context-appropriate translations (hand-written, not literal word-for-word).
const DICT: Record<string, Entry> = {
  "home.namaskaram": {
    en: "Namaskaram,",
    ta: "வணக்கம்,",
    ml: "നമസ്കാരം,",
  },
  "home.welcome": {
    en: "You’re entering {house} — may we always share our warmth and love.",
    ta: "{house} வீட்டிற்குள் வருகிறீர்கள் — நம் அன்பும் பாசமும் என்றும் பகிரப்படட்டும்.",
    ml: "{house}-ലേക്ക് കടക്കുകയാണ് — നമ്മുടെ സ്നേഹവും കരുതലും എന്നും പങ്കുവെക്കാം.",
  },
  "home.welcome_generic": {
    en: "Welcome home — may we always share our warmth and love.",
    ta: "வீட்டிற்கு வரவேற்கிறோம் — நம் அன்பும் பாசமும் என்றும் பகிரப்படட்டும்.",
    ml: "വീട്ടിലേക്ക് സ്വാഗതം — നമ്മുടെ സ്നേഹവും കരുതലും എന്നും പങ്കുവെക്കാം.",
  },
  "home.years": { en: "{age} years", ta: "{age} வயது", ml: "{age} വയസ്സ്" },
  "home.count": {
    en: "one of {n} in the family",
    ta: "குடும்பத்தில் {n} பேரில் ஒருவர்",
    ml: "കുടുംബത്തിലെ {n} പേരിൽ ഒരാൾ",
  },
  "home.switch": {
    en: "Not {name}? Switch",
    ta: "{name} இல்லையா? மாற்று",
    ml: "{name} അല്ലേ? മാറ്റുക",
  },
  "home.demo": {
    en: "This is the demo family — start your own →",
    ta: "இது மாதிரி குடும்பம் — உங்கள் சொந்தக் குடும்பத்தைத் தொடங்குங்கள் →",
    ml: "ഇത് ഡെമോ കുടുംബമാണ് — സ്വന്തമായി തുടങ്ങൂ →",
  },
  "home.hint": {
    en: "Your tree has just you so far. Add your parents, partner, and children →",
    ta: "இப்போதைக்கு மரத்தில் நீங்கள் மட்டுமே. உங்கள் பெற்றோர், துணை, பிள்ளைகளைச் சேருங்கள் →",
    ml: "ഇതുവരെ വൃക്ഷത്തിൽ നിങ്ങൾ മാത്രം. മാതാപിതാക്കളെയും ഇണയെയും മക്കളെയും ചേർക്കൂ →",
  },
  "hub.open": { en: "Open", ta: "திற", ml: "തുറക്കുക" },
  "hub.tree.title": {
    en: "Our family tree",
    ta: "நம் குடும்ப மரம்",
    ml: "നമ്മുടെ കുടുംബവൃക്ഷം",
  },
  "hub.tree.desc": {
    en: "See everyone arranged around you — generation by generation.",
    ta: "தலைமுறை வாரியாக உங்களைச் சுற்றி அனைவரையும் காணுங்கள்.",
    ml: "തലമുറകളായി നിങ്ങൾക്കു ചുറ്റും എല്ലാവരെയും കാണൂ.",
  },
  "hub.relate.title": { en: "How am I related?", ta: "உறவு என்ன?", ml: "ബന്ധം എന്ത്?" },
  "hub.relate.desc": {
    en: "Pick anyone and learn exactly how the two of you connect.",
    ta: "யாரையேனும் தேர்ந்தெடுத்து, உங்கள் இருவருக்கும் உள்ள உறவை அறியுங்கள்.",
    ml: "ആരെയെങ്കിലും തിരഞ്ഞെടുത്ത് നിങ്ങൾ തമ്മിലുള്ള ബന്ധം അറിയൂ.",
  },
  "hub.invite.title": {
    en: "Plan an occasion",
    ta: "விழாவைத் திட்டமிடுங்கள்",
    ml: "ചടങ്ങ് ആസൂത്രണം ചെയ്യൂ",
  },
  "hub.invite.desc": {
    en: "Build a warm, well-judged invite list for the next function.",
    ta: "அடுத்த விழாவிற்கு அன்பான அழைப்புப் பட்டியலை உருவாக்குங்கள்.",
    ml: "അടുത്ത ചടങ്ങിന് ഊഷ്മളമായ ക്ഷണപ്പട്ടിക തയ്യാറാക്കൂ.",
  },
  "hub.events.title": {
    en: "Upcoming celebrations",
    ta: "வரவிருக்கும் கொண்டாட்டங்கள்",
    ml: "വരാനിരിക്കുന്ന ആഘോഷങ്ങൾ",
  },
  "hub.events.desc": {
    en: "Whose birthday or anniversary is coming next, and their age.",
    ta: "அடுத்து யாருடைய பிறந்தநாள் அல்லது திருமண நாள், அவர்களின் வயது.",
    ml: "അടുത്തതായി ആരുടെ പിറന്നാളോ വിവാഹവാർഷികമോ, അവരുടെ വയസ്സും.",
  },
  "hub.family.title": {
    en: "Add & manage family",
    ta: "குடும்பத்தைச் சேர் & நிர்வகி",
    ml: "കുടുംബം ചേർക്കുക & പരിപാലിക്കുക",
  },
  "hub.family.desc": {
    en: "Add new relatives, edit details, and tend the family records.",
    ta: "புதிய உறவினர்களைச் சேருங்கள், விவரங்களைத் திருத்துங்கள், பதிவுகளைப் பராமரியுங்கள்.",
    ml: "പുതിയ ബന്ധുക്കളെ ചേർക്കൂ, വിവരങ്ങൾ തിരുത്തൂ, രേഖകൾ പരിപാലിക്കൂ.",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(LANG_KEY) as Lang) || "en",
  );
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const entry = DICT[key];
      let s = entry ? entry[lang] ?? entry.en : key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return s;
    },
    [lang],
  );
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within LanguageProvider");
  return c;
}
