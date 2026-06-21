import { Link } from "react-router-dom";

/** Nilavilakku (brass lamp) + wordmark. */
export function BrandMark({ size = 28, to = "/" }: { size?: number; to?: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 13,
        textDecoration: "none",
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: "1.35rem",
        color: "var(--ink)",
        letterSpacing: "0.3px",
      }}
    >
      <svg width={size} height={(size / 26) * 34} viewBox="0 0 26 34" aria-hidden="true">
        <path d="M13 1l2 3-2 2-2-2z" fill="#C2912F" />
        <path d="M9 7h8l-1.5 3h-5z" fill="#C2912F" />
        <ellipse cx="13" cy="13" rx="8" ry="3.4" fill="#9C3A22" />
        <path d="M5 13c1 3 3 4 8 4s7-1 8-4" fill="none" stroke="#C2912F" strokeWidth="1.4" />
        <rect x="12" y="16" width="2" height="11" fill="#C2912F" />
        <path d="M6 33c0-4 3-6 7-6s7 2 7 6z" fill="#C2912F" />
        <circle cx="13" cy="11" r="2.2" fill="#F4A300" />
      </svg>
      Family&nbsp;Routes
    </Link>
  );
}
