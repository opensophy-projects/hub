import React, { useEffect, useRef } from 'react';

interface DotWaveBackgroundProps {
  isDark: boolean;
}

const COLOR_PRESETS = {
  dark: {
    shadow:    [0.04,  0.04,  0.04 ] as const,
    highlight: [0.12,  0.12,  0.12 ] as const,
  },
  light: {
    shadow:    [0.91,  0.906, 0.898] as const,
    highlight: [0.82,  0.816, 0.808] as const,
  },
} as const;

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 vUv;
  void main() {
    vUv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;
  uniform float u_time;
  uniform vec3  u_resolution;
  uniform vec3  u_colorShadow;
  uniform vec3  u_colorHighlight;

  float rand(vec2 p) {
    return fract(sin(dot(p, vec2(12.543, 514.123))) * 4732.12);
  }

  float noise(vec2 p) {
    vec2 f = smoothstep(0.0, 1.0, fract(p));
    vec2 i = floor(p);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float n   = 2.0;
    vec2  uv  = fragCoord / u_resolution.y;
    vec2  uvp = fragCoord / u_resolution.xy;

    uv += 0.75 * noise(uv * 3.0 + u_time / 2.0 + noise(uv * 7.0 - u_time / 3.0) / 2.0) / 2.0;

    float grid =
      (mod(floor(uvp.x * u_resolution.x / n), 2.0) == 0.0 ? 1.0 : 0.0) *
      (mod(floor(uvp.y * u_resolution.y / n), 2.0) == 0.0 ? 1.0 : 0.0);

    vec3 col = mix(
      u_colorShadow,
      u_colorHighlight,
      5.0 * vec3(pow(1.0 - noise(uv * 4.0 - vec2(0.0, u_time / 2.0)), 5.0))
    );

    fragColor = vec4(col, grid);
  }

  void main() {
    vec4 fragColor;
    vec2 fragCoord = vUv * u_resolution.xy;
    mainImage(fragColor, fragCoord);
    gl_FragColor = fragColor;
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vert: WebGLShader,
  frag: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const DotWaveBackground: React.FC<DotWaveBackgroundProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const themeRef  = useRef(isDark);
  // Track wall-clock time paused while tab is hidden, so animation doesn't jump
  const pausedAtRef    = useRef<number | null>(null);
  const totalPausedRef = useRef<number>(0);

  useEffect(() => {
    themeRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── WebGL init ────────────────────────────────────────────────────────────
    let gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    // Compile shaders helper — called on init and on context restore
    function buildGL(ctx: WebGLRenderingContext): {
      program: WebGLProgram;
      buf: WebGLBuffer;
      uTime: WebGLUniformLocation | null;
      uResolution: WebGLUniformLocation | null;
      uShadow: WebGLUniformLocation | null;
      uHighlight: WebGLUniformLocation | null;
    } | null {
      const vert = createShader(ctx, ctx.VERTEX_SHADER, VERTEX_SHADER);
      const frag = createShader(ctx, ctx.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vert || !frag) return null;
      const program = createProgram(ctx, vert, frag);
      if (!program) return null;

      const positions = new Float32Array([-1, -1,  1, -1, -1,  1,  1,  1]);
      const buf = ctx.createBuffer()!;
      ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
      ctx.bufferData(ctx.ARRAY_BUFFER, positions, ctx.STATIC_DRAW);

      const aPos = ctx.getAttribLocation(program, 'a_position');
      ctx.enableVertexAttribArray(aPos);
      ctx.vertexAttribPointer(aPos, 2, ctx.FLOAT, false, 0, 0);

      // Cleanup individual shaders — they're linked into program now
      ctx.deleteShader(vert);
      ctx.deleteShader(frag);

      return {
        program,
        buf,
        uTime:       ctx.getUniformLocation(program, 'u_time'),
        uResolution: ctx.getUniformLocation(program, 'u_resolution'),
        uShadow:     ctx.getUniformLocation(program, 'u_colorShadow'),
        uHighlight:  ctx.getUniformLocation(program, 'u_colorHighlight'),
      };
    }

    let gpu = buildGL(gl);
    if (!gpu) return;

    // ── Resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const startTime = performance.now();

    // ── Render loop ───────────────────────────────────────────────────────────
    const render = () => {
      if (!gl || !gpu) return;

      const elapsed = performance.now() - startTime - totalPausedRef.current;
      const t = (elapsed / 1000) * 0.5;
      const preset = COLOR_PRESETS[themeRef.current ? 'dark' : 'light'];

      gl.useProgram(gpu.program);
      gl.uniform1f(gpu.uTime, t);
      gl.uniform3f(gpu.uResolution, canvas.width, canvas.height, 1);
      gl.uniform3f(gpu.uShadow,    ...preset.shadow);
      gl.uniform3f(gpu.uHighlight, ...preset.highlight);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    // ── Pause when tab is hidden ──────────────────────────────────────────────
    const onVisibility = () => {
      if (document.hidden) {
        // Tab hidden — stop loop and record when we paused
        cancelAnimationFrame(rafRef.current);
        pausedAtRef.current = performance.now();
      } else {
        // Tab visible — accumulate paused duration and restart loop
        if (pausedAtRef.current !== null) {
          totalPausedRef.current += performance.now() - pausedAtRef.current;
          pausedAtRef.current = null;
        }
        render();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ── WebGL context lost / restored ─────────────────────────────────────────
    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(rafRef.current);
    };

    const onContextRestored = () => {
      // Re-acquire context reference and rebuild GPU objects
      const newCtx = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
      if (!newCtx) return;
      gl = newCtx;
      gpu = buildGL(gl);
      if (!gpu) return;
      resize();
      render();
    };

    canvas.addEventListener('webglcontextlost',     onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost',     onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (gl && gpu) {
        gl.deleteBuffer(gpu.buf);
        gl.deleteProgram(gpu.program);
      }
    };
  }, []); // only once — isDark handled via ref

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        // Prevent layout thrash: this canvas never affects surrounding layout
        contain: 'strict',
      }}
    />
  );
};

export default DotWaveBackground;