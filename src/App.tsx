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

export default function App() {
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
      </Routes>
    </HashRouter>
  );
}
