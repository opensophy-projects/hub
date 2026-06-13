import type { ComponentConfig } from './types';

// Lightweight metadata extracted from the former config.json files.
// This keeps runtime defaults and explicit entry-file exceptions without
// requiring a config.json inside every UI component folder.
export const componentMetadata = {
  "aurora": {
    "id": "aurora",
    "name": "Aurora",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "aurora.tsx",
    "props": [
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "amplitude",
        "type": "number",
        "default": 1,
        "description": "amplitude",
        "control": "number"
      },
      {
        "name": "blend",
        "type": "number",
        "default": 0.5,
        "description": "blend",
        "control": "number"
      },
      {
        "name": "colorStops",
        "type": "array",
        "default": [
          "#5227FF",
          "#7cff67",
          "#5227FF"
        ],
        "description": "colorStops",
        "control": "text"
      }
    ],
    "specificProps": [
      "speed",
      "amplitude",
      "blend",
      "colorStops"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "beams": {
    "id": "beams",
    "name": "Beams",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "beams.tsx",
    "props": [
      {
        "name": "beamWidth",
        "type": "number",
        "default": 2,
        "description": "beamWidth",
        "control": "number"
      },
      {
        "name": "beamHeight",
        "type": "number",
        "default": 20,
        "description": "beamHeight",
        "control": "number"
      },
      {
        "name": "beamNumber",
        "type": "number",
        "default": 12,
        "description": "beamNumber",
        "control": "number"
      },
      {
        "name": "lightColor",
        "type": "string",
        "default": "#ffffff",
        "description": "lightColor",
        "control": "text"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      }
    ],
    "specificProps": [
      "beamWidth",
      "beamHeight",
      "beamNumber",
      "lightColor",
      "speed"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "color-bends": {
    "id": "color-bends",
    "name": "Color Bends",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "color-bends.tsx",
    "props": [
      {
        "name": "rotation",
        "type": "number",
        "default": 0,
        "description": "rotation",
        "control": "number"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "transparent",
        "type": "boolean",
        "default": true,
        "description": "transparent",
        "control": "boolean"
      },
      {
        "name": "autoRotate",
        "type": "number",
        "default": 0,
        "description": "autoRotate",
        "control": "number"
      },
      {
        "name": "scale",
        "type": "number",
        "default": 1,
        "description": "scale",
        "control": "number"
      },
      {
        "name": "frequency",
        "type": "number",
        "default": 1,
        "description": "frequency",
        "control": "number"
      },
      {
        "name": "warpStrength",
        "type": "number",
        "default": 1,
        "description": "warpStrength",
        "control": "number"
      },
      {
        "name": "mouseInfluence",
        "type": "number",
        "default": 0,
        "description": "mouseInfluence",
        "control": "number"
      },
      {
        "name": "parallax",
        "type": "number",
        "default": 0,
        "description": "parallax",
        "control": "number"
      },
      {
        "name": "noise",
        "type": "number",
        "default": 0,
        "description": "noise",
        "control": "number"
      },
      {
        "name": "iterations",
        "type": "number",
        "default": 4,
        "description": "iterations",
        "control": "number"
      },
      {
        "name": "intensity",
        "type": "number",
        "default": 1,
        "description": "intensity",
        "control": "number"
      },
      {
        "name": "bandWidth",
        "type": "number",
        "default": 1,
        "description": "bandWidth",
        "control": "number"
      }
    ],
    "specificProps": [
      "rotation",
      "speed",
      "transparent",
      "autoRotate",
      "scale",
      "frequency",
      "warpStrength",
      "mouseInfluence",
      "parallax",
      "noise",
      "iterations",
      "intensity",
      "bandWidth"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "dark-veil": {
    "id": "dark-veil",
    "name": "Dark Veil",
    "description": "Генеративный WebGL-фон на основе CPPN (нейросети с периодическими активациями). Поддерживает сдвиг оттенка, шум, сканлайны и искажение пространства.",
    "main": "dark-veil.tsx",
    "props": [
      {
        "name": "speed",
        "type": "number",
        "default": 0.5,
        "description": "Скорость анимации",
        "control": "number",
        "min": 0,
        "max": 3,
        "step": 0.05
      },
      {
        "name": "hueShift",
        "type": "number",
        "default": 0,
        "description": "Сдвиг оттенка (градусы, 0–360)",
        "control": "number",
        "min": 0,
        "max": 360,
        "step": 1
      },
      {
        "name": "noiseIntensity",
        "type": "number",
        "default": 0,
        "description": "Интенсивность зернистости",
        "control": "number",
        "min": 0,
        "max": 0.5,
        "step": 0.01
      },
      {
        "name": "scanlineIntensity",
        "type": "number",
        "default": 0,
        "description": "Интенсивность сканлайнов",
        "control": "number",
        "min": 0,
        "max": 1,
        "step": 0.05
      },
      {
        "name": "scanlineFrequency",
        "type": "number",
        "default": 0,
        "description": "Частота сканлайнов (px⁻¹)",
        "control": "number",
        "min": 0,
        "max": 3,
        "step": 0.05
      },
      {
        "name": "warpAmount",
        "type": "number",
        "default": 0,
        "description": "Деформация пространства UV",
        "control": "number",
        "min": 0,
        "max": 2,
        "step": 0.05
      },
      {
        "name": "resolutionScale",
        "type": "number",
        "default": 1,
        "description": "Масштаб разрешения (0.5 = половина пикселей, экономия GPU)",
        "control": "number",
        "min": 0.25,
        "max": 2,
        "step": 0.25
      }
    ],
    "specificProps": [
      "speed",
      "hueShift",
      "noiseIntensity",
      "scanlineIntensity",
      "scanlineFrequency",
      "warpAmount",
      "resolutionScale"
    ],
    "category": "backgrounds",
    "tags": [
      "webgl",
      "background",
      "generative",
      "cppn",
      "shader",
      "animation"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "dot-field": {
    "id": "dot-field",
    "name": "Dot Field",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "dot-field.tsx",
    "props": [
      {
        "name": "dotRadius",
        "type": "number",
        "default": 1.5,
        "description": "dotRadius",
        "control": "number"
      },
      {
        "name": "dotSpacing",
        "type": "number",
        "default": 14,
        "description": "dotSpacing",
        "control": "number"
      },
      {
        "name": "cursorRadius",
        "type": "number",
        "default": 500,
        "description": "cursorRadius",
        "control": "number"
      },
      {
        "name": "cursorForce",
        "type": "number",
        "default": 0.1,
        "description": "cursorForce",
        "control": "number"
      },
      {
        "name": "bulgeOnly",
        "type": "boolean",
        "default": true,
        "description": "bulgeOnly",
        "control": "boolean"
      },
      {
        "name": "bulgeStrength",
        "type": "number",
        "default": 67,
        "description": "bulgeStrength",
        "control": "number"
      },
      {
        "name": "glowRadius",
        "type": "number",
        "default": 160,
        "description": "glowRadius",
        "control": "number"
      },
      {
        "name": "sparkle",
        "type": "boolean",
        "default": false,
        "description": "sparkle",
        "control": "boolean"
      },
      {
        "name": "waveAmplitude",
        "type": "number",
        "default": 0,
        "description": "waveAmplitude",
        "control": "number"
      },
      {
        "name": "gradientFrom",
        "type": "string",
        "default": "rgba(168, 85, 247, 0.35)",
        "description": "gradientFrom",
        "control": "text"
      },
      {
        "name": "gradientTo",
        "type": "string",
        "default": "rgba(180, 151, 207, 0.25)",
        "description": "gradientTo",
        "control": "text"
      },
      {
        "name": "glowColor",
        "type": "string",
        "default": "#120F17",
        "description": "glowColor",
        "control": "text"
      }
    ],
    "specificProps": [
      "dotRadius",
      "dotSpacing",
      "cursorRadius",
      "cursorForce",
      "bulgeOnly",
      "bulgeStrength",
      "glowRadius",
      "sparkle",
      "waveAmplitude",
      "gradientFrom",
      "gradientTo",
      "glowColor"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "eye-sauron": {
    "id": "eye-sauron",
    "name": "Eye Sauron",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "eye-sauron.tsx",
    "props": [
      {
        "name": "eyeColor",
        "type": "string",
        "default": "#ff4500",
        "description": "eyeColor",
        "control": "text"
      },
      {
        "name": "intensity",
        "type": "number",
        "default": 1,
        "description": "intensity",
        "control": "number"
      },
      {
        "name": "pupilSize",
        "type": "number",
        "default": 0.35,
        "description": "pupilSize",
        "control": "number"
      },
      {
        "name": "irisWidth",
        "type": "number",
        "default": 0.25,
        "description": "irisWidth",
        "control": "number"
      },
      {
        "name": "glowIntensity",
        "type": "number",
        "default": 1,
        "description": "glowIntensity",
        "control": "number"
      },
      {
        "name": "scale",
        "type": "number",
        "default": 1,
        "description": "scale",
        "control": "number"
      },
      {
        "name": "noiseScale",
        "type": "number",
        "default": 1,
        "description": "noiseScale",
        "control": "number"
      },
      {
        "name": "pupilFollow",
        "type": "number",
        "default": 1,
        "description": "pupilFollow",
        "control": "number"
      },
      {
        "name": "flameSpeed",
        "type": "number",
        "default": 1,
        "description": "flameSpeed",
        "control": "number"
      },
      {
        "name": "backgroundColor",
        "type": "string",
        "default": "#000000",
        "description": "backgroundColor",
        "control": "text"
      }
    ],
    "specificProps": [
      "eyeColor",
      "intensity",
      "pupilSize",
      "irisWidth",
      "glowIntensity",
      "scale",
      "noiseScale",
      "pupilFollow",
      "flameSpeed",
      "backgroundColor"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "floating-lines": {
    "id": "floating-lines",
    "name": "Floating Lines",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "floating-lines.tsx",
    "props": [
      {
        "name": "animationSpeed",
        "type": "number",
        "default": 1,
        "description": "animationSpeed",
        "control": "number"
      },
      {
        "name": "interactive",
        "type": "boolean",
        "default": true,
        "description": "interactive",
        "control": "boolean"
      },
      {
        "name": "parallax",
        "type": "boolean",
        "default": false,
        "description": "parallax",
        "control": "boolean"
      }
    ],
    "specificProps": [
      "animationSpeed",
      "interactive",
      "parallax"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "gradient-blinds": {
    "id": "gradient-blinds",
    "name": "Gradient Blinds",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "gradient-blinds.tsx",
    "props": [
      {
        "name": "paused",
        "type": "boolean",
        "default": false,
        "description": "paused",
        "control": "boolean"
      },
      {
        "name": "angle",
        "type": "number",
        "default": 0,
        "description": "angle",
        "control": "number"
      },
      {
        "name": "noise",
        "type": "number",
        "default": 0.3,
        "description": "noise",
        "control": "number"
      },
      {
        "name": "blindCount",
        "type": "number",
        "default": 16,
        "description": "blindCount",
        "control": "number"
      },
      {
        "name": "blindMinWidth",
        "type": "number",
        "default": 60,
        "description": "blindMinWidth",
        "control": "number"
      },
      {
        "name": "mouseDampening",
        "type": "number",
        "default": 0.15,
        "description": "mouseDampening",
        "control": "number"
      },
      {
        "name": "mirrorGradient",
        "type": "boolean",
        "default": false,
        "description": "mirrorGradient",
        "control": "boolean"
      },
      {
        "name": "spotlightRadius",
        "type": "number",
        "default": 0.5,
        "description": "spotlightRadius",
        "control": "number"
      },
      {
        "name": "spotlightSoftness",
        "type": "number",
        "default": 1,
        "description": "spotlightSoftness",
        "control": "number"
      },
      {
        "name": "spotlightOpacity",
        "type": "number",
        "default": 1,
        "description": "spotlightOpacity",
        "control": "number"
      },
      {
        "name": "distortAmount",
        "type": "number",
        "default": 0,
        "description": "distortAmount",
        "control": "number"
      },
      {
        "name": "shineDirection",
        "type": "string",
        "default": "left",
        "description": "shineDirection",
        "control": "text"
      },
      {
        "name": "mixBlendMode",
        "type": "string",
        "default": "lighten",
        "description": "mixBlendMode",
        "control": "text"
      }
    ],
    "specificProps": [
      "paused",
      "angle",
      "noise",
      "blindCount",
      "blindMinWidth",
      "mouseDampening",
      "mirrorGradient",
      "spotlightRadius",
      "spotlightSoftness",
      "spotlightOpacity",
      "distortAmount",
      "shineDirection",
      "mixBlendMode"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "grainient": {
    "id": "grainient",
    "name": "Grainient",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "grainient.tsx",
    "props": [
      {
        "name": "timeSpeed",
        "type": "number",
        "default": 1,
        "description": "timeSpeed",
        "control": "number"
      },
      {
        "name": "colorBalance",
        "type": "number",
        "default": 0.5,
        "description": "colorBalance",
        "control": "number"
      },
      {
        "name": "warpStrength",
        "type": "number",
        "default": 1,
        "description": "warpStrength",
        "control": "number"
      },
      {
        "name": "warpFrequency",
        "type": "number",
        "default": 1,
        "description": "warpFrequency",
        "control": "number"
      },
      {
        "name": "warpSpeed",
        "type": "number",
        "default": 1,
        "description": "warpSpeed",
        "control": "number"
      },
      {
        "name": "warpAmplitude",
        "type": "number",
        "default": 1,
        "description": "warpAmplitude",
        "control": "number"
      },
      {
        "name": "blendAngle",
        "type": "number",
        "default": 0,
        "description": "blendAngle",
        "control": "number"
      },
      {
        "name": "blendSoftness",
        "type": "number",
        "default": 0.5,
        "description": "blendSoftness",
        "control": "number"
      },
      {
        "name": "rotationAmount",
        "type": "number",
        "default": 0,
        "description": "rotationAmount",
        "control": "number"
      },
      {
        "name": "noiseScale",
        "type": "number",
        "default": 1,
        "description": "noiseScale",
        "control": "number"
      },
      {
        "name": "grainAmount",
        "type": "number",
        "default": 0.1,
        "description": "grainAmount",
        "control": "number"
      },
      {
        "name": "grainScale",
        "type": "number",
        "default": 1,
        "description": "grainScale",
        "control": "number"
      },
      {
        "name": "grainAnimated",
        "type": "boolean",
        "default": true,
        "description": "grainAnimated",
        "control": "boolean"
      },
      {
        "name": "contrast",
        "type": "number",
        "default": 1,
        "description": "contrast",
        "control": "number"
      },
      {
        "name": "gamma",
        "type": "number",
        "default": 1,
        "description": "gamma",
        "control": "number"
      },
      {
        "name": "saturation",
        "type": "number",
        "default": 1,
        "description": "saturation",
        "control": "number"
      },
      {
        "name": "centerX",
        "type": "number",
        "default": 0,
        "description": "centerX",
        "control": "number"
      },
      {
        "name": "centerY",
        "type": "number",
        "default": 0,
        "description": "centerY",
        "control": "number"
      },
      {
        "name": "zoom",
        "type": "number",
        "default": 1,
        "description": "zoom",
        "control": "number"
      },
      {
        "name": "color1",
        "type": "string",
        "default": "#ff00ff",
        "description": "color1",
        "control": "text"
      },
      {
        "name": "color2",
        "type": "string",
        "default": "#00ffff",
        "description": "color2",
        "control": "text"
      },
      {
        "name": "color3",
        "type": "string",
        "default": "#ffffff",
        "description": "color3",
        "control": "text"
      }
    ],
    "specificProps": [
      "timeSpeed",
      "colorBalance",
      "warpStrength",
      "warpFrequency",
      "warpSpeed",
      "warpAmplitude",
      "blendAngle",
      "blendSoftness",
      "rotationAmount",
      "noiseScale",
      "grainAmount",
      "grainScale",
      "grainAnimated",
      "contrast",
      "gamma",
      "saturation",
      "centerX",
      "centerY",
      "zoom",
      "color1",
      "color2",
      "color3"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "iridescence": {
    "id": "iridescence",
    "name": "Iridescence",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "iridescence.tsx",
    "props": [
      {
        "name": "color",
        "type": "array",
        "default": [
          1,
          1,
          1
        ],
        "description": "color",
        "control": "text"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "amplitude",
        "type": "number",
        "default": 0.1,
        "description": "amplitude",
        "control": "number"
      },
      {
        "name": "mouseReact",
        "type": "boolean",
        "default": true,
        "description": "mouseReact",
        "control": "boolean"
      }
    ],
    "specificProps": [
      "color",
      "speed",
      "amplitude",
      "mouseReact"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "light-pillar": {
    "id": "light-pillar",
    "name": "Light Pillar",
    "description": "Генеративный WebGL-фон на основе трёхмерного ray marching шейдера. Анимированный столп света с градиентной окраской, волновой деформацией и интерактивным откликом на мышь. Использует Three.js для рендера.",
    "main": "light-pillar.tsx",
    "props": [
      {
        "name": "topColor",
        "type": "string",
        "default": "#5227FF",
        "description": "Цвет верхней части столпа",
        "control": "text"
      },
      {
        "name": "bottomColor",
        "type": "string",
        "default": "#FF9FFC",
        "description": "Цвет нижней части столпа",
        "control": "text"
      },
      {
        "name": "intensity",
        "type": "number",
        "default": 1.0,
        "description": "Яркость итогового изображения",
        "control": "number",
        "min": 0.1,
        "max": 5,
        "step": 0.05
      },
      {
        "name": "rotationSpeed",
        "type": "number",
        "default": 0.3,
        "description": "Скорость вращения столпа. 0 — стоп-кадр",
        "control": "number",
        "min": 0,
        "max": 3,
        "step": 0.05
      },
      {
        "name": "interactive",
        "type": "boolean",
        "default": false,
        "description": "Управление вращением мышью при наведении",
        "control": "checkbox"
      },
      {
        "name": "glowAmount",
        "type": "number",
        "default": 0.005,
        "description": "Интенсивность свечения — контролирует насыщенность цвета",
        "control": "number",
        "min": 0.001,
        "max": 0.05,
        "step": 0.001
      },
      {
        "name": "pillarWidth",
        "type": "number",
        "default": 3.0,
        "description": "Ширина (радиус) столпа в условных единицах",
        "control": "number",
        "min": 0.5,
        "max": 8,
        "step": 0.1
      },
      {
        "name": "pillarHeight",
        "type": "number",
        "default": 0.4,
        "description": "Коэффициент вертикального сжатия столпа. Меньше — выше и тоньше",
        "control": "number",
        "min": 0.05,
        "max": 2,
        "step": 0.05
      },
      {
        "name": "noiseIntensity",
        "type": "number",
        "default": 0.5,
        "description": "Интенсивность зернистости (плёночный шум). 0 — чистый рендер",
        "control": "number",
        "min": 0,
        "max": 3,
        "step": 0.05
      },
      {
        "name": "pillarRotation",
        "type": "number",
        "default": 0,
        "description": "Статический поворот камеры в градусах",
        "control": "number",
        "min": -180,
        "max": 180,
        "step": 1
      },
      {
        "name": "quality",
        "type": "string",
        "default": "high",
        "description": "Качество рендера. На мобильных автоматически снижается",
        "control": "select",
        "options": [
          "low",
          "medium",
          "high"
        ]
      }
    ],
    "specificProps": [
      "topColor",
      "bottomColor",
      "intensity",
      "rotationSpeed",
      "interactive",
      "glowAmount",
      "pillarWidth",
      "pillarHeight",
      "noiseIntensity",
      "pillarRotation",
      "quality"
    ],
    "category": "backgrounds",
    "tags": [
      "webgl",
      "background",
      "shader",
      "three.js",
      "ray-marching",
      "generative",
      "animation",
      "interactive"
    ],
    "author": "custom",
    "version": "1.0.0"
  },
  "light-rays": {
    "id": "light-rays",
    "name": "Light Rays",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "light-rays.tsx",
    "props": [
      {
        "name": "raysOrigin",
        "type": "string",
        "default": "top-center",
        "description": "raysOrigin",
        "control": "text"
      },
      {
        "name": "raysColor",
        "type": "string",
        "default": "#ffffff",
        "description": "raysColor",
        "control": "text"
      },
      {
        "name": "raysSpeed",
        "type": "number",
        "default": 1,
        "description": "raysSpeed",
        "control": "number"
      },
      {
        "name": "lightSpread",
        "type": "number",
        "default": 1,
        "description": "lightSpread",
        "control": "number"
      },
      {
        "name": "rayLength",
        "type": "number",
        "default": 1,
        "description": "rayLength",
        "control": "number"
      },
      {
        "name": "pulsating",
        "type": "boolean",
        "default": false,
        "description": "pulsating",
        "control": "boolean"
      },
      {
        "name": "fadeDistance",
        "type": "number",
        "default": 1,
        "description": "fadeDistance",
        "control": "number"
      },
      {
        "name": "saturation",
        "type": "number",
        "default": 1,
        "description": "saturation",
        "control": "number"
      },
      {
        "name": "followMouse",
        "type": "boolean",
        "default": false,
        "description": "followMouse",
        "control": "boolean"
      },
      {
        "name": "mouseInfluence",
        "type": "number",
        "default": 0.1,
        "description": "mouseInfluence",
        "control": "number"
      },
      {
        "name": "noiseAmount",
        "type": "number",
        "default": 0,
        "description": "noiseAmount",
        "control": "number"
      },
      {
        "name": "distortion",
        "type": "number",
        "default": 0,
        "description": "distortion",
        "control": "number"
      }
    ],
    "specificProps": [
      "raysOrigin",
      "raysColor",
      "raysSpeed",
      "lightSpread",
      "rayLength",
      "pulsating",
      "fadeDistance",
      "saturation",
      "followMouse",
      "mouseInfluence",
      "noiseAmount",
      "distortion"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "lightning": {
    "id": "lightning",
    "name": "Lightning",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "background.tsx",
    "props": [
      {
        "name": "hue",
        "type": "number",
        "default": 230,
        "description": "hue",
        "control": "number"
      },
      {
        "name": "xOffset",
        "type": "number",
        "default": 0,
        "description": "xOffset",
        "control": "number"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "intensity",
        "type": "number",
        "default": 1,
        "description": "intensity",
        "control": "number"
      },
      {
        "name": "size",
        "type": "number",
        "default": 1,
        "description": "size",
        "control": "number"
      }
    ],
    "specificProps": [
      "hue",
      "xOffset",
      "speed",
      "intensity",
      "size"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "pixel-blast": {
    "id": "pixel-blast",
    "name": "Pixel Blast",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "pixel-blast.tsx",
    "props": [
      {
        "name": "variant",
        "type": "string",
        "default": "square",
        "description": "variant",
        "control": "text"
      },
      {
        "name": "pixelSize",
        "type": "number",
        "default": 8,
        "description": "pixelSize",
        "control": "number"
      },
      {
        "name": "color",
        "type": "string",
        "default": "#ffffff",
        "description": "color",
        "control": "text"
      },
      {
        "name": "antialias",
        "type": "boolean",
        "default": false,
        "description": "antialias",
        "control": "boolean"
      },
      {
        "name": "patternScale",
        "type": "number",
        "default": 1,
        "description": "patternScale",
        "control": "number"
      },
      {
        "name": "patternDensity",
        "type": "number",
        "default": 1,
        "description": "patternDensity",
        "control": "number"
      },
      {
        "name": "liquid",
        "type": "boolean",
        "default": false,
        "description": "liquid",
        "control": "boolean"
      },
      {
        "name": "liquidStrength",
        "type": "number",
        "default": 0.5,
        "description": "liquidStrength",
        "control": "number"
      },
      {
        "name": "liquidRadius",
        "type": "number",
        "default": 0.5,
        "description": "liquidRadius",
        "control": "number"
      },
      {
        "name": "pixelSizeJitter",
        "type": "number",
        "default": 0,
        "description": "pixelSizeJitter",
        "control": "number"
      },
      {
        "name": "enableRipples",
        "type": "boolean",
        "default": true,
        "description": "enableRipples",
        "control": "boolean"
      },
      {
        "name": "rippleIntensityScale",
        "type": "number",
        "default": 1,
        "description": "rippleIntensityScale",
        "control": "number"
      },
      {
        "name": "rippleThickness",
        "type": "number",
        "default": 1,
        "description": "rippleThickness",
        "control": "number"
      },
      {
        "name": "rippleSpeed",
        "type": "number",
        "default": 1,
        "description": "rippleSpeed",
        "control": "number"
      },
      {
        "name": "liquidWobbleSpeed",
        "type": "number",
        "default": 1,
        "description": "liquidWobbleSpeed",
        "control": "number"
      },
      {
        "name": "autoPauseOffscreen",
        "type": "boolean",
        "default": true,
        "description": "autoPauseOffscreen",
        "control": "boolean"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "transparent",
        "type": "boolean",
        "default": true,
        "description": "transparent",
        "control": "boolean"
      },
      {
        "name": "edgeFade",
        "type": "number",
        "default": 0,
        "description": "edgeFade",
        "control": "number"
      },
      {
        "name": "noiseAmount",
        "type": "number",
        "default": 0,
        "description": "noiseAmount",
        "control": "number"
      }
    ],
    "specificProps": [
      "variant",
      "pixelSize",
      "color",
      "antialias",
      "patternScale",
      "patternDensity",
      "liquid",
      "liquidStrength",
      "liquidRadius",
      "pixelSizeJitter",
      "enableRipples",
      "rippleIntensityScale",
      "rippleThickness",
      "rippleSpeed",
      "liquidWobbleSpeed",
      "autoPauseOffscreen",
      "speed",
      "transparent",
      "edgeFade",
      "noiseAmount"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "plasma-wave": {
    "id": "plasma-wave",
    "name": "Plasma Wave",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "plasma-wave.tsx",
    "props": [],
    "specificProps": [],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "plasma": {
    "id": "plasma",
    "name": "Plasma",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "plasma.tsx",
    "props": [
      {
        "name": "color",
        "type": "string",
        "default": "#ff8844",
        "description": "color",
        "control": "text"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "direction",
        "type": "string",
        "default": "forward",
        "description": "direction",
        "control": "text"
      },
      {
        "name": "scale",
        "type": "number",
        "default": 1,
        "description": "scale",
        "control": "number"
      },
      {
        "name": "opacity",
        "type": "number",
        "default": 1,
        "description": "opacity",
        "control": "number"
      },
      {
        "name": "mouseInteractive",
        "type": "boolean",
        "default": false,
        "description": "mouseInteractive",
        "control": "boolean"
      }
    ],
    "specificProps": [
      "color",
      "speed",
      "direction",
      "scale",
      "opacity",
      "mouseInteractive"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "prism": {
    "id": "prism",
    "name": "Prism",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "prism.tsx",
    "props": [
      {
        "name": "height",
        "type": "number",
        "default": 3.5,
        "description": "height",
        "control": "number"
      },
      {
        "name": "baseWidth",
        "type": "number",
        "default": 5.5,
        "description": "baseWidth",
        "control": "number"
      },
      {
        "name": "animationType",
        "type": "string",
        "default": "rotate",
        "description": "animationType",
        "control": "text"
      },
      {
        "name": "glow",
        "type": "number",
        "default": 1,
        "description": "glow",
        "control": "number"
      },
      {
        "name": "noise",
        "type": "number",
        "default": 0.5,
        "description": "noise",
        "control": "number"
      },
      {
        "name": "scale",
        "type": "number",
        "default": 3.6,
        "description": "scale",
        "control": "number"
      },
      {
        "name": "hueShift",
        "type": "number",
        "default": 0,
        "description": "hueShift",
        "control": "number"
      },
      {
        "name": "colorFrequency",
        "type": "number",
        "default": 1,
        "description": "colorFrequency",
        "control": "number"
      },
      {
        "name": "hoverStrength",
        "type": "number",
        "default": 2,
        "description": "hoverStrength",
        "control": "number"
      },
      {
        "name": "inertia",
        "type": "number",
        "default": 0.05,
        "description": "inertia",
        "control": "number"
      },
      {
        "name": "bloom",
        "type": "number",
        "default": 1,
        "description": "bloom",
        "control": "number"
      },
      {
        "name": "suspendWhenOffscreen",
        "type": "boolean",
        "default": false,
        "description": "suspendWhenOffscreen",
        "control": "boolean"
      },
      {
        "name": "timeScale",
        "type": "number",
        "default": 0.5,
        "description": "timeScale",
        "control": "number"
      }
    ],
    "specificProps": [
      "height",
      "baseWidth",
      "animationType",
      "glow",
      "noise",
      "scale",
      "hueShift",
      "colorFrequency",
      "hoverStrength",
      "inertia",
      "bloom",
      "suspendWhenOffscreen",
      "timeScale"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "prismatic-burst": {
    "id": "prismatic-burst",
    "name": "Prismatic Burst",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "prismatic-burst.tsx",
    "props": [
      {
        "name": "intensity",
        "type": "number",
        "default": 1,
        "description": "intensity",
        "control": "number"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "animationType",
        "type": "string",
        "default": "rotate",
        "description": "animationType",
        "control": "text"
      },
      {
        "name": "distort",
        "type": "number",
        "default": 0,
        "description": "distort",
        "control": "number"
      },
      {
        "name": "paused",
        "type": "boolean",
        "default": false,
        "description": "paused",
        "control": "boolean"
      },
      {
        "name": "hoverDampness",
        "type": "number",
        "default": 0.1,
        "description": "hoverDampness",
        "control": "number"
      },
      {
        "name": "rayCount",
        "type": "number",
        "default": 24,
        "description": "rayCount",
        "control": "number"
      },
      {
        "name": "mixBlendMode",
        "type": "string",
        "default": "screen",
        "description": "mixBlendMode",
        "control": "text"
      }
    ],
    "specificProps": [
      "intensity",
      "speed",
      "animationType",
      "distort",
      "paused",
      "hoverDampness",
      "rayCount",
      "mixBlendMode"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "silk": {
    "id": "silk",
    "name": "Silk",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "silk.tsx",
    "props": [
      {
        "name": "speed",
        "type": "number",
        "default": 5,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "scale",
        "type": "number",
        "default": 1,
        "description": "scale",
        "control": "number"
      },
      {
        "name": "color",
        "type": "string",
        "default": "#7B7481",
        "description": "color",
        "control": "text"
      },
      {
        "name": "noiseIntensity",
        "type": "number",
        "default": 1.5,
        "description": "noiseIntensity",
        "control": "number"
      },
      {
        "name": "rotation",
        "type": "number",
        "default": 0,
        "description": "rotation",
        "control": "number"
      }
    ],
    "specificProps": [
      "speed",
      "scale",
      "color",
      "noiseIntensity",
      "rotation"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "soft-aurora": {
    "id": "soft-aurora",
    "name": "Soft Aurora",
    "description": "Анимированный фоновый UI-компонент.",
    "main": "soft-aurora.tsx",
    "props": [
      {
        "name": "speed",
        "type": "number",
        "default": 1,
        "description": "speed",
        "control": "number"
      },
      {
        "name": "scale",
        "type": "number",
        "default": 1,
        "description": "scale",
        "control": "number"
      },
      {
        "name": "brightness",
        "type": "number",
        "default": 1,
        "description": "brightness",
        "control": "number"
      },
      {
        "name": "color1",
        "type": "string",
        "default": "#ff00ff",
        "description": "color1",
        "control": "text"
      },
      {
        "name": "color2",
        "type": "string",
        "default": "#00ffff",
        "description": "color2",
        "control": "text"
      },
      {
        "name": "noiseFrequency",
        "type": "number",
        "default": 1,
        "description": "noiseFrequency",
        "control": "number"
      },
      {
        "name": "noiseAmplitude",
        "type": "number",
        "default": 1,
        "description": "noiseAmplitude",
        "control": "number"
      },
      {
        "name": "bandHeight",
        "type": "number",
        "default": 0.5,
        "description": "bandHeight",
        "control": "number"
      },
      {
        "name": "bandSpread",
        "type": "number",
        "default": 1,
        "description": "bandSpread",
        "control": "number"
      },
      {
        "name": "octaveDecay",
        "type": "number",
        "default": 0.5,
        "description": "octaveDecay",
        "control": "number"
      },
      {
        "name": "layerOffset",
        "type": "number",
        "default": 0.2,
        "description": "layerOffset",
        "control": "number"
      },
      {
        "name": "colorSpeed",
        "type": "number",
        "default": 1,
        "description": "colorSpeed",
        "control": "number"
      },
      {
        "name": "enableMouseInteraction",
        "type": "boolean",
        "default": true,
        "description": "enableMouseInteraction",
        "control": "boolean"
      },
      {
        "name": "mouseInfluence",
        "type": "number",
        "default": 0.2,
        "description": "mouseInfluence",
        "control": "number"
      }
    ],
    "specificProps": [
      "speed",
      "scale",
      "brightness",
      "color1",
      "color2",
      "noiseFrequency",
      "noiseAmplitude",
      "bandHeight",
      "bandSpread",
      "octaveDecay",
      "layerOffset",
      "colorSpeed",
      "enableMouseInteraction",
      "mouseInfluence"
    ],
    "category": "backgrounds",
    "tags": [
      "background",
      "animation",
      "react"
    ],
    "author": "veilosophy",
    "version": "1.0.0"
  },
  "blur-text": {
    "id": "blur-text",
    "name": "Блюрный Текст",
    "description": "Красивый компонент анимированного текста с эффектом размытия",
    "main": "BlurText.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Добро пожаловать в будущее веб-дизайна",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold text-center",
        "description": "CSS классы",
        "control": "text"
      },
      {
        "name": "delay",
        "type": "number",
        "default": 200,
        "description": "Задержка между элементами (мс)",
        "control": "number",
        "min": 0,
        "max": 1000,
        "step": 10
      },
      {
        "name": "animateBy",
        "type": "string",
        "default": "words",
        "description": "Режим анимации",
        "control": "select",
        "options": [
          "words",
          "letters"
        ]
      },
      {
        "name": "direction",
        "type": "string",
        "default": "top",
        "description": "Направление появления",
        "control": "select",
        "options": [
          "top",
          "bottom"
        ]
      }
    ],
    "specificProps": [
      "delay",
      "animateBy",
      "direction"
    ],
    "category": "text",
    "tags": [
      "animation",
      "blur",
      "text",
      "motion"
    ],
    "author": "reactbits",
    "version": "1.0.0"
  },
  "circular-text": {
    "id": "circular-text",
    "name": "Circular Text",
    "description": "Текст расположенный по кругу с непрерывной анимацией вращения. Реагирует на ховер — замедление, ускорение, пауза или хаотичное вращение.",
    "main": "CircularText.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "CIRCULAR TEXT • CIRCULAR TEXT •",
        "description": "Текст по кругу",
        "control": "text"
      },
      {
        "name": "onHover",
        "type": "string",
        "default": "speedUp",
        "description": "Поведение при наведении",
        "control": "select",
        "options": [
          "slowDown",
          "speedUp",
          "pause",
          "goBonkers"
        ]
      },
      {
        "name": "spinDuration",
        "type": "number",
        "default": 20,
        "description": "Длительность одного оборота (с)",
        "control": "number",
        "min": 1,
        "max": 60,
        "step": 1
      },
      {
        "name": "className",
        "type": "string",
        "default": "",
        "description": "CSS классы",
        "control": "text"
      }
    ],
    "specificProps": [
      "onHover",
      "spinDuration",
      "text"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "circular",
      "motion",
      "rotation"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "count-up": {
    "id": "count-up",
    "name": "Счётчик",
    "description": "Анимированный числовой счётчик на framer-motion с пружинной анимацией. Поддерживает направление, задержку, разделитель и программный запуск.",
    "main": "count-up-preview.tsx",
    "props": [
      {
        "name": "to",
        "type": "number",
        "default": 100,
        "description": "Конечное значение"
      },
      {
        "name": "from",
        "type": "number",
        "default": 0,
        "description": "Начальное значение"
      },
      {
        "name": "direction",
        "type": "select",
        "options": [
          "up",
          "down"
        ],
        "default": "up",
        "description": "Направление счёта"
      },
      {
        "name": "delay",
        "type": "number",
        "default": 0,
        "description": "Задержка перед запуском (сек)"
      },
      {
        "name": "duration",
        "type": "number",
        "default": 2,
        "description": "Длительность анимации (сек)"
      },
      {
        "name": "separator",
        "type": "string",
        "default": "",
        "description": "Разделитель тысяч"
      }
    ],
    "specificProps": [
      "to",
      "from",
      "direction",
      "separator"
    ],
    "category": "text",
    "tags": [
      "number",
      "counter",
      "animation",
      "spring",
      "framer-motion"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "curved-loop": {
    "id": "curved-loop",
    "name": "Curved Loop",
    "description": "Бесконечный marquee-текст по кривой линии. Поддерживает перетаскивание мышью для изменения скорости и направления.",
    "main": "CurvedLoop.tsx",
    "props": [
      {
        "name": "marqueeText",
        "type": "string",
        "default": "CURVED LOOP • CURVED LOOP •",
        "description": "Текст бегущей строки",
        "control": "text"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 2,
        "description": "Скорость прокрутки (пикс/кадр)",
        "control": "number",
        "min": 0.5,
        "max": 20,
        "step": 0.5
      },
      {
        "name": "curveAmount",
        "type": "number",
        "default": 400,
        "description": "Глубина изгиба (px). 0 — прямая линия",
        "control": "number",
        "min": -600,
        "max": 600,
        "step": 10
      },
      {
        "name": "direction",
        "type": "string",
        "default": "left",
        "description": "Направление прокрутки",
        "control": "select",
        "options": [
          "left",
          "right"
        ]
      },
      {
        "name": "interactive",
        "type": "boolean",
        "default": true,
        "description": "Включить перетаскивание",
        "control": "checkbox"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "CSS классы для SVG-текста",
        "control": "text"
      }
    ],
    "specificProps": [
      "marqueeText",
      "speed",
      "curveAmount",
      "direction",
      "interactive"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "marquee",
      "svg",
      "loop",
      "curved"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "decrypted-text": {
    "id": "decrypted-text",
    "name": "Decrypted Text",
    "description": "Эффект дешифровки текста. Символы случайно заменяются, затем последовательно или хаотично раскрываются в исходный текст.",
    "main": "DecryptedText.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Decrypted Text",
        "description": "Текст для дешифровки",
        "control": "text"
      },
      {
        "name": "animateOn",
        "type": "string",
        "default": "hover",
        "description": "Триггер анимации",
        "control": "select",
        "options": [
          "hover",
          "view",
          "inViewHover",
          "click"
        ]
      },
      {
        "name": "speed",
        "type": "number",
        "default": 50,
        "description": "Интервал между шагами (мс)",
        "control": "number",
        "min": 10,
        "max": 300,
        "step": 10
      },
      {
        "name": "maxIterations",
        "type": "number",
        "default": 10,
        "description": "Итераций случайного шифрования (не sequential)",
        "control": "number",
        "min": 1,
        "max": 50,
        "step": 1
      },
      {
        "name": "sequential",
        "type": "boolean",
        "default": false,
        "description": "Раскрывать символы последовательно",
        "control": "checkbox"
      },
      {
        "name": "revealDirection",
        "type": "string",
        "default": "start",
        "description": "Направление раскрытия (только sequential)",
        "control": "select",
        "options": [
          "start",
          "end",
          "center"
        ]
      },
      {
        "name": "useOriginalCharsOnly",
        "type": "boolean",
        "default": false,
        "description": "Использовать только символы исходного текста",
        "control": "checkbox"
      },
      {
        "name": "characters",
        "type": "string",
        "default": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
        "description": "Набор символов для шифрования",
        "control": "text"
      },
      {
        "name": "clickMode",
        "type": "string",
        "default": "once",
        "description": "Режим клика (только animateOn=click)",
        "control": "select",
        "options": [
          "once",
          "toggle"
        ]
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "Классы для раскрытых символов",
        "control": "text"
      },
      {
        "name": "encryptedClassName",
        "type": "string",
        "default": "text-4xl font-bold opacity-40",
        "description": "Классы для зашифрованных символов",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "animateOn",
      "speed",
      "maxIterations",
      "sequential",
      "revealDirection",
      "useOriginalCharsOnly",
      "clickMode"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "decrypt",
      "cipher",
      "hover"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "fuzzy-text": {
    "id": "fuzzy-text",
    "name": "Размытый текст",
    "description": "Текст с эффектом случайного горизонтального размытия строк через Canvas. Поддерживает интерактивный hover, глитч-режим, градиент, управление интенсивностью и направлением фаззинга.",
    "main": "fuzzy-text.tsx",
    "props": [
      {
        "name": "children",
        "type": "string",
        "default": "Fuzzy",
        "description": "Текст для отображения",
        "control": "text"
      },
      {
        "name": "fontSize",
        "type": "string",
        "default": "clamp(2rem, 8vw, 8rem)",
        "description": "Размер шрифта (px или CSS-значение)",
        "control": "text"
      },
      {
        "name": "fontWeight",
        "type": "number",
        "default": 900,
        "description": "Жирность шрифта",
        "control": "number",
        "min": 100,
        "max": 900,
        "step": 100
      },
      {
        "name": "baseIntensity",
        "type": "number",
        "default": 0.18,
        "description": "Базовая интенсивность фаззинга (0–1)",
        "control": "number",
        "min": 0,
        "max": 1,
        "step": 0.01
      },
      {
        "name": "hoverIntensity",
        "type": "number",
        "default": 0.5,
        "description": "Интенсивность при наведении (0–1)",
        "control": "number",
        "min": 0,
        "max": 1,
        "step": 0.01
      },
      {
        "name": "fuzzRange",
        "type": "number",
        "default": 30,
        "description": "Максимальный сдвиг строки в пикселях",
        "control": "number",
        "min": 1,
        "max": 100,
        "step": 1
      },
      {
        "name": "direction",
        "type": "string",
        "default": "horizontal",
        "description": "Направление фаззинга",
        "control": "select",
        "options": [
          "horizontal",
          "vertical",
          "both"
        ]
      },
      {
        "name": "enableHover",
        "type": "boolean",
        "default": true,
        "description": "Реагировать на наведение мыши",
        "control": "checkbox"
      },
      {
        "name": "glitchMode",
        "type": "boolean",
        "default": false,
        "description": "Периодические вспышки глитча",
        "control": "checkbox"
      },
      {
        "name": "glitchInterval",
        "type": "number",
        "default": 2000,
        "description": "Интервал между глитчами (мс)",
        "control": "number",
        "min": 200,
        "max": 10000,
        "step": 100
      },
      {
        "name": "glitchDuration",
        "type": "number",
        "default": 200,
        "description": "Длительность одного глитча (мс)",
        "control": "number",
        "min": 50,
        "max": 1000,
        "step": 50
      },
      {
        "name": "transitionDuration",
        "type": "number",
        "default": 0,
        "description": "Длительность плавного перехода интенсивности (мс, 0 = мгновенно)",
        "control": "number",
        "min": 0,
        "max": 2000,
        "step": 50
      },
      {
        "name": "clickEffect",
        "type": "boolean",
        "default": false,
        "description": "Вспышка при клике",
        "control": "checkbox"
      },
      {
        "name": "fps",
        "type": "number",
        "default": 60,
        "description": "Частота кадров анимации",
        "control": "number",
        "min": 10,
        "max": 120,
        "step": 5
      },
      {
        "name": "letterSpacing",
        "type": "number",
        "default": 0,
        "description": "Межбуквенный интервал в пикселях",
        "control": "number",
        "min": -10,
        "max": 50,
        "step": 1
      },
      {
        "name": "className",
        "type": "string",
        "default": "",
        "description": "CSS классы на canvas-элементе",
        "control": "text"
      }
    ],
    "specificProps": [
      "children",
      "baseIntensity",
      "hoverIntensity",
      "fuzzRange",
      "direction",
      "enableHover",
      "glitchMode",
      "glitchInterval",
      "glitchDuration",
      "transitionDuration",
      "clickEffect"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "canvas",
      "glitch",
      "noise",
      "interactive"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "gradient-text": {
    "id": "gradient-text",
    "name": "Gradient Text",
    "description": "Текст с анимированным градиентом. Поддерживает горизонтальное, вертикальное и диагональное движение, yoyo-режим и опциональную градиентную рамку.",
    "main": "GradientText.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Gradient Text",
        "description": "Текст с градиентом",
        "control": "text"
      },
      {
        "name": "animationSpeed",
        "type": "number",
        "default": 8,
        "description": "Скорость анимации (с на цикл)",
        "control": "number",
        "min": 1,
        "max": 30,
        "step": 1
      },
      {
        "name": "direction",
        "type": "string",
        "default": "horizontal",
        "description": "Направление движения градиента",
        "control": "select",
        "options": [
          "horizontal",
          "vertical",
          "diagonal"
        ]
      },
      {
        "name": "yoyo",
        "type": "boolean",
        "default": true,
        "description": "Туда-обратно (иначе — бесконечный цикл)",
        "control": "checkbox"
      },
      {
        "name": "showBorder",
        "type": "boolean",
        "default": false,
        "description": "Показывать градиентную рамку",
        "control": "checkbox"
      },
      {
        "name": "pauseOnHover",
        "type": "boolean",
        "default": false,
        "description": "Пауза при наведении",
        "control": "checkbox"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-5xl font-bold",
        "description": "CSS классы",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "animationSpeed",
      "direction",
      "yoyo",
      "showBorder",
      "pauseOnHover"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "gradient",
      "motion",
      "color"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "line-shadow-text": {
    "id": "line-shadow-text",
    "name": "Линейная тень текста",
    "description": "Текст с анимированной диагональной штриховкой в качестве тени. Штриховка бесконечно движется по тексту через bg-clip-text и CSS-анимацию.",
    "main": "line-shadow-text-preview.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "LineShadow",
        "description": "Текст для отображения",
        "control": "text"
      },
      {
        "name": "shadowColor",
        "type": "string",
        "default": "#a855f7",
        "description": "Цвет штриховки тени",
        "control": "text"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-6xl font-bold",
        "description": "CSS классы на корневом элементе",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "shadowColor"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "shadow",
      "gradient",
      "css-animation",
      "decorative"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "magic-text-reveal": {
    "id": "magic-text-reveal",
    "name": "Скрытый текст",
    "description": "Текст скрыт облаком мерцающих частиц. При наведении частицы возвращаются на исходные позиции и текст проявляется. Canvas-анимация с шумовым движением, sparkle-эффектом и плавным reveal.",
    "main": "magic-text-reveal.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Magic Text",
        "description": "Скрытый текст для проявления",
        "control": "text"
      },
      {
        "name": "color",
        "type": "string",
        "default": "rgba(255, 255, 255, 1)",
        "description": "Цвет текста и частиц",
        "control": "text"
      },
      {
        "name": "fontSize",
        "type": "number",
        "default": 70,
        "description": "Размер шрифта в пикселях",
        "control": "number",
        "min": 20,
        "max": 200,
        "step": 2
      },
      {
        "name": "fontWeight",
        "type": "number",
        "default": 600,
        "description": "Жирность шрифта",
        "control": "number",
        "min": 100,
        "max": 900,
        "step": 100
      },
      {
        "name": "spread",
        "type": "number",
        "default": 40,
        "description": "Радиус блуждания частиц в пикселях",
        "control": "number",
        "min": 5,
        "max": 150,
        "step": 5
      },
      {
        "name": "speed",
        "type": "number",
        "default": 0.5,
        "description": "Скорость движения частиц",
        "control": "number",
        "min": 0.1,
        "max": 3,
        "step": 0.1
      },
      {
        "name": "density",
        "type": "number",
        "default": 4,
        "description": "Плотность частиц (1 = максимум, 5 = минимум)",
        "control": "number",
        "min": 1,
        "max": 5,
        "step": 1
      },
      {
        "name": "resetOnMouseLeave",
        "type": "boolean",
        "default": true,
        "description": "Возвращать частицы в хаос при уходе курсора",
        "control": "checkbox"
      },
      {
        "name": "className",
        "type": "string",
        "default": "",
        "description": "CSS классы на корневом контейнере",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "spread",
      "speed",
      "density",
      "resetOnMouseLeave"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "canvas",
      "particles",
      "hover",
      "reveal",
      "interactive"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "morphing-text": {
    "id": "morphing-text",
    "name": "Морфинг текста",
    "description": "Плавный переход между словами через blur-морфинг с SVG-фильтром threshold. Слова перетекают друг в друга с эффектом расплавленного текста.",
    "main": "morphing-text-preview.tsx",
    "props": [
      {
        "name": "texts",
        "type": "string",
        "default": "Дизайн, Интерфейс, Анимация, Движение",
        "description": "Строки через запятую — каждая становится отдельным словом в цикле",
        "control": "text"
      },
      {
        "name": "className",
        "type": "string",
        "default": "",
        "description": "CSS классы на корневом контейнере",
        "control": "text"
      }
    ],
    "specificProps": [
      "texts"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "morph",
      "blur",
      "svg-filter",
      "loop"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "rolling-text": {
    "id": "rolling-text",
    "name": "Перекатывающийся текст",
    "description": "Буквы текста «перекатываются» через 3D-вращение по оси X — старая буква уходит назад, новая выкатывается вперёд. Запускается сразу или при появлении в области видимости.",
    "main": "rolling-text-preview.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Перекатывающийся текст",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "duration",
        "type": "number",
        "default": 0.5,
        "description": "Длительность анимации одной буквы (с)",
        "control": "number",
        "min": 0.1,
        "max": 3,
        "step": 0.05
      },
      {
        "name": "delay",
        "type": "number",
        "default": 0.1,
        "description": "Задержка stagger между буквами (с)",
        "control": "number",
        "min": 0,
        "max": 0.5,
        "step": 0.01
      },
      {
        "name": "inView",
        "type": "boolean",
        "default": false,
        "description": "Запускать анимацию при появлении в области видимости",
        "control": "checkbox"
      },
      {
        "name": "inViewOnce",
        "type": "boolean",
        "default": true,
        "description": "Запустить анимацию только один раз",
        "control": "checkbox"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "CSS классы на корневом span",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "duration",
      "delay",
      "inView",
      "inViewOnce"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "3d",
      "rotate",
      "framer-motion",
      "stagger",
      "in-view"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "rotating-text": {
    "id": "rotating-text",
    "name": "Чередующийся Текст",
    "description": "Текст, который автоматически переключается между несколькими строками с анимацией. Поддерживает разбивку по буквам, словам или строкам, stagger, spring-переходы и программное управление через ref.",
    "main": "rotating-text.tsx",
    "props": [
      {
        "name": "texts",
        "type": "string[]",
        "default": [
          "Дизайн",
          "Интерфейс",
          "Анимация",
          "Движение"
        ],
        "description": "Массив строк для чередования",
        "control": "text"
      },
      {
        "name": "rotationInterval",
        "type": "number",
        "default": 2000,
        "description": "Интервал смены текста (мс)",
        "control": "number",
        "min": 500,
        "max": 10000,
        "step": 100
      },
      {
        "name": "splitBy",
        "type": "string",
        "default": "characters",
        "description": "Разбивка анимации: по буквам, словам или строкам",
        "control": "select",
        "options": [
          "characters",
          "words",
          "lines"
        ]
      },
      {
        "name": "staggerDuration",
        "type": "number",
        "default": 0.03,
        "description": "Задержка stagger между элементами (с)",
        "control": "number",
        "min": 0,
        "max": 0.2,
        "step": 0.005
      },
      {
        "name": "staggerFrom",
        "type": "string",
        "default": "first",
        "description": "Откуда начинается stagger",
        "control": "select",
        "options": [
          "first",
          "last",
          "center",
          "random"
        ]
      },
      {
        "name": "loop",
        "type": "boolean",
        "default": true,
        "description": "Зациклить чередование",
        "control": "checkbox"
      },
      {
        "name": "auto",
        "type": "boolean",
        "default": true,
        "description": "Автоматически переключать текст",
        "control": "checkbox"
      },
      {
        "name": "animatePresenceMode",
        "type": "string",
        "default": "wait",
        "description": "Режим AnimatePresence",
        "control": "select",
        "options": [
          "wait",
          "sync"
        ]
      },
      {
        "name": "mainClassName",
        "type": "string",
        "default": "text-4xl font-bold overflow-hidden",
        "description": "CSS классы для корневого span",
        "control": "text"
      },
      {
        "name": "elementLevelClassName",
        "type": "string",
        "default": "",
        "description": "CSS классы для каждой буквы/слова",
        "control": "text"
      }
    ],
    "specificProps": [
      "rotationInterval",
      "splitBy",
      "staggerDuration",
      "staggerFrom",
      "loop",
      "auto",
      "animatePresenceMode"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "rotating",
      "framer-motion",
      "typewriter",
      "stagger"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "scroll-float": {
    "id": "scroll-float",
    "name": "Scroll Float",
    "description": "Текст с эффектом всплытия при скролле. Каждая буква анимируется через GSAP ScrollTrigger — появляется снизу с деформацией масштаба, синхронизированно с позицией скролла.",
    "main": "scroll-float-preview.tsx",
    "props": [
      {
        "name": "children",
        "type": "string",
        "default": "Scroll Float",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "animationDuration",
        "type": "number",
        "default": 1,
        "description": "Длительность анимации каждой буквы (с)",
        "control": "number",
        "min": 0.1,
        "max": 5,
        "step": 0.1
      },
      {
        "name": "ease",
        "type": "string",
        "default": "back.inOut(2)",
        "description": "GSAP easing функция",
        "control": "select",
        "options": [
          "back.inOut(2)",
          "back.out(1.7)",
          "power3.out",
          "power4.out",
          "elastic.out(1, 0.3)",
          "expo.out",
          "sine.inOut",
          "circ.inOut"
        ]
      },
      {
        "name": "scrollStart",
        "type": "string",
        "default": "center bottom+=50%",
        "description": "Точка начала анимации (ScrollTrigger start)",
        "control": "text"
      },
      {
        "name": "scrollEnd",
        "type": "string",
        "default": "bottom bottom-=40%",
        "description": "Точка конца анимации (ScrollTrigger end)",
        "control": "text"
      },
      {
        "name": "stagger",
        "type": "number",
        "default": 0.03,
        "description": "Задержка между буквами (с)",
        "control": "number",
        "min": 0,
        "max": 0.3,
        "step": 0.005
      },
      {
        "name": "containerClassName",
        "type": "string",
        "default": "",
        "description": "CSS классы для контейнера <h2>",
        "control": "text"
      },
      {
        "name": "textClassName",
        "type": "string",
        "default": "",
        "description": "CSS классы для текстового <span>",
        "control": "text"
      }
    ],
    "specificProps": [
      "children",
      "animationDuration",
      "ease",
      "stagger",
      "scrollStart",
      "scrollEnd"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "gsap",
      "scroll",
      "split",
      "scrub"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "scroll-reveal": {
    "id": "scroll-reveal",
    "name": "Scroll Reveal",
    "description": "Текст с эффектом раскрытия при скролле. Слова появляются с opacity и blur, весь блок плавно выравнивается из наклонного положения — всё синхронизировано с позицией скролла через GSAP ScrollTrigger.",
    "main": "scroll-reveal-preview.tsx",
    "props": [
      {
        "name": "children",
        "type": "string",
        "default": "Текст появляется по мере того как вы прокручиваете страницу вниз.",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "enableBlur",
        "type": "boolean",
        "default": true,
        "description": "Включить blur-анимацию слов",
        "control": "checkbox"
      },
      {
        "name": "baseOpacity",
        "type": "number",
        "default": 0.1,
        "description": "Начальная прозрачность слов (0–1)",
        "control": "number",
        "min": 0,
        "max": 1,
        "step": 0.05
      },
      {
        "name": "baseRotation",
        "type": "number",
        "default": 3,
        "description": "Начальный наклон блока в градусах",
        "control": "number",
        "min": 0,
        "max": 15,
        "step": 0.5
      },
      {
        "name": "blurStrength",
        "type": "number",
        "default": 4,
        "description": "Сила размытия в пикселях",
        "control": "number",
        "min": 0,
        "max": 20,
        "step": 1
      },
      {
        "name": "rotationEnd",
        "type": "string",
        "default": "bottom bottom",
        "description": "Точка конца анимации наклона (ScrollTrigger end)",
        "control": "text"
      },
      {
        "name": "wordAnimationEnd",
        "type": "string",
        "default": "bottom bottom",
        "description": "Точка конца анимации слов (ScrollTrigger end)",
        "control": "text"
      },
      {
        "name": "containerClassName",
        "type": "string",
        "default": "",
        "description": "CSS классы для контейнера <h2>",
        "control": "text"
      },
      {
        "name": "textClassName",
        "type": "string",
        "default": "",
        "description": "CSS классы для текстового <p>",
        "control": "text"
      }
    ],
    "specificProps": [
      "enableBlur",
      "baseOpacity",
      "baseRotation",
      "blurStrength",
      "rotationEnd",
      "wordAnimationEnd"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "gsap",
      "scroll",
      "blur",
      "reveal",
      "scrub"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "scroll-velocity": {
    "id": "scroll-velocity",
    "name": "Скорость скролла",
    "description": "Бесконечная бегущая строка, скорость которой зависит от скорости прокрутки страницы. Чётные строки идут вправо, нечётные — влево. Основана на framer-motion useVelocity и useSpring.",
    "main": "scroll-velocity.tsx",
    "props": [
      {
        "name": "texts",
        "type": "string",
        "default": "Scroll Velocity •, Framer Motion •",
        "description": "Строки через запятую — каждая становится отдельной бегущей строкой",
        "control": "text"
      },
      {
        "name": "velocity",
        "type": "number",
        "default": 100,
        "description": "Базовая скорость (пикс/с)",
        "control": "number",
        "min": 10,
        "max": 500,
        "step": 10
      },
      {
        "name": "damping",
        "type": "number",
        "default": 50,
        "description": "Демпфирование spring (выше = быстрее затухает)",
        "control": "number",
        "min": 5,
        "max": 200,
        "step": 5
      },
      {
        "name": "stiffness",
        "type": "number",
        "default": 400,
        "description": "Жёсткость spring (выше = резче реакция)",
        "control": "number",
        "min": 50,
        "max": 1000,
        "step": 50
      },
      {
        "name": "numCopies",
        "type": "number",
        "default": 6,
        "description": "Количество копий для бесшовного повтора",
        "control": "number",
        "min": 2,
        "max": 12,
        "step": 1
      },
      {
        "name": "className",
        "type": "string",
        "default": "",
        "description": "CSS классы для каждого span с текстом",
        "control": "text"
      }
    ],
    "specificProps": [
      "texts",
      "velocity",
      "damping",
      "stiffness",
      "numCopies"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "marquee",
      "scroll",
      "framer-motion",
      "velocity",
      "spring"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "shiny-text": {
    "id": "shiny-text",
    "name": "Shiny Text",
    "description": "Текст с анимированным блеском. Световой блик скользит по тексту с настраиваемой скоростью, цветом и направлением.",
    "main": "ShinyText.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Shiny Text",
        "description": "Текст с блеском",
        "control": "text"
      },
      {
        "name": "color",
        "type": "string",
        "default": "#b5b5b5",
        "description": "Основной цвет текста",
        "control": "color"
      },
      {
        "name": "shineColor",
        "type": "string",
        "default": "#ffffff",
        "description": "Цвет блика",
        "control": "color"
      },
      {
        "name": "speed",
        "type": "number",
        "default": 2,
        "description": "Скорость анимации (с)",
        "control": "number",
        "min": 0.5,
        "max": 10,
        "step": 0.5
      },
      {
        "name": "spread",
        "type": "number",
        "default": 120,
        "description": "Угол градиента (°)",
        "control": "number",
        "min": 0,
        "max": 360,
        "step": 5
      },
      {
        "name": "delay",
        "type": "number",
        "default": 0,
        "description": "Пауза между проходами (с)",
        "control": "number",
        "min": 0,
        "max": 5,
        "step": 0.5
      },
      {
        "name": "direction",
        "type": "string",
        "default": "left",
        "description": "Направление блика",
        "control": "select",
        "options": [
          "left",
          "right"
        ]
      },
      {
        "name": "yoyo",
        "type": "boolean",
        "default": false,
        "description": "Блик движется туда-обратно",
        "control": "checkbox"
      },
      {
        "name": "pauseOnHover",
        "type": "boolean",
        "default": false,
        "description": "Пауза при наведении",
        "control": "checkbox"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": false,
        "description": "Выключить анимацию",
        "control": "checkbox"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "CSS классы",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "color",
      "shineColor",
      "speed",
      "spread",
      "delay",
      "direction",
      "yoyo",
      "pauseOnHover"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "shiny",
      "gradient",
      "motion"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "split-text": {
    "id": "split-text",
    "name": "Split Text",
    "description": "Анимированный текст на GSAP с разбивкой по символам, словам или строкам. Запускается при скролле через ScrollTrigger.",
    "main": "SplitText.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Привет, это Split Text!",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "splitType",
        "type": "string",
        "default": "chars",
        "description": "Тип разбивки текста",
        "control": "select",
        "options": [
          "chars",
          "words",
          "lines",
          "words, chars"
        ]
      },
      {
        "name": "tag",
        "type": "string",
        "default": "p",
        "description": "HTML тег обёртки",
        "control": "select",
        "options": [
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "span"
        ]
      },
      {
        "name": "delay",
        "type": "number",
        "default": 50,
        "description": "Задержка stagger между элементами (мс)",
        "control": "number",
        "min": 0,
        "max": 500,
        "step": 5
      },
      {
        "name": "duration",
        "type": "number",
        "default": 1.25,
        "description": "Длительность анимации каждого элемента (с)",
        "control": "number",
        "min": 0.1,
        "max": 5,
        "step": 0.05
      },
      {
        "name": "ease",
        "type": "string",
        "default": "power3.out",
        "description": "GSAP easing функция",
        "control": "select",
        "options": [
          "power3.out",
          "power2.out",
          "power4.out",
          "back.out(1.7)",
          "elastic.out(1, 0.3)",
          "expo.out",
          "sine.out",
          "circ.out"
        ]
      },
      {
        "name": "threshold",
        "type": "number",
        "default": 0.1,
        "description": "Порог видимости для запуска (0–1)",
        "control": "number",
        "min": 0,
        "max": 1,
        "step": 0.05
      },
      {
        "name": "rootMargin",
        "type": "string",
        "default": "-100px",
        "description": "rootMargin для ScrollTrigger (например -100px)",
        "control": "text"
      },
      {
        "name": "textAlign",
        "type": "string",
        "default": "center",
        "description": "Выравнивание текста",
        "control": "select",
        "options": [
          "left",
          "center",
          "right"
        ]
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "CSS классы для элемента",
        "control": "text"
      }
    ],
    "specificProps": [
      "splitType",
      "tag",
      "delay",
      "duration",
      "ease",
      "threshold",
      "rootMargin",
      "textAlign"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "gsap",
      "scroll",
      "split"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "text-type": {
    "id": "text-type",
    "name": "Text Type",
    "description": "Эффект печатающей машинки. Поддерживает массив строк с удалением, переменную скорость, цвета для каждой строки и кастомный курсор.",
    "main": "TextType.tsx",
    "props": [
      {
        "name": "text",
        "type": "string",
        "default": "Привет, мир!",
        "description": "Текст или массив строк (через запятую в UI)",
        "control": "text"
      },
      {
        "name": "typingSpeed",
        "type": "number",
        "default": 50,
        "description": "Скорость печати (мс/символ)",
        "control": "number",
        "min": 10,
        "max": 500,
        "step": 10
      },
      {
        "name": "deletingSpeed",
        "type": "number",
        "default": 30,
        "description": "Скорость удаления (мс/символ)",
        "control": "number",
        "min": 10,
        "max": 300,
        "step": 10
      },
      {
        "name": "pauseDuration",
        "type": "number",
        "default": 2000,
        "description": "Пауза после завершения строки (мс)",
        "control": "number",
        "min": 0,
        "max": 10000,
        "step": 100
      },
      {
        "name": "initialDelay",
        "type": "number",
        "default": 0,
        "description": "Задержка перед началом (мс)",
        "control": "number",
        "min": 0,
        "max": 5000,
        "step": 100
      },
      {
        "name": "loop",
        "type": "boolean",
        "default": true,
        "description": "Зациклить анимацию",
        "control": "checkbox"
      },
      {
        "name": "showCursor",
        "type": "boolean",
        "default": true,
        "description": "Показывать курсор",
        "control": "checkbox"
      },
      {
        "name": "cursorCharacter",
        "type": "string",
        "default": "|",
        "description": "Символ курсора",
        "control": "text"
      },
      {
        "name": "cursorBlinkDuration",
        "type": "number",
        "default": 0.5,
        "description": "Скорость мигания курсора (с)",
        "control": "number",
        "min": 0.1,
        "max": 2,
        "step": 0.1
      },
      {
        "name": "hideCursorWhileTyping",
        "type": "boolean",
        "default": false,
        "description": "Скрывать курсор во время печати",
        "control": "checkbox"
      },
      {
        "name": "reverseMode",
        "type": "boolean",
        "default": false,
        "description": "Печатать текст задом наперёд",
        "control": "checkbox"
      },
      {
        "name": "startOnVisible",
        "type": "boolean",
        "default": false,
        "description": "Запускать при появлении в области видимости",
        "control": "checkbox"
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "CSS классы",
        "control": "text"
      }
    ],
    "specificProps": [
      "text",
      "typingSpeed",
      "deletingSpeed",
      "pauseDuration",
      "loop",
      "showCursor",
      "cursorCharacter",
      "cursorBlinkDuration",
      "hideCursorWhileTyping",
      "reverseMode"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "typing",
      "gsap",
      "cursor"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "variable-proximity": {
    "id": "variable-proximity",
    "name": "Близость шрифта",
    "description": "Буквы меняют параметры вариативного шрифта в зависимости от близости курсора. Чем ближе мышь — тем жирнее, шире или курсивнее становится буква. Работает с любым вариативным шрифтом через fontVariationSettings.",
    "main": "variable-proximity-preview.tsx",
    "props": [
      {
        "name": "label",
        "type": "string",
        "default": "Наведи курсор",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "fromFontVariationSettings",
        "type": "string",
        "default": "'wght' 400, 'wdth' 100",
        "description": "Начальные параметры шрифта (далеко от курсора)",
        "control": "text"
      },
      {
        "name": "toFontVariationSettings",
        "type": "string",
        "default": "'wght' 900, 'wdth' 125",
        "description": "Конечные параметры шрифта (под курсором)",
        "control": "text"
      },
      {
        "name": "radius",
        "type": "number",
        "default": 100,
        "description": "Радиус влияния курсора в пикселях",
        "control": "number",
        "min": 20,
        "max": 400,
        "step": 10
      },
      {
        "name": "falloff",
        "type": "string",
        "default": "linear",
        "description": "Кривая затухания эффекта",
        "control": "select",
        "options": [
          "linear",
          "exponential",
          "gaussian"
        ]
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-5xl font-bold",
        "description": "CSS классы для текста",
        "control": "text"
      }
    ],
    "specificProps": [
      "label",
      "radius",
      "falloff",
      "fromFontVariationSettings",
      "toFontVariationSettings"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "variable-font",
      "mouse",
      "proximity",
      "interactive"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  },
  "wave-text": {
    "id": "wave-text",
    "name": "Волновой текст",
    "description": "Буквы текста непрерывно анимируются волной — каждая буква покачивается вверх-вниз со сдвигом по времени относительно соседей. Поддерживает prefers-reduced-motion.",
    "main": "wave-text.tsx",
    "props": [
      {
        "name": "children",
        "type": "string",
        "default": "Волновой текст",
        "description": "Текст для анимации",
        "control": "text"
      },
      {
        "name": "amplitude",
        "type": "number",
        "default": 8,
        "description": "Амплитуда волны в пикселях",
        "control": "number",
        "min": 1,
        "max": 40,
        "step": 1
      },
      {
        "name": "duration",
        "type": "number",
        "default": 1.2,
        "description": "Длительность одного цикла волны (с)",
        "control": "number",
        "min": 0.3,
        "max": 5,
        "step": 0.1
      },
      {
        "name": "staggerDelay",
        "type": "number",
        "default": 0.05,
        "description": "Задержка между буквами (с)",
        "control": "number",
        "min": 0,
        "max": 0.3,
        "step": 0.01
      },
      {
        "name": "className",
        "type": "string",
        "default": "text-4xl font-bold",
        "description": "CSS классы",
        "control": "text"
      }
    ],
    "specificProps": [
      "children",
      "amplitude",
      "duration",
      "staggerDelay"
    ],
    "category": "text",
    "tags": [
      "animation",
      "text",
      "wave",
      "framer-motion",
      "loop",
      "stagger"
    ],
    "author": "davidhdev",
    "version": "1.0.0"
  }
} as const satisfies Record<string, Partial<ComponentConfig> & { id: string }>;
