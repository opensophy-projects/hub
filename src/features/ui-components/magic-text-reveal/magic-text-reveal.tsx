'use client'
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color: string;
  opacity: number;
  originalAlpha: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  floatingOffsetX: number;
  floatingOffsetY: number;
  floatingSpeed: number;
  floatingAngle: number;
  targetOpacity: number;
  sparkleSpeed: number;
}

interface MagicTextRevealProps {
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  spread?: number;
  speed?: number;
  density?: number;
  resetOnMouseLeave?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MagicTextReveal: React.FC<MagicTextRevealProps> = ({
  text = "Magic Text",
  color = "rgba(255, 255, 255, 1)",
  fontSize = 70,
  fontFamily = "Jakarta Sans, sans-serif",
  fontWeight = 600,
  spread = 40,
  speed = 0.5,
  density = 4,
  resetOnMouseLeave = true,
  className = "",
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
    const [isHovered, setIsHovered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  const transformedDensity = 6 - density;
  const globalDpr = useMemo(() => {
    if (typeof window !== "undefined") return window.devicePixelRatio * 1.5 || 1;
    return 1;
  }, []);

  // Measure text dimensions
  const measureText = useCallback((text: string, fontSize: number, fontWeight: number, fontFamily: string) => {
    if (typeof window === "undefined") return { width: 200, height: 60 };
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: 200, height: 60 };
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    
    return {
      width: Math.ceil(metrics.width + fontSize * 0.5), // Add padding
      height: Math.ceil(fontSize * 1.4) // Line height approximation
    };
  }, []);

  // Update text dimensions when text or font properties change
  useEffect(() => {
    const dimensions = measureText(text, fontSize, fontWeight, fontFamily);
    setTextDimensions(dimensions);
  }, [text, fontSize, fontWeight, fontFamily, measureText]);

  // Create particles from text
  const createParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    text: string,
    textX: number,
    textY: number,
    font: string,
    color: string,
    transformedDensity: number
  ): Particle[] => {
    const particles: Particle[] = [];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.imageSmoothingEnabled = true;
    
    // Render text for sampling
    ctx.fillText(text, textX, textY);
    
    // Sample the rendered text
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate sampling rate based on DPR
    const currentDPR = canvas.width / parseInt(canvas.style.width);
    const baseSampleRate = Math.max(2, Math.round(currentDPR));
    const sampleRate = baseSampleRate * transformedDensity;
    
    // Calculate text bounds
    let minX = canvas.width;
    let maxX = 0;
    let minY = canvas.height;
    let maxY = 0;
    
    // First pass: find text bounds
    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Calculate spread area
    const textWidth = maxX - minX;
    const textHeight = maxY - minY;
    const spreadRadius = Math.max(textWidth, textHeight) * 0.1;
    
    // Second pass: create particles with random initial positions
    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];
        if (alpha > 0) {
          const originalAlpha = alpha / 255;
          
          // Calculate random initial position within spread radius
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * spreadRadius;
          const initialX = x + Math.cos(angle) * distance;
          const initialY = y + Math.sin(angle) * distance;
          
          const particle: Particle = {
            x: initialX,
            y: initialY,
            originalX: x,
            originalY: y,
            color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${originalAlpha})`,
            opacity: originalAlpha * 0.3,
            originalAlpha,
            velocityX: 0,
            velocityY: 0,
            angle: Math.random() * Math.PI * 2,
            speed: 0,
            floatingOffsetX: 0,
            floatingOffsetY: 0,
            floatingSpeed: Math.random() * 2 + 1,
            floatingAngle: Math.random() * Math.PI * 2,
            targetOpacity: Math.random() * originalAlpha * 0.5,
            sparkleSpeed: Math.random() * 2 + 1
          };
          particles.push(particle);
        }
      }
    }
    
    // Clear canvas after sampling
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return particles;
  }, []);

  // Update particles animation
  const updateParticles = useCallback((
    particles: Particle[],
    deltaTime: number,
    isHovered: boolean,
    showText: boolean,
    setShowText: (show: boolean) => void,
    spread: number,
    speed: number
  ) => {    const FLOAT_RADIUS = spread;
    const RETURN_SPEED = 3;
    const FLOAT_SPEED = speed;
    const TRANSITION_SPEED = 5 * FLOAT_SPEED;
    const NOISE_SCALE = 0.6;
    const CHAOS_FACTOR = 1.3;
    const FADE_SPEED = 13; 

    particles.forEach(particle => {
      if (isHovered) {
        // When hovered, gradually return to original position
        const dx = particle.originalX - particle.x;
        const dy = particle.originalY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) {
          particle.x += (dx / distance) * RETURN_SPEED * deltaTime * 60;
          particle.y += (dy / distance) * RETURN_SPEED * deltaTime * 60;
        } else {
          particle.x = particle.originalX;
          particle.y = particle.originalY;
        }
        
        // Fade out particles when hovered
        particle.opacity = Math.max(0, particle.opacity - FADE_SPEED * deltaTime);
      } else {
        // Update particle's unique movement pattern
        particle.floatingAngle += deltaTime * particle.floatingSpeed * (1 + Math.random() * CHAOS_FACTOR);
        
        // Generate base movement using improved noise
        const time = Date.now() * 0.001;
        const uniqueOffset = particle.floatingSpeed * 2000;
        const noiseX = (
          Math.sin(time * particle.floatingSpeed + particle.floatingAngle) * 1.2 +
          Math.sin((time + uniqueOffset) * 0.5) * 0.8 +
          (Math.random() - 0.5) * CHAOS_FACTOR
        ) * NOISE_SCALE;
        const noiseY = (
          Math.cos(time * particle.floatingSpeed + particle.floatingAngle * 1.5) * 0.6 +
          Math.cos((time + uniqueOffset) * 0.5) * 0.4 +
          (Math.random() - 0.5) * CHAOS_FACTOR
        ) * NOISE_SCALE;
        
        // Calculate target position with random offset
        const randomOffsetX = FLOAT_RADIUS * noiseX;
        const randomOffsetY = FLOAT_RADIUS * noiseY;
        const targetX = particle.originalX + randomOffsetX;
        const targetY = particle.originalY + randomOffsetY;
        
        // Smooth movement towards target with variable speed
        const dx = targetX - particle.x;
        const dy = targetY - particle.y;
        
        // Add dynamic jitter based on distance
        const distanceFromTarget = Math.sqrt(dx * dx + dy * dy);
        const jitterScale = Math.min(1, distanceFromTarget / (FLOAT_RADIUS * 1.5));
        const jitterX = (Math.random() - 0.5) * FLOAT_SPEED * jitterScale;
        const jitterY = (Math.random() - 0.5) * FLOAT_SPEED * jitterScale;
        
        particle.x += dx * TRANSITION_SPEED * deltaTime + jitterX;
        particle.y += dy * TRANSITION_SPEED * deltaTime + jitterY;
        
        // Contain particles within bounds with soft boundary
        const distanceFromOrigin = Math.sqrt(
          Math.pow(particle.x - particle.originalX, 2) + 
          Math.pow(particle.y - particle.originalY, 2)
        );
        if (distanceFromOrigin > FLOAT_RADIUS) {
          const angle = Math.atan2(particle.y - particle.originalY, particle.x - particle.originalX);
          const pullBack = (distanceFromOrigin - FLOAT_RADIUS) * 0.1;
          particle.x -= Math.cos(angle) * pullBack;
          particle.y -= Math.sin(angle) * pullBack;
        }
        
        // Enhanced continuous sparkling effect
        const opacityDiff = particle.targetOpacity - particle.opacity;
        particle.opacity += opacityDiff * particle.sparkleSpeed * deltaTime * 3;
        
        // When particle reaches its target opacity, set a new random target
        if (Math.abs(opacityDiff) < 0.01) {
          particle.targetOpacity = Math.random() < 0.5 
            ? Math.random() * 0.1 * particle.originalAlpha
            : particle.originalAlpha * 3;
          particle.sparkleSpeed = Math.random() * 3 + 1;
        }
      }
    });

    if (isHovered && !showText) {
      setShowText(true);
    }
    if (!isHovered && showText) {
      setShowText(false);
    }
  }, []);

  // Render particles
  const renderParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    globalDpr: number
  ) => {
    ctx.save();
    ctx.scale(globalDpr, globalDpr);
    
    // Batch similar colored particles together
    const particlesByColor = new Map<string, Array<{x: number, y: number}>>();
    
    particles.forEach(particle => {
      if (particle.opacity <= 0) return;
      const color = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`);
      if (!particlesByColor.has(color)) {
        particlesByColor.set(color, []);
      }
      particlesByColor.get(color)!.push({
        x: particle.x / globalDpr,
        y: particle.y / globalDpr
      });
    });
    
    // Render particles in batches by color
    particlesByColor.forEach((positions, color) => {
      ctx.fillStyle = color;
      positions.forEach(({ x, y }) => {
        ctx.fillRect(x, y, 1, 1);
      });
    });
    
    ctx.restore();
  }, []);

  // Render canvas
  const renderCanvas = useCallback(() => {
    if (!wrapperRef.current || !canvasRef.current || !wrapperSize.width || !wrapperSize.height) return;
    
    const canvas = canvasRef.current;
    const { width, height } = wrapperSize;
    
    canvas.width = width * globalDpr;
    canvas.height = height * globalDpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Calculate text position
    const textX = canvas.width / 2;
    const textY = canvas.height / 2;
    
    // Create font string
    const font = `${fontWeight} ${fontSize * globalDpr}px ${fontFamily}`;
    
    // Create particles from text
    const particles = createParticles(ctx, canvas, text, textX, textY, font, color, transformedDensity);
    
    // Store particles for later use
    particlesRef.current = particles;
    
    // Render particles
    renderParticles(ctx, particles, globalDpr);
  }, [wrapperSize, globalDpr, text, fontSize, fontFamily, fontWeight, color, transformedDensity, createParticles, renderParticles]);

  // Animation loop
  useEffect(() => {
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      
      if (!canvas || !ctx || !particlesRef.current.length) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      updateParticles(
        particlesRef.current,
        deltaTime,
        isHovered,
        showText,
        setShowText,
        spread,
        speed
      );
      
      renderParticles(ctx, particlesRef.current, globalDpr);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered, showText, spread, speed, globalDpr, updateParticles, renderParticles]);  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current && textDimensions.width && textDimensions.height) {
        // Responsive padding based on screen size and font size
        const isMobile = window.innerWidth < 768;
        const basePadding = isMobile ? Math.max(fontSize * 0.3, 20) : Math.max(fontSize * 0.5, 40);
        
        const minWidth = Math.max(textDimensions.width + basePadding * 2, isMobile ? 120 : 200);
        const minHeight = Math.max(textDimensions.height + basePadding * 2, isMobile ? 60 : 100);
        
        // Get container constraints with responsive maxWidth
        const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
        const viewportMargin = isMobile ? 0.95 : 0.9;
        const maxWidth = parentRect ? parentRect.width * viewportMargin : window.innerWidth * viewportMargin;
        const maxHeight = parentRect ? parentRect.height * viewportMargin : window.innerHeight * viewportMargin;
        
        const finalWidth = Math.min(minWidth, maxWidth);
        const finalHeight = Math.min(minHeight, maxHeight);
        
        setWrapperSize({ width: finalWidth, height: finalHeight });
      }
    };

    // Initial resize
    if (textDimensions.width && textDimensions.height) {
      handleResize();
    }
    
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [textDimensions, fontSize]);

  // Render canvas when size changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setHasBeenShown(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (resetOnMouseLeave || !hasBeenShown) {
      setIsHovered(false);
    }
  }, [resetOnMouseLeave, hasBeenShown]);
  return (
    <div
      ref={wrapperRef}
      className={`relative flex items-center justify-center overflow-hidden rounded-lg transition-all duration-300 ${className}`}
      style={{
        width: wrapperSize.width || 'auto',
        height: wrapperSize.height || 'auto',
        minWidth: '150px',
        minHeight: '80px',
        maxWidth: '100%',
        backgroundColor: 'rgba(15, 15, 15, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >{/* Animated text that appears on hover */}
      <div
        className={`absolute z-10 transition-opacity duration-200 ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          color,
          fontFamily,
          fontWeight,
          fontSize: `${fontSize}px`,
          userSelect: 'none',
          whiteSpace: 'nowrap',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        {text}
      </div>
      
      {/* Canvas for particle system */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
};