import { describe, it, expect } from 'vitest';
import { extractPoeResponseText } from '../providers/poe.js';

describe('extractPoeResponseText', () => {
  it('uses top-level output_text when present', () => {
    expect(extractPoeResponseText({ output_text: '{"ok":true}' })).toBe('{"ok":true}');
  });

  it('extracts text from nested message output_text parts', () => {
    const text = extractPoeResponseText({
      output: [
        { type: 'reasoning', id: 'r1' },
        {
          type: 'message',
          content: [{ type: 'output_text', text: '{"plans":[]}' }],
        },
      ],
    });
    expect(text).toBe('{"plans":[]}');
  });

  it('returns null when no text is available', () => {
    expect(extractPoeResponseText({ output: [{ type: 'reasoning' }] })).toBeNull();
  });
});
