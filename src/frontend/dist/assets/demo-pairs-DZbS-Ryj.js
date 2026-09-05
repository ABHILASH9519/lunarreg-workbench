const DEMO_DEFS = [
  {
    metadata: {
      id: "demo-ohrc-crater-field",
      name: "OHRC Crater Field",
      sensor: "OHRC",
      sunAzimuthDeg: 120,
      sunElevationDeg: 35,
      scaleRatio: 1,
      description: "Synthetic high-resolution crater field with subtle sun-angle variation between the pair. DEMO/SAMPLE DATA — not official Chandrayaan-2/ISRO imagery.",
      isDemo: true
    },
    seed: 101,
    size: 512,
    transform: { scale: 1, rotationDeg: 2.5, tx: 8, ty: -5 },
    appearance: {
      sunAzimuthShift: 8,
      sunElevationShift: 3,
      contrast: 1.05,
      brightness: 4
    }
  },
  {
    metadata: {
      id: "demo-tmc2-mare-basalt",
      name: "TMC-2 Mare Basalt",
      sensor: "TMC-2",
      sunAzimuthDeg: 200,
      sunElevationDeg: 28,
      scaleRatio: 1.04,
      description: "Synthetic mare-basalt terrain with scale variation between the pair. DEMO/SAMPLE DATA — not official Chandrayaan-2/ISRO imagery.",
      isDemo: true
    },
    seed: 202,
    size: 512,
    transform: { scale: 1.04, rotationDeg: -1.8, tx: -12, ty: 6 },
    appearance: {
      sunAzimuthShift: -6,
      sunElevationShift: 2,
      contrast: 0.95,
      brightness: -3
    }
  },
  {
    metadata: {
      id: "demo-iirs-mineral-spectral",
      name: "IIRS Mineral Spectral",
      sensor: "IIRS",
      sunAzimuthDeg: 80,
      sunElevationDeg: 42,
      scaleRatio: 1,
      description: "Synthetic spectral-style terrain with strong illumination contrast between the pair. DEMO/SAMPLE DATA — not official Chandrayaan-2/ISRO imagery.",
      isDemo: true
    },
    seed: 303,
    size: 512,
    transform: { scale: 1, rotationDeg: 4.2, tx: 4, ty: 10 },
    appearance: {
      sunAzimuthShift: 12,
      sunElevationShift: 6,
      contrast: 1.2,
      brightness: 8
    }
  },
  {
    metadata: {
      id: "demo-lro-nac-highland",
      name: "LRO NAC Highland",
      sensor: "LRO NAC",
      sunAzimuthDeg: 150,
      sunElevationDeg: 50,
      scaleRatio: 1.08,
      description: "Synthetic highland terrain with pronounced scale and viewpoint variation. DEMO/SAMPLE DATA — not official LRO/NASA imagery.",
      isDemo: true
    },
    seed: 404,
    size: 512,
    transform: { scale: 1.08, rotationDeg: -3.5, tx: -18, ty: 14 },
    appearance: {
      sunAzimuthShift: -10,
      sunElevationShift: 4,
      contrast: 1.1,
      brightness: -6
    }
  },
  {
    metadata: {
      id: "demo-selene-ridge-system",
      name: "SELENE Ridge System",
      sensor: "SELENE",
      sunAzimuthDeg: 260,
      sunElevationDeg: 22,
      scaleRatio: 1.02,
      description: "Synthetic ridge-and-fault terrain with low-sun illumination and multi-modal appearance. DEMO/SAMPLE DATA — not official JAXA/SELENE imagery.",
      isDemo: true
    },
    seed: 505,
    size: 512,
    transform: { scale: 1.02, rotationDeg: 1.2, tx: 6, ty: -9 },
    appearance: {
      sunAzimuthShift: 5,
      sunElevationShift: -2,
      contrast: 0.9,
      brightness: 2
    }
  }
];
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeNoise(seed, size) {
  const rand = mulberry32(seed);
  const grid = size + 1;
  const lattice = new Float32Array(grid * grid);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  const out = new Float32Array(size * size);
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / size;
      const gy = y / size;
      const x0 = Math.floor(gx * size);
      const y0 = Math.floor(gy * size);
      const fx = smooth(gx * size - x0);
      const fy = smooth(gy * size - y0);
      const v00 = lattice[y0 * grid + x0];
      const v10 = lattice[y0 * grid + x0 + 1];
      const v01 = lattice[(y0 + 1) * grid + x0];
      const v11 = lattice[(y0 + 1) * grid + x0 + 1];
      const top = v00 + (v10 - v00) * fx;
      const bottom = v01 + (v11 - v01) * fx;
      out[y * size + x] = top + (bottom - top) * fy;
    }
  }
  return out;
}
function fbm(seed, size, octaves) {
  const out = new Float32Array(size * size);
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const layer = makeNoise(
      seed + o * 7919,
      Math.max(8, Math.floor(size / frequency))
    );
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}
function addCraters(terrain, size, seed, count) {
  const rand = mulberry32(seed);
  for (let c = 0; c < count; c++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const radius = 8 + rand() * 40;
    const depth = 0.15 + rand() * 0.35;
    for (let y = Math.max(0, Math.floor(cy - radius)); y < Math.min(size, cy + radius); y++) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(size, cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;
        const rim = Math.abs(dist - radius * 0.85) < radius * 0.12 ? 0.15 : 0;
        const bowl = (1 - dist / radius) * depth;
        terrain[y * size + x] -= bowl;
        terrain[y * size + x] += rim;
      }
    }
  }
}
function shade(terrain, size, azimuthDeg, elevationDeg) {
  const az = azimuthDeg * Math.PI / 180;
  const el = elevationDeg * Math.PI / 180;
  const lx = Math.cos(el) * Math.cos(az);
  const ly = Math.cos(el) * Math.sin(az);
  const lz = Math.sin(el);
  const out = new Float32Array(size * size);
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const dzdx = terrain[y * size + x + 1] - terrain[y * size + x - 1];
      const dzdy = terrain[(y + 1) * size + x] - terrain[(y - 1) * size + x];
      const nx = -dzdx;
      const ny = -dzdy;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const dot = (nx * lx + ny * ly + nz * lz) / len;
      out[y * size + x] = Math.max(0, dot);
    }
  }
  return out;
}
function renderTerrain(terrain, size, azimuthDeg, elevationDeg, contrast, brightness) {
  const shaded = shade(terrain, size, azimuthDeg, elevationDeg);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    let v = shaded[i] * 255;
    v = (v - 128) * contrast + 128 + brightness;
    v = Math.max(0, Math.min(255, v));
    imageData.data[i * 4] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
function applyTransform(dataUrl, size, scale, rotationDeg, tx, ty) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  ctx.translate(size / 2 + tx, size / 2 + ty);
  ctx.rotate(rotationDeg * Math.PI / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  return canvas.toDataURL("image/png");
}
function generateDemoPair(def) {
  const { size, seed, transform, appearance, metadata } = def;
  const terrain = fbm(seed, size, 5);
  addCraters(terrain, size, seed + 13, 40);
  const referenceDataUrl = renderTerrain(
    terrain,
    size,
    metadata.sunAzimuthDeg,
    metadata.sunElevationDeg,
    1,
    0
  );
  const sourceShaded = renderTerrain(
    terrain,
    size,
    metadata.sunAzimuthDeg + appearance.sunAzimuthShift,
    metadata.sunElevationDeg + appearance.sunElevationShift,
    appearance.contrast,
    appearance.brightness
  );
  const sourceDataUrl = applyTransform(
    sourceShaded,
    size,
    transform.scale,
    transform.rotationDeg,
    transform.tx,
    transform.ty
  );
  return {
    metadata,
    sourceDataUrl,
    referenceDataUrl,
    width: size,
    height: size
  };
}
function generateAllDemoPairs() {
  return DEMO_DEFS.map(generateDemoPair);
}
export {
  DEMO_DEFS,
  generateAllDemoPairs,
  generateDemoPair
};
