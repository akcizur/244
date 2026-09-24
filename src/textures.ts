// Realistic Procedural Textures for Materials using HTML Canvas
import * as THREE from 'three';

let cachedPlasticMaps: { normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } | null = null;

// Generates an authentic ABS plastic normal map with realistic micro-noises, scratches, and mold grain
export function createPlasticTextureMaps(): { normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  if (cachedPlasticMaps) {
    return cachedPlasticMaps;
  }

  // 1024x1024 for needle-sharp normal map grooves and micro-scratches
  const size = 1024;
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const hCtx = heightCanvas.getContext('2d')!;

  // Neutral plane (mid-gray = 128)
  hCtx.fillStyle = '#808080';
  hCtx.fillRect(0, 0, size, size);

  // 1. Multi-octave surface noises (injection mold steel EDM micro-grain + subtle plastic cooling waviness)
  const hImgData = hCtx.getImageData(0, 0, size, size);
  const hData = hImgData.data;

  // Pseudo-random deterministic noise function with octaves
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // High-frequency injection mold spark EDM granulation
      const granNoise = (Math.random() - 0.5) * 7.0;

      // Medium-frequency gentle mold flow ripple
      const flowRipple =
        Math.sin(x * 0.045 + y * 0.02) * 2.5 +
        Math.cos(x * 0.025 - y * 0.04) * 2.5;

      // Fine micro-waviness
      const microWave = Math.sin(x * 0.12 + Math.sin(y * 0.08) * 2.0) * 1.5;

      const v = Math.min(255, Math.max(0, 128 + granNoise + flowRipple + microWave));
      hData[idx] = v;
      hData[idx + 1] = v;
      hData[idx + 2] = v;
    }
  }
  hCtx.putImageData(hImgData, 0, 0);

  // 2. Procedural Authentic Wear: Fewer, larger scratches of varied sizes + scattered impact dents (obouchané důlky)
  hCtx.lineCap = 'round';
  hCtx.lineJoin = 'round';

  // A) Obouchané důlky (Impact dents, craters, and corner collision pockmarks) - sparse and logical ("sem tam")
  const dentCount = 18;
  for (let i = 0; i < dentCount; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    // Varied sizes: from small 3.5px pebble dings to larger 12px corner impact craters
    const radius = 3.5 + Math.random() * 8.5;
    const isAngular = Math.random() > 0.45; // 55% angular brick corner impacts, 45% circular dents

    // 1. Raised deformed plastic lip/ridge around the dent (displaced material pushed up)
    const rimGradient = hCtx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.55);
    rimGradient.addColorStop(0, 'rgba(185, 185, 185, 0.45)');
    rimGradient.addColorStop(0.6, 'rgba(170, 170, 170, 0.35)');
    rimGradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
    hCtx.fillStyle = rimGradient;
    hCtx.beginPath();
    if (isAngular) {
      const rot = Math.random() * Math.PI;
      const r = radius * 1.45;
      hCtx.moveTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
      hCtx.lineTo(cx + Math.cos(rot + 2.1) * r, cy + Math.sin(rot + 2.1) * r);
      hCtx.lineTo(cx + Math.cos(rot + 4.2) * r, cy + Math.sin(rot + 4.2) * r);
      hCtx.closePath();
    } else {
      hCtx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    }
    hCtx.fill();

    // 2. Deep indented depression/crater floor (dark gouge cut into plastic)
    const craterGradient = hCtx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 0, cx, cy, radius);
    craterGradient.addColorStop(0, 'rgba(35, 35, 35, 0.65)');
    craterGradient.addColorStop(0.7, 'rgba(55, 55, 55, 0.55)');
    craterGradient.addColorStop(1, 'rgba(110, 110, 110, 0.15)');
    hCtx.fillStyle = craterGradient;
    hCtx.beginPath();
    if (isAngular) {
      const rot = Math.random() * Math.PI;
      hCtx.moveTo(cx + Math.cos(rot) * radius, cy + Math.sin(rot) * radius);
      hCtx.lineTo(cx + Math.cos(rot + 2.1) * radius, cy + Math.sin(rot + 2.1) * radius);
      hCtx.lineTo(cx + Math.cos(rot + 4.2) * radius, cy + Math.sin(rot + 4.2) * radius);
      hCtx.closePath();
    } else {
      hCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    }
    hCtx.fill();
  }

  // B) Realistically sparse, larger scratches with varied sizes ("větší, méně scratches, různé velikosti")
  // 1. Long curved handling scratches (length 110px to 240px) - only 5
  const longScratchCount = 5;
  for (let i = 0; i < longScratchCount; i++) {
    const x0 = Math.random() * size;
    const y0 = Math.random() * size;
    const length = 110 + Math.random() * 130;
    const angle = Math.random() * Math.PI * 2;
    const curveOffset = (Math.random() - 0.5) * 55;

    const x1 = x0 + Math.cos(angle) * length;
    const y1 = y0 + Math.sin(angle) * length;
    const cx = (x0 + x1) / 2 + Math.cos(angle + Math.PI / 2) * curveOffset;
    const cy = (y0 + y1) / 2 + Math.sin(angle + Math.PI / 2) * curveOffset;

    // Outer displaced plastic burr ridge
    hCtx.strokeStyle = `rgba(180, 180, 180, ${0.25 + Math.random() * 0.25})`;
    hCtx.lineWidth = 4.2;
    hCtx.beginPath();
    hCtx.moveTo(x0 + 1.2, y0 + 1.2);
    hCtx.quadraticCurveTo(cx + 1.2, cy + 1.2, x1 + 1.2, y1 + 1.2);
    hCtx.stroke();

    // Deep center groove
    hCtx.strokeStyle = `rgba(45, 45, 45, ${0.55 + Math.random() * 0.3})`;
    hCtx.lineWidth = 2.2;
    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    hCtx.quadraticCurveTo(cx, cy, x1, y1);
    hCtx.stroke();
  }

  // 2. Medium collision scratches (length 45px to 95px) - only 9
  const medScratchCount = 9;
  for (let i = 0; i < medScratchCount; i++) {
    const x0 = Math.random() * size;
    const y0 = Math.random() * size;
    const length = 45 + Math.random() * 50;
    const angle = Math.random() * Math.PI * 2;
    const x1 = x0 + Math.cos(angle) * length;
    const y1 = y0 + Math.sin(angle) * length;

    hCtx.strokeStyle = `rgba(185, 185, 185, 0.28)`;
    hCtx.lineWidth = 3.6;
    hCtx.beginPath();
    hCtx.moveTo(x0 + 1, y0 + 1);
    hCtx.lineTo(x1 + 1, y1 + 1);
    hCtx.stroke();

    hCtx.strokeStyle = `rgba(40, 40, 40, 0.6)`;
    hCtx.lineWidth = 1.8;
    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    hCtx.lineTo(x1, y1);
    hCtx.stroke();
  }

  // 3. Short sharp impact nicks (length 18px to 35px) - only 8
  const shortScratchCount = 8;
  for (let i = 0; i < shortScratchCount; i++) {
    const x0 = Math.random() * size;
    const y0 = Math.random() * size;
    const length = 18 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const x1 = x0 + Math.cos(angle) * length;
    const y1 = y0 + Math.sin(angle) * length;

    hCtx.strokeStyle = `rgba(190, 190, 190, 0.3)`;
    hCtx.lineWidth = 3.0;
    hCtx.beginPath();
    hCtx.moveTo(x0 + 0.8, y0 + 0.8);
    hCtx.lineTo(x1 + 0.8, y1 + 0.8);
    hCtx.stroke();

    hCtx.strokeStyle = `rgba(35, 35, 35, 0.65)`;
    hCtx.lineWidth = 1.5;
    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    hCtx.lineTo(x1, y1);
    hCtx.stroke();
  }

  // 3. Convert Heightmap to High-Fidelity Tangent-Space Normal Map using Sobel Filter
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d')!;
  const nImgData = nCtx.createImageData(size, size);
  const nData = nImgData.data;

  const heightPixels = hCtx.getImageData(0, 0, size, size).data;
  const getH = (x: number, y: number): number => {
    const px = (x + size) % size;
    const py = (y + size) % size;
    return heightPixels[(py * size + px) * 4] / 255;
  };

  const normalStrength = 2.8;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 3x3 Sobel kernel
      const tl = getH(x - 1, y - 1);
      const t = getH(x, y - 1);
      const tr = getH(x + 1, y - 1);
      const l = getH(x - 1, y);
      const r = getH(x + 1, y);
      const bl = getH(x - 1, y + 1);
      const b = getH(x, y + 1);
      const br = getH(x + 1, y + 1);

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dX * normalStrength;
      let ny = -dY * normalStrength;
      let nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * size + x) * 4;
      nData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      nData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      nData[idx + 3] = 255;
    }
  }
  nCtx.putImageData(nImgData, 0, 0);

  const normalTex = new THREE.CanvasTexture(normalCanvas);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(2.0, 2.0);
  normalTex.anisotropy = 8;
  normalTex.needsUpdate = true;

  // 4. Correlated Roughness Map (Mirror-gloss ABS base with light-scattering scratches)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  // Base polished plastic roughness: ~0.09 (23 in sRGB)
  rCtx.fillStyle = '#171717';
  rCtx.fillRect(0, 0, size, size);

  const rImgData = rCtx.getImageData(0, 0, size, size);
  const rData = rImgData.data;

  for (let i = 0; i < rData.length; i += 4) {
    // Normal deviation from flat (128, 128, 255)
    const devX = Math.abs(nData[i] - 128);
    const devY = Math.abs(nData[i + 1] - 128);
    const deviation = (devX + devY) / 128.0;

    // High deviation (scratch or pit) breaks gloss and diffuses light (roughness up to 0.45)
    const baseRoughness = 22 + (Math.random() - 0.5) * 4; // 0.086 ± 0.015
    const scratchRoughness = deviation * 95; // spikes roughness over scratches
    const totalRoughness = Math.min(255, Math.max(0, Math.floor(baseRoughness + scratchRoughness)));

    rData[i] = totalRoughness;
    rData[i + 1] = totalRoughness;
    rData[i + 2] = totalRoughness;
    rData[i + 3] = 255;
  }
  rCtx.putImageData(rImgData, 0, 0);

  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(2.0, 2.0);
  roughTex.anisotropy = 8;
  roughTex.needsUpdate = true;

  cachedPlasticMaps = { normalMap: normalTex, roughnessMap: roughTex };
  return cachedPlasticMaps;
}

// Custom Grid Lines Shader Material with Player-Centered Radial Blur Gradient falloff and screen-space anti-aliasing
export function createRadialGridMaterial(theme: 'dark' | 'light'): THREE.ShaderMaterial {
  const isDark = theme === 'dark';
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColorMinor: { value: new THREE.Color(isDark ? 0x223048 : 0x94a3b8) },
      uColorMajor: { value: new THREE.Color(isDark ? 0x10b981 : 0x059669) },
      uGridMinor: { value: 0.5 },
      uGridMajor: { value: 1.0 },
      uPlayerPos: { value: new THREE.Vector2(0, 0) },
      uInnerRadius: { value: 4.0 },
      uMediumRadius: { value: 14.0 },
      uOuterRadius: { value: 26.0 },
      uCursorPos: { value: new THREE.Vector2(0, 0) },
      uCursorHighlight: { value: 0.85 },
      uTheme: { value: isDark ? 0.0 : 1.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorMinor;
      uniform vec3 uColorMajor;
      uniform float uGridMinor;
      uniform float uGridMajor;
      uniform vec2 uPlayerPos;
      uniform float uInnerRadius;
      uniform float uMediumRadius;
      uniform float uOuterRadius;
      uniform vec2 uCursorPos;
      uniform float uCursorHighlight;
      uniform float uTheme;
      varying vec3 vWorldPos;

      // Analytical grid line calculation in world meters with screen-space anti-aliasing
      float getGridLine(vec2 coord, float stepSize, float lineWidthPixels) {
        vec2 u = coord / stepSize;
        vec2 distToLine = abs(fract(u + 0.5) - 0.5) * stepSize;
        vec2 pixelSize = max(fwidth(coord), vec2(0.001));
        vec2 line = smoothstep(pixelSize * (lineWidthPixels * 0.5 + 0.6), pixelSize * (lineWidthPixels * 0.5 - 0.6), distToLine);
        return max(line.x, line.y);
      }

      void main() {
        vec2 coord = vWorldPos.xz;
        
        // Logika vzdálenosti a rozmazání okolo player vision:
        // Mřížka se rozmazává a vytrácí do dálky do ztracena okolo hráče
        float distFromPlayer = length(coord - uPlayerPos);

        if (distFromPlayer >= uOuterRadius) {
          discard;
        }

        // Plynulý radiální blur gradient z ostrého středu do ztracena
        float radialFactor = 1.0 - smoothstep(uInnerRadius, uOuterRadius, distFromPlayer);
        float radialFade = pow(radialFactor, 1.75);

        // Rozostření čar se vzdáleností (vzdálenější čáry se jemně rozostřují)
        float blurSpread = mix(1.35, 3.2, smoothstep(uInnerRadius, uMediumRadius, distFromPlayer));

        // 0.5m modulární mřížka přesně odpovídající 1 studu (50 cm)
        float minor = getGridLine(coord, uGridMinor, blurSpread);

        // 1.0m hlavní linie
        float major = getGridLine(coord, uGridMajor, blurSpread * 1.2);

        // Zvýraznění aktivní buňky pod kurzorem
        float cursorDist = length(coord - uCursorPos);
        float cursorGlow = (1.0 - smoothstep(0.0, 1.8, cursorDist)) * uCursorHighlight;

        vec3 col = mix(uColorMinor, uColorMajor, major * 0.85);
        float lineAlpha = max(minor * 0.52, major * 0.92);

        if (uTheme > 0.5) {
          lineAlpha = max(minor * 0.42, major * 0.82);
        }

        float totalAlpha = (lineAlpha + cursorGlow * 0.45) * radialFade;

        if (totalAlpha <= 0.003) {
          discard;
        }

        gl_FragColor = vec4(col, clamp(totalAlpha, 0.0, 1.0));
      }
    `,
  });
}

// Generates an architectural studio concrete / carbon matte floor with subtle 0.5m tiles
export function createFloorTextures(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark studio slate floor
  ctx.fillStyle = '#22252c';
  ctx.fillRect(0, 0, size, size);

  // Micro noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Modular studio panel borders (subtle inset grooves)
  ctx.strokeStyle = '#181a1f';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  // Dot matrix markers for engineering precision
  ctx.fillStyle = '#323742';
  for (let x = 64; x < size; x += 128) {
    for (let y = 64; y < size; y += 128) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(60, 60);

  // Floor roughness canvas
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 512;
  rCanvas.height = 512;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#c0c0c0'; // ~0.75 roughness
  rCtx.fillRect(0, 0, 512, 512);

  const floorRough = new THREE.CanvasTexture(rCanvas);
  floorRough.wrapS = THREE.RepeatWrapping;
  floorRough.wrapT = THREE.RepeatWrapping;
  floorRough.repeat.set(60, 60);

  return { map: floorTex, roughnessMap: floorRough };
}

// Generates an embossed "BYLDR" logo bump map for stud caps
export function createStudLogoBumpMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral bump plane (50% gray = zero displacement)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Outer bevel ring on stud cap
  ctx.strokeStyle = '#a5a5a5';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#5a5a5a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Embossed BYLDR brand typography
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';

  // Lower dark shadow for emboss depth
  ctx.fillStyle = '#484848';
  ctx.fillText('BYLDR', 1.5, 2.5);

  // Upper bright highlight for emboss raise
  ctx.fillStyle = '#dcdcdc';
  ctx.fillText('BYLDR', -1.5, -1.5);

  // Main raised face
  ctx.fillStyle = '#b0b0b0';
  ctx.fillText('BYLDR', 0, 0);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
