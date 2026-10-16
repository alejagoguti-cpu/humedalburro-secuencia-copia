import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Cpu, Leaf, Users, type LucideIcon } from 'lucide-react';
import { SYSTEMS } from './conclusion-content';

// Red propia: macromodelo premium. Núcleo luminoso, tres sistemas en órbita y sus componentes en listas mono ordenadas.
const SYS_META: Record<string, { ang: number; Icon: LucideIcon; ink: string; side: 1 | -1 }> = {
  s3: { ang: 0, Icon: Leaf, ink: '#06201c', side: 1 },
  s2: { ang: 120, Icon: Cpu, ink: '#150f2b', side: 1 },
  s1: { ang: 240, Icon: Users, ink: '#2a0d06', side: -1 },
};

interface Props { active: boolean; W: number; H: number; m: boolean }

export default function RedPremium({ active, W, H, m }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<string | null>(null);
  const cx = W / 2, cy = H * 0.5;
  const R1 = m ? Math.min(W * 0.24, H * 0.15) : Math.min(H * 0.2, W * 0.17);
  const DISC = m ? 58 : 92, ROW = m ? 0 : 23;
  const pol = (deg: number, r: number) => ({ x: cx + r * Math.sin((deg * Math.PI) / 180), y: cy - r * Math.cos((deg * Math.PI) / 180) });

  const geo = useMemo(() => {
    const systems = SYSTEMS.map((s) => {
      const meta = SYS_META[s.id], pos = pol(meta.ang, R1), n = s.comps.length;
      const bx = pos.x + meta.side * (DISC / 2 + 22), tx = pos.x + meta.side * (DISC / 2 + 34);
      const items = s.comps.map((name, i) => ({ name, y: pos.y + (i - (n - 1) / 2) * ROW }));
      return { ...s, ...meta, pos, bx, tx, items, y0: items[0].y, y1: items[n - 1].y };
    });
    // arcos de interdependencia entre sistemas (sentido horario) con flecha
    const arcs = systems.map((s, i) => {
      const t = systems[(i + 1) % systems.length], g = ((DISC / 2 + 12) / R1) * (180 / Math.PI);
      const a0 = s.ang + g, a1 = (t.ang < s.ang ? t.ang + 360 : t.ang) - g;
      const A = pol(a0, R1), B = pol(a1, R1);
      return { id: s.id + t.id, d: 'M' + A.x + ',' + A.y + ' A' + R1 + ',' + R1 + ' 0 0 1 ' + B.x + ',' + B.y, color: s.color };
    });
    return { systems, arcs };
  }, [W, H, m]);

  useEffect(() => {
    const el = root.current; if (!el || !active) return;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      gsap.set(q('.rp-sys, .rp-core'), { xPercent: -50, yPercent: -50 });
      gsap.set(el, { opacity: 1 });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { gsap.set(q('.rp-in, .rp-item'), { opacity: 1 }); gsap.set(q('.rp-line'), { strokeDashoffset: 0 }); return; }
      const tl = gsap.timeline({ delay: 0.4 });
      tl.fromTo(q('.rp-ring'), { opacity: 0, scale: 0.55, svgOrigin: cx + ' ' + cy }, { opacity: 1, scale: 1, svgOrigin: cx + ' ' + cy, duration: 1.4, stagger: 0.18, ease: 'power3.out' }, 0);
      tl.fromTo(q('.rp-core'), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' }, 0.25);
      tl.fromTo(q('.rp-sys'), { scale: 0.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, stagger: 0.25, ease: 'back.out(1.5)' }, 0.9);
      tl.fromTo(q('.rp-line'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.07, ease: 'power2.inOut' }, 1.5);
      tl.fromTo(q('.rp-item'), { opacity: 0, x: (_i: number, t: Element) => ((t as HTMLElement).dataset.side === '-1' ? 14 : -14) }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.07, ease: 'power2.out' }, 2.2);
      tl.fromTo(q('.rp-ui'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out' }, 1.0);
      q('.rp-sys').forEach((n, i) => { gsap.to(n, { y: '+=' + (i % 2 ? 5 : -5), duration: 2.6 + i * 0.35, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 3.2 + i * 0.2 }); });
    }, el);
    return () => { gsap.to(el, { opacity: 0, duration: 0.45, onComplete: () => ctx.revert() }); };
  }, [active, W, H, m]);

  const hs = (id: string | null) => ({ onPointerEnter: () => setHot(id), onPointerLeave: () => setHot(null) });
  const dim = (sid: string) => (hot && hot !== sid ? 0.25 : 1);

  return (
    <div ref={root} className="rp" style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: active ? 'auto' : 'none', zIndex: 8 }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden>
        <defs>
          <radialGradient id="rpg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(235,229,217,0.12)" /><stop offset="100%" stopColor="rgba(235,229,217,0)" /></radialGradient>
          <marker id="rpa" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 Z" fill="#fff" /></marker>
        </defs>
        <circle className="rp-ring" cx={cx} cy={cy} r={R1 * 1.75} fill="url(#rpg)" />
        <circle className="rp-ring" cx={cx} cy={cy} r={R1} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
        <g className="rp-ring"><g className="rot-cw" style={{ transformOrigin: cx + 'px ' + cy + 'px' }}>
          <circle cx={cx} cy={cy} r={R1 * 1.42} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx={cx} cy={cy - R1 * 1.42} r="3.2" fill="#fff" /><circle cx={cx + R1 * 1.42} cy={cy} r="2" fill="#cdae67" />
        </g></g>
        <g className="rp-ring"><g className="rot-ccw" style={{ transformOrigin: cx + 'px ' + cy + 'px' }}>
          <circle cx={cx} cy={cy} r={R1 * 1.85} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="10 12" />
          <circle cx={cx - R1 * 1.85} cy={cy} r="3" fill="#fff" /><circle cx={cx} cy={cy + R1 * 1.85} r="2" fill="#6fb1a7" />
        </g></g>
        {geo.systems.map((s) => (
          <g key={'sp' + s.id}>
            <line className="rp-line" pathLength={1} strokeDasharray="1" strokeDashoffset="1" x1={cx} y1={cy} x2={s.pos.x} y2={s.pos.y} stroke={s.color} strokeWidth="1.4" opacity={0.5 * dim(s.id)} />
            {!m && <path className="rp-line" pathLength={1} strokeDasharray="1" strokeDashoffset="1" d={'M' + (s.pos.x + s.side * (DISC / 2 + 4)) + ',' + s.pos.y + ' L' + s.bx + ',' + s.pos.y + ' M' + s.bx + ',' + (s.y0 - 4) + ' L' + s.bx + ',' + (s.y1 + 4)} fill="none" stroke={s.color} strokeWidth="1.2" opacity={0.7 * dim(s.id)} />}
          </g>
        ))}
        {geo.arcs.map((a) => (
          <g key={a.id}>
            <path className="rp-line" pathLength={1} strokeDasharray="1" strokeDashoffset="1" d={a.d} fill="none" stroke={a.color} strokeWidth="2" opacity="0.9" markerEnd="url(#rpa)" />
            <path className="arc-flow" d={a.d} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
          </g>
        ))}
      </svg>

      {/* núcleo */}
      <div className="rp-core rp-disc" style={{ left: cx, top: cy, width: DISC * 1.6, height: DISC * 1.6, ['--c' as string]: '#ebe5d9' } as React.CSSProperties}>
        <div className="rp-core-txt">NUESTRA<br />RED PROPIA</div>
      </div>

      {/* sistemas */}
      {geo.systems.map((s) => (
        <div key={s.id} className="rp-sys" {...hs(s.id)} style={{ left: s.pos.x, top: s.pos.y, opacity: dim(s.id), transition: 'opacity .3s' }}>
          <div className="rp-disc" style={{ width: DISC, height: DISC, ['--c' as string]: s.color, color: s.ink } as React.CSSProperties}><s.Icon size={DISC * 0.46} strokeWidth={1.7} /></div>
          <div className="rp-lab" style={s.ang === 0 ? { bottom: DISC + 10, top: 'auto' } : { top: DISC + 10 }}><b>{s.title}</b></div>
        </div>
      ))}

      {/* componentes: listas mono junto a cada sistema */}
      {!m && geo.systems.map((s) => s.items.map((it) => (
        <div key={s.id + it.name} className="rp-item" data-side={s.side} style={{ position: 'absolute', top: it.y, transform: 'translateY(-50%)', opacity: dim(s.id) , ...(s.side === 1 ? { left: s.tx } : { right: W - s.tx }), textAlign: s.side === 1 ? 'left' : 'right', transition: 'opacity .3s' }}>
          {s.side === 1 && <i style={{ background: s.color }} />}<span>{it.name}</span>{s.side === -1 && <i style={{ background: s.color }} />}
        </div>
      )))}

      {/* interfaz */}
      <div className="rp-ui rp-in" style={{ position: 'absolute', left: 20, top: 16, opacity: 0, pointerEvents: 'none' }}>
        <div style={{ font: '700 17px var(--sans)' }}>Red propia · Kennedy</div>
        <div className="kicker" style={{ marginTop: 3, fontSize: 9.5, letterSpacing: '0.16em' }}>MODELAMIENTO DINÁMICO · MACROMODELOS TERRITORIALES</div>
      </div>
      <a className="rp-ui rp-in btn-ghost pri" href="../pot-kennedy-mapa.html" style={{ position: 'absolute', right: 20, top: 14, opacity: 0 }}>Explorar red →</a>
      <div className="rp-ui rp-in kicker" style={{ position: 'absolute', left: '50%', bottom: m ? 74 : 66, transform: 'translateX(-50%)', width: m ? '86vw' : 'min(46vw,620px)', textAlign: 'center', opacity: 0, lineHeight: 1.7, pointerEvents: 'none', letterSpacing: '0.14em', fontSize: 10, whiteSpace: 'normal' }}>
        UNA HERRAMIENTA PARA COMPRENDER LAS INTERDEPENDENCIAS ENTRE PERSONAS, INFRAESTRUCTURA Y ECOSISTEMAS
      </div>
      {!m && (
        <div className="rp-ui rp-in" style={{ position: 'absolute', right: 20, bottom: 70, opacity: 0, background: 'rgba(0,0,0,0.85)', border: '1px solid #383838', borderRadius: 12, padding: '10px 14px', pointerEvents: 'none' }}>
          {[['Interdependencia entre sistemas', '#fff', undefined], ['Componente del sistema', '#8e8e8e', '1 5']].map(([t, c, d]) => (
            <div key={t} className="flex items-center gap-2 kicker" style={{ lineHeight: 1.9 }}>
              <svg width="30" height="8"><line x1="0" y1="4" x2="30" y2="4" stroke={c} strokeWidth="2" strokeDasharray={d} strokeLinecap="round" /></svg>{t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
