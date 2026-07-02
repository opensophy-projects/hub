const n=`import React, { useEffect, useRef } from 'react';

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  letterSpacing?: number;
  className?: string;
}

// Разделяемое изменяемое состояние анимации
interface AnimState {
  isCancelled: boolean;
  isHovering: boolean;
  isClicking: boolean;
  isGlitching: boolean;
  currentIntensity: number;
  lastFrameTime: number;
  animationFrameId: number;
  glitchTimeoutId: ReturnType<typeof setTimeout> | undefined;
  glitchEndTimeoutId: ReturnType<typeof setTimeout> | undefined;
  clickTimeoutId: ReturnType<typeof setTimeout> | undefined;
}

// Параметры отрисованного текста для основного канваса
interface TextLayout {
  offscreen: HTMLCanvasElement;
  offscreenWidth: number;
  tightHeight: number;
  xOffset: number;
  textBoundingWidth: number;
}

// Конфигурация шрифта и стиля для offscreen-канваса
interface OffscreenConfig {
  fontWeight: string | number;
  fontSizeStr: string;
  computedFontFamily: string;
  numericFontSize: number;
  letterSpacing: number;
  gradient: string[] | null;
  color: string;
}

// Конфигурация зоны взаимодействия для обработчиков событий
interface InteractiveZone {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Вычисляет числовой размер шрифта из CSS-значения
function resolveNumericFontSize(fontSize: number | string): number {
  if (typeof fontSize === 'number') return fontSize;
  const temp = document.createElement('span');
  temp.style.fontSize = fontSize;
  document.body.appendChild(temp);
  const size = Number.parseFloat(globalThis.getComputedStyle(temp).fontSize);
  temp.remove();
  return size;
}

// Вычисляет суммарную ширину текста с учётом letterSpacing
function measureTotalWidth(
  offCtx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
): number {
  if (letterSpacing === 0) return offCtx.measureText(text).width;
  let total = 0;
  for (const char of text) {
    total += offCtx.measureText(char).width + letterSpacing;
  }
  return total - letterSpacing;
}

// Рисует текст посимвольно с межбуквенным интервалом
function drawTextWithSpacing(
  offCtx: CanvasRenderingContext2D,
  text: string,
  xOffset: number,
  ascent: number,
  letterSpacing: number
): void {
  let xPos = xOffset;
  for (const char of text) {
    offCtx.fillText(char, xPos, ascent);
    xPos += offCtx.measureText(char).width + letterSpacing;
  }
}

// Подготавливает offscreen-канвас с отрисованным текстом
function buildOffscreenCanvas(text: string, cfg: OffscreenConfig): TextLayout | null {
  const { fontWeight, fontSizeStr, computedFontFamily, numericFontSize, letterSpacing, gradient, color } = cfg;
  const offscreen = document.createElement('canvas');
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return null;

  const font = \`\${fontWeight} \${fontSizeStr} \${computedFontFamily}\`;
  offCtx.font = font;
  offCtx.textBaseline = 'alphabetic';

  const totalWidth = measureTotalWidth(offCtx, text, letterSpacing);
  const metrics = offCtx.measureText(text);
  const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
  const actualRight =
    letterSpacing === 0
      ? (metrics.actualBoundingBoxRight ?? metrics.width)
      : totalWidth;
  const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
  const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

  const textBoundingWidth = Math.ceil(
    letterSpacing === 0 ? actualLeft + actualRight : totalWidth
  );
  const tightHeight = Math.ceil(actualAscent + actualDescent);
  const extraWidthBuffer = 10;
  const offscreenWidth = textBoundingWidth + extraWidthBuffer;

  offscreen.width = offscreenWidth;
  offscreen.height = tightHeight;

  offCtx.font = font;
  offCtx.textBaseline = 'alphabetic';

  if (gradient && gradient.length >= 2) {
    const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
    gradient.forEach((c, i) => grad.addColorStop(i / (gradient.length - 1), c));
    offCtx.fillStyle = grad;
  } else {
    offCtx.fillStyle = color;
  }

  const xOffset = extraWidthBuffer / 2;
  if (letterSpacing === 0) {
    offCtx.fillText(text, xOffset - actualLeft, actualAscent);
  } else {
    drawTextWithSpacing(offCtx, text, xOffset, actualAscent, letterSpacing);
  }

  return { offscreen, offscreenWidth, tightHeight, xOffset, textBoundingWidth };
}

// Регистрирует обработчики событий взаимодействия
function attachEventListeners(
  canvas: HTMLCanvasElement,
  st: AnimState,
  zone: InteractiveZone,
  enableHover: boolean,
  clickEffect: boolean
): () => void {
  const isInside = (x: number, y: number) =>
    x >= zone.left && x <= zone.right &&
    y >= zone.top && y <= zone.bottom;

  const handleMouseMove = (e: MouseEvent) => {
    if (!enableHover) return;
    const rect = canvas.getBoundingClientRect();
    st.isHovering = isInside(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseLeave = () => { st.isHovering = false; };

  const handleClick = () => {
    if (!clickEffect) return;
    st.isClicking = true;
    clearTimeout(st.clickTimeoutId);
    st.clickTimeoutId = setTimeout(() => { st.isClicking = false; }, 150);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enableHover) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    st.isHovering = isInside(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchEnd = () => { st.isHovering = false; };

  if (enableHover) {
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
  }
  if (clickEffect) canvas.addEventListener('click', handleClick);

  return () => {
    if (enableHover) {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    }
    if (clickEffect) canvas.removeEventListener('click', handleClick);
  };
}

// Вычисляет целевую интенсивность на основе состояния
function resolveTargetIntensity(
  st: AnimState,
  hoverIntensity: number,
  baseIntensity: number
): number {
  if (st.isClicking || st.isGlitching) return 1;
  if (st.isHovering) return hoverIntensity;
  return baseIntensity;
}

// Плавно сближает текущую интенсивность с целевой
function stepIntensity(
  current: number,
  target: number,
  transitionDuration: number,
  frameDuration: number
): number {
  if (transitionDuration <= 0) return target;
  const step = 1 / (transitionDuration / frameDuration);
  if (current < target) return Math.min(current + step, target);
  if (current > target) return Math.max(current - step, target);
  return current;
}

// Запускает цикл глитча через общий объект состояния
function startGlitchLoop(
  st: AnimState,
  glitchInterval: number,
  glitchDuration: number
): void {
  if (st.isCancelled) return;
  st.glitchTimeoutId = setTimeout(() => {
    if (st.isCancelled) return;
    st.isGlitching = true;
    st.glitchEndTimeoutId = setTimeout(() => {
      st.isGlitching = false;
      startGlitchLoop(st, glitchInterval, glitchDuration);
    }, glitchDuration);
  }, glitchInterval);
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = 'clamp(2rem, 8vw, 8rem)',
  fontWeight = 900,
  fontFamily = 'inherit',
  color = '#fff',
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = 'horizontal',
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  letterSpacing = 0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement & { cleanupFuzzyText?: () => void }>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const st: AnimState = {
      isCancelled: false,
      isHovering: false,
      isClicking: false,
      isGlitching: false,
      currentIntensity: baseIntensity,
      lastFrameTime: 0,
      animationFrameId: 0,
      glitchTimeoutId: undefined,
      glitchEndTimeoutId: undefined,
      clickTimeoutId: undefined,
    };

    const init = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === 'inherit'
          ? globalThis.getComputedStyle(canvas).fontFamily || 'sans-serif'
          : fontFamily;

      const fontSizeStr = typeof fontSize === 'number' ? \`\${fontSize}px\` : fontSize;
      const fontString = \`\${fontWeight} \${fontSizeStr} \${computedFontFamily}\`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (st.isCancelled) return;

      const text = React.Children.toArray(children).join('');
      const layout = buildOffscreenCanvas(text, {
        fontWeight, fontSizeStr, computedFontFamily,
        numericFontSize: resolveNumericFontSize(fontSize),
        letterSpacing, gradient, color,
      });
      if (!layout) return;

      const { offscreen, offscreenWidth, tightHeight, xOffset, textBoundingWidth } = layout;
      const horizontalMargin = fuzzRange + 20;
      const verticalMargin = direction === 'vertical' || direction === 'both' ? fuzzRange + 10 : 0;

      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const frameDuration = 1000 / fps;
      if (glitchMode) startGlitchLoop(st, glitchInterval, glitchDuration);

      const run = (timestamp: number) => {
        if (st.isCancelled) return;
        if (timestamp - st.lastFrameTime < frameDuration) {
          st.animationFrameId = globalThis.requestAnimationFrame(run);
          return;
        }
        st.lastFrameTime = timestamp;

        ctx.clearRect(
          -fuzzRange - 20, -fuzzRange - 10,
          offscreenWidth + 2 * (fuzzRange + 20),
          tightHeight + 2 * (fuzzRange + 10)
        );

        const targetIntensity = resolveTargetIntensity(st, hoverIntensity, baseIntensity);
        st.currentIntensity = stepIntensity(
          st.currentIntensity, targetIntensity, transitionDuration, frameDuration
        );

        for (let j = 0; j < tightHeight; j++) {
          let dx = 0, dy = 0;
          if (direction === 'horizontal' || direction === 'both') {
            // NOSONAR: Math.random() используется для визуального шума — криптографическая стойкость не требуется
            dx = Math.floor(st.currentIntensity * (Math.random() - 0.5) * fuzzRange);
          }
          if (direction === 'vertical' || direction === 'both') {
            // NOSONAR: аналогично — визуальный эффект смещения строк
            dy = Math.floor(st.currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5);
          }
          ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j + dy, offscreenWidth, 1);
        }
        st.animationFrameId = globalThis.requestAnimationFrame(run);
      };

      st.animationFrameId = globalThis.requestAnimationFrame(run);

      const removeListeners = attachEventListeners(
        canvas, st,
        {
          left: horizontalMargin + xOffset,
          right: horizontalMargin + xOffset + textBoundingWidth,
          top: verticalMargin,
          bottom: verticalMargin + tightHeight,
        },
        enableHover,
        clickEffect
      );

      canvas.cleanupFuzzyText = () => {
        globalThis.cancelAnimationFrame(st.animationFrameId);
        clearTimeout(st.glitchTimeoutId);
        clearTimeout(st.glitchEndTimeoutId);
        clearTimeout(st.clickTimeoutId);
        removeListeners();
      };
    };

    init();

    return () => {
      st.isCancelled = true;
      canvas?.cleanupFuzzyText?.();
    };
  }, [
    children, fontSize, fontWeight, fontFamily, color, enableHover,
    baseIntensity, hoverIntensity, fuzzRange, fps, direction,
    transitionDuration, clickEffect, glitchMode, glitchInterval,
    glitchDuration, gradient, letterSpacing,
  ]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FuzzyText;`;export{n as default};
