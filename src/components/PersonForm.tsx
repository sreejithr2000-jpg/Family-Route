import { useMemo, useState } from "react";
import type { Gender, Person } from "../data/types";
import { store } from "../data/store";
import { buildIndex, parents as parentsOf } from "../lib/graph";
import { findDuplicates } from "../lib/people";
import { PersonSelect } from "./PersonSelect";

export function PersonForm({
  editing,
  onClose,
  onSaved,
}: {
  editing?: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const data = useMemo(() => store.getData(), []);
  const people = data.people;

  // derive existing relationships for the edited person
  const existing = useMemo(() => {
    if (!editing) return { p1: null as string | null, p2: null as string | null, sp: null as string | null, since: "" };
    const g = buildIndex(data.edges);
    const ps = parentsOf(g, editing.id);
    const spouseEdge = data.edges.find(
      (e) => e.type === "spouse" && e.status !== "former" && (e.from === editing.id || e.to === editing.id),
    );
    const sp = spouseEdge ? (spouseEdge.from === editing.id ? spouseEdge.to : spouseEdge.from) : null;
    return { p1: ps[0] ?? null, p2: ps[1] ?? null, sp, since: spouseEdge?.since ?? "" };
  }, [editing, data]);

  const [name, setName] = useState(editing?.name ?? "");
  const [nicknames, setNicknames] = useState((editing?.nicknames ?? []).join(", "));
  const [gender, setGender] = useState<Gender | "">(editing?.gender ?? "");
  const [dob, setDob] = useState(editing?.dob ?? "");
  const [place, setPlace] = useState(editing?.place ?? "");
  const [nativePlace, setNativePlace] = useState(editing?.nativePlace ?? "");
  const [gotra, setGotra] = useState(editing?.gotra ?? "");
  const [phone, setPhone] = useState(editing?.contact?.phone ?? "");
  const [email, setEmail] = useState(editing?.contact?.email ?? "");
  const [address, setAddress] = useState(editing?.contact?.address ?? "");
  const [isDeceased, setIsDeceased] = useState(!!editing?.isDeceased);
  const [dateOfDeath, setDateOfDeath] = useState(editing?.dateOfDeath ?? "");
  const [householdId, setHouseholdId] = useState(editing?.householdId ?? "");
  const [newHousehold, setNewHousehold] = useState("");

  const [parent1, setParent1] = useState<string | null>(existing.p1);
  const [parent2, setParent2] = useState<string | null>(existing.p2);
  const [spouseId, setSpouseId] = useState<string | null>(existing.sp);
  const [anniversary, setAnniversary] = useState(existing.since);

  const [error, setError] = useState("");

  const dupes = useMemo(
    () => (editing ? [] : findDuplicates(people, name)),
    [people, name, editing],
  );

  const exclude = [editing?.id, parent1, parent2, spouseId].filter(Boolean) as string[];

  function submit() {
    if (!name.trim()) {
      setError("A name is needed.");
      return;
    }
    let hid = householdId;
    if (newHousehold.trim()) hid = store.addHousehold(newHousehold.trim());

    const person: Person = {
      id: editing?.id ?? "",
      name: name.trim(),
      nicknames: nicknames.split(",").map((s) => s.trim()).filter(Boolean),
      gender: gender || undefined,
      dob: dob || undefined,
      place: place.trim() || undefined,
      nativePlace: nativePlace.trim() || undefined,
      gotra: gotra.trim() || undefined,
      contact:
        phone || email || address
          ? { phone: phone || undefined, email: email || undefined, address: address || undefined }
          : undefined,
      isDeceased: isDeceased || undefined,
      dateOfDeath: isDeceased ? dateOfDeath || undefined : undefined,
      householdId: hid || undefined,
    };
    store.savePerson(person, {
      parentIds: [parent1, parent2].filter(Boolean) as string[],
      spouseId,
      anniversary: spouseId ? anniversary || null : null,
    });
    onSaved();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{editing ? `Edit ${editing.name.split(" ")[0]}` : "Add a family member"}</h2>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {dupes.length > 0 && (
            <div className="dupe-warn">
              Someone similar is already here: <b>{dupes.map((d) => d.name).join(", ")}</b>. You can
              still add them if they’re different.
            </div>
          )}

          <label className="fld">
            <span>Name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </label>

          <div className="fld-row">
            <label className="fld">
              <span>Nicknames</span>
              <input value={nicknames} onChange={(e) => setNicknames(e.target.value)} placeholder="Appu, Ammu" />
            </label>
            <label className="fld">
              <span>Gender</span>
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>Date of birth</span>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </label>
            <label className="fld">
              <span>Lives in</span>
              <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Kochi, Kerala" />
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>Native place</span>
              <input value={nativePlace} onChange={(e) => setNativePlace(e.target.value)} placeholder="Thrissur" />
            </label>
            <label className="fld">
              <span>Gotra</span>
              <input value={gotra} onChange={(e) => setGotra(e.target.value)} />
            </label>
          </div>

          <div className="fld-section">Relationships</div>
          <div className="fld-row">
            <PersonSelect label="Parent 1" people={people} value={parent1} onChange={setParent1} exclude={exclude} clearable placeholder="—" />
            <PersonSelect label="Parent 2" people={people} value={parent2} onChange={setParent2} exclude={exclude} clearable placeholder="—" />
          </div>
          <PersonSelect label="Spouse" people={people} value={spouseId} onChange={setSpouseId} exclude={exclude} clearable placeholder="—" />
          {spouseId && (
            <label className="fld" style={{ marginTop: 12 }}>
              <span>💐 Wedding anniversary <span className="muted">(optional)</span></span>
              <input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
            </label>
          )}

          <div className="fld-section">Household</div>
          <div className="fld-row">
            <label className="fld">
              <span>Belongs to</span>
              <select value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
                <option value="">—</option>
                {data.households.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span>…or new household</span>
              <input value={newHousehold} onChange={(e) => setNewHousehold(e.target.value)} placeholder="e.g. Kochi house" />
            </label>
          </div>

          <div className="fld-section">Contact <span className="muted">(optional)</span></div>
          <div className="fld-row">
            <label className="fld"><span>Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="fld"><span>Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          </div>
          <label className="fld"><span>Address</span><input value={address} onChange={(e) => setAddress(e.target.value)} /></label>

          <label className="fld checkline">
            <input type="checkbox" checked={isDeceased} onChange={(e) => setIsDeceased(e.target.checked)} />
            <span>This person has passed away</span>
          </label>
          {isDeceased && (
            <label className="fld">
              <span>Date of passing</span>
              <input type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} />
            </label>
          )}

          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-solid" onClick={submit}>{editing ? "Save changes" : "Add to family"}</button>
        </div>
      </div>
    </div>
  );
}
