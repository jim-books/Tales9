/** Extract an image URL from Poe chat/completions text (Imagen, Flux, etc.). */
export function extractImageUrlFromPoeContent(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const markdown = trimmed.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  if (markdown?.[1]) return stripTrailingPunctuation(markdown[1]);

  const dataUrl = trimmed.match(/(data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+)/i);
  if (dataUrl?.[1]) return dataUrl[1];

  const urls = (trimmed.match(/https?:\/\/[^\s)\]"'<>]+/g) ?? []).map(stripTrailingPunctuation);
  if (!urls.length) return null;

  const withExt = urls.find((u) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(u));
  if (withExt) return withExt;

  const poeCdn = urls.find((u) => /poecdn\.net|pfst\.|puc\.|poe\.com/i.test(u));
  if (poeCdn) return poeCdn;

  return urls[0] ?? null;
}

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:)\]]+$/g, '');
}
