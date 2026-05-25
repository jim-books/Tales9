import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { AssetType, type Asset } from '@salet/shared';
import { okJson, errJson } from './_utils.js';

const MAX_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg',
};

export interface AssetsRouterOptions {
  uploadsDir: string;
}

export function assetsRouter(opts: AssetsRouterOptions): Router {
  const r = Router();

  r.post('/assets', upload.single('file'), async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) return errJson(res, 400, 'NO_FILE', 'multipart field "file" is required');
    const declaredType = String(req.body?.type ?? '');
    if (!AssetType.safeParse(declaredType).success) {
      return errJson(res, 400, 'INVALID_TYPE', 'type must be logo, icon, or drinkPhoto');
    }
    const ext = ALLOWED_MIME[file.mimetype];
    if (!ext) {
      return errJson(res, 415, 'UNSUPPORTED_MIME', 'only PNG, JPEG, and SVG are accepted');
    }
    if (!sniffMagicBytes(file.buffer, file.mimetype)) {
      return errJson(res, 415, 'MAGIC_BYTES_MISMATCH', 'file content does not match declared MIME');
    }
    try {
      await mkdir(opts.uploadsDir, { recursive: true });
      const id = randomUUID();
      const filename = `${id}${ext}`;
      const fullPath = path.join(opts.uploadsDir, filename);
      await writeFile(fullPath, file.buffer);
      const asset: Asset = {
        id,
        type: declaredType as Asset['type'],
        mimeType: file.mimetype,
        bytes: file.size,
        storageRef: fullPath,
        createdAt: new Date().toISOString(),
      };
      return okJson(res, asset);
    } catch (err) {
      return errJson(res, 500, 'WRITE_FAILED', (err as Error).message);
    }
  });

  return r;
}

export function sniffMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 4) return false;
  if (mime === 'image/png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (mime === 'image/jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === 'image/svg+xml') {
    const head = buf.subarray(0, 256).toString('utf8').trimStart().toLowerCase();
    return head.startsWith('<svg') || head.startsWith('<?xml');
  }
  return false;
}

export const __test__ = { ALLOWED_MIME, MAX_BYTES, _hash: (b: Buffer) => createHash('sha256').update(b).digest('hex') };
