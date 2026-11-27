import fs from 'node:fs';
import path from 'node:path';
import { parseSvg } from './svg.js';

export function sourceDir(cfg, root) {
  return path.resolve(root, cfg.dir || 'icons', 'source');
}

export function listSources(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));
  for (const f of files) {
    if (f.includes('@')) continue;
    const name = f.slice(0, -4);
    const smallFile = files.find((g) => g.startsWith(name + '@') && /^.+@\d+\.svg$/.test(g));
    out.push({
      name, file: path.join(dir, f), kind: 'icon',
      small: smallFile ? { size: Number(smallFile.match(/@(\d+)\.svg$/)[1]), file: path.join(dir, smallFile) } : null,
    });
  }
  const partsDir = path.join(dir, 'parts');
  if (fs.existsSync(partsDir)) {
    for (const f of fs.readdirSync(partsDir).filter((f) => f.endsWith('.svg'))) {
      out.push({ name: f.slice(0, -4), file: path.join(partsDir, f), kind: 'part', small: null });
    }
  }
  return out;
}

export function loadSource(entry) {
  const text = fs.readFileSync(entry.file, 'utf8');
  const parsed = parseSvg(text);
  let small = null;
  if (entry.small) small = { size: entry.small.size, ...parseSvg(fs.readFileSync(entry.small.file, 'utf8')) };
  return { ...entry, text, ...parsed, smallSrc: small };
}

export function select(dir, names) {
  const all = listSources(dir);
  if (!names.length || names.includes('all')) return all.filter((e) => e.kind === 'icon');
  const out = [];
  for (const n of names) {
    const hit = all.find((e) => e.name === n || path.resolve(n) === e.file);
    if (!hit) {
      if (fs.existsSync(n) && n.endsWith('.svg')) out.push({ name: path.basename(n, '.svg'), file: path.resolve(n), kind: 'icon', small: null });
      else throw new Error(`No source named "${n}" in ${dir}`);
    } else out.push(hit);
  }
  return out;
}
