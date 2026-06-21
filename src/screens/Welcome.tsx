import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import type { Gender, Person } from "../data/types";
import { BrandMark } from "../components/BrandMark";
import { FloatingMotifs } from "../components/FloatingMotifs";
import { Toran } from "../components/Toran";
import { Pookalam } from "../components/Pookalam";

type Step = "intro" | "you" | "family";

export function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");

  // step "you"
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [dob, setDob] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [myId, setMyId] = useState<string | null>(null);

  // step "family"
  const [father, setFather] = useState("");
  const [mother, setMother] = useState("");
  const [spouse, setSpouse] = useState("");
  const [children, setChildren] = useState<string[]>([""]);

  function submitYou() {
    if (!name.trim()) {
      setError("Please add your name so we can place you at the heart of the tree.");
      return;
    }
    const me: Person = {
      id: "",
      name: name.trim(),
      gender: gender || undefined,
      dob: dob || undefined,
      place: place.trim() || undefined,
    };
    const id = store.beginFamily(me, familyName);
    setMyId(id);
    setStep("family");
  }

  function finish() {
    if (!myId) return;
    const fId = father.trim()
      ? store.savePerson({ id: "", name: father.trim(), gender: "male", place: place.trim() || undefined }, { parentIds: [], spouseId: null })
      : null;
    const mId = mother.trim()
      ? store.savePerson({ id: "", name: mother.trim(), gender: "female", place: place.trim() || undefined }, { parentIds: [], spouseId: null })
      : null;
    const sId = spouse.trim()
      ? store.savePerson({ id: "", name: spouse.trim(), place: place.trim() || undefined }, { parentIds: [], spouseId: null })
      : null;

    // link my parents + spouse onto me
    store.savePerson(
      { id: myId, name: name.trim(), gender: gender || undefined, dob: dob || undefined, place: place.trim() || undefined },
      { parentIds: [fId, mId].filter(Boolean) as string[], spouseId: sId },
    );

    // children belong to me (and my spouse, if any)
    for (const c of children.map((c) => c.trim()).filter(Boolean)) {
      store.savePerson({ id: "", name: c }, { parentIds: [myId, sId].filter(Boolean) as string[], spouseId: null });
    }

    navigate("/home");
  }

  const setChild = (i: number, v: string) =>
    setChildren((arr) => arr.map((c, idx) => (idx === i ? v : c)));

  return (
    <div className="welcome-screen">
      <div className="kasavu-frame" />
      <FloatingMotifs />
      <Toran />

      <div className="welcome-body">
        <BrandMark />

        {step === "intro" && (
          <div className="welcome-intro reveal d1">
            <div className="welcome-pookalam"><Pookalam size={200} /></div>
            <span className="eyebrow">◈ Make it your own</span>
            <h1>Welcome home.</h1>
            <p className="lede">
              What you’re seeing is a demo family, just to show you around. When you’re ready,
              set up your own — name your family, add yourself, and bring in your closest people.
            </p>
            <div className="welcome-cta">
              <button className="btn btn-solid" onClick={() => setStep("you")}>Set up my family</button>
              <Link to="/settings" className="btn btn-ghost">Join an existing family</Link>
            </div>
            <Link to="/who" className="welcome-text-link">…or keep exploring the demo</Link>
            <p className="welcome-note">Already set up your family on another device? Choose “Join an existing family” and use your family code.</p>
          </div>
        )}

        {step === "you" && (
          <div className="welcome-form reveal d1">
            <span className="eyebrow">◈ Step 1 of 2 · About you</span>
            <h1>Let’s begin with you.</h1>
            <p className="lede">You’ll be the centre of the tree — everyone is added around you.</p>

            <label className="fld">
              <span>Your family’s name <span className="muted">(optional)</span></span>
              <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="e.g. The Nair family" />
            </label>
            <label className="fld">
              <span>Your name *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
            </label>
            <div className="fld-row">
              <label className="fld">
                <span>Gender</span>
                <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="fld">
                <span>Date of birth</span>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </label>
            </div>
            <label className="fld">
              <span>Where you live</span>
              <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Kochi, Kerala" />
            </label>

            {error && <div className="form-error">{error}</div>}
            <div className="welcome-cta spread">
              <button className="btn btn-ghost" onClick={() => setStep("intro")}>← Back</button>
              <button className="btn btn-solid" onClick={submitYou}>Next: your family →</button>
            </div>
            <p className="welcome-note">This clears the demo family and starts yours.</p>
          </div>
        )}

        {step === "family" && (
          <div className="welcome-form reveal d1">
            <span className="eyebrow">◈ Step 2 of 2 · Your closest family</span>
            <h1>Who’s closest to you?</h1>
            <p className="lede">Add a few now to get going — you can add everyone else, and all their details, afterwards. All optional.</p>

            <div className="fld-row">
              <label className="fld"><span>Father</span><input value={father} onChange={(e) => setFather(e.target.value)} placeholder="Name" /></label>
              <label className="fld"><span>Mother</span><input value={mother} onChange={(e) => setMother(e.target.value)} placeholder="Name" /></label>
            </div>
            <label className="fld"><span>Spouse / partner</span><input value={spouse} onChange={(e) => setSpouse(e.target.value)} placeholder="Name" /></label>

            <div className="fld">
              <span>Children</span>
              {children.map((c, i) => (
                <input key={i} value={c} onChange={(e) => setChild(i, e.target.value)} placeholder={`Child ${i + 1}`} style={{ marginBottom: 8 }} />
              ))}
              <button type="button" className="link-btn" onClick={() => setChildren((a) => [...a, ""])}>+ Add another child</button>
            </div>

            <div className="welcome-cta spread">
              <button className="btn btn-ghost" onClick={() => navigate("/home")}>Skip for now</button>
              <button className="btn btn-solid" onClick={finish}>Plant our tree 🌱</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
