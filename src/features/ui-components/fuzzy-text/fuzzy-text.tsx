import React, { useEffect, useRef } from 'react';

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

// Вычисляет целевую интенсивность на основе состояния
function resolveTargetIntensity(
  isClicking: boolean,
  isGlitching: boolean,
  isHovering: boolean,
  hoverIntensity: number,
  baseIntensity: number
): number {
  if (isClicking || isGlitching) return 1;
  if (isHovering) return hoverIntensity;
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
    let animationFrameId: number;
    let isCancelled = false;
    let glitchTimeoutId: ReturnType<typeof setTimeout>;
    let glitchEndTimeoutId: ReturnType<typeof setTimeout>;
    let clickTimeoutId: ReturnType<typeof setTimeout>;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === 'inherit'
          ? globalThis.getComputedStyle(canvas).fontFamily || 'sans-serif'
          : fontFamily;

      const fontSizeStr = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      const numericFontSize = resolveNumericFontSize(fontSize);
      const text = React.Children.toArray(children).join('');

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
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

      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = 'alphabetic';

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((c, i) => grad.addColorStop(i / (gradient.length - 1), c));
        offCtx.fillStyle = grad;
      } else {
        offCtx.fillStyle = color;
      }

      if (letterSpacing === 0) {
        offCtx.fillText(text, xOffset - actualLeft, actualAscent);
      } else {
        drawTextWithSpacing(offCtx, text, xOffset, actualAscent, letterSpacing);
      }

      const horizontalMargin = fuzzRange + 20;
      const verticalMargin =
        direction === 'vertical' || direction === 'both' ? fuzzRange + 10 : 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      let isClicking = false;
      let isGlitching = false;
      let currentIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };

      if (glitchMode) startGlitchLoop();

      const run = (timestamp: number) => {
        if (isCancelled) return;

        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = globalThis.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;

        ctx.clearRect(
          -fuzzRange - 20,
          -fuzzRange - 10,
          offscreenWidth + 2 * (fuzzRange + 20),
          tightHeight + 2 * (fuzzRange + 10)
        );

        const targetIntensity = resolveTargetIntensity(
          isClicking, isGlitching, isHovering, hoverIntensity, baseIntensity
        );
        currentIntensity = stepIntensity(
          currentIntensity, targetIntensity, transitionDuration, frameDuration
        );

        for (let j = 0; j < tightHeight; j++) {
          let dx = 0,
            dy = 0;
          if (direction === 'horizontal' || direction === 'both') {
            dx = Math.floor(currentIntensity * (Math.random() - 0.5) * fuzzRange);
          }
          if (direction === 'vertical' || direction === 'both') {
            dy = Math.floor(
              currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5
            );
          }
          ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j + dy, offscreenWidth, 1);
        }
        animationFrameId = globalThis.requestAnimationFrame(run);
      };

      animationFrameId = globalThis.requestAnimationFrame(run);

      const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft &&
        x <= interactiveRight &&
        y >= interactiveTop &&
        y <= interactiveBottom;

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = setTimeout(() => {
          isClicking = false;
        }, 150);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
      }

      if (clickEffect) {
        canvas.addEventListener('click', handleClick);
      }

      const cleanup = () => {
        globalThis.cancelAnimationFrame(animationFrameId);
        clearTimeout(glitchTimeoutId);
        clearTimeout(glitchEndTimeoutId);
        clearTimeout(clickTimeoutId);
        if (enableHover) {
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mouseleave', handleMouseLeave);
          canvas.removeEventListener('touchmove', handleTouchMove);
          canvas.removeEventListener('touchend', handleTouchEnd);
        }
        if (clickEffect) {
          canvas.removeEventListener('click', handleClick);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    init();

    return () => {
      isCancelled = true;
      globalThis.cancelAnimationFrame(animationFrameId);
      clearTimeout(glitchTimeoutId);
      clearTimeout(glitchEndTimeoutId);
      clearTimeout(clickTimeoutId);
      canvas?.cleanupFuzzyText?.();
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    fps,
    direction,
    transitionDuration,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
    gradient,
    letterSpacing,
  ]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FuzzyText;