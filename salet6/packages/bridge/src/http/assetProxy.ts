import { Router, type Request, type Response } from 'express';
import { errJson } from './_utils.js';

const ALLOWED_URL = /^https?:\/\//i;

export function assetProxyRouter(): Router {
  const r = Router();

  r.get('/asset-proxy', async (req: Request, res: Response) => {
    const raw = req.query.url;
    if (typeof raw !== 'string' || !ALLOWED_URL.test(raw)) {
      return errJson(res, 400, 'INVALID_URL', 'url must be an http(s) URL');
    }

    try {
      const upstream = await fetch(raw, {
        headers: { 'User-Agent': 'salet6-bridge/1.0' },
      });
      if (!upstream.ok) {
        return errJson(res, 502, 'UPSTREAM', `upstream returned ${upstream.status}`);
      }
      const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Content-Type', contentType);
      res.send(bytes);
    } catch (err) {
      return errJson(res, 502, 'FETCH_FAILED', (err as Error).message);
    }
  });

  return r;
}
