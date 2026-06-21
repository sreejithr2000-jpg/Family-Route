import { useMemo } from "react";

interface Petal {
  rx: number;
  ry: number;
  cy: number;
  fill: string;
  rotate: number;
}

function ring(count: number, r: number, len: number, wid: number, fill: string, rot = 0): Petal[] {
  return Array.from({ length: count }, (_, i) => ({
    rx: wid,
    ry: len,
    cy: -r,
    fill,
    rotate: (i / count) * 360 + rot,
  }));
}

/**
 * A pookalam (floral rangoli) drawn entirely in SVG — concentric petal rings.
 * Slowly rotates; honours prefers-reduced-motion via the `spin` flag.
 */
export function Pookalam({ size = 420, spin = true }: { size?: number; spin?: boolean }) {
  const petals = useMemo(
    () => [
      ...ring(24, 150, 26, 9, "#E0B851"),
      ...ring(24, 150, 18, 6, "#9C3A22", 7.5),
      ...ring(18, 108, 22, 11, "#3b6b34"),
      ...ring(18, 108, 15, 7, "#F4A300", 10),
    ],
    [],
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Pookalam — floral welcome"
      style={{
        maxWidth: "100%",
        height: "auto",
        animation: spin ? "pookalam-spin 70s linear infinite" : undefined,
        filter: "drop-shadow(0 18px 30px rgba(156,58,34,0.18))",
      }}
    >
      <style>{`@keyframes pookalam-spin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){svg[aria-label="Pookalam — floral welcome"]{animation:none!important}}`}</style>
      <g transform="translate(200,200)">
        <circle r={190} fill="none" stroke="#C2912F" strokeWidth={1} opacity={0.4} />
        <circle r={160} fill="#9C3A22" opacity={0.12} />
        <circle r={120} fill="#33522F" opacity={0.14} />
        {petals.map((p, i) => (
          <ellipse
            key={i}
            cx={0}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            fill={p.fill}
            transform={`rotate(${p.rotate})`}
          />
        ))}
        <circle r={86} fill="#C2562F" />
        <circle r={86} fill="none" stroke="#F4E4C5" strokeWidth={3} />
        <circle r={58} fill="#E0B851" />
        <circle r={34} fill="#9C3A22" />
        <circle r={14} fill="#F4A300" />
      </g>
    </svg>
  );
}
