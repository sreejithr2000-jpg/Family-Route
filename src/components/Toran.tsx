/**
 * A toran / thoranam — the hanging string of mango leaves and marigolds
 * tied across a doorway to welcome guests in Kerala & Tamil Nadu homes.
 */
export function Toran() {
  const count = 22;
  const span = 1200;
  const gap = span / count;
  const leaves = Array.from({ length: count + 1 }, (_, i) => i * gap);

  return (
    <div className="toran" aria-hidden="true">
      <svg viewBox={`0 0 ${span} 54`} preserveAspectRatio="none" width="100%" height="54">
        {/* the string, gently sagging */}
        <path
          d={`M0 6 Q ${span / 2} 22 ${span} 6`}
          fill="none"
          stroke="#7a5a2a"
          strokeWidth="2"
        />
        {leaves.map((x, i) => {
          // follow the sag of the string
          const t = x / span;
          const y = 6 + Math.sin(t * Math.PI) * 16;
          const big = i % 2 === 0;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {/* mango leaf hanging down */}
              <path
                d={big ? "M0 0 C -6 14, -3 30, 0 36 C 3 30, 6 14, 0 0 Z" : "M0 0 C -5 11, -2 24, 0 29 C 2 24, 5 11, 0 0 Z"}
                fill={big ? "#3b6b34" : "#4f7a45"}
              />
              <path d="M0 2 L0 30" stroke="#22381f" strokeWidth="0.7" />
              {/* a marigold tucked between every few leaves */}
              {i % 3 === 0 && (
                <g transform={`translate(0 ${big ? 40 : 33})`}>
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <ellipse key={a} cx="0" cy="-4" rx="2.2" ry="4" fill="#F4A300" transform={`rotate(${a})`} />
                  ))}
                  <circle r="2.2" fill="#9C3A22" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
