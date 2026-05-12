import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { SingularityShaders } from './SingularityShaders';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';

// ─── ShinyText ────────────────────────────────────────────────────────────────

interface ShinyTextProps {
  text: string;
  speed?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 4,
  color = 'rgba(255,255,255,0.55)',
  shineColor = 'rgba(255,255,255,0.95)',
  spread = 110,
}) => {
  const progress   = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastRef    = useRef<number | null>(null);

  useAnimationFrame(time => {
    if (lastRef.current === null) { lastRef.current = time; return; }
    elapsedRef.current += time - lastRef.current;
    lastRef.current = time;
    const p = (elapsedRef.current % (speed * 1000)) / (speed * 1000) * 100;
    progress.set(p);
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  return (
    <motion.span
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
        display: 'inline',
      }}
    >
      {text}
    </motion.span>
  );
};

// ─── GlowingEffect (встроенный, для карточек без tailwind) ───────────────────

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

interface GlowingEffectInlineProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
  isNegative?: boolean;
}

const GlowingEffectInline = memo(({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 0,
  spread = 20,
  movementDuration = 2,
  borderWidth = 1,
  disabled = true,
  isNegative = false,
}: GlowingEffectInlineProps) => {
  const containerRef      = useRef<HTMLDivElement>(null);
  const lastPosition      = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const animateAngleTransition = useCallback((
    element: HTMLDivElement,
    startValue: number,
    endValue: number,
    duration: number,
  ) => {
    const startTime = performance.now();
    const animateValue = (currentTime: number) => {
      const elapsed  = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value    = startValue + (endValue - startValue) * easeOutQuint(progress);
      element.style.setProperty('--start', String(value));
      if (progress < 1) requestAnimationFrame(animateValue);
    };
    requestAnimationFrame(animateValue);
  }, []);

  const handleMove = useCallback((e?: MouseEvent | { x: number; y: number }) => {
    if (!containerRef.current) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const element = containerRef.current;
      if (!element) return;
      const { left, top, width, height } = element.getBoundingClientRect();
      const mouseX = e?.x ?? lastPosition.current.x;
      const mouseY = e?.y ?? lastPosition.current.y;
      if (e) lastPosition.current = { x: mouseX, y: mouseY };
      const center             = [left + width * 0.5, top + height * 0.5];
      const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
      const inactiveRadius     = 0.5 * Math.min(width, height) * inactiveZone;
      if (distanceFromCenter < inactiveRadius) { element.style.setProperty('--active', '0'); return; }
      const isActive =
        mouseX > left - proximity && mouseX < left + width  + proximity &&
        mouseY > top  - proximity && mouseY < top  + height + proximity;
      element.style.setProperty('--active', isActive ? '1' : '0');
      if (!isActive) return;
      const currentAngle = Number.parseFloat(element.style.getPropertyValue('--start')) || 0;
      const targetAngle  = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
      const angleDiff    = ((targetAngle - currentAngle + 180) % 360) - 180;
      animateAngleTransition(element, currentAngle, currentAngle + angleDiff, movementDuration * 1000);
    });
  }, [inactiveZone, proximity, movementDuration, animateAngleTransition]);

  useEffect(() => {
    if (disabled) return;
    const handleScroll      = () => handleMove();
    const handlePointerMove = (e: PointerEvent) => handleMove(e);
    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      globalThis.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handleMove, disabled]);

  const gradient = isNegative
    ? `repeating-conic-gradient(from 236.84deg at 50% 50%, #ffffff, #ffffff calc(25% / var(--repeating-conic-gradient-times)))`
    : `repeating-conic-gradient(from 236.84deg at 50% 50%, #000000, #000000 calc(25% / var(--repeating-conic-gradient-times)))`;

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      style={{
        '--blur':                           `${blur}px`,
        '--spread':                         spread,
        '--start':                          '0',
        '--active':                         '0',
        '--glowingeffect-border-width':     `${borderWidth}px`,
        '--repeating-conic-gradient-times': '5',
        '--gradient':                       gradient,
        position:                           'absolute',
        inset:                              0,
        borderRadius:                       'inherit',
        pointerEvents:                      'none',
      } as React.CSSProperties}
    >
      <div style={{
        position:            'absolute',
        inset:               `calc(-1 * var(--glowingeffect-border-width))`,
        borderRadius:        'inherit',
        border:              `var(--glowingeffect-border-width) solid transparent`,
        background:          gradient,
        backgroundAttachment:'fixed',
        opacity:             'var(--active)',
        transition:          'opacity 300ms',
        WebkitMaskImage:     'linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))',
        maskImage:           'linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))',
        WebkitMaskClip:      'padding-box, border-box',
        maskClip:            'padding-box, border-box',
        WebkitMaskComposite: 'intersect',
        maskComposite:       'intersect',
      } as React.CSSProperties} />
    </div>
  );
});
GlowingEffectInline.displayName = 'GlowingEffectInline';

// ─── Card primitives ───────────────────────────────────────────────────────────

type LandingCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  isNegative: boolean;
};

type LandingCardHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

type LandingCardTitleProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode;
  as?: React.ElementType;
};

type LandingCardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement> & {
  children: React.ReactNode;
};

type LandingCardContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const LandingCard = React.forwardRef<HTMLDivElement, LandingCardProps>(({
  children,
  isNegative,
  style,
  ...props
}, ref) => {
  const border = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const bg     = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  return (
    <div
      ref={ref}
      style={{
        position:     'relative',
        border:       `1px solid ${border}`,
        background:   bg,
        borderRadius: 16,
        overflow:     'hidden',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
LandingCard.displayName = 'LandingCard';

const LandingCardHeader: React.FC<LandingCardHeaderProps> = ({ children, style, ...props }) => (
  <div
    style={{
      padding:  '1.5rem 1.5rem 0',
      position: 'relative',
      zIndex:   1,
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const LandingCardTitle: React.FC<LandingCardTitleProps> = ({
  children,
  as: Component = 'h3',
  style,
  ...props
}) => React.createElement(
  Component,
  {
    style: {
      fontSize:   'clamp(1.1rem, 1.8vw, 1.4rem)',
      fontWeight: 700,
      lineHeight: 1.25,
      margin:     0,
      fontFamily: 'Inter, system-ui, sans-serif',
      ...style,
    },
    ...props,
  },
  children,
);

const LandingCardDescription: React.FC<LandingCardDescriptionProps> = ({ children, style, ...props }) => (
  <p
    style={{
      margin:     '0.75rem 0 0',
      fontSize:   'clamp(0.95rem, 1.4vw, 1.1rem)',
      lineHeight: 1.65,
      textWrap:   'balance',
      ...style,
    }}
    {...props}
  >
    {children}
  </p>
);

const LandingCardContent: React.FC<LandingCardContentProps> = ({ children, style, ...props }) => (
  <div
    style={{
      padding:    '1rem 1.5rem 1.5rem',
      position:   'relative',
      zIndex:     1,
      fontFamily: 'Inter, system-ui, sans-serif',
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

// ─── FeatureCard (SecuritySection) ───────────────────────────────────────────

interface FeatureCardProps {
  title: string;
  text: string;
  isNegative: boolean;
  fullWidth?: boolean;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, text, isNegative, fullWidth, badge }) => {
  const titleC = isNegative ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.88)';
  const textC  = isNegative ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
  const badgeC = isNegative ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';
  const badgeBg = isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <LandingCard
      isNegative={isNegative}
      style={{
        display:       'flex',
        flexDirection: 'column',
        minHeight:     176,
        gridColumn:    fullWidth ? '1 / -1' : undefined,
      }}
    >
      <LandingCardHeader>
        {badge && (
          <div style={{
            display:       'inline-flex',
            alignSelf:     'flex-start',
            fontSize:      '0.66rem',
            fontWeight:    700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         badgeC,
            background:    badgeBg,
            borderRadius:  999,
            padding:       '0.18rem 0.55rem',
            marginBottom:  '0.75rem',
            fontFamily:    'ui-monospace, monospace',
          }}>
            {badge}
          </div>
        )}
        <LandingCardTitle style={{ color: titleC }}>{title}</LandingCardTitle>
      </LandingCardHeader>
      <LandingCardContent style={{ flex: 1 }}>
        <LandingCardDescription style={{ color: textC }}>{text}</LandingCardDescription>
      </LandingCardContent>
    </LandingCard>
  );
};

// ─── TrailsInFormsScene ────────────────────────────────────────────────────────

type TrailsShape = 'Sphere';

interface TrailsInFormsParams {
  shape: TrailsShape;
  backgroundColor: string;
  lineColor: string;
  dotColor: string;
  useFog: boolean;
  fogDensity: number;
  speed: number;
  dotLength: number;
  dotDensity: number;
  onlyExternal: boolean;
}

const TRAILS_PARAMS: TrailsInFormsParams = {
  shape: 'Sphere',
  backgroundColor: '#141414',
  lineColor: '#5c5c5c',
  dotColor: '#ffffff',
  useFog: true,
  fogDensity: 0.0122,
  speed: 0.285,
  dotLength: 0.09359,
  dotDensity: 8.397,
  onlyExternal: false,
};

const TRAILS_VERTEX_SHADER = `
  attribute float lineDistance;
  varying float vDistance;

  void main() {
    vDistance = lineDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TRAILS_FRAGMENT_SHADER = `
  uniform vec3 colorLine;
  uniform vec3 colorDot;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDotLength;
  uniform float uDotRepeat;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform bool uUseFog;

  varying float vDistance;

  void main() {
    float alpha = 0.2;
    float distanceState = vDistance - uTime * uSpeed * 10.0;
    float flow = mod(distanceState, uDotRepeat * 10.0);
    float lengthVal = (uDotRepeat * 10.0) * uDotLength;
    float signal = smoothstep((uDotRepeat * 10.0) - lengthVal, (uDotRepeat * 10.0), flow);

    if (flow < (uDotRepeat * 10.0) - lengthVal) {
      signal = 0.0;
    }

    vec3 finalColor = mix(colorLine, colorDot, signal);
    float finalAlpha = max(alpha, signal);
    gl_FragColor = vec4(finalColor, finalAlpha);

    if (uUseFog) {
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = exp2(-uFogDensity * uFogDensity * depth * depth * 1.442695);
      fogFactor = clamp(fogFactor, 0.0, 1.0);
      gl_FragColor.rgb = mix(uFogColor, gl_FragColor.rgb, fogFactor);
    }
  }
`;

const isTrailsPointInside = (v: THREE.Vector3, shapeType: TrailsShape) => {
  const r = 12;

  switch (shapeType) {
    case 'Sphere':
      return (v.x * v.x + v.y * v.y + v.z * v.z) < (r * r);
    default:
      return false;
  }
};

const isTrailsSurface = (v: THREE.Vector3, shapeType: TrailsShape, step: number) => {
  if (!isTrailsPointInside(v, shapeType)) return false;

  const dirs = [
    new THREE.Vector3(step, 0, 0), new THREE.Vector3(-step, 0, 0),
    new THREE.Vector3(0, step, 0), new THREE.Vector3(0, -step, 0),
    new THREE.Vector3(0, 0, step), new THREE.Vector3(0, 0, -step),
  ];

  return dirs.some(dir => !isTrailsPointInside(v.clone().add(dir), shapeType));
};

const createTrailsGeometry = (shapeType: TrailsShape, onlyExternal: boolean) => {
  const positions: number[] = [];
  const attributes: number[] = [];
  const step = 2;
  const maxSegments = 6000;
  const dirs = [
    new THREE.Vector3(step, 0, 0), new THREE.Vector3(-step, 0, 0),
    new THREE.Vector3(0, step, 0), new THREE.Vector3(0, -step, 0),
    new THREE.Vector3(0, 0, step), new THREE.Vector3(0, 0, -step),
  ];

  const findStartPoint = () => {
    const point = new THREE.Vector3();

    for (let k = 0; k < 200; k++) {
      point.set(
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 26,
      );
      point.x = Math.round(point.x / step) * step;
      point.y = Math.round(point.y / step) * step;
      point.z = Math.round(point.z / step) * step;

      if (onlyExternal ? isTrailsSurface(point, shapeType, step) : isTrailsPointInside(point, shapeType)) {
        return point.clone();
      }
    }

    return new THREE.Vector3(0, 0, 0);
  };

  let currentPos = findStartPoint();
  let currentDist = 0;

  for (let i = 0; i < maxSegments; i++) {
    const direction = dirs[Math.floor(Math.random() * dirs.length)];
    const nextPos = currentPos.clone().add(direction);
    const isValid = onlyExternal
      ? isTrailsSurface(nextPos, shapeType, step)
      : isTrailsPointInside(nextPos, shapeType);

    if (isValid) {
      positions.push(currentPos.x, currentPos.y, currentPos.z, nextPos.x, nextPos.y, nextPos.z);
      attributes.push(currentDist, currentDist + step);
      currentDist += step;
      currentPos.copy(nextPos);
    } else {
      currentDist += 50;
      currentPos = findStartPoint();
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('lineDistance', new THREE.Float32BufferAttribute(attributes, 1));
  return geometry;
};

const TrailsInFormsScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(TRAILS_PARAMS.backgroundColor, TRAILS_PARAMS.fogDensity);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, -1, 24);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'block h-full w-full';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const material = new THREE.ShaderMaterial({
      vertexShader: TRAILS_VERTEX_SHADER,
      fragmentShader: TRAILS_FRAGMENT_SHADER,
      uniforms: {
        colorLine: { value: new THREE.Color(TRAILS_PARAMS.lineColor) },
        colorDot: { value: new THREE.Color(TRAILS_PARAMS.dotColor) },
        uTime: { value: 0 },
        uSpeed: { value: TRAILS_PARAMS.speed },
        uDotLength: { value: TRAILS_PARAMS.dotLength },
        uDotRepeat: { value: TRAILS_PARAMS.dotDensity },
        uFogColor: { value: new THREE.Color(TRAILS_PARAMS.backgroundColor) },
        uFogDensity: { value: TRAILS_PARAMS.fogDensity },
        uUseFog: { value: TRAILS_PARAMS.useFog },
      },
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const geometry = createTrailsGeometry(TRAILS_PARAMS.shape, TRAILS_PARAMS.onlyExternal);
    const mesh = new THREE.LineSegments(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const nextWidth = Math.max(1, width);
      const nextHeight = Math.max(1, height);

      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const clock = new THREE.Clock();
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      material.uniforms.uTime.value = clock.getElapsedTime();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="trails-scene relative h-full w-full overflow-visible"
      aria-label="Анимированная сфера Trails in Forms"
    />
  );
};

// ─── SecuritySection ──────────────────────────────────────────────────────────

interface SecuritySectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const textMut   = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <section
      style={{
        background: bg,
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        width:      '100%',
        boxSizing:  'border-box',
        overflow:   'hidden',
      }}
    >
      <style>{`
        .sec-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: clamp(2rem, 4vw, 4rem);
          padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem) 0;
          box-sizing: border-box;
        }
        .sec-chart-col {
          min-width: 0;
          height: clamp(260px, 34vw, 460px);
          overflow: visible;
        }
        .trails-scene {
          transform: scale(1.24);
          transform-origin: center;
        }
        .sec-text-col  { min-width: 0; }
        @media (max-width: 800px) {
          .sec-top { grid-template-columns: 1fr; }
          .sec-chart-col { order: 2; height: clamp(200px, 48vw, 300px); }
          .trails-scene { transform: scale(1.08); }
          .sec-text-col  { order: 1; }
        }
        .sec-cards-area {
          padding: clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem);
          box-sizing: border-box;
        }
        .sec-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 560px) { .sec-cards { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="sec-top">
        <div className="sec-chart-col">
          <TrailsInFormsScene />
        </div>
        <div className="sec-text-col">
          <p style={{ fontSize: '1rem', fontWeight: 600, color: textMut, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 2rem', fontFamily: 'Inter, sans-serif' }}>
            ЧЕМ ЗАНИМАЕТСЯ
          </p>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Помогаем внедрять безопасность, знания и автоматизацию в IT-процессы
          </h2>
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="От понятных материалов до практической интеграции защитных решений — подбираем подход под вашу команду и инфраструктуру."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>
      </div>

      <div className="sec-cards-area">
        <div className="sec-cards">
          <FeatureCard
            isNegative={isNegative}
            title="Знания каждому!"
            badge="открытые знания"
            text="Пишем понятные статьи и гайды по DevSecOps и не только. Рассказываем как настроить безопасность с нуля и сделать её частью культуры команды."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Интеграция анализа безопасности"
            badge="услуга"
            text="Интегрируем автоматический анализ кода на уязвимости на каждом этапе разработки. Проверяем исходный код, тестируем работающее приложение и отслеживаем уязвимости в библиотеках — всё автоматически в CI/CD без участия команды."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Настройка безопасного доступа"
            badge="услуга"
            text="Настраиваем и интегрируем защищённый доступ к сервисам и серверам. Подбираем решение под задачу — mTLS, VPN, Zero Trust или другой подход. Доступ получают только те, кому вы это разрешили."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Проверка защищённости"
            badge="услуга"
            text="Этично проверяем сервис или сервер на наличие уязвимостей: открытые точки входа, слабые конфигурации и всё, что может стать проблемой раньше, чем вы об этом узнаете."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Автоматизация"
            badge="услуга"
            text="Автоматизируем рутину — от простого bash-скрипта до сложных решений под индивидуальные требования."
          />
          <FeatureCard
            isNegative={isNegative}
            title="Подбор стека защиты"
            badge="услуга"
            text="Подбираем стек защиты с одной целью — максимальная эффективность при минимальных затратах ресурсов."
          />
        </div>

        <p className="sec-contact" style={{
          color:      textMut,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize:   'clamp(0.98rem, 1.25vw, 1.08rem)',
          lineHeight: 1.7,
          margin:     '1.5rem 0 0',
        }}>
          Чтобы заказать услугу или обсудить сотрудничество, напишите на{' '}
          <a href="mailto:opensophy@gmail.com" style={{ color: textMain, textDecoration: 'none' }}>
            opensophy@gmail.com
          </a>
          . Все карточки с пометкой «услуга» доступны для заказа; «Знания каждому!» — открытая образовательная инициатива.
        </p>
      </div>
    </section>
  );
};


// ─── SimpleIsometricPillars ───────────────────────────────────────────────────

interface SimpleIsometricPillarsProps {
  isNegative: boolean;
}

const SimpleIsometricPillars: React.FC<SimpleIsometricPillarsProps> = ({ isNegative }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawDiamond = (x: number, y: number, tw: number, th: number, pillarHeight: number) => {
      const hw = tw / 2;
      const hh = th / 2;
      const topY = y - pillarHeight;

      const topGradient = ctx.createLinearGradient(x - hw, topY - hh, x + hw, topY + hh);
      const leftGradient = ctx.createLinearGradient(x - hw, topY, x, y + hh);
      const rightGradient = ctx.createLinearGradient(x + hw, topY, x, y + hh);

      if (isNegative) {
        topGradient.addColorStop(0, 'rgba(255,255,255,0.96)');
        topGradient.addColorStop(1, 'rgba(190,190,198,0.9)');
        leftGradient.addColorStop(0, 'rgba(150,150,158,0.72)');
        leftGradient.addColorStop(1, 'rgba(54,54,60,0.62)');
        rightGradient.addColorStop(0, 'rgba(105,105,112,0.7)');
        rightGradient.addColorStop(1, 'rgba(30,30,35,0.58)');
      } else {
        topGradient.addColorStop(0, 'rgba(0,0,0,0.75)');
        topGradient.addColorStop(1, 'rgba(50,50,50,0.62)');
        leftGradient.addColorStop(0, 'rgba(80,80,80,0.48)');
        leftGradient.addColorStop(1, 'rgba(190,190,190,0.28)');
        rightGradient.addColorStop(0, 'rgba(130,130,130,0.42)');
        rightGradient.addColorStop(1, 'rgba(210,210,210,0.22)');
      }

      ctx.beginPath();
      ctx.moveTo(x - hw, topY);
      ctx.lineTo(x, topY + hh);
      ctx.lineTo(x, y + hh);
      ctx.lineTo(x - hw, y);
      ctx.closePath();
      ctx.fillStyle = leftGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + hw, topY);
      ctx.lineTo(x, topY + hh);
      ctx.lineTo(x, y + hh);
      ctx.lineTo(x + hw, y);
      ctx.closePath();
      ctx.fillStyle = rightGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, topY - hh);
      ctx.lineTo(x + hw, topY);
      ctx.lineTo(x, topY + hh);
      ctx.lineTo(x - hw, topY);
      ctx.closePath();
      ctx.fillStyle = topGradient;
      ctx.fill();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const t = Date.now() / 1000;
      ctx.clearRect(0, 0, width, height);

      const count = 9;
      const tw = Math.min(width / 6.6, 108);
      const th = tw / 2;
      const spacing = tw * 0.44;
      const startX = width / 2 - ((count - 1) * spacing) / 2;
      const baseY = height * 0.74;

      for (let i = 0; i < count; i++) {
        const x = startX + i * spacing;
        const y = baseY;
        const wave = Math.sin(t * 1.15 - i * 0.7) * 0.5 + 0.5;
        const pillarHeight = tw * (0.36 + wave * 1.35);
        drawDiamond(x, y, tw, th, pillarHeight);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [isNegative]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
};

// ─── EcoCard ──────────────────────────────────────────────────────────────────

interface EcoCardProps {
  title:       string;
  description: string;
  link?:       string;
  linkLabel?:  string;
  isNegative:  boolean;
  extraLinks?: Array<{ href: string; label: string }>;
}

const EcoCard: React.FC<EcoCardProps> = ({
  title, description, link, linkLabel, isNegative, extraLinks,
}) => {
  const outerBorder  = isNegative ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const innerBorder  = isNegative ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const innerBg      = isNegative ? '#0a0a0a'                : '#E8E7E3';
  const innerShadow  = isNegative ? '0px 0px 27px 0px rgba(45,45,45,0.3)' : 'none';
  const titleC       = isNegative ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.88)';
  const textC        = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const linkClr      = isNegative ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)';
  const linkHov      = isNegative ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';

  return (
    <div style={{
      position:     'relative',
      borderRadius: '1.25rem',
      border:       `0.75px solid ${outerBorder}`,
      padding:      '0.5rem',
    }}>
      <GlowingEffectInline
        spread={40} glow disabled={false}
        proximity={64} inactiveZone={0.01}
        borderWidth={3} isNegative={isNegative}
      />

      <div style={{
        position:      'relative',
        borderRadius:  '0.9rem',
        border:        `0.75px solid ${innerBorder}`,
        background:    innerBg,
        boxShadow:     innerShadow,
        overflow:      'hidden',
        padding:       '1.5rem',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.6rem',
        minHeight:     '180px',
      }}>
        <div style={{
          fontSize:   'clamp(1rem, 1.5vw, 1.15rem)',
          fontWeight: 700,
          color:      titleC,
          lineHeight: 1.25,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {title}
        </div>

        <div style={{
          fontSize:   'clamp(0.9rem, 1.3vw, 1rem)',
          color:      textC,
          lineHeight: 1.65,
          fontFamily: 'Inter, system-ui, sans-serif',
          flex:       1,
        }}>
          {description}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            4,
              fontSize:       '0.75rem',
              color:          linkClr,
              textDecoration: 'none',
              marginTop:      '0.25rem',
              fontFamily:     'ui-monospace, monospace',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkClr; }}
          >
            {linkLabel} ↗
          </a>
        )}

        {extraLinks && extraLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.25rem' }}>
            {extraLinks.map(el => (
              <a
                key={el.href}
                href={el.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            4,
                  fontSize:       '0.75rem',
                  color:          linkClr,
                  textDecoration: 'none',
                  fontFamily:     'ui-monospace, monospace',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkHov; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = linkClr; }}
              >
                {el.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── EcosystemSection ─────────────────────────────────────────────────────────

interface EcosystemSectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const EcosystemSection: React.FC<EcosystemSectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMut  = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <section style={{
      background: bg,
      marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
      width:      '100%',
      boxSizing:  'border-box',
      overflow:   'hidden',
    }}>
      <style>{`
        .eco-inner {
          padding: clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem);
          box-sizing: border-box;
        }
        .eco-header {
          margin-bottom: clamp(3rem, 5vw, 4.5rem);
        }
        .eco-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(380px, 1fr);
          gap: clamp(1.5rem, 4vw, 4rem);
          align-items: stretch;
          grid-template-areas: 'cards pillars';
        }
        .eco-cards {
          grid-area: cards;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .eco-pillars {
          grid-area: pillars;
          min-height: clamp(430px, 48vw, 660px);
          border-radius: 1.25rem;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .eco-content {
            grid-template-columns: 1fr;
            grid-template-areas:
              'pillars'
              'cards';
          }
          .eco-pillars { min-height: clamp(290px, 64vw, 460px); }
        }
        .eco-rotating-text {
          overflow: visible !important;
        }
        .eco-rotating-text span {
          overflow: visible !important;
        }
        .eco-heading-inline {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          gap: 0.35em;
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .eco-heading-inline {
            flex-direction: column;
            align-items: flex-start;
            white-space: normal;
            gap: 0.1em;
          }
        }
      `}</style>

      <div className="eco-inner">
        <div className="eco-header">
          <p style={{
            fontSize:      '1rem',
            fontWeight:    600,
            color:         textMut,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin:        '0 0 2rem',
            fontFamily:    'Inter, sans-serif',
          }}>
            ЧТО РАЗРАБАТЫВАЕТ
          </p>

          <p style={{
            fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin:     0,
            maxWidth:   '100%',
            fontFamily: 'Inter, sans-serif',
            color:      textMut,
          }}>
            <ShinyText
              text="Развиваем open-source инструменты Opensophy для публикации знаний, сборки интерфейсов и безопасного доступа к инфраструктуре."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        <div className="eco-content">
          {/* Карточки экосистемы */}
          <div className="eco-cards">
            <EcoCard
              isNegative={isNegative}
              title="Opensophy Hub (O.Hub)"
              description="Гибридная open-source платформа для документации и публикации контента. Подходит для технических команд, авторов и всех, кто хочет красиво и структурировано делиться знаниями."
              link="https://github.com/opensophy-projects/hub"
              linkLabel="opensophy-projects/hub"
            />
            <EcoCard
              isNegative={isNegative}
              title="Opensophy mTLS (O.mTLS)"
              description="Инструмент для быстрого создания и управления mTLS-сертификатами. Для тех, кто хочет надёжно закрыть доступ к своим сервисам и серверам без лишней головной боли."
            />
            <EcoCard
              isNegative={isNegative}
              title="Opensophy UI (O.UI)"
              description="Библиотека готовых React-компонентов с живым превью и настройками. Анимации, интерактивные блоки, кастомные элементы и фирменные компоненты Opensophy — для разработчиков и дизайнеров, которые ценят время."
            />
          </div>

          <div className="eco-pillars" aria-label="Анимированная изометрическая линия Opensophy">
            <SimpleIsometricPillars isNegative={isNegative} />
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── LandingContent ───────────────────────────────────────────────────────────

const LandingContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (globalThis.window === undefined) return true;
    return localStorage.getItem('theme') !== 'light';
  });

  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsNegative(e.newValue !== 'light');
    };
    const onCustom = (e: Event) => {
      setIsNegative((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    };
    globalThis.addEventListener('storage', onStorage);
    globalThis.addEventListener('hub:theme-change', onCustom);
    return () => {
      globalThis.removeEventListener('storage', onStorage);
      globalThis.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  useEffect(() => {
    const readOffset = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-left').trim();
      setNavOffset(val ? Number.parseInt(val, 10) : 0);
    };
    readOffset();
    const observer = new MutationObserver(readOffset);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Hero title — адаптивный размер без обрезки ── */
        .hero-title-wrap {
          position: absolute;
          /* Центрируем горизонтально относительно видимой области (за вычетом nav) */
          left: 0;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 clamp(1rem, 4vw, 3rem);
          pointer-events: none;
          /* Смещение вправо на ширину навигационной панели задаётся inline-стилем */
        }

        .hero-title {
          font-family: 'customfont', sans-serif;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          /*
            fluid-размер: минимум 2rem (320px экран),
            максимум 10rem (≥1400px экран).
            vw-коэффициент подобран так, чтобы текст никогда не вылазил за экран.
          */
          font-size: clamp(2rem, 10vw, 10rem);
          color: var(--hero-text-color, currentColor);
        }

        /* На очень маленьких экранах (< 360px) ещё немного уменьшаем */
        @media (max-width: 360px) {
          .hero-title {
            font-size: clamp(1.6rem, 11vw, 3rem);
            letter-spacing: 0.03em;
          }
        }

        /* Планшеты */
        @media (min-width: 361px) and (max-width: 768px) {
          .hero-title {
            font-size: clamp(2.5rem, 10vw, 5.5rem);
            letter-spacing: 0.05em;
          }
        }

        /* Десктоп с навигационной панелью (учитываем смещение) */
        @media (min-width: 1001px) {
          .hero-title {
            font-size: clamp(4rem, 8vw, 10rem);
          }
        }
      `}</style>

      <Navigation />

      {/* Hero */}
      <section style={{
        position:  'relative',
        minHeight: '100svh',
        overflow:  'hidden',
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SingularityShaders
            speed={0.8} intensity={1.1} size={1.05}
            waveStrength={1} colorShift={1} isNegative={isNegative}
            className="h-full w-full"
          />
        </div>

        {/* Нижний градиент — плавный переход к фону */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        {/* Hero title — центрирован, адаптивный */}
        <div
          className="hero-title-wrap"
          style={{
            /* Дополнительное смещение справа чтобы nav не перекрывал
               (только на десктопе, где navOffset > 0) */
            paddingLeft: navOffset > 0 ? `calc(${navOffset}px + clamp(1rem, 4vw, 3rem))` : undefined,
          }}
        >
          <h1
            className="hero-title"
            style={{ color: textMain }}
          >
            Opensophy
          </h1>
        </div>
      </section>

      {/* О проекте */}
      <section style={{
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        padding:    'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
        width:      '100%',
        boxSizing:  'border-box',
      }}>
        <p style={{
          fontSize:      '1rem',
          fontWeight:    600,
          color:         isNegative ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
          marginBottom:  '2rem',
          marginTop:     0,
          fontFamily:    'Inter, sans-serif',
          letterSpacing: '0.14em',
        }}>
          О ПРОЕКТЕ
        </p>
        <p style={{
          fontSize:   'clamp(1.75rem, 3.5vw, 2.6rem)',
          fontWeight: 500,
          lineHeight: 1.55,
          margin:     0,
          maxWidth:   '100%',
          fontFamily: 'Inter, sans-serif',
        }}>
          <ShinyText
            text="Opensophy — инициатива открытой философии в IT. Качественные и доступные знания, услуги, инструменты и решения."
            speed={4}
            color={shinyBase}
            shineColor={shinyGlow}
          />
        </p>
      </section>

      {/* Безопасность */}
      <SecuritySection isNegative={isNegative} navOffset={navOffset} />

      {/* Экосистема */}
      <EcosystemSection isNegative={isNegative} navOffset={navOffset} />
    </div>
  );
};

// ─── GeneralPage ──────────────────────────────────────────────────────────────

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <LandingContent />
  </ThemeProvider>
);

export { ShinyText, GlowingEffectInline, FeatureCard };
export default GeneralPage;
