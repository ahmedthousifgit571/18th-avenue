'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { contact } from '@/content/project';
import { layoutById, layouts, sqft } from '@/content/units';
import { media } from '@/content/media';

const field = 'w-full border-b border-ink/25 bg-transparent py-3 text-base outline-none transition-colors placeholder:text-mute focus:border-bronze';

/**
 * Register-interest form. There is no backend: it composes an email to the sales team, prefilled with any layout
 * chosen on the Residences page (?layout=…#contact).
 */
export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'General enquiry', message: '' });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('layout');
    const l = id ? layoutById(id) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the query string is client-only, read once on mount
    if (l) setForm((f) => ({ ...f, interest: l.id }));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = layoutById(form.interest);
    const interest = l ? `Tower ${l.tower}, ${l.type}${l.position ? ` (${l.position})` : ''}, ${sqft(l.area.gross)} sq ft, ${l.bedrooms}` : form.interest;
    const body = [`Name: ${form.name}`, `Phone: ${form.phone}`, `Email: ${form.email}`, `Interested in: ${interest}`, '', form.message].join('\n');
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(`18th Avenue enquiry: ${interest}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" className="relative z-[3] bg-paper py-24 md:py-36" data-tone="light" aria-labelledby="contact-title">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow mb-5 text-bronze">Register interest</p>
          <h2 id="contact-title" className="display h-lg">
            Let’s talk about <em>your home.</em>
          </h2>
          <p className="body mt-6 max-w-md">
            Tell us which tower or layout you have in mind and the sales team at {contact.company} will be in touch.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            <a href={contact.phoneHref} className="group flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full border border-line transition-colors group-hover:border-bronze">
                <Phone size={16} strokeWidth={1.4} />
              </span>
              <span className="font-serif text-2xl">{contact.phone}</span>
            </a>
            <a href={`mailto:${contact.email}`} className="group flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full border border-line transition-colors group-hover:border-bronze">
                <Mail size={16} strokeWidth={1.4} />
              </span>
              <span className="font-serif text-2xl">{contact.email}</span>
            </a>
          </div>
          <div className="relative mt-12 hidden aspect-[2/1] overflow-hidden rounded-sm lg:block">
            <Image src={media.exterior['drop-off'].src} alt="The drop-off porch at night, artist's impression" fill sizes="40vw" className="object-cover" />
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-7 lg:col-span-6 lg:col-start-7">
          <div className="grid gap-7 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow text-mute">Full name</span>
              <input required value={form.name} onChange={set('name')} className={field} autoComplete="name" type="text" />
            </label>
            <label className="block">
              <span className="eyebrow text-mute">Phone</span>
              <input required value={form.phone} onChange={set('phone')} className={field} autoComplete="tel" type="tel" placeholder="+673" />
            </label>
          </div>
          <label className="block">
            <span className="eyebrow text-mute">Email</span>
            <input value={form.email} onChange={set('email')} className={field} autoComplete="email" type="email" />
          </label>
          <label className="block">
            <span className="eyebrow text-mute">I’m interested in</span>
            <select value={form.interest} onChange={set('interest')} className={`${field} appearance-none`}>
              <option>General enquiry</option>
              {[1, 2, 3, 4, 5].map((t) => (
                <optgroup key={t} label={`Tower ${t}`}>
                  {layouts
                    .filter((l) => l.tower === t)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.type}
                        {l.position ? ` · ${l.position}` : ''} · {sqft(l.area.gross)} sq ft · {l.bedrooms}
                      </option>
                    ))}
                </optgroup>
              ))}
              <option>Retail shop unit</option>
            </select>
          </label>
          <label className="block">
            <span className="eyebrow text-mute">Message</span>
            <textarea value={form.message} onChange={set('message')} rows={4} className={`${field} resize-none`} placeholder="Viewing times, questions, preferred floor…" />
          </label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" className="btn btn-solid self-start">
              Send enquiry <ArrowUpRight size={14} />
            </button>
            <p className="max-w-xs text-xs text-mute">Opens your email app with the details filled in. Nothing is stored on this site.</p>
          </div>
        </form>
      </div>
    </section>
  );
}
