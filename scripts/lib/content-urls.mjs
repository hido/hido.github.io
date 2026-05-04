// Shared helpers for walking src/content/*.md and extracting external URLs
// from frontmatter / body. Used by check-dead-links.mjs and wayback-submit.mjs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const URL_RE = /https?:\/\/[^\s"'<>)]+/g;

export function walkMarkdown(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkMarkdown(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

// Extract every external URL from a markdown file, dropping trailing
// punctuation that the greedy regex picks up. Skip internal hosts and
// any caller-supplied predicates.
export function urlsFromFile(path, extraSkip = () => false) {
  const text = readFileSync(path, 'utf8');
  const out = new Set();
  for (const m of text.matchAll(URL_RE)) {
    const u = m[0].replace(/[)"',]+$/, '');
    if (u.includes('hido.github.io')) continue;
    if (u.includes('localhost')) continue;
    if (extraSkip(u)) continue;
    out.add(u);
  }
  return [...out];
}
