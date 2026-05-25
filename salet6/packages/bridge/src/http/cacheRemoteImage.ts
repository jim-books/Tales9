import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function bridgeOrigin(): string {
  const port = process.env.BRIDGE_PORT ?? '8787';
  return `http://localhost:${port}`;
}

/**
 * Download a remote image and serve it from bridge /uploads so the authoring UI
 * (localhost:5173) can display it without Poe CDN CSP/CORS issues.
 */
export async function cacheRemoteImageForUi(
  url: string | null,
  uploadsDir: string,
): Promise<string | null> {
  if (!url) return null;
  if (/^data:image\//i.test(url)) {
    return url;
  }
  if (!/^https?:\/\//i.test(url)) {
    return url.startsWith('/uploads/') ? `${bridgeOrigin()}${url}` : url;
  }
  if (new RegExp(`^https?://localhost:${process.env.BRIDGE_PORT ?? '8787'}/uploads/`, 'i').test(url)) {
    return url;
  }

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'salet6-bridge/1.0' } });
    if (!res.ok) return null;
    const mimeType = (res.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
    let ext = ALLOWED_MIME[mimeType];
    if (!ext) {
      const pathExt = url.match(/\.(png|jpe?g|webp|gif)(\?|$)/i)?.[1];
      ext = pathExt ? `.${pathExt.toLowerCase().replace('jpeg', 'jpg')}` : '.png';
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 32) return null;
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(uploadsDir, filename), bytes);
    return `${bridgeOrigin()}/uploads/${filename}`;
  } catch {
    return null;
  }
}
