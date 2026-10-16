import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';

// Diagrama de red premium reutilizable: núcleo luminoso + nodos en órbita + enlaces con flecha y flujo.
// Se ancla a un punto real del mapa (coordenada) y se mueve con la cámara.
export interface DNode { id: string; title: string; badge?: string; badgeColor?: string; sub?: string; Icon: LucideIcon; color: string; ink: string; ang: number }
export interface DLink { id: string; a: string; b: string; style: 'solid' | 'dotted' | 'dashed'; color: string; arrow?: boolean; delay: number; off?: number; ring?: boolean }
export interface DSpec { core: { title: string; sub?: string; color: string }; nodes: DNode[]; links: DLink[] }

interface Props {
  spec: DSpec; active: boolean; beat: number; W: number; H: number; m: boolean;
  project: () => { x: number; y: number } | null;
  emph: (linkId: string, beat: number, ring: boolean) => number; // opacidad de cada enlace según la etapa
  selected: string | null; onSelect: (id: string) => void;
}

export default function Diagram({ spec, active, beat, W, H, m, project, emph, selected, onSelect }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const R = m ? Math.min(W * 0.3, H * 0.17) : Math.min(H * 0.26, W * 0.2);
  const ND = m ? 28 : 36, CR = m ? 38 : 48;
  const pol = (deg: number, r: number) => ({ x: r * Math.sin((deg * Math.PI) / 180), y: -r * Math.cos((deg * Math.PI) / 180) });

  const geo = useMemo(() => {
    const nodes = spec.nodes.map((n) => ({ ...n, p: pol(n.ang, R) }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links = spec.links.map((l) => {
      const A = l.a === 'core' ? { p: { x: 0, y: 0 }, r: CR, ang: 0 } : { p: byId.get(l.a)!.p, r: ND, ang: byId.get(l.a)!.ang };
      const B = { p: byId.get(l.b)!.p, r: ND, ang: byId.get(l.b)!.ang };
      let d: string;
      if (l.ring) {
        const g = ((ND + 12) / R) * (180 / Math.PI);
        const a0 = A.ang + g, a1 = (B.ang < A.ang ? B.ang + 360 : B.ang) - g;
        const P = pol(a0, R), Q = pol(a1, R);
        d = 'M' + P.x + ',' + P.y + ' A' + R + ',' + R + ' 0 0 1 ' + Q.x + ',' + Q.y;
      } else {
        const dx = B.p.x - A.p.x, dy = B.p.y - A.p.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, o = l.off ?? 0;
        const sx = A.p.x + ux * (A.r + 6) + nx * o, sy = A.p.y + uy * (A.r + 6) + ny * o, ex = B.p.x - ux * (B.r + 8) + nx * o, ey = B.p.y - uy * (B.r + 8) + ny * o;
        d = l.a === 'core' ? 'M' + sx + ',' + sy + ' L' + ex + ',' + ey : 'M' + sx + ',' + sy + ' Q' + (A.p.x + B.p.x) * 0.42 + ',' + (A.p.y + B.p.y) * 0.42 + ' ' + ex + ',' + ey;
      }
      return { ...l, d };
    });
    return { nodes, links };
  }, [spec, R, ND, CR]);

  // anclaje al punto del mapa (o al centro de la pantalla)
  useEffect(() => {
    const tick = () => { const el = root.current; if (!el) return; const p = project(); gsap.set(el, { x: p ? p.x : W / 2, y: p ? p.y : H * 0.53 }); };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [project, W, H]);

  // entrada animada y bucles
  useEffect(() => {
    const el = root.current; if (!el || !active) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      gsap.set(q('.dg-node, .dg-core'), { xPercent: -50, yPercent: -50 });
      gsap.set(el, { opacity: 1 });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { gsap.set(q('.dg-line'), { strokeDashoffset: 0 }); return; }
      const tl = gsap.timeline({ delay: 0.25 });
      tl.fromTo(q('.dg-ring'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.3, stagger: 0.16, ease: 'power3.out', transformOrigin: '50% 50%' }, 0);
      tl.fromTo(q('.dg-core'), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.95, ease: 'back.out(1.7)' }, 0.2);
      tl.fromTo(q('.dg-node'), { scale: 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.18, ease: 'back.out(1.6)' }, 0.65);
      tl.fromTo(q('.dg-lab'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, 1.0);
      q('.dg-line').forEach((p) => {
        const d = +(p.getAttribute('data-d') ?? 0);
        tl.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0.9 + d);
      });
      q('.dg-node').forEach((n, i) => { gsap.to(n, { y: '+=' + (i % 2 ? 5 : -5), duration: 2.4 + (i % 3) * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2.4 + i * 0.2 }); });
    }, el);
    return () => { gsap.to(el, { opacity: 0, duration: 0.4, onComplete: () => ctx.revert() }); };
  }, [active, spec, R]);

  // énfasis de enlaces por etapa
  useEffect(() => {
    const el = root.current; if (!el) return;
    el.querySelectorAll<SVGPathElement>('.dg-vis').forEach((p) => {
      const id = p.getAttribute('data-id')!, ring = p.getAttribute('data-ring') === '1';
      gsap.to(p, { opacity: emph(id, beat, ring), duration: 0.6, overwrite: true });
    });
  }, [beat, active, emph]);

  const mk = (c: string) => 'dgah-' + c.replace('#', '');
  const colors = Array.from(new Set(spec.links.map((l) => l.color)));
  return (
    <div ref={root} className="dg" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: 0, zIndex: 8, pointerEvents: active ? 'auto' : 'none' }}>
      <svg width="1" height="1" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} aria-hidden>
        <defs>
          {colors.map((c) => <marker key={c} id={mk(c)} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 Z" fill={c} /></marker>)}
          <radialGradient id="dgg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(235,229,217,0.10)" /><stop offset="100%" stopColor="rgba(235,229,217,0)" /></radialGradient>
        </defs>
        <circle className="dg-ring" cx="0" cy="0" r={R * 1.45} fill="url(#dgg)" />
        <circle className="dg-ring" cx="0" cy="0" r={R} fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="1.1" />
        <g className="dg-ring"><g className="rot-cw" style={{ transformOrigin: '0px 0px' }}>
          <circle cx="0" cy="0" r={R * 1.22} fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx="0" cy={-R * 1.22} r="3" fill="#fff" /><circle cx={R * 1.22} cy="0" r="2" fill="#cdae67" />
        </g></g>
        <g className="dg-ring"><g className="rot-ccw" style={{ transformOrigin: '0px 0px' }}>
          <circle cx="0" cy="0" r={R * 1.46} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="10 12" />
          <circle cx={-R * 1.46} cy="0" r="2.6" fill="#fff" /><circle cx="0" cy={R * 1.46} r="2" fill="#6fb1a7" />
        </g></g>
        {geo.links.map((l) => (
          <g key={l.id}>
            <g className="dg-vis" data-id={l.id} data-ring={l.ring ? 1 : 0} style={{ opacity: emph(l.id, beat, !!l.ring) }}>
              <path className="dg-line" data-d={l.delay} pathLength={1} strokeDasharray="1" strokeDashoffset="1" d={l.d} fill="none" stroke={l.color}
                strokeWidth={l.style === 'solid' ? (l.ring ? 2.6 : 2.2) : 1.2} strokeLinecap="round" opacity={l.style === 'solid' ? 0.95 : 0.25} markerEnd={l.arrow && l.style === 'solid' ? 'url(#' + mk(l.color) + ')' : undefined} />
              <path className="arc-flow" d={l.d} fill="none" stroke={l.style === 'solid' ? '#fff' : l.color} strokeWidth={l.style === 'dotted' ? 3.6 : 2.4} strokeLinecap="round"
                style={{ strokeDasharray: l.style === 'dotted' ? '0.1 9' : l.style === 'dashed' ? '8 8' : '2 14', animationDelay: '-' + ((l.delay * 0.7) % 1.4) + 's' }} opacity={l.style === 'solid' ? 0.85 : 0.95} />
            </g>
          </g>
        ))}
      </svg>

      <div className="dg-core rp-disc" style={{ position: 'absolute', left: 0, top: 0, width: CR * 2, height: CR * 2, ['--c' as string]: spec.core.color } as React.CSSProperties}>
        <div className="rp-core-txt">{spec.core.title}</div>
      </div>
      {spec.core.sub && <div className="dg-lab dg-coresub" style={{ position: 'absolute', left: 0, top: CR + 10, transform: 'translateX(-50%)' }}>{spec.core.sub}</div>}

      {geo.nodes.map((n) => {
        const up = n.p.y < -4; // los nodos de la mitad superior llevan la etiqueta arriba; los de abajo, abajo
        return (
          <div key={n.id} className="dg-node" onClick={() => onSelect(n.id)} style={{ position: 'absolute', left: n.p.x, top: n.p.y, cursor: 'pointer' }}>
            <div className="rp-disc" style={{ width: ND * 2, height: ND * 2, ['--c' as string]: n.color, color: n.ink, outline: selected === n.id ? '2px solid #fff' : 'none', outlineOffset: 3 } as React.CSSProperties}>
              <n.Icon size={ND * 0.95} strokeWidth={1.7} />
            </div>
            <div className="dg-lab" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', ...(up ? { bottom: ND * 2 + 10 } : { top: ND * 2 + 10 }), textAlign: 'center' }}>
              <b>{n.title}</b>
              {n.badge && <span className="dg-badge" style={{ color: n.badgeColor }}><i style={{ background: n.badgeColor }} />{n.badge}</span>}
              {n.sub && !m && <small>{n.sub}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
