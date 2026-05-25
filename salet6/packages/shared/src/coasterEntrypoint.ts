/**
 * Node/bridge coaster prep: esbuild TS→JS with regex fallback (via core).
 */

import * as esbuild from 'esbuild';
import {
  buildCoasterFactoryReturn,
  normalizeTranspiledJs,
  prepareCoasterEntrypoint as prepareCoasterEntrypointCore,
  unfenceCoasterSource,
} from './coasterEntrypointCore.js';

export {
  buildCoasterFactoryReturn,
  extractCoasterFactoryNames,
  normalizeTranspiledJs,
  typescriptToRunnableJs,
  unfenceCoasterSource,
} from './coasterEntrypointCore.js';

function unfenceEntrypoint(source: string): string {
  return unfenceCoasterSource(source);
}

function isPreparedCoasterScript(source: string): boolean {
  return /return\s+\(typeof\s+mountCoaster\s*===\s*["']function["']/.test(source);
}

function transpileWithEsbuild(source: string): string | null {
  try {
    const unfenced = unfenceEntrypoint(source);
    const result = esbuild.transformSync(unfenced, {
      loader: 'ts',
      target: 'es2020',
      format: 'esm',
    });
    return normalizeTranspiledJs(result.code);
  } catch {
    return null;
  }
}

/** Bridge/compile: prefers esbuild, falls back to regex strip. */
export function prepareCoasterEntrypoint(source: string): string {
  const unfenced = unfenceEntrypoint(source);
  if (isPreparedCoasterScript(unfenced)) {
    return unfenced;
  }
  const esbuildJs = transpileWithEsbuild(source);
  if (esbuildJs) {
    return `${esbuildJs}\n${buildCoasterFactoryReturn(esbuildJs)}`;
  }
  return prepareCoasterEntrypointCore(source);
}
