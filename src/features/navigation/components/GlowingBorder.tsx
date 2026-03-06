import { memo, useCallback, useEffect, useRef } from "react";

// ─── Точная копия GlowingEffect.tsx, адаптированная для sidebar/toc ───────────
// Единственное отличие: isDark prop вместо variant/isNegative,
// и disabled=false по умолчанию

interface GlowingBorderProps {
  spread?: number;
  movementDuration?: number;
  borderWidth?: number;
  inactiveZone?: number;
  proximity?: number;
  isDark?: boolean;
}

const easeOutQuint = (x: number): number => {
  return 1 - Math.pow(1 - x, 5);
};

export const GlowingBorder = memo(({
  spread = 20,
  movementDuration = 2,
  borderWidth = 1,
  inactiveZone = 0.7,
  proximity = 0,
  isDark = true,
}: GlowingBorderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const animateAngleTransition = useCallback((
    element: HTMLDivElement,
    startValue: number,
    endValue: number,
    duration: number
  ) => {
    const startTime = performance.now();
    const animateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);
      const value = startValue + (endValue - startValue) * easedProgress;
      element.style.setProperty("--start", String(value));
      if (progress < 1) requestAnimationFrame(animateValue);
    };
    requestAnimationFrame(animateValue);
  }, []);

  const handleMove = useCallback(
    (e?: MouseEvent | { x: number; y: number }) => {
      if (!containerRef.current) return;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      animationFrameRef.current = requestAnimationFrame(() => {
        const element = containerRef.current;
        if (!element) return;

        const { left, top, width, height } = element.getBoundingClientRect();
        const mouseX = e?.x ?? lastPosition.current.x;
        const mouseY = e?.y ?? lastPosition.current.y;
        if (e) lastPosition.current = { x: mouseX, y: mouseY };

        const center = [left + width * 0.5, top + height * 0.5];
        const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
        const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

        if (distanceFromCenter < inactiveRadius) {
          element.style.setProperty("--active", "0");
          return;
        }

        const isActive =
          mouseX > left - proximity &&
          mouseX < left + width + proximity &&
          mouseY > top - proximity &&
          mouseY < top + height + proximity;

        element.style.setProperty("--active", isActive ? "1" : "0");
        if (!isActive) return;

        const currentAngle = Number.parseFloat(element.style.getPropertyValue("--start")) || 0;
        const targetAngle = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
        const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
        const newAngle = currentAngle + angleDiff;
        animateAngleTransition(element, currentAngle, newAngle, movementDuration * 1000);
      });
    },
    [inactiveZone, proximity, movementDuration, animateAngleTransition]
  );

  useEffect(() => {
    const handleScroll = () => handleMove();
    const handlePointerMove = (e: PointerEvent) => handleMove(e);
    globalThis.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      globalThis.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handleMove]);

  // Точно как в оригинале GlowingEffect.tsx:
  // isNegative=true → #ffffff (для тёмного фона)
  // default → #000000 (для светлого фона)
  const gradient = isDark
    ? `repeating-conic-gradient(from 236.84deg at 50% 50%, #ffffff, #ffffff calc(25% / 5))`
    : `repeating-conic-gradient(from 236.84deg at 50% 50%, #000000, #000000 calc(25% / 5))`;

  return (
    <>
      {/* Первый div из оригинала — статичная базовая граница */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: "-1px",
          borderRadius: "inherit",
          border: `${borderWidth}px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
          zIndex: 1,
        }}
      />

      {/* Второй div из оригинала — динамический контейнер */}
      <div
        ref={containerRef}
        style={{
          "--spread": spread,
          "--start": "0",
          "--active": "0",
          "--glowingeffect-border-width": `${borderWidth}px`,
          "--repeating-conic-gradient-times": "5",
          "--gradient": gradient,
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          zIndex: 1,
        } as React.CSSProperties}
      >
        {/*
          Внутренний div с ::after — точная копия из GlowingEffect.tsx:
          after:content-[""]
          after:rounded-[inherit]
          after:absolute
          after:inset-[calc(-1*var(--glowingeffect-border-width))]
          after:[border:var(--glowingeffect-border-width)_solid_transparent]
          after:[background:var(--gradient)]
          after:[background-attachment:fixed]
          after:opacity-[var(--active)]
          after:transition-opacity after:duration-300
          after:[mask-clip:padding-box,border-box]
          after:[mask-composite:intersect]
          after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(...)]
        */}
        <div
          style={{
            borderRadius: "inherit",
            position: "absolute",
            inset: 0,
          }}
          className="glowing-border-glow"
        />
      </div>

      <style>{`
        .glowing-border-glow {
          border-radius: inherit;
        }
        .glowing-border-glow::after {
          content: "";
          border-radius: inherit;
          position: absolute;
          inset: calc(-1 * var(--glowingeffect-border-width));
          border: var(--glowingeffect-border-width) solid transparent;
          background: var(--gradient);
          background-attachment: fixed;
          opacity: var(--active);
          transition: opacity 300ms;
          -webkit-mask-clip: padding-box, border-box;
          mask-clip: padding-box, border-box;
          -webkit-mask-composite: source-in;
          mask-composite: intersect;
          -webkit-mask-image:
            linear-gradient(#0000, #0000),
            conic-gradient(
              from calc((var(--start) - var(--spread)) * 1deg),
              #00000000 0deg,
              #fff,
              #00000000 calc(var(--spread) * 2deg)
            );
          mask-image:
            linear-gradient(#0000, #0000),
            conic-gradient(
              from calc((var(--start) - var(--spread)) * 1deg),
              #00000000 0deg,
              #fff,
              #00000000 calc(var(--spread) * 2deg)
            );
        }
      `}</style>
    </>
  );
});

GlowingBorder.displayName = "GlowingBorder";