/**
 * spriteLoader.ts - Chroma-Key Background Removal (White + Green)
 * 
 * Loads image assets, removes background pixels using Canvas + getImageData.
 * Supports two chroma-key modes:
 *   - White: R > 235 && G > 235 && B > 235 → alpha = 0 (for JPEGs)
 *   - Green: R < 50 && G > 180 && B < 50 → alpha = 0 (for #00FF00 backgrounds)
 *   - Auto: Detects dominant corner color and picks the right mode
 * 
 * Applies edge softening for smooth anti-aliased edges.
 */

export interface SpriteFrame {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface SpriteSheet {
  frames: SpriteFrame[];
  cols: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  source: HTMLCanvasElement;
}

export interface FurnitureSprite {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src} - ${e}`));
    img.src = src;
  });
}

/**
 * Detect the dominant background color by sampling corner pixels.
 * Returns 'white', 'green', or 'none'.
 */
function detectBackgroundType(
  data: Uint8ClampedArray,
  width: number,
  height: number
): 'white' | 'green' | 'none' {
  // Sample 4 corner regions (5x5 pixel areas)
  const corners = [
    { x: 2, y: 2 },                   // top-left
    { x: width - 3, y: 2 },            // top-right
    { x: 2, y: height - 3 },           // bottom-left
    { x: width - 3, y: height - 3 },   // bottom-right
  ];

  let whiteCount = 0;
  let greenCount = 0;
  let total = 0;

  for (const corner of corners) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = corner.x + dx;
        const py = corner.y + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        
        const i = (py * width + px) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        
        if (r > 230 && g > 230 && b > 230) whiteCount++;
        if (g > 140 && g > r * 1.3 && g > b * 1.3) greenCount++;
        total++;
      }
    }
  }

  const whiteRatio = whiteCount / total;
  const greenRatio = greenCount / total;

  if (greenRatio > 0.5) return 'green';
  if (whiteRatio > 0.5) return 'white';
  return 'none';
}

/**
 * Remove white background from an image element.
 * Pixels with R > threshold && G > threshold && B > threshold become transparent.
 * Applies edge softening for smoother anti-aliasing.
 */
export function removeWhiteBackground(
  img: HTMLImageElement | HTMLCanvasElement,
  threshold: number = 235
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const width = canvas.width;
  const height = canvas.height;
  const visited = new Uint8Array(width * height);
  const q = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const add = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    
    const p = idx * 4;
    const r = data[p], g = data[p+1], b = data[p+2];
    
    // Near-white pixels are considered part of the background to allow edge softening
    if (r > threshold - 20 && g > threshold - 20 && b > threshold - 20) {
      visited[idx] = 1;
      q[tail++] = idx;
    }
  };

  // Seed the edges
  for (let x = 0; x < width; x++) { add(x, 0); add(x, height - 1); }
  for (let y = 0; y < height; y++) { add(0, y); add(width - 1, y); }

  // Flood fill BFS
  while (head < tail) {
    const idx = q[head++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    add(x + 1, y);
    add(x - 1, y);
    add(x, y + 1);
    add(x, y - 1);
  }

  // Apply transparency only to visited background pixels
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      const p = i * 4;
      const r = data[p], g = data[p+1], b = data[p+2];
      if (r > threshold && g > threshold && b > threshold) {
        // Pure white → fully transparent
        data[p + 3] = 0;
      } else {
        // Near-white edge → partial transparency for anti-aliasing
        const maxChannel = Math.max(r, g, b);
        const softness = (maxChannel - (threshold - 20)) / 20;
        data[p + 3] = Math.round(data[p + 3] * (1 - softness * 0.8));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Remove green (#00FF00) chroma-key background from an image.
 * Pixels where G is dominant and R,B are low become transparent.
 */
export function removeGreenBackground(
  img: HTMLImageElement | HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Pure green screen: high G, lower R/B
    if (g > 150 && g > r * 1.5 && g > b * 1.5) {
      data[i + 3] = 0;
    }
    // Edge softening for green spill
    else if (g > 120 && g > r * 1.2 && g > b * 1.2) {
      const greenDominance = g / (Math.max(r, b, 1));
      if (greenDominance > 1.8) {
        const softness = Math.min(1, (greenDominance - 1.8) / 1.5);
        data[i + 3] = Math.round(data[i + 3] * (1 - softness * 0.85));
        // Also reduce green spill on remaining pixels
        data[i + 1] = Math.round(g * (1 - softness * 0.3));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Auto-detect background type and remove it.
 * Works for both white JPEG backgrounds and green (#00FF00) chroma-key PNGs.
 */
export function removeBackground(
  img: HTMLImageElement | HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const bgType = detectBackgroundType(imageData.data, canvas.width, canvas.height);

  if (bgType === 'green') {
    return removeGreenBackground(img);
  } else if (bgType === 'white') {
    return removeWhiteBackground(img);
  }

  // No background detected - return as-is (likely already transparent PNG)
  return canvas;
}

/**
 * Load and process a character sprite sheet.
 * Grid layout: 8 columns × 2 rows
 * Row 0, Col 0–3: Walk Down/Front
 * Row 0, Col 4–7: Walk Up/Back  
 * Row 1, Col 0–7: Walk Side (Left; flip for Right)
 */
export async function loadCharacterSheet(
  src: string,
  cols: number = 8,
  rows: number = 2
): Promise<SpriteSheet> {
  const img = await loadImage(src);
  const cleanCanvas = removeBackground(img);
  
  const frameWidth = Math.floor(cleanCanvas.width / cols);
  const frameHeight = Math.floor(cleanCanvas.height / rows);
  
  const frames: SpriteFrame[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = frameWidth;
      frameCanvas.height = frameHeight;
      const fCtx = frameCanvas.getContext('2d')!;
      
      fCtx.drawImage(
        cleanCanvas,
        col * frameWidth, row * frameHeight,
        frameWidth, frameHeight,
        0, 0,
        frameWidth, frameHeight
      );
      
      frames.push({
        canvas: frameCanvas,
        width: frameWidth,
        height: frameHeight,
      });
    }
  }
  
  return {
    frames,
    cols,
    rows,
    frameWidth,
    frameHeight,
    source: cleanCanvas,
  };
}

/**
 * Load an individual furniture/decoration asset image.
 * Auto-detects background type and removes it.
 */
export async function loadFurnitureAsset(src: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  return removeBackground(img);
}

/**
 * Create a flipped (mirrored) version of a sprite frame.
 * Used for creating right-facing sprites from left-facing ones.
 */
export function flipSpriteHorizontal(frame: SpriteFrame): SpriteFrame {
  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext('2d')!;
  
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(frame.canvas, 0, 0);
  
  return {
    canvas,
    width: frame.width,
    height: frame.height,
  };
}
