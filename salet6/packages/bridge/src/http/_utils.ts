import type { Response } from 'express';

export function okJson<T>(res: Response, data: T) {
  return res.status(200).json({ ok: true, data });
}

export function errJson(res: Response, status: number, errorCode: string, message: string) {
  return res.status(status).json({ ok: false, errorCode, message });
}
