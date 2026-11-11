/**
 * A script that runs while the HTML is parsed, before first paint (see Next's "Preventing flash before hydration"
 * guide). On the client it renders as text/plain so React doesn't warn about rendering a <script>.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
