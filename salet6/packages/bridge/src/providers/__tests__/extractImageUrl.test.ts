import { describe, expect, it } from 'vitest';
import { extractImageUrlFromPoeContent } from '../extractImageUrl.js';

describe('extractImageUrlFromPoeContent', () => {
  it('extracts markdown image url', () => {
    const url = extractImageUrlFromPoeContent('Here: ![img](https://pfst.cf2.poecdn.net/flux/abc.png)');
    expect(url).toBe('https://pfst.cf2.poecdn.net/flux/abc.png');
  });

  it('extracts poecdn url without extension', () => {
    const url = extractImageUrlFromPoeContent(
      'Image: https://pfst.cf2.poecdn.net/generated/xyz?sig=1',
    );
    expect(url).toContain('poecdn.net');
  });

  it('prefers extension urls when multiple present', () => {
    const url = extractImageUrlFromPoeContent(
      'See https://example.com/page and https://cdn.test/img.webp',
    );
    expect(url).toBe('https://cdn.test/img.webp');
  });
});
