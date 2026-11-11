/**
 * The 18th Avenue wordmark, redrawn as SVG from the client's logo: a high-contrast "18" with a superscript "th",
 * and AVENUE in thin geometric capitals with the logo's inverted A (Λ) and mirrored N (И).
 */
export default function Wordmark({ className = '', title = '18th Avenue' }: { className?: string; title?: string }) {
  const letters = [
    'M0 16 L7 0 L14 16', // Λ
    'M0 0 L7 16 L14 0', // V
    'M12 0 H0 V16 H12 M0 8 H10', // E
    'M0 16 V0 L13 16 V0', // И
    'M0 0 V10.5 Q0 16 6.5 16 Q13 16 13 10.5 V0', // U
    'M12 0 H0 V16 H12 M0 8 H10', // E
  ];
  return (
    <svg viewBox="0 0 236 46" className={className} role="img" aria-label={title} fill="none">
      <text x="0" y="40" fill="currentColor" style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 50, letterSpacing: -1 }}>
        18
      </text>
      <text x="48" y="17" fill="currentColor" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 17 }}>
        th
      </text>
      <g transform="translate(82 15)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
        {letters.map((d, i) => (
          <path key={i} d={d} transform={`translate(${i * 26} 0)`} />
        ))}
      </g>
    </svg>
  );
}
