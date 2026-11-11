/** The reference's long hairline arrow (⟶), drawn so it scales with the label beside it. */
export default function Arrow({ className = '', direction = 'right' }: { className?: string; direction?: 'right' | 'left' }) {
  return (
    <svg
      viewBox="0 0 30 10"
      className={`pill-arrow h-[0.62em] w-[1.85em] shrink-0 ${direction === 'left' ? 'rotate-180' : ''} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden
    >
      <path d="M0 5h29M24.5 0.6 29 5l-4.5 4.4" />
    </svg>
  );
}
