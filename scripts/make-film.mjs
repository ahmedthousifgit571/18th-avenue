// Downloads Unity Land's 18th Avenue film (about 261 MB) once and encodes a web version with ffmpeg:
//   public/media/film/18th-avenue-720p.mp4  (H.264, CRF 26, faststart, AAC 128k)
//   public/media/film/towers-poster.webp
// Usage: node scripts/make-film.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = path.resolve(import.meta.dirname, '..');
const SRC_URL = 'https://18thavenue.com.bn/wp-content/uploads/2025/07/Unityland-Final-Ver-3-1.mp4';
const raw = path.join(root, 'assets-src/film/unityland-final.mp4');
const outDir = path.join(root, 'public/media/film');
await fs.mkdir(path.dirname(raw), { recursive: true });
await fs.mkdir(outDir, { recursive: true });

try {
  await fs.access(raw);
} catch {
  console.log('downloading film…');
  const res = await fetch(SRC_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (asset pipeline)' } });
  if (!res.ok) throw new Error(`${res.status} ${SRC_URL}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(raw));
}

const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_type', '-of', 'json', raw]);
const info = JSON.parse(probe.toString());
const duration = Number(info.format.duration);
console.log(`source: ${duration.toFixed(1)} s`, info.streams.map((s) => `${s.codec_type} ${s.width ?? ''}x${s.height ?? ''}`).join(', '));

const out = path.join(outDir, '18th-avenue-720p.mp4');
execFileSync(
  'ffmpeg',
  ['-y', '-i', raw, '-vf', 'scale=-2:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', out],
  { stdio: 'inherit' },
);


const posterPng = path.join(root, 'assets-src/film/poster.png');
// 0:30 is the towers in daylight from the street; crop off the film's watermark and burned-in subtitles.
execFileSync('ffmpeg', ['-y', '-ss', '30', '-i', raw, '-frames:v', '1', '-vf', 'crop=iw:ih*0.74:0:ih*0.12,scale=1600:-2', posterPng], { stdio: 'ignore' });
const sharp = (await import('sharp')).default;
await sharp(posterPng).webp({ quality: 84 }).toFile(path.join(outDir, 'towers-poster.webp'));

const { size } = await fs.stat(out);
console.log(`wrote ${path.relative(root, out)} (${(size / 1048576).toFixed(1)} MB) and towers-poster.webp`);
