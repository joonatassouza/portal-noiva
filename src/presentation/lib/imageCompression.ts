/**
 * Client-side image compression to WebP.
 *
 * Browser-only. Uses Canvas + toBlob to:
 *  1) downscale to maxDimension (default 1600px)
 *  2) re-encode as image/webp at the requested quality
 *  3) iteratively reduce quality until size ≤ targetBytes (default 200 KB).
 */
export interface CompressOptions {
  maxDimension?: number;
  targetBytes?: number;
  initialQuality?: number;
  minQuality?: number;
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

export async function compressToWebP(
  file: File,
  opts: CompressOptions = {},
): Promise<CompressedImage> {
  const maxDim = opts.maxDimension ?? 1600;
  const targetBytes = opts.targetBytes ?? 200 * 1024;
  const initialQuality = opts.initialQuality ?? 0.85;
  const minQuality = opts.minQuality ?? 0.55;

  const bitmap = await createImageBitmapSafe(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available.');
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = initialQuality;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > targetBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.1);
    blob = await canvasToBlob(canvas, quality);
  }

  return { blob, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null.'))),
      'image/webp',
      quality,
    );
  });
}

async function createImageBitmapSafe(file: File): Promise<ImageBitmap> {
  if ('createImageBitmap' in window) {
    return await window.createImageBitmap(file);
  }
  // Fallback for older browsers — load via <img>.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      resolve(i);
    };
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed.'));
    };
    i.src = url;
  });
  // Cast: TS HTMLImageElement is structurally compatible enough for canvas drawImage,
  // and we narrow back to ImageBitmap for the public type.
  return img as unknown as ImageBitmap;
}
