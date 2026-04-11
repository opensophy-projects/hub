import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatsProps {
  isNegative: boolean;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// ── Wave helpers ──────────────────────────────────────────────────────────────

const generateWaveData = (count: number, seed: number, smoothness: number = 1, spike = false) => {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const wave1 = Math.sin(i * 0.18 * smoothness + seed) * 0.28;
    const wave2 = Math.sin(i * 0.37 * smoothness + seed * 1.7) * 0.16;
    const wave3 = Math.sin(i * 0.6  * smoothness + seed * 0.9) * 0.09;
    const wave4 = Math.sin(i * 1.1  * smoothness + seed * 2.3) * 0.05;
    const trend = progress * 0.22;
    const base  = 0.32 + trend;
    const spikePeak = spike ? Math.exp(-Math.pow((progress - 0.84) / 0.065, 2)) * 0.65 : 0;
    points.push(Math.min(0.97, Math.max(0.04, base + wave1 + wave2 + wave3 + wave4 + spikePeak)));
  }
  return points;
};

const smoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cp1x = pts[i].x   + (pts[i + 1].x - (i > 0 ? pts[i - 1].x : pts[i].x)) / 6;
    const cp1y = pts[i].y   + (pts[i + 1].y - (i > 0 ? pts[i - 1].y : pts[i].y)) / 6;
    const cp2x = pts[i + 1].x - (i + 2 < pts.length ? pts[i + 2].x - pts[i].x : pts[i + 1].x - pts[i].x) / 6;
    const cp2y = pts[i + 1].y - (i + 2 < pts.length ? pts[i + 2].y - pts[i].y : pts[i + 1].y - pts[i].y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
};

// ── Animated counter ──────────────────────────────────────────────────────────

const AnimatedNumber: React.FC<{ target: string; inView: boolean; delay?: number; isNegative: boolean }> = ({
  target, inView, delay = 0, isNegative,
}) => {
  const [display, setDisplay] = useState('0');
  const numericTarget = parseInt(target.replace(/\D/g, ''), 10);
  const suffix        = target.replace(/[\d\s]/g, '');

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 1400;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = Math.round(eased * numericTarget);
      const formatted = value.toLocaleString('ru-RU').replace(',', ' ');
      setDisplay(progress >= 1 ? formatted + suffix : formatted);
      if (progress < 1) requestAnimationFrame(step);
    };
    const timer = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(timer);
  }, [inView, numericTarget, suffix, delay]);

  return (
    <span className={cn('tabular-nums', isNegative ? 'text-white' : 'text-black')}>
      {display}
    </span>
  );
};

// ── Wave chart ────────────────────────────────────────────────────────────────

const WaveChart: React.FC<{ isNegative: boolean; inView: boolean }> = ({ isNegative, inView }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim]           = useState({ width: 800, height: 220 });
  const [animProgress, setAnim] = useState(0);
  const rafRef                  = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        if (r.width > 0) setDim({ width: r.width, height: r.height });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const anim = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2200, 1);
      setAnim(p);
      if (p < 1) rafRef.current = requestAnimationFrame(anim);
    };
    rafRef.current = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  const COUNT  = 80;
  const { width, height } = dim;
  const padY   = 10;
  const chartH = height - padY * 2;

  const mainData = generateWaveData(COUNT, 1.2, 1, true);
  const secData  = generateWaveData(COUNT, 2.8, 0.7).map(v => v * 0.55 + 0.02);

  const toPoints = (data: number[]) =>
    data.map((v, i) => ({ x: (i / (COUNT - 1)) * width, y: padY + (1 - v) * chartH }));

  const mainPts = toPoints(mainData);
  const secPts  = toPoints(secData);
  const mainLine = smoothPath(mainPts);
  const secLine  = smoothPath(secPts);
  const areaPath = (pts: { x: number; y: number }[], line: string) =>
    `${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  const uid = `wave-${isNegative ? 'd' : 'l'}`;

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${uid}-mg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isNegative ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id={`${uid}-sg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isNegative ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-10%" y="-80%" width="120%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={`${uid}-clip`}>
            <rect x="0" y="0" width={width * animProgress} height={height} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${uid}-clip)`} style={{ opacity: 0.7 }}>
          <path d={areaPath(secPts, secLine)} fill={`url(#${uid}-sg)`} />
          <path d={secLine} fill="none" stroke={isNegative ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)'} strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g clipPath={`url(#${uid}-clip)`}>
          <path d={areaPath(mainPts, mainLine)} fill={`url(#${uid}-mg)`} />
          <path d={mainLine} fill="none" stroke={isNegative ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'} strokeWidth="1.8" strokeLinecap="round" filter={`url(#${uid}-glow)`} />
        </g>
      </svg>
    </div>
  );
};

// ── Stats section ─────────────────────────────────────────────────────────────

export const Stats: React.FC<StatsProps> = ({ isNegative }) => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const bg        = isNegative ? 'bg-[#0a0a0a]'   : 'bg-[#E8E7E3]';
  const textMuted  = isNegative ? 'text-white/50'   : 'text-black/40';
  const textSub    = isNegative ? 'text-white/65'   : 'text-black/55';
  const borderColor = isNegative ? 'border-white/10' : 'border-black/10';

  return (
    <section ref={sectionRef} className={`relative overflow-visible py-12 sm:py-16 md:py-20 lg:py-28 ${bg}`}>
      <div className="lg:container lg:mx-auto lg:px-4 xl:px-8">
        <div className="lg:max-w-7xl lg:mx-auto px-4 sm:px-6 md:px-8">

          {/* Заголовок секции */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="mb-12 sm:mb-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <h2
                className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.0] ${isNegative ? 'text-white' : 'text-black'}`}
                style={{ fontFamily: 'customfont, sans-serif' }}
              >
                Наши статьи
              </h2>
              <p className={`text-base sm:text-lg leading-relaxed max-w-sm md:text-right ${textSub}`}>
                IT-материалы для студентов, специалистов и всех, кто хочет разобраться в теме
              </p>
            </div>
          </motion.div>

          {/* Один счётчик — 10к+ просмотров в среднем на статью */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
            className={cn('py-8 mb-12 sm:mb-16 border-y', borderColor)}
          >
            <p className={`text-5xl sm:text-6xl font-bold mb-2 tabular-nums ${isNegative ? 'text-white' : 'text-black'}`}>
              <AnimatedNumber target="10000+" inView={inView} delay={200} isNegative={isNegative} />
            </p>
            <p className={`text-sm sm:text-base ${textMuted}`}>просмотров в среднем на статью</p>
          </motion.div>

          {/* Волновой график */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }}
            className="relative"
          >
            <div className="h-44 sm:h-56 md:h-64 w-full relative">
              {inView && <WaveChart isNegative={isNegative} inView={inView} />}
              <div className="absolute inset-y-0 left-0 w-20 sm:w-28 pointer-events-none"
                style={{ background: `linear-gradient(to right, ${isNegative ? '#0a0a0a' : '#E8E7E3'}, transparent)` }} />
              <div className="absolute inset-y-0 right-0 w-20 sm:w-28 pointer-events-none"
                style={{ background: `linear-gradient(to left, ${isNegative ? '#0a0a0a' : '#E8E7E3'}, transparent)` }} />
            </div>
            <p className={cn('text-center mt-4 text-xs sm:text-sm italic', textMuted)}>
              Охват растёт с каждой новой публикацией
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
};