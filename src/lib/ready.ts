'use client';

/**
 * Runs `cb` once the page is ready to animate: straight away on pages without the intro curtain, or when the home
 * page's curtain lifts (it adds `is-loaded` to <html>). Returns a cleanup function.
 */
export function whenLoaded(cb: () => void): () => void {
  const html = document.documentElement;
  if (html.classList.contains('is-loaded')) {
    cb();
    return () => {};
  }
  const obs = new MutationObserver(() => {
    if (html.classList.contains('is-loaded')) {
      obs.disconnect();
      cb();
    }
  });
  obs.observe(html, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}

export function isLoaded() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('is-loaded');
}
