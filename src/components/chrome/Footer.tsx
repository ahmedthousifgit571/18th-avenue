'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import FitText from '@/components/ui/FitText';
import Reveal from '@/components/type/Reveal';
import { Chars } from '@/components/type/Split';
import { contact, nav, project } from '@/content/project';
import { layoutById, sqft } from '@/content/units';
import { endcard } from '@/content/cinema';

const field =
  'peer w-full border-b border-pine/35 bg-transparent pb-2 pt-1 text-[1rem] text-pine outline-none transition-colors focus:border-golden';

/**
 * Belgrade Arbor's footer: a sky gradient rising from vanilla, "Join the world of…" with an underlined form, the
 * nav, the disclaimer and the towers standing in the sky under a giant wordmark. There is no backend: the form
 * opens the visitor's email app addressed to the sales team, with any layout picked on /residences filled in.
 */
export default function Footer() {
  const [form, setForm] = useState({ first: '', last: '', email: '', phone: '', agree: false });
  const [sent, setSent] = useState(false);
  const set = (k: 'first' | 'last' | 'email' | 'phone') => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = layoutById(new URLSearchParams(window.location.search).get('layout') ?? '');
    const interest = l ? `Tower ${l.tower}, ${l.type}${l.position ? ` (${l.position})` : ''}, ${sqft(l.area.gross)} sq ft, ${l.bedrooms}` : 'General enquiry';
    const body = [`Name: ${form.first} ${form.last}`, `Email: ${form.email}`, `Phone: ${form.phone || '-'}`, `Interested in: ${interest}`].join('\n');
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(`18th Avenue: register interest (${interest})`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <footer id="contact" className="relative z-[3] overflow-hidden bg-linear-to-t from-[#8ab6d2] via-[#dfe6dc] via-55% to-vanilla text-pine">
      <div className="wrap relative z-[2] grid gap-14 pb-10 pt-24 md:pt-32 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal as="h2" className="font-serif text-[clamp(2.4rem,3.6vw,3.6rem)] uppercase leading-[0.98]">
            <Chars text="Join the world of" />
            <br />
            <Chars text="18th Avenue" />
          </Reveal>
          <p className="t-body mt-6 text-pine/80">Register your interest and the sales team will be in touch.</p>

          <form onSubmit={submit} className="mt-10 flex flex-col gap-7">
            <div className="grid gap-7 sm:grid-cols-2 sm:gap-4">
              <label className="block">
                <span className="t-label text-golden">First name*</span>
                <input required value={form.first} onChange={set('first')} className={field} autoComplete="given-name" type="text" />
              </label>
              <label className="block">
                <span className="t-label text-golden">Last name*</span>
                <input required value={form.last} onChange={set('last')} className={field} autoComplete="family-name" type="text" />
              </label>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 sm:gap-4">
              <label className="block">
                <span className="t-label text-golden">Email*</span>
                <input required value={form.email} onChange={set('email')} className={field} autoComplete="email" type="email" />
              </label>
              <label className="block">
                <span className="t-label text-golden">Phone</span>
                <input value={form.phone} onChange={set('phone')} className={field} autoComplete="tel" type="tel" placeholder="+673" />
              </label>
            </div>
            <label className="flex items-start gap-3 text-[0.8rem] leading-snug text-golden">
              <input
                required
                type="checkbox"
                checked={form.agree}
                onChange={(e) => setForm((f) => ({ ...f, agree: e.target.checked }))}
                className="mt-0.5 size-4 shrink-0 appearance-none rounded-[3px] border border-pine/50 bg-transparent checked:border-pine checked:bg-pine"
              />
              <span>I agree to be contacted by {contact.company} about 18th Avenue.</span>
            </label>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <button type="submit" className="link-u text-pine">
                Let’s begin
              </button>
              {sent && <p className="text-[0.8rem] text-pine/70">Your email app should open with the details filled in.</p>}
            </div>
          </form>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-7">
          <ul className="flex flex-col gap-3">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="t-label text-[0.8rem] tracking-[0.06em] text-pine transition-colors hover:text-golden">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-8 lg:col-span-3 lg:col-start-10">
          <p className="text-[0.78rem] leading-relaxed text-pine/80">Disclaimer: {project.disclaimer}</p>
          <div className="text-[0.85rem] leading-relaxed">
            <p className="text-pine/80">For direct inquiries, our team is available at</p>
            <a href={contact.phoneHref} className="mt-1 block text-[1.05rem] font-medium text-golden hover:underline">
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="block text-golden hover:underline">
              {contact.email}
            </a>
          </div>
          <address className="text-[0.78rem] not-italic leading-relaxed text-pine/70">
            {contact.company}
            <br />
            {contact.address.join(' ')}
          </address>
        </div>
      </div>

      {/* The towers in the sky: the film's end card, whose white ground multiplies away into the gradient. No
          z-index on this layer: a stacking context here would leave the blend nothing to blend with. */}
      <div className="relative -mt-8 h-[min(78vw,40rem)] md:-mt-40 md:h-[min(52vw,46rem)]">
        <Image
          src={endcard.src}
          alt="The 18th Avenue towers, artist's impression"
          width={endcard.width}
          height={endcard.height}
          sizes="(min-width: 768px) 55vw, 100vw"
          className="absolute bottom-0 right-[4%] h-full w-auto max-w-none object-contain mix-blend-multiply [mask-image:radial-gradient(ellipse_62%_80%_at_50%_62%,#000_58%,transparent_100%)] md:right-[18%]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[#8ab6d2] to-transparent" />
        <div className="wrap absolute inset-x-0 bottom-0 z-[2] flex flex-col-reverse items-start gap-3 pb-5 md:flex-row md:items-end md:justify-between md:pb-8">
          <p className="text-[0.75rem] text-vanilla/95">{project.copyright}. All rights reserved.</p>
          <FitText as="p" guessVw={7} className="w-full font-serif uppercase leading-[0.8] text-vanilla md:w-[52%]" max={260}>
            18th Avenue
          </FitText>
        </div>
      </div>
    </footer>
  );
}
