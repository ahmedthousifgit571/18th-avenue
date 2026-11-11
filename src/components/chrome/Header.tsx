'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Wordmark from './Wordmark';
import Arrow from '@/components/ui/Arrow';
import { contact, nav, project } from '@/content/project';
import { scroller, scrollToEl } from '@/lib/scroller';

/**
 * Belgrade Arbor's floating header: a frosted pill with MENU, the wordmark and INQUIRE. Opening the menu grows the
 * same pill into a panel of serif links, each swapping to an italic lime copy on hover.
 */
export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) scroller.lenis?.stop();
    else scroller.lenis?.start();
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  // Close when the route changes (the effect only syncs with navigation, an external system).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing on navigation
    setOpen(false);
  }, [pathname]);

  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    // In-page anchors scroll smoothly through Lenis instead of jumping.
    const hash = href.startsWith('#') ? href : href.startsWith('/#') && pathname === '/' ? href.slice(1) : null;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        e.preventDefault();
        scroller.lenis?.start();
        scrollToEl(el);
      }
    }
  };

  const current = (href: string) => (href === '/' ? pathname === '/' : !href.includes('#') && pathname.startsWith(href));

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 md:pt-[1.2rem]">
      <div
        ref={panel}
        className="pointer-events-auto w-full max-w-[34rem] overflow-hidden rounded-[1.6rem] border border-cream/[0.06] bg-charcoal/[0.82] text-cream shadow-[0_18px_50px_-20px_rgb(0_0_0/0.45)] backdrop-blur-xl transition-[border-radius] duration-700 md:w-[33vw] md:min-w-[30rem]"
      >
        <div className="relative grid h-[3.05rem] grid-cols-[1fr_auto_1fr] items-center px-2">
          <button
            ref={toggle}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="group flex h-full items-center gap-3 justify-self-start rounded-full pl-2.5 pr-3"
          >
            <span className="relative block h-3 w-7" aria-hidden>
              <span
                className={`absolute left-0 top-[3px] h-px w-full bg-cream/80 transition-transform duration-500 ease-[var(--ease-avenue)] ${open ? 'translate-y-[2.5px] rotate-[18deg]' : ''}`}
              />
              <span
                className={`absolute left-0 top-[8px] h-px w-full bg-cream/80 transition-transform duration-500 ease-[var(--ease-avenue)] ${open ? '-translate-y-[2.5px] -rotate-[18deg]' : ''}`}
              />
            </span>
            <span className="t-label text-[0.7rem] tracking-[0.02em]">
              <span className="sr-only">{open ? 'Close ' : 'Open '}</span>Menu
            </span>
          </button>

          <Link href="/" aria-label={`${project.name}, home`} className="justify-self-center text-golden" onClick={() => setOpen(false)}>
            <Wordmark className="h-[1.35rem] w-auto" />
          </Link>

          <a
            href="#contact"
            onClick={go('#contact')}
            className="pill justify-self-end gap-3 border-cream/30 py-2 pl-4 pr-3 text-[0.7rem] text-cream min-h-0 max-[380px]:gap-0 max-[380px]:px-3"
          >
            <span>Inquire</span>
            <span className="max-[380px]:hidden">
              <Arrow />
            </span>
          </a>
        </div>

        {/* The pill grows into the menu panel (grid rows 0fr → 1fr animates to the content's height). */}
        <div
          id="site-menu"
          className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-avenue-in-out)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          aria-hidden={!open}
          inert={!open}
        >
          <div className="min-h-0">
            <div className="flex max-h-[calc(100svh-6rem)] flex-col items-center overflow-y-auto px-6 pb-7 pt-7" data-lenis-prevent>
              <Wordmark className="h-10 w-auto text-golden" />
              <nav aria-label="Main" className="mt-8 flex flex-col items-center">
                {nav.map((n, i) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={go(n.href)}
                    aria-current={current(n.href) ? 'page' : undefined}
                    className={`font-serif text-[clamp(1.75rem,2.3vw,2.1rem)] leading-[1.22] transition-[opacity,transform] duration-700 ease-[var(--ease-avenue)] ${
                      open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                    } ${current(n.href) ? 'text-lime italic' : 'text-cream-dark'}`}
                    style={{ transitionDelay: open ? `${180 + i * 45}ms` : '0ms' }}
                  >
                    <span className="swap">
                      <span>{n.label}</span>
                      <span className="text-lime">{n.label}</span>
                    </span>
                  </Link>
                ))}
              </nav>
              <div
                className={`mt-8 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[0.72rem] uppercase tracking-[0.06em] text-cream/55 transition-opacity duration-700 ${open ? 'opacity-100 delay-500' : 'opacity-0'}`}
              >
                <a href={contact.phoneHref} className="hover:text-cream">
                  {contact.phone}
                </a>
                <a href={`mailto:${contact.email}`} className="hover:text-cream">
                  {contact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
