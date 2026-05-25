/**
 * Browser-safe coaster entrypoint prep (regex TS strip only; no esbuild).
 * Bridge uses coasterEntrypoint.ts which adds esbuild transpile on top.
 */

const PREFERRED_FACTORY_NAMES = ['mountCoaster', 'createCoaster', 'defaultExport'] as const;

/** Full script body appended inside `new Function('PIXI','ctx', script)`. */
export function prepareCoasterEntrypoint(source: string): string {
  const unfenced = unfenceEntrypoint(source);
  if (isPreparedCoasterScript(unfenced)) {
    return unfenced;
  }
  const js = typescriptToRunnableJs(source);
  return `${js}\n${buildCoasterFactoryReturn(js)}`;
}

function isPreparedCoasterScript(source: string): boolean {
  return /return\s+\(typeof\s+mountCoaster\s*===\s*["']function["']/.test(source);
}

/** Names of coaster factory functions declared in the script. */
export function extractCoasterFactoryNames(js: string): string[] {
  const names = new Set<string>(PREFERRED_FACTORY_NAMES);
  for (const m of js.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    names.add(m[1]);
  }
  for (const m of js.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\s*\(/g)) {
    names.add(m[1]);
  }
  return [...names];
}

export function buildCoasterFactoryReturn(js: string): string {
  const preferred = new Set<string>(PREFERRED_FACTORY_NAMES);
  const discovered = extractCoasterFactoryNames(js).filter((n) => !preferred.has(n));
  const ordered = [...PREFERRED_FACTORY_NAMES, ...discovered];
  const checks = ordered.map((n) => `(typeof ${n} === "function" ? ${n} : null)`);
  return `return ${checks.join(' ?? ')} ?? null;`;
}

export function normalizeTranspiledJs(code: string): string {
  let s = code.trim();
  s = s.replace(/^return\s+function\s+mountCoaster\s*\(/m, 'function mountCoaster(');
  s = s
    .replace(/\bexport\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g, 'function $1(')
    .replace(/\bexport\s+default\s+function\s*\(/g, 'function mountCoaster(')
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+function\s+/g, 'function ')
    .replace(/\bexport\s+/g, '');
  return s.trim();
}

/** Regex-based fallback when esbuild cannot parse the snippet. */
export function typescriptToRunnableJs(source: string): string {
  let s = unfenceEntrypoint(source);
  s = s.replace(/^return\s+function\s+mountCoaster\s*\(/m, 'function mountCoaster(');
  s = normalizeTranspiledJs(s);
  s = s.replace(/^\s*type\s+\w+[\s\S]*?;\s*$/gm, '');
  s = s.replace(/^\s*interface\s+\w+\s*\{[\s\S]*?\}\s*$/gm, '');
  s = stripFunctionHeaders(s);
  s = stripTypeAssertions(s);
  return s.trim();
}

/** Strip markdown fences and bare language-tag lines from LLM coaster output. */
export function unfenceCoasterSource(source: string): string {
  let s = source.trim();
  s = s.replace(/^```(?:typescript|ts|javascript|js)?\s*\n?/i, '');
  s = s.replace(/\n?```\s*$/i, '');
  s = s.trim();
  // Partial strip (e.g. Poe removes only ```) leaves a bare "javascript" line.
  while (/^(?:typescript|ts|javascript|js)\s*$/i.test((s.split('\n')[0] ?? '').trim())) {
    s = s.replace(/^(?:typescript|ts|javascript|js)\s*\n?/i, '').trim();
  }
  return s;
}

function unfenceEntrypoint(source: string): string {
  return unfenceCoasterSource(source);
}

function stripFunctionHeaders(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const fnIdx = source.indexOf('function', i);
    if (fnIdx === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, fnIdx);
    const nameMatch = source.slice(fnIdx).match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!nameMatch) {
      out += source[fnIdx];
      i = fnIdx + 1;
      continue;
    }
    const name = nameMatch[1];
    const parenStart = fnIdx + nameMatch[0].length - 1;
    const parenEnd = findParamListEnd(source, parenStart);
    if (parenEnd === -1) {
      out += source.slice(fnIdx);
      break;
    }
    const params = source.slice(parenStart + 1, parenEnd);
    let bodyBrace = parenEnd + 1;
    bodyBrace = skipReturnTypeAnnotation(source, bodyBrace);
    while (bodyBrace < source.length && /\s/.test(source[bodyBrace])) bodyBrace++;
    out += `function ${name}(${stripParamListTypes(params)})`;
    if (source[bodyBrace] === '{') {
      out += ' {';
      i = bodyBrace + 1;
    } else {
      out += source.slice(parenEnd + 1, bodyBrace);
      i = bodyBrace;
    }
  }
  return out;
}

function findParamListEnd(source: string, openIdx: number): number {
  if (source[openIdx] !== '(') return -1;
  let paren = 1;
  let brace = 0;
  let bracket = 0;
  for (let i = openIdx + 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') paren++;
    else if (ch === ')') {
      paren--;
      if (paren === 0) return i;
    } else if (ch === '{') brace++;
    else if (ch === '}') brace--;
    else if (ch === '[') bracket++;
    else if (ch === ']') bracket--;
  }
  return -1;
}

function skipReturnTypeAnnotation(source: string, start: number): number {
  let i = start;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] !== ':') return i;
  i++;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] === '{') {
    let depth = 0;
    for (; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') {
        depth--;
        if (depth === 0) return i + 1;
      }
    }
    return i;
  }
  while (i < source.length && source[i] !== '{') i++;
  return i;
}

function stripParamListTypes(params: string): string {
  if (!params.trim()) return params;
  let depth = 0;
  let cur = '';
  const parts: string[] = [];
  for (const ch of params) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.length) parts.push(cur);
  return parts
    .map((part) => {
      const t = part.trim();
      const colon = t.indexOf(':');
      if (colon === -1) return t;
      const eq = t.indexOf('=');
      if (eq !== -1 && eq < colon) return t;
      return t.slice(0, colon).trim().replace(/\?$/, '');
    })
    .join(', ');
}

function stripTypeAssertions(source: string): string {
  let s = source;
  s = s.replace(/\s+as\s+const\b/g, '');
  s = s.replace(/\s+as\s+(?:any|unknown|never|void|null|undefined)\b/g, '');
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/\s+as\s+[A-Za-z_$][\w$]*(?:\s*<[^>]*>)?/g, '');
    if (next === s) break;
    s = next;
  }
  return s;
}
