/** Line drawings for the three "Features of Development" (drawn in, via the .draw-in class, when revealed). */
export function LiftDiagram() {
  return (
    <svg viewBox="0 0 240 150" className="draw-in w-full" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="10" y="14" width="88" height="100" rx="2" pathLength={1} />
      <rect x="142" y="14" width="88" height="100" rx="2" pathLength={1} />
      <rect x="104" y="39" width="32" height="50" rx="1" pathLength={1} className="text-bronze" stroke="currentColor" />
      <path d="M112 51h16M112 77h16M120 51v26" pathLength={1} className="text-bronze" stroke="currentColor" />
      <path d="M98 64h6M136 64h6" pathLength={1} />
      <path d="M120 89v38" pathLength={1} className="text-bronze" stroke="currentColor" />
      <text x="54" y="69" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" style={{ fontFamily: 'var(--font-serif)' }}>
        Home A
      </text>
      <text x="186" y="69" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" style={{ fontFamily: 'var(--font-serif)' }}>
        Home B
      </text>
      <text x="120" y="142" textAnchor="middle" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1.5">
        ONE LIFT
      </text>
    </svg>
  );
}

export function BasementDiagram() {
  return (
    <svg viewBox="0 0 240 150" className="draw-in w-full" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M10 92h220" pathLength={1} />
      <path d="M10 132h220" pathLength={1} />
      <path d="M150 10v122M178 10v122" pathLength={1} />
      <rect x="156" y="98" width="16" height="30" pathLength={1} className="text-bronze" stroke="currentColor" />
      <path d="M164 98V30" pathLength={1} className="text-bronze" stroke="currentColor" />
      <path d="M10 92l40 40" pathLength={1} />
      <rect x="72" y="112" width="30" height="13" rx="4" pathLength={1} />
      <rect x="110" y="112" width="30" height="13" rx="4" pathLength={1} />
      <text x="20" y="85" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1.5">
        GROUND
      </text>
      <text x="80" y="104" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1.5">
        2 CARPARKS
      </text>
    </svg>
  );
}

export function SlabDiagram() {
  return (
    <svg viewBox="0 0 240 150" className="draw-in w-full" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M10 22h220M10 128h220" pathLength={1} strokeWidth="5" />
      <path d="M24 22v106M216 22v106" pathLength={1} strokeWidth="7" />
      <path d="M194 30v90" pathLength={1} className="text-bronze" stroke="currentColor" />
      <path d="M188 36l6-6 6 6M188 114l6 6 6-6" pathLength={1} className="text-bronze" stroke="currentColor" />
      <text x="182" y="79" textAnchor="end" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1.5">
        HIGHER CEILING
      </text>
      <text x="38" y="42" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1.5">
        FLAT SLAB · NO BEAMS
      </text>
      <text x="38" y="116" fill="currentColor" stroke="none" fontSize="8" letterSpacing="1.5">
        SHEAR WALLS
      </text>
    </svg>
  );
}
