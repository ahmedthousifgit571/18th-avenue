'use client';

import { Html } from '@react-three/drei';
import { PINS, TOWERS } from './layout';
import { EXPLORER } from './shots';
import { setStage, useStage } from '@/lib/stage';
import { towers as towerInfo, sqft } from '@/content/units';

/** Amenity markers for the active explorer chapter, and tower name tags. DOM via drei <Html>. */
export default function Pins() {
  const shot = useStage((s) => s.shot);
  const chapter = useStage((s) => s.chapter);
  const tower = useStage((s) => s.tower);
  const hover = useStage((s) => s.hoverAmenity);
  const hoverTower = useStage((s) => s.hoverTower);

  const keys = shot === 'explorer' ? EXPLORER[chapter]?.keys ?? [] : [];
  const showTowers = (shot === 'explorer' && chapter === 3) || shot === 'towers';

  return (
    <group>
      {PINS.filter((p) => keys.includes(p.key)).map((p) => (
        <Html key={p.key} position={p.position} center zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
          <div className={`pin ${hover === p.key ? 'is-hot' : ''}`}>
            <span className="pin-dot">{p.key}</span>
            <span className="pin-label">{p.name}</span>
          </div>
        </Html>
      ))}
      {showTowers &&
        TOWERS.map((t) => {
          const info = towerInfo[t.id - 1];
          const active = tower === t.id;
          // In the Residences picker the towers stand close together on screen: the others are numbered dots
          // (matching the 1–5 buttons beside the model) and only the chosen or hovered tower opens up.
          const picker = shot === 'towers';
          const open = !picker || active || hoverTower === t.id;
          return (
            <Html
              key={t.id}
              position={[t.centre[0], t.height + (picker ? 4.5 : 9), t.centre[1]]}
              center
              zIndexRange={active || hoverTower === t.id ? [40, 30] : [30, 20]}
            >
              <button
                type="button"
                className={`tower-tag ${active ? 'is-active' : ''} ${open ? '' : 'is-dot'}`}
                aria-label={`Tower ${t.id}`}
                onClick={() => setStage({ tower: active && !picker ? 0 : t.id })}
                onPointerEnter={() => setStage({ hoverTower: t.id })}
                onPointerLeave={() => setStage({ hoverTower: 0 })}
              >
                <span className="tower-tag-name">{open ? `Tower ${t.id}` : t.id}</span>
                {picker && open && (
                  <span className="tower-tag-meta">
                    {sqft(info.sizes[0])}–{sqft(info.sizes[1])} sq ft
                  </span>
                )}
              </button>
            </Html>
          );
        })}
    </group>
  );
}
