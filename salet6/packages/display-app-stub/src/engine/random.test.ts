import { describe, expect, it } from 'vitest';
import { pickRandom } from './random.js';

describe('pickRandom', () => {
  it('returns undefined for an empty list', () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it('uses injected rng for deterministic picks', () => {
    const values = ['a', 'b', 'c'];
    expect(pickRandom(values, () => 0.0)).toBe('a');
    expect(pickRandom(values, () => 0.34)).toBe('b');
    expect(pickRandom(values, () => 0.99)).toBe('c');
  });
});
