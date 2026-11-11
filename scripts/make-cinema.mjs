// Cuts the full-bleed loops and stills for the Belgrade-Arbor-style home page from Unity Land's own film
// (assets-src/film/unityland-final.mp4, 1920x1080, downloaded by scripts/make-film.mjs).
//
// The film has a "18th AVENUE" watermark in the top-left corner (about 5–14% down) and burned-in subtitles
// from about 83% down, so every output is cropped (or, for the hero, de-logoed over the sky) to remove both.
//
//   public/media/cinema/<clip>.mp4   H.264, no audio, faststart; loops for <video autoplay muted loop>
//   public/media/cinema/<clip>.webp  poster (first frame of the loop)
//   public/media/cinema/still-*.webp stills for image cards
//
// Usage: node scripts/make-cinema.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'assets-src/film/unityland-final.mp4');
const out = path.join(root, 'public/media/cinema');
const tmp = path.join(root, 'assets-src/cinema');
await fs.mkdir(out, { recursive: true });
await fs.mkdir(tmp, { recursive: true });

// Crops in source pixels (1920x1080).
const CROP_BAND = 'crop=1920:724:0:162'; // 15%..82%: no watermark, no subtitles
// Hero: inpaint only the watermark's own pixels (mask from scripts/watermark-mask.mjs, a relative path because
// ffmpeg filter arguments can't take a Windows drive colon), keeping the sky and tower crowns; drop subtitles.
const CROP_HERO = 'removelogo=assets-src/cinema/watermark-mask.png,crop=1920:884:0:0';

/**
 * @param {string} name
 * @param {{ parts: [number, number][], crop: string, width: number, pingpong?: boolean, crf?: number }} o
 */
function clip(name, o) {
  const file = path.join(out, `${name}.mp4`);
  const inputs = [];
  const chains = [];
  o.parts.forEach(([a, b], i) => {
    inputs.push('-ss', String(a), '-t', String(b - a), '-i', src);
    chains.push(`[${i}:v]${o.crop},scale=${o.width}:-2:flags=lanczos,fps=30,setsar=1[v${i}]`);
  });
  let graph = chains.join(';');
  let last;
  if (o.parts.length > 1) {
    graph += ';' + o.parts.map((_, i) => `[v${i}]`).join('') + `concat=n=${o.parts.length}:v=1:a=0[cat]`;
    last = 'cat';
  } else last = 'v0';
  if (o.pingpong) {
    graph += `;[${last}]split[f][r];[r]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[rv];[f][rv]concat=n=2:v=1:a=0[pp]`;
    last = 'pp';
  }
  execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-y', ...inputs,
      '-filter_complex', graph, '-map', `[${last}]`, '-an',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(o.crf ?? 26), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', file,
    ],
    { stdio: 'inherit' },
  );
  return file;
}

/*
 * The hero gets its own, heavier treatment, because it is the first thing anyone sees:
 *  1. de-logo, crop off the subtitles, and lightly denoise the film's own compression noise;
 *  2. retime the move with a cosine ease and motion-interpolate every frame at its eased instant (clean on this
 *     shot: a smooth CG camera move), so the camera drifts at ~0.7x and glides to a stop at each end;
 *  3. grade (gentle S-curve, warm highlights / cool shadows, a touch of saturation), sharpen, soft vignette;
 *  4. loop as a pendulum (forward, then reversed: seamless because the motion eases to zero at the turns);
 *  5. encode AV1 (10-bit: no banding in the sky, about half the bytes) with an H.264 fallback.
 */
const HERO_SHOT = [30.3, 34.3]; // the cleanest 4 s of the street-level orbit
const HERO_FORWARD_S = 9; // forward leg after retiming; the loop is twice this
const HERO_GRADE = [
  "curves=master='0/0 0.22/0.19 0.5/0.5 0.78/0.81 1/1'",
  'eq=contrast=1.04:saturation=1.06:gamma=0.98',
  'colorbalance=rs=-0.015:bs=0.025:rh=0.035:gh=0.012:bh=-0.03',
  'unsharp=5:5:0.6:5:5:0',
  'vignette=angle=0.42',
].join(',');

const countFrames = (file) =>
  Number(
    execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file])
      .toString()
      .trim(),
  );

function heroLoop() {
  const [a, b] = HERO_SHOT;
  // Stage 0: the film repeats a frame about every 37 (a frame-rate conversion), which shows as a hitch in a slow
  // drift. mpdecimate drops those repeats and the rest are re-stamped evenly; also de-logo, crop and denoise here.
  const clean = path.join(tmp, 'hero-clean.mp4');
  execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-y', '-ss', String(a), '-t', String(b - a), '-i', src,
      '-vf', ['setpts=PTS-STARTPTS', CROP_HERO, 'mpdecimate', 'setpts=N/30/TB', 'hqdn3d=1.2:1.2:3:3'].join(','),
      '-an', '-fps_mode', 'passthrough', '-c:v', 'libx264', '-preset', 'fast', '-crf', '8', '-pix_fmt', 'yuv420p', clean,
    ],
    { stdio: 'inherit' },
  );
  const L = (countFrames(clean) - 1) / 30; // time of the last frame, so the ease ends exactly on it
  const forward = path.join(tmp, 'hero-forward.mp4');
  // Stage 1: one continuous, eased, graded forward leg (near-lossless intermediate).
  execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-y', '-i', clean,
      '-vf',
      [
        // Cosine ease on the source frames' timestamps: source time s → output time (T/π)·acos(1 − 2s/L), so the
        // speed is zero at both ends. minterpolate then renders every output frame at its exact eased instant
        // (resampling a fixed high-fps stream instead quantises the ease into visible judder).
        `setpts=(${HERO_FORWARD_S}/PI)*acos(max(-1\\,1-2*T/${L.toFixed(6)}))/TB`,
        'minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none',
        HERO_GRADE,
        'setsar=1',
      ].join(','),
      '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '10', '-pix_fmt', 'yuv420p', forward,
    ],
    { stdio: 'inherit' },
  );
  const frames = countFrames(forward);
  // Stage 2: pendulum loop. Reverse leg drops both turn frames so neither is shown twice at the seams.
  const graph = `[0:v]split[f][r];[r]reverse,trim=start_frame=1:end_frame=${frames - 1},setpts=PTS-STARTPTS[rv];[f][rv]concat=n=2:v=1:a=0[pp]`;
  const common = ['-v', 'error', '-y', '-i', forward, '-filter_complex', graph, '-map', '[pp]', '-an', '-movflags', '+faststart'];
  const av1 = path.join(out, 'hero.av1.mp4');
  execFileSync(
    'ffmpeg',
    [...common, '-c:v', 'libsvtav1', '-preset', '4', '-crf', '30', '-g', '150', '-pix_fmt', 'yuv420p10le', '-svtav1-params', 'tune=0', av1],
    { stdio: 'inherit' },
  );
  const h264 = path.join(out, 'hero.mp4');
  execFileSync(
    'ffmpeg',
    [...common, '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '21', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-g', '150', h264],
    { stdio: 'inherit' },
  );
  return { forward, files: [av1, h264] };
}

async function heroPoster(forward) {
  const png = path.join(tmp, 'hero.png');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', forward, '-frames:v', '1', png]);
  // New name (not hero.webp) so the Next image optimizer, which caches by URL, never serves the ungraded frame.
  await sharp(png).webp({ quality: 86 }).toFile(path.join(out, 'hero-poster.webp'));
}

async function poster(name, at, crop, width = 1920) {
  const png = path.join(tmp, `${name}.png`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(at), '-i', src, '-frames:v', '1', '-vf', `${crop},scale=${width}:-2:flags=lanczos`, png]);
  const file = path.join(out, `${name}.webp`);
  await sharp(png).webp({ quality: 82 }).toFile(file);
  return file;
}

const clips = [
  // (The hero, the street-level towers, is built by heroLoop() above.)
  // The aerial orbit around the five towers in their neighbourhood.
  { name: 'location', parts: [[19.4, 28.9]], crop: CROP_BAND, width: 1600, pingpong: true, crf: 27, posterAt: 19.4 },
  // The shop street.
  { name: 'retail', parts: [[114.2, 122.4]], crop: CROP_BAND, width: 1600, crf: 26, posterAt: 114.2 },
  // Lagoon pool deck, then the glass pool pavilions.
  { name: 'amenities', parts: [[59.6, 63.8], [83.1, 88.2]], crop: CROP_BAND, width: 1600, crf: 26, posterAt: 60.4 },
];

// Optional names on the command line limit the run (e.g. node scripts/make-cinema.mjs retail still-gym).
const only = process.argv.slice(2);
const want = (k) => !only.length || only.includes(k);

if (want('hero')) {
  const { forward, files } = heroLoop();
  await heroPoster(forward);
  for (const f of files) console.log(`${path.basename(f)} ${((await fs.stat(f)).size / 1048576).toFixed(1)} MB`);
}

for (const c of clips.filter((c) => want(c.name))) {
  const f = clip(c.name, c);
  await poster(c.name, c.posterAt, c.crop, c.width);
  const { size } = await fs.stat(f);
  console.log(`${c.name}.mp4 ${(size / 1048576).toFixed(1)} MB`);
}

// Stills for the image cards (all from the same film, cropped the same way).
const stills = {
  'towers-street': 31.6,
  aerial: 25.2,
  'tower-top': 39.6,
  'drop-off': 44.6,
  'pool-deck': 61.2,
  'kids-pool': 66.5,
  gym: 69.4,
  pavilion: 85.6,
  gourmet: 93.2,
  bbq: 98.4,
  shops: 114.4,
  coffee: 125.6,
  living: 135.2,
  'window-view': 144.6,
  kitchen: 150.6,
};
for (const [name, at] of Object.entries(stills)) if (want(`still-${name}`)) await poster(`still-${name}`, at, CROP_BAND);

// End card: the towers drawn on white (left half), for the footer. White is blended away in CSS.
if (want('endcard')) {
  const png = path.join(tmp, 'endcard.png');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '157.5', '-i', src, '-frames:v', '1', '-vf', 'crop=1000:770:0:150', png]);
  await sharp(png).webp({ quality: 86 }).toFile(path.join(out, 'endcard-towers.webp'));
}

console.log('stills written to public/media/cinema');
