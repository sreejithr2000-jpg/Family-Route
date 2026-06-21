type MotifType = "marigold" | "leaf" | "jasmine";
type Anim = "drift" | "sway" | "fall";

interface Placed {
  t: MotifType;
  x: number; // left %
  y: number; // top %
  s: number; // size px
  delay: number;
  dur: number;
  anim: Anim;
}

// A hand-placed scatter so it feels composed, not random noise.
const MOTIFS: Placed[] = [
  { t: "marigold", x: 5, y: 16, s: 30, delay: 0, dur: 15, anim: "drift" },
  { t: "leaf", x: 91, y: 10, s: 34, delay: 1.5, dur: 19, anim: "drift" },
  { t: "jasmine", x: 13, y: 68, s: 20, delay: 1, dur: 13, anim: "sway" },
  { t: "marigold", x: 84, y: 60, s: 24, delay: 3, dur: 17, anim: "drift" },
  { t: "leaf", x: 46, y: 6, s: 24, delay: 5, dur: 21, anim: "drift" },
  { t: "jasmine", x: 72, y: 82, s: 18, delay: 2, dur: 14, anim: "sway" },
  { t: "marigold", x: 33, y: 88, s: 20, delay: 4, dur: 16, anim: "drift" },
  // a couple of slowly falling petals
  { t: "jasmine", x: 28, y: 0, s: 20, delay: 0, dur: 17, anim: "fall" },
  { t: "marigold", x: 63, y: 0, s: 18, delay: 7, dur: 23, anim: "fall" },
];

function MotifShape({ t }: { t: MotifType }) {
  if (t === "leaf") {
    // mango leaf
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
        <path d="M4 20 C4 11 11 4 20 4 C20 13 13 20 4 20 Z" fill="#3b6b34" />
        <path d="M5 19 L19 5" stroke="#22381f" strokeWidth="1" fill="none" />
      </svg>
    );
  }
  if (t === "jasmine") {
    // five-petal white jasmine
    return (
      <svg viewBox="0 0 28 28" width="100%" height="100%" aria-hidden="true">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="14" cy="7" rx="4.2" ry="6.5" fill="#fff8ea" stroke="#e0b851" strokeWidth="0.5" transform={`rotate(${a} 14 14)`} />
        ))}
        <circle cx="14" cy="14" r="2.4" fill="#f4a300" />
      </svg>
    );
  }
  // marigold
  return (
    <svg viewBox="0 0 28 28" width="100%" height="100%" aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="14" cy="6" rx="3.4" ry="6" fill="#F4A300" transform={`rotate(${a} 14 14)`} />
      ))}
      {[22, 67, 112, 157, 202, 247, 292, 337].map((a) => (
        <ellipse key={a} cx="14" cy="8.5" rx="2.6" ry="4.5" fill="#e07b1f" transform={`rotate(${a} 14 14)`} />
      ))}
      <circle cx="14" cy="14" r="3.4" fill="#9C3A22" />
    </svg>
  );
}

/** Ambient drifting Kerala–Tamil motifs. Decorative only; never blocks taps. */
export function FloatingMotifs() {
  return (
    <div className="floating-motifs" aria-hidden="true">
      {MOTIFS.map((m, i) => (
        <span
          key={i}
          className={`motif motif-${m.anim}`}
          style={{
            left: `${m.x}%`,
            top: m.anim === "fall" ? undefined : `${m.y}%`,
            width: m.s,
            height: m.s,
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
          }}
        >
          <MotifShape t={m.t} />
        </span>
      ))}
    </div>
  );
}
