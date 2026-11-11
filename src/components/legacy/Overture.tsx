import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import WordScrub from '@/components/type/WordScrub';
import Counter from '@/components/type/Counter';
import { facts, project } from '@/content/project';
import { media } from '@/content/media';

export default function Overture() {
  return (
    <section className="relative z-[3] bg-ivory py-24 md:py-36" data-tone="light" aria-labelledby="overture-title">
      <div className="wrap grid gap-12 md:grid-cols-12">
        <div className="md:col-span-3">
          <p className="eyebrow text-bronze" id="overture-title">
            A modern lifestyle home
          </p>
          <div className="mt-8 hidden gap-3 md:flex">
            <div className="relative aspect-[3/4] w-24 overflow-hidden rounded-sm">
              <Image src={media.exterior.tower.src} alt="One of the 18th Avenue towers, artist's impression" fill sizes="96px" className="object-cover" />
            </div>
            <div className="relative mt-10 aspect-[3/4] w-24 overflow-hidden rounded-sm">
              <Image src={media.exterior.pool.src} alt="Lagoon pool and pavilions, artist's impression" fill sizes="96px" className="object-cover" />
            </div>
          </div>
        </div>
        <div className="md:col-span-9">
          <WordScrub text={project.intro} className="display text-[clamp(1.9rem,3.7vw,3.6rem)] leading-[1.08]" />
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <p className="body max-w-md">{project.development}</p>
            <div className="flex flex-col items-start justify-end gap-6">
              <p className="body max-w-sm">
                A joint development between the landowner, {project.landowner}, and the developer, {project.developer}.
              </p>
              <Link href="/about" className="eyebrow link-line inline-flex items-center gap-3 pb-1">
                Our story <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap mt-24 md:mt-36">
        <ul className="grid grid-cols-2 border-t border-line md:grid-cols-3 xl:grid-cols-6">
          {facts.map((f) => (
            <li key={f.unit} className="flex flex-col gap-2 border-b border-line py-8 pr-4 xl:border-b-0 xl:border-r xl:px-6 xl:first:pl-0 xl:last:border-r-0">
              <p className="num text-[clamp(3rem,6vw,5.5rem)] leading-none text-ink">
                <Counter value={f.value} decimals={'decimals' in f ? f.decimals : 0} />
              </p>
              <p className="eyebrow text-ink">{f.unit}</p>
              <p className="text-sm text-mute">{f.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
