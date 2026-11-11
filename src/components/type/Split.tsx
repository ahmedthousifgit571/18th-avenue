/**
 * Server-renderable text splitting. Each word is a clipping box so its glyphs can rise from below (the reference's
 * title reveals), and every glyph or word carries a data attribute that GSAP timelines select.
 * Screen readers read the plain sentence from a visually hidden copy; the split spans are aria-hidden.
 */

export function Chars({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden className="inline-block overflow-clip whitespace-nowrap pb-[0.12em] -mb-[0.12em] align-top">
          {[...w].map((c, ci) => (
            <span key={ci} data-char className="inline-block will-change-transform">
              {c}
            </span>
          ))}
          {wi < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </span>
  );
}

/** Glyphs without clipping boxes (for blur-in reveals, whose blur would be cut off by a clip). */
export function Letters({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="whitespace-nowrap">
        {[...text].map((c, i) => (
          <span key={i} data-letter className="inline-block">
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Words as separate inline blocks (for word-by-word fades). */
export function Words({ text, className = '', wordClass = '' }: { text: string; className?: string; wordClass?: string }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span data-word className={`inline-block ${wordClass}`}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}

/** Words that rise inside their own clipping boxes (for statements that slide up line by line). */
export function RiseWords({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="inline-block overflow-clip pb-[0.14em] -mb-[0.14em] align-top">
            <span data-rise className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  );
}
