import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../data/store";
import type { Gender, Person } from "../data/types";
import { BrandMark } from "../components/BrandMark";
import { FloatingMotifs } from "../components/FloatingMotifs";
import { Toran } from "../components/Toran";
import { Pookalam } from "../components/Pookalam";

export function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "form">("intro");

  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [dob, setDob] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");

  function begin() {
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
    store.beginFamily(me, familyName);
    navigate("/home");
  }

  return (
    <div className="welcome-screen">
      <div className="kasavu-frame" />
      <FloatingMotifs />
      <Toran />

      <div className="welcome-body">
        <BrandMark />

        {step === "intro" ? (
          <div className="welcome-intro reveal d1">
            <div className="welcome-pookalam">
              <Pookalam size={210} />
            </div>
            <span className="eyebrow">◈ Make it your own</span>
            <h1>Welcome home.</h1>
            <p className="lede">
              What you’re seeing now is a demo family, just to show you around. When you’re
              ready, begin your own tree — add yourself first, then grow it one loved one at
              a time.
            </p>
            <div className="welcome-cta">
              <button className="btn btn-solid" onClick={() => setStep("form")}>
                Begin our family
              </button>
              <Link to="/who" className="btn btn-ghost">Keep exploring the demo</Link>
            </div>
            <p className="welcome-note">
              Starting fresh clears the demo family from this device. Your tree lives privately
              in this browser.
            </p>
          </div>
        ) : (
          <div className="welcome-form reveal d1">
            <span className="eyebrow">◈ Let’s begin with you</span>
            <h1>Tell us about yourself.</h1>
            <p className="lede">You’ll be the centre of the tree — everyone else is added around you.</p>

            <label className="fld">
              <span>Your family’s name <span className="muted">(optional)</span></span>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Nair family"
              />
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

            <div className="welcome-cta">
              <button className="btn btn-ghost" onClick={() => setStep("intro")}>← Back</button>
              <button className="btn btn-solid" onClick={begin}>Plant the tree 🌱</button>
            </div>
            <p className="welcome-note">This clears the demo family and starts yours.</p>
          </div>
        )}
      </div>
    </div>
  );
}
