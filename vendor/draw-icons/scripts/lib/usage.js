import fs from 'node:fs';
import path from 'node:path';
import { listSources } from './source.js';

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit', '.output', 'out', 'coverage', '.turbo', '.vercel', 'vendor', 'Pods', '.cache']);
const CODE = /\.(tsx?|jsx?|mjs|cjs|vue|svelte|astro|mdx|html)$/;

function walk(root, limit = 6000) {
  const files = [];
  const stack = [root];
  while (stack.length && files.length < limit) {
    const dir = stack.pop();
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.name.startsWith('.') && e.name !== '.storybook') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP.has(e.name)) stack.push(p); }
      else files.push(p);
    }
  }
  return files;
}

function sizeOf(attrs) {
  const px = [];
  for (const m of attrs.matchAll(/\b(?:size|width|height)=\{?["']?(\d+(?:\.\d+)?)/g)) px.push(Number(m[1]));
  for (const m of attrs.matchAll(/(?:^|[\s"'`:])(?:size|w|h)-(\d+(?:\.\d+)?)(?![\w.-])/g)) px.push(Number(m[1]) * 4);
  for (const m of attrs.matchAll(/(?:^|[\s"'`:])(?:size|w|h)-\[(\d+(?:\.\d+)?)(px|rem)\]/g)) px.push(Number(m[1]) * (m[2] === 'rem' ? 16 : 1));
  return [...new Set(px)];
}

// Aliases (@/, ~/, $lib/, /public-url) can't be resolved without the bundler config, so an aliased
// path counts when the part after the alias is the end of the icon folder's path.
function pointsAt(spec, fromDir, iconDir, root) {
  if (spec.startsWith('.')) return path.resolve(fromDir, spec) === iconDir;
  const rest = spec.replace(/^\/|^[@~$][^/]*\//, '');
  const rel = path.relative(root, iconDir).split(path.sep).join('/');
  return rel === rest || rel.endsWith('/' + rest);
}

// Sizes are per file, not per import: icons passed around as data are rendered as <Icon />,
// so any tag ending in "Icon" counts, not just the import bindings.
export function findUsages(cfg, root) {
  const iconDir = path.resolve(root, cfg.dir);
  const base = path.basename(iconDir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`["'\`(]([^"'\`()\\s]*?${base})/([a-z0-9-]+)(?:@(\\d+))?\\.svg`, 'g');
  const out = [];
  for (const f of walk(root)) {
    if (!CODE.test(f) || f.startsWith(iconDir + path.sep)) continue;
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (text.length > 400_000 || !text.includes(path.basename(iconDir) + '/')) continue;
    const hits = [];
    for (const m of text.matchAll(re)) {
      if (!pointsAt(m[1], path.dirname(f), iconDir, root)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      const lineText = text.split('\n')[line - 1];
      const binding = /import\s+(\w+)\s+from/.exec(lineText)?.[1] || null;
      hits.push({ file: path.relative(root, f), line, name: m[2], small: m[3] ? Number(m[3]) : null, binding });
    }
    if (!hits.length) continue;
    const bindings = new Set(hits.map((h) => h.binding).filter(Boolean));
    const sizes = new Set();
    for (const m of text.matchAll(/<([A-Z][\w.]*)\b([^>]*)>/g)) {
      if (bindings.has(m[1]) || /Icon$/.test(m[1])) for (const s of sizeOf(m[2])) sizes.add(s);
    }
    for (const h of hits) out.push({ ...h, sizes: [...sizes].sort((a, b) => a - b) });
  }
  return out;
}

export function usageProblems(usages, cfg, srcDir) {
  const names = new Set(listSources(srcDir).filter((e) => e.kind === 'icon').map((e) => e.name));
  const smalls = new Set(listSources(srcDir).filter((e) => e.small).map((e) => `${e.name}@${e.small.size}`));
  const errors = [], warnings = [];
  for (const u of usages) {
    const at = `${u.file}:${u.line}`;
    const file = `${u.name}${u.small ? '@' + u.small : ''}.svg`;
    if (!names.has(u.name)) errors.push(`${at} imports ${file}, but there is no source/${u.name}.svg`);
    else if (u.small && !smalls.has(`${u.name}@${u.small}`)) errors.push(`${at} imports ${file}, but there is no source/${u.name}@${u.small}.svg`);
  }
  const allowed = cfg.sizes || [];
  const seen = new Set();
  for (const u of usages) {
    if (seen.has(u.file) || !allowed.length) continue;
    seen.add(u.file);
    const off = u.sizes.filter((s) => !allowed.includes(s));
    if (off.length) warnings.push(`${u.file} shows icons at ${off.join(', ')}px; they are drawn for ${allowed.join(', ')}px (sizes in icons.yaml)`);
  }
  return { errors, warnings };
}
