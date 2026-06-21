import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./screens/Landing";
import { WhoAreYou } from "./screens/WhoAreYou";
import { Home } from "./screens/Home";
import { Tree } from "./screens/Tree";
import { Relate } from "./screens/Relate";
import { Events } from "./screens/Events";
import { Invite } from "./screens/Invite";
import { Family } from "./screens/Family";
import { Welcome } from "./screens/Welcome";
import { Settings } from "./screens/Settings";
import { startAutoSync } from "./sync/cloud";

export default function App() {
  // If this device is connected to a shared family, pull on load and keep
  // pushing changes up (no-op when cloud sync isn't configured).
  useEffect(() => {
    startAutoSync();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<Welcome />} />
        <Route path="/who" element={<WhoAreYou />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tree" element={<Tree />} />
        <Route path="/relate" element={<Relate />} />
        <Route path="/events" element={<Events />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/family" element={<Family />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}
