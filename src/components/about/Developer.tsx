import Image from 'next/image';
import { consultants, project } from '@/content/project';
import { media } from '@/content/media';

const PARTNERS = [
  { role: 'Landowner', name: project.landowner, note: 'Joint development partner' },
  { role: 'Developer', name: project.developer, note: 'Brunei Darussalam' },
  { role: 'Concept architect & master planner', name: project.architect, note: 'Singapore based, Temasek owned' },
];

// live: "Site Progress" captions on the home page
const PROGRESS = [
  { img: media.exterior['progress-2024-08'], date: '12 Aug 2024', caption: 'Site works under way on Lot 32170' },
  { img: media.exterior['progress-east'], date: 'Before works', caption: 'View of lot 32170 (from lot 32169), east view' },
  { img: media.exterior['progress-road'], date: 'Before works', caption: 'View from Jalan Pusar Ulak, east view' },
];

export default function Developer() {
  return (
    <section className="relative z-[3] bg-ivory py-24 md:py-36" data-tone="light" aria-labelledby="dev-title">
      <div className="wrap">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow mb-5 text-bronze">Developer & consultants</p>
            <h2 id="dev-title" className="display h-lg">
              A Brunei–Singapore <em>partnership.</em>
            </h2>
          </div>
          <p className="body md:col-span-5">
            18th Avenue is a joint development between the landowner, {project.landowner}, and the developer,{' '}
            {project.developer}, designed by the international, award-winning firm {project.architect}.
          </p>
        </div>

        <ul className="mt-14 grid border-t border-line md:grid-cols-3">
          {PARTNERS.map((p, i) => (
            <li key={p.name} className={`flex flex-col gap-3 border-b border-line py-8 md:border-b-0 md:py-10 ${i ? 'md:border-l md:pl-8' : 'md:pr-8'}`}>
              <p className="eyebrow text-bronze">{p.role}</p>
              <p className="display text-[clamp(1.9rem,3vw,2.8rem)]">{p.name}</p>
              <p className="text-sm text-mute">{p.note}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16">
          <p className="eyebrow mb-6 text-mute">Consultants</p>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
            {consultants.map((c) => (
              <li key={c.id} className="flex flex-col items-center justify-center gap-2 bg-paper px-4 py-6 text-center">
                <div className="relative h-16 w-full">
                  <Image src={media.consultants[c.id].src} alt={c.name} fill sizes="200px" className="object-contain mix-blend-multiply grayscale transition duration-500 hover:grayscale-0" />
                </div>
                {c.role && <p className="text-[0.625rem] uppercase leading-snug tracking-[0.14em] text-mute">{c.role}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-24 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow mb-5 text-bronze">Site progress</p>
            <h3 className="display h-sm">Construction began in {project.construction.commencement}.</h3>
            <ol className="mt-8 border-l border-line pl-6">
              <li className="relative pb-6">
                <span className="absolute -left-[1.85rem] top-1.5 size-2.5 rounded-full bg-bronze" />
                <p className="eyebrow text-ink">July 2024</p>
                <p className="mt-1 text-sm text-mute">Commencement</p>
              </li>
              <li className="relative pb-6">
                <span className="absolute -left-[1.85rem] top-1.5 size-2.5 rounded-full bg-bronze" />
                <p className="eyebrow text-ink">August 2024</p>
                <p className="mt-1 text-sm text-mute">Site works under way</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[1.85rem] top-1.5 size-2.5 rounded-full border border-bronze bg-ivory" />
                <p className="eyebrow text-ink">{project.construction.period} programme</p>
                <p className="mt-1 text-sm text-mute">Estimated construction period</p>
              </li>
            </ol>
          </div>
          <ul className="grid gap-5 sm:grid-cols-3 md:col-span-8">
            {PROGRESS.map((p) => (
              <li key={p.caption}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand">
                  <Image src={p.img.src} alt={p.caption} fill sizes="(min-width: 768px) 22vw, 100vw" className="object-cover" />
                </div>
                <p className="eyebrow mt-3 text-ink">{p.date}</p>
                <p className="mt-1 text-sm text-mute">{p.caption}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
