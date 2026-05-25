/**
 * Load monorepo root `.env` first, then `packages/bridge/.env` overrides.
 * Must be imported before any module that reads process.env at top level (e.g. poe.ts).
 */
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = dirname(fileURLToPath(import.meta.url));
const bridgeDir = resolve(srcDir, '..');
const repoRoot = resolve(bridgeDir, '../..');

// override: true so repo .env wins over stale POE_* vars exported in the shell/IDE.
config({ path: resolve(repoRoot, '.env'), override: true });
config({ path: resolve(bridgeDir, '.env'), override: true });

export function resolvedPoeModels(): Record<string, string | undefined> {
  return {
    provider: process.env.PROVIDER,
    text: process.env.POE_TEXT_MODEL,
    edit: process.env.POE_EDIT_MODEL,
    code: process.env.POE_CODE_MODEL,
    image: process.env.POE_IMAGE_MODEL,
  };
}

/** First 12 chars of API key for startup verification (never log full secret). */
export function poeApiKeyFingerprint(): string | undefined {
  const key = process.env.POE_API_KEY;
  return key && key.length > 12 ? `${key.slice(0, 12)}…` : key ? '(short)' : undefined;
}
