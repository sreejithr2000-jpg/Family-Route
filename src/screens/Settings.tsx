import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/store";
import { BrandMark } from "../components/BrandMark";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { cloudEnabled, createFamily, joinFamily, push, pull } from "../sync/cloud";

export function Settings() {
  const navigate = useNavigate();
  const [familyName, setFamilyName] = useState(store.getFamilyName());
  const [code, setCode] = useState(store.getFamilyCode());
  const [joinCode, setJoinCode] = useState("");
  const [importText, setImportText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const total = store.getPeople().length;
  const syncedAt = store.getSyncedAt();

  const say = (ok: boolean, text: string) => setMsg({ ok, text });

  const saveName = () => { store.setFamilyName(familyName); say(true, "Family name saved."); };

  const doCreate = async () => {
    setBusy(true);
    const r = await createFamily();
    setBusy(false);
    if (r.ok && r.code) setCode(r.code);
    say(r.ok, r.message);
  };
  const doJoin = async () => {
    setBusy(true);
    const r = await joinFamily(joinCode);
    setBusy(false);
    if (r.ok) { setCode(store.getFamilyCode()); navigate("/who"); }
    say(r.ok, r.message);
  };
  const doPush = async () => { setBusy(true); const r = await push(); setBusy(false); say(r.ok, r.message); };
  const doPull = async () => { setBusy(true); const r = await pull(); setBusy(false); say(r.ok, r.message); };
  const disconnect = () => { store.setFamilyCode(""); setCode(""); say(true, "Disconnected from the shared family on this device."); };

  const copyTransferCode = async () => {
    try { await navigator.clipboard.writeText(store.exportCode()); say(true, "Family code copied — paste it on the other device."); }
    catch { setImportText(store.exportCode()); say(true, "Copy failed — the code is shown below to copy manually."); }
  };
  const downloadBackup = () => {
    const blob = new Blob([store.exportCode()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `family-routes-backup-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const doImport = () => {
    if (store.importCode(importText)) { say(true, "Family imported."); navigate("/who"); }
    else say(false, "That code didn’t look right — please check and try again.");
  };

  const resetDemo = () => {
    if (confirm("Reset this device back to the demo family? Your local tree here will be cleared.")) {
      store.resetToSeed();
      navigate("/");
    }
  };

  return (
    <div className="settings-screen">
      <div className="kasavu-frame" />
      <header className="tree-bar">
        <BrandMark to="/home" />
        <div className="tree-title">⚙ Settings</div>
        <button className="home-switch" onClick={() => navigate("/home")}>← Home</button>
      </header>

      <div className="settings-body">
        {msg && <div className={`settings-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>}

        {/* Family */}
        <section className="settings-card">
          <h2>Your family</h2>
          <p className="muted">{total} people on this device.</p>
          <label className="fld">
            <span>Family / household name</span>
            <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="e.g. The Nair family" />
          </label>
          <button className="btn btn-solid" onClick={saveName}>Save name</button>
        </section>

        {/* Language */}
        <section className="settings-card">
          <h2>Language</h2>
          <p className="muted">Choose the language for the home page.</p>
          <LanguageSwitcher />
        </section>

        {/* Cloud sync */}
        <section className="settings-card">
          <h2>Share across devices</h2>
          {!cloudEnabled() ? (
            <p className="muted">
              Live cloud sync isn’t switched on yet. You can still move your family between
              devices using the backup code below. (Ask to enable Supabase sync for automatic,
              ongoing syncing.)
            </p>
          ) : code ? (
            <>
              <p className="muted">This device is connected to your shared family.</p>
              <div className="code-box">
                <span className="code-label">Family code</span>
                <span className="code-val">{code}</span>
              </div>
              <p className="muted small">
                Share this code with family. On their phone: Settings → “Join with a code”.
                {syncedAt ? `  Last synced ${new Date(syncedAt).toLocaleString("en-IN")}.` : ""}
              </p>
              <div className="settings-actions">
                <button className="btn btn-solid" disabled={busy} onClick={doPull}>⇣ Sync down</button>
                <button className="btn btn-ghost" disabled={busy} onClick={doPush}>⇡ Sync up</button>
                <button className="btn btn-ghost" onClick={disconnect}>Disconnect</button>
              </div>
            </>
          ) : (
            <>
              <p className="muted">Create one shared copy of your family, then join it from every device.</p>
              <div className="settings-actions">
                <button className="btn btn-solid" disabled={busy} onClick={doCreate}>Create shared family</button>
              </div>
              <div className="join-row">
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Have a code? e.g. K7M2QX" />
                <button className="btn btn-ghost" disabled={busy} onClick={doJoin}>Join with a code</button>
              </div>
            </>
          )}
        </section>

        {/* Offline backup / transfer */}
        <section className="settings-card">
          <h2>Backup &amp; transfer (no setup)</h2>
          <p className="muted">
            Copy a code from this device and paste it on another to move your whole family across —
            a one-time snapshot, no internet account needed.
          </p>
          <div className="settings-actions">
            <button className="btn btn-solid" onClick={copyTransferCode}>Copy family code</button>
            <button className="btn btn-ghost" onClick={downloadBackup}>Download backup</button>
          </div>
          <label className="fld" style={{ marginTop: 16 }}>
            <span>Paste a family code to load it here</span>
            <textarea className="export-area" rows={4} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste the long code from your other device…" />
          </label>
          <button className="btn btn-solid" onClick={doImport} disabled={!importText.trim()}>Load this family</button>
        </section>

        {/* Danger */}
        <section className="settings-card danger">
          <h2>Reset</h2>
          <p className="muted">Clear this device and go back to the demo family.</p>
          <button className="btn btn-ghost danger-btn" onClick={resetDemo}>Reset to demo</button>
        </section>
      </div>
    </div>
  );
}
