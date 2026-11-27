// APK adaptation: load the bundled YAML parser directly. See UPSTREAM.md.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '../deps/yaml/dist/index.js';

export const CONFIG_NAME = 'icons.yaml';

export function findConfig(start = process.cwd(), explicit) {
  if (explicit) return path.resolve(explicit);
  let dir = path.resolve(start);
  while (true) {
    const p = path.join(dir, CONFIG_NAME);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

export function loadConfig(file) {
  try { return parse(fs.readFileSync(file, 'utf8')) ?? {}; } catch (e) { throw new Error(`${file}: ${e.message}`); }
}

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function merge(base, over) {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v;
  return out;
}

const DEFAULT_DNA = {
  grid: 24,
  padding: 1,
  keylines: { circle: 20, square: 18, portrait: [16, 20], landscape: [20, 16] },
  corners: { family: 'circular', radius: { large: 2, small: 1 }, largeThreshold: 8 },
  caps: 'round',
  joins: 'round',
  angles: [0, 45, 90],
  detail: 'low',
  minGap: 2,
  badge: { position: 'bottom-right', size: 8, gap: 2 },
  style: 'outline',
  stroke: 2,
  duotoneOpacity: 0.2,
};
export const DETAIL_BUDGET = { minimal: 4, low: 6, medium: 9, high: 13 };
export const STYLES = ['outline', 'duotone', 'filled'];

export function resolved(cfg) {
  return {
    ...cfg,
    dna: merge(DEFAULT_DNA, cfg.dna || {}),
    sizes: cfg.sizes || [],
  };
}

const KEYS = {
  '': ['product', 'personality', 'sizes', 'dir', 'avoid', 'dna'],
  dna: ['style', 'stroke', 'grid', 'padding', 'keylines', 'corners', 'caps', 'joins', 'angles', 'detail', 'minGap', 'badge', 'duotoneOpacity', 'signature', 'pixel'],
};
const ENUMS = {
  'dna.style': STYLES,
  'dna.corners.family': ['circular', 'squircle', 'sharp'],
  'dna.caps': ['round', 'butt', 'square'],
  'dna.joins': ['round', 'miter', 'bevel'],
  'dna.detail': ['minimal', 'low', 'medium', 'high'],
  'dna.badge.position': ['bottom-right', 'top-right', 'bottom-left', 'top-left'],
};
const REQUIRED = [
  'product', 'sizes', 'dir',
  'dna.style', 'dna.stroke', 'dna.grid', 'dna.padding', 'dna.keylines', 'dna.corners.family', 'dna.corners.radius', 'dna.caps', 'dna.joins',
  'dna.angles', 'dna.detail', 'dna.minGap',
];

function get(obj, p) {
  return p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

export function validate(cfg) {
  const errors = [], missing = [], warnings = [];
  for (const [section, known] of Object.entries(KEYS)) {
    const obj = section ? cfg[section] : cfg;
    if (!isObj(obj)) continue;
    for (const k of Object.keys(obj)) if (!known.includes(k)) errors.push(`unknown key "${section ? section + '.' : ''}${k}"`);
  }
  for (const [p, vals] of Object.entries(ENUMS)) {
    const v = get(cfg, p);
    if (v !== undefined && !vals.includes(v)) errors.push(`${p}: "${v}" is not one of ${vals.join(', ')}`);
  }
  for (const p of REQUIRED) if (empty(get(cfg, p))) missing.push(p);

  const stroke = get(cfg, 'dna.stroke');
  if (stroke !== undefined && !(typeof stroke === 'number' && stroke > 0)) errors.push('dna.stroke must be a number > 0');
  const sizes = cfg.sizes;
  if (sizes !== undefined && (!Array.isArray(sizes) || sizes.some((n) => typeof n !== 'number'))) errors.push('sizes must be a list of numbers (px)');
  const op = get(cfg, 'dna.duotoneOpacity');
  if (op !== undefined && (op <= 0 || op >= 1)) errors.push('dna.duotoneOpacity must be between 0 and 1');
  const r = get(cfg, 'dna.corners.radius');
  if (r && (typeof r.large !== 'number' || typeof r.small !== 'number')) errors.push('dna.corners.radius needs numeric "large" and "small"');
  const gap = get(cfg, 'dna.minGap');
  const grid = get(cfg, 'dna.grid');
  if (typeof gap === 'number' && typeof stroke === 'number' && typeof grid === 'number' && (stroke + gap) * 3 > grid) {
    warnings.push(`stroke ${stroke} + gap ${gap} leaves very little room on a ${grid} grid; icons will be forced to be very simple`);
  }
  const sizes0 = Array.isArray(sizes) ? sizes.filter((n) => typeof n === 'number') : [];
  if (get(cfg, 'dna.pixel') !== undefined && typeof get(cfg, 'dna.pixel') !== 'boolean') errors.push('dna.pixel must be true or false');
  if (get(cfg, 'dna.pixel') === true) {
    const need = 'pixel art needs';
    if (typeof stroke === 'number' && !Number.isInteger(stroke)) errors.push(`dna.stroke: ${need} a whole number; other widths break the pixel grid`);
    if (get(cfg, 'dna.corners.family') !== 'sharp') errors.push(`dna.corners.family: ${need} "sharp"`);
    if (get(cfg, 'dna.caps') === 'round') errors.push(`dna.caps: ${need} "square" or "butt"; round caps blur the end pixels`);
    if (get(cfg, 'dna.joins') !== undefined && get(cfg, 'dna.joins') !== 'miter') errors.push(`dna.joins: ${need} "miter"; other joins blur the corner pixels`);
    const ang = get(cfg, 'dna.angles');
    if (Array.isArray(ang) && ang.some((a) => a % 90 !== 0)) errors.push(`dna.angles: ${need} [0, 90]; diagonals are drawn as pixel stairs`);
    if (typeof grid === 'number') {
      const odd = sizes0.filter((n) => n % grid !== 0);
      if (odd.length) errors.push(`sizes: ${odd.join(', ')}px is not a whole multiple of the ${grid}px grid, so icon pixels would come out uneven (use ${[1, 2, 3].map((k) => k * grid).join(', ')}…)`);
    }
  }
  return { errors, missing, warnings };
}
