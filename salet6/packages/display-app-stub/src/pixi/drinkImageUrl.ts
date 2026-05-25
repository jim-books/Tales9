const DEFAULT_BRIDGE_HTTP_API = 'http://localhost:8787/api';
const DEFAULT_BRIDGE_ORIGIN = 'http://localhost:8787';

function bridgeOrigin(): string {
  const base =
    (typeof import.meta.env.VITE_SALET_BRIDGE_HTTP === 'string' &&
      import.meta.env.VITE_SALET_BRIDGE_HTTP) ||
    DEFAULT_BRIDGE_HTTP_API;
  return base.replace(/\/api\/?$/i, '').replace(/\/$/, '') || DEFAULT_BRIDGE_ORIGIN;
}

/** Resolve drink image URLs for Pixi fetch (bridge uploads, proxy, or passthrough). */
export function toProxiedDrinkImageUrl(url: string): string {
  if (/^data:image\//i.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${bridgeOrigin()}${url}`;
  if (!/^https?:\/\//i.test(url)) return url;
  if (/^https?:\/\/(localhost|127\.0\.0\.1):8787\//i.test(url)) return url;
  const apiBase = `${bridgeOrigin()}/api`;
  return `${apiBase}/asset-proxy?url=${encodeURIComponent(url)}`;
}
