import * as THREE from 'three';
import { seeded } from '@/three/site/layout';

/**
 * Finish options for the show-room. Names are ours (not a confirmed specification). Textures are drawn on canvases
 * at runtime, so the studio ships no image files.
 */
export type FinishOption = { id: string; name: string; swatch: string; note: string };

export const FINISHES: Record<'floor' | 'walls' | 'joinery', { label: string; options: FinishOption[] }> = {
  floor: {
    label: 'Floor',
    options: [
      { id: 'marble', name: 'Calacatta marble', swatch: 'linear-gradient(135deg,#f4f1ec 0%,#e7e2d9 45%,#cfc8bc 50%,#f1ede6 56%,#ece7df 100%)', note: 'As in the show-flat renders' },
      { id: 'oak', name: 'Natural oak', swatch: 'repeating-linear-gradient(90deg,#c39566 0 9px,#b5885b 9px 18px,#cc9f70 18px 27px)', note: 'Warm timber planks' },
      { id: 'terrazzo', name: 'Warm terrazzo', swatch: 'radial-gradient(circle at 30% 30%,#b7795a 0 3px,transparent 4px),radial-gradient(circle at 70% 60%,#7e8a74 0 2px,transparent 3px),radial-gradient(circle at 50% 80%,#8d867c 0 3px,transparent 4px),#e8e1d5', note: 'Speckled stone' },
    ],
  },
  walls: {
    label: 'Walls',
    options: [
      { id: 'warm-white', name: 'Warm white', swatch: '#f2eee6', note: 'Bright and neutral' },
      { id: 'sand', name: 'Sandstone', swatch: '#e1d1b9', note: 'Soft and sunlit' },
      { id: 'sage', name: 'Sage', swatch: '#c7ccbb', note: 'Garden calm' },
    ],
  },
  joinery: {
    label: 'Joinery',
    options: [
      { id: 'walnut', name: 'Walnut slat', swatch: 'repeating-linear-gradient(90deg,#5b3e2a 0 6px,#4a3222 6px 8px)', note: 'As in the show-flat foyer' },
      { id: 'champagne', name: 'Champagne metal', swatch: 'linear-gradient(135deg,#d9c296,#a88a57 55%,#d1be95)', note: 'Brushed, warm' },
      { id: 'black', name: 'Matte black', swatch: '#202020', note: 'Graphic contrast' },
    ],
  },
};

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function tex(c: HTMLCanvasElement, repeat: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

function marble() {
  const [c, g] = canvas(1024);
  g.fillStyle = '#f2efea';
  g.fillRect(0, 0, 1024, 1024);
  const r = seeded(11);
  // Large slabs with soft grey veining and a few fine gold threads.
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = i % 9 === 0 ? 'rgba(176,150,104,0.35)' : `rgba(130,124,116,${0.08 + r() * 0.16})`;
    g.lineWidth = 0.6 + r() * (i % 5 === 0 ? 4 : 1.6);
    g.beginPath();
    let x = r() * 1024;
    let y = 0;
    g.moveTo(x, y);
    while (y < 1024) {
      const nx = x + (r() - 0.45) * 160;
      const ny = y + 40 + r() * 120;
      g.quadraticCurveTo(x + (r() - 0.5) * 120, (y + ny) / 2, nx, ny);
      x = nx;
      y = ny;
    }
    g.stroke();
  }
  // Slab joints
  g.strokeStyle = 'rgba(120,110,100,0.25)';
  g.lineWidth = 2;
  g.strokeRect(0, 0, 1024, 1024);
  return tex(c, [3, 3]);
}

function oak() {
  const [c, g] = canvas(1024);
  const r = seeded(7);
  const planks = 8;
  const w = 1024 / planks;
  for (let i = 0; i < planks; i++) {
    let y = -r() * 400;
    while (y < 1024) {
      const len = 380 + r() * 380;
      const base = [190 + r() * 22, 140 + r() * 18, 94 + r() * 14];
      g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
      g.fillRect(i * w, y, w, len);
      for (let k = 0; k < 26; k++) {
        g.strokeStyle = `rgba(110,72,40,${0.05 + r() * 0.12})`;
        g.lineWidth = 0.5 + r() * 1.4;
        const gx = i * w + r() * w;
        g.beginPath();
        g.moveTo(gx, y);
        g.bezierCurveTo(gx + (r() - 0.5) * 10, y + len / 3, gx + (r() - 0.5) * 10, y + (2 * len) / 3, gx + (r() - 0.5) * 6, y + len);
        g.stroke();
      }
      g.fillStyle = 'rgba(70,45,25,0.5)';
      g.fillRect(i * w, y + len - 2, w, 2);
      y += len;
    }
    g.fillStyle = 'rgba(70,45,25,0.45)';
    g.fillRect(i * w, 0, 2, 1024);
  }
  return tex(c, [2.4, 2.4]);
}

function terrazzo() {
  const [c, g] = canvas(1024);
  g.fillStyle = '#e8e1d5';
  g.fillRect(0, 0, 1024, 1024);
  const r = seeded(3);
  const chips = ['#b7795a', '#7e8a74', '#8d867c', '#d4c3a6', '#5c5650', '#c9a27e'];
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = chips[Math.floor(r() * chips.length)];
    const x = r() * 1024;
    const y = r() * 1024;
    const s = 1.5 + r() * r() * 11;
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + r();
      const rr = s * (0.6 + r() * 0.5);
      g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.fill();
  }
  return tex(c, [3, 3]);
}

function walnut() {
  const [c, g] = canvas(512);
  const r = seeded(19);
  g.fillStyle = '#5a3e2b';
  g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 120; k++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '35,22,14' : '120,86,58'},${0.08 + r() * 0.2})`;
    g.lineWidth = 0.6 + r() * 2;
    const x = r() * 512;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + (r() - 0.5) * 30, 170, x + (r() - 0.5) * 30, 340, x + (r() - 0.5) * 16, 512);
    g.stroke();
  }
  return tex(c, [1, 1]);
}

export type FinishMaterials = {
  floor: Record<string, THREE.MeshStandardMaterial>;
  walls: Record<string, THREE.MeshStandardMaterial>;
  joinery: Record<string, THREE.MeshStandardMaterial>;
};

export function makeFinishMaterials(): FinishMaterials {
  return {
    floor: {
      marble: new THREE.MeshStandardMaterial({ map: marble(), roughness: 0.18, metalness: 0, envMapIntensity: 0.9 }),
      oak: new THREE.MeshStandardMaterial({ map: oak(), roughness: 0.55 }),
      terrazzo: new THREE.MeshStandardMaterial({ map: terrazzo(), roughness: 0.35 }),
    },
    walls: {
      'warm-white': new THREE.MeshStandardMaterial({ color: '#f2eee6', roughness: 0.92 }),
      sand: new THREE.MeshStandardMaterial({ color: '#dfcdb3', roughness: 0.92 }),
      sage: new THREE.MeshStandardMaterial({ color: '#c3c9b6', roughness: 0.92 }),
    },
    joinery: {
      walnut: new THREE.MeshStandardMaterial({ map: walnut(), roughness: 0.55 }),
      champagne: new THREE.MeshStandardMaterial({ color: '#c2a571', roughness: 0.32, metalness: 0.85 }),
      black: new THREE.MeshStandardMaterial({ color: '#1f1f1f', roughness: 0.6, metalness: 0.1 }),
    },
  };
}
