import { parsePath, fmt } from './geom.js';

export const SHAPES = ['path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect'];

const GEOMETRY_ATTRS = {
  path: ['d'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
};
export function allowedAttrs(tag) {
  return [...(GEOMETRY_ATTRS[tag] || []), 'data-role'];
}

function parseAttrs(s) {
  const attrs = {};
  const re = /([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(s))) attrs[m[1]] = m[3] ?? m[4];
  return attrs;
}

// groups are flattened, but depth and parents are kept so lint can flag them
export function parseSvg(text) {
  const clean = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[\s\S]*?\?>/g, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  const rootM = /<svg\b([^>]*)>/i.exec(clean);
  if (!rootM) throw new Error('No <svg> root element found');
  const root = parseAttrs(rootM[1]);
  const body = clean.slice(rootM.index + rootM[0].length).replace(/<\/svg>\s*$/i, '');
  const elements = [];
  const others = [];
  const re = /<\s*(\/?)([\w:-]+)([^>]*?)(\/?)\s*>/g;
  let m;
  const stack = [];
  while ((m = re.exec(body))) {
    const [, closing, tag, rest, selfClose] = m;
    if (closing) { stack.pop(); continue; }
    if (tag === 'svg') continue;
    const attrs = parseAttrs(rest);
    if (SHAPES.includes(tag)) elements.push({ tag, attrs, depth: stack.length, parents: [...stack] });
    else others.push(tag);
    if (!selfClose && !SHAPES.includes(tag)) stack.push(tag);
    if (!selfClose && SHAPES.includes(tag)) {
      // a shape with children (e.g. <title>): skip to its close tag
      const close = body.indexOf(`</${tag}>`, re.lastIndex);
      if (close !== -1) re.lastIndex = close + tag.length + 3;
    }
  }
  return { root, elements, others };
}

const num = (v, d = 0) => (v === undefined || v === '' ? d : Number(v));

function toPathData(el) {
  const a = el.attrs;
  switch (el.tag) {
    case 'path': return a.d || '';
    case 'line': return `M${fmt(num(a.x1))} ${fmt(num(a.y1))}L${fmt(num(a.x2))} ${fmt(num(a.y2))}`;
    case 'polyline':
    case 'polygon': {
      const n = (a.points || '').trim().split(/[\s,]+/).map(Number);
      let d = '';
      for (let i = 0; i + 1 < n.length; i += 2) d += `${i ? 'L' : 'M'}${fmt(n[i])} ${fmt(n[i + 1])}`;
      return el.tag === 'polygon' ? d + 'Z' : d;
    }
    case 'circle': {
      const cx = num(a.cx), cy = num(a.cy), r = num(a.r);
      return `M${fmt(cx - r)} ${fmt(cy)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx + r)} ${fmt(cy)}A${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(cx - r)} ${fmt(cy)}Z`;
    }
    case 'ellipse': {
      const cx = num(a.cx), cy = num(a.cy), rx = num(a.rx), ry = num(a.ry);
      return `M${fmt(cx - rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx + rx)} ${fmt(cy)}A${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(cx - rx)} ${fmt(cy)}Z`;
    }
    case 'rect': {
      const x = num(a.x), y = num(a.y), w = num(a.width), h = num(a.height);
      let rx = a.rx !== undefined ? num(a.rx) : a.ry !== undefined ? num(a.ry) : 0;
      let ry = a.ry !== undefined ? num(a.ry) : rx;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M${fmt(x)} ${fmt(y)}H${fmt(x + w)}V${fmt(y + h)}H${fmt(x)}Z`;
      return `M${fmt(x + rx)} ${fmt(y)}H${fmt(x + w - rx)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x + w)} ${fmt(y + ry)}` +
        `V${fmt(y + h - ry)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x + w - rx)} ${fmt(y + h)}` +
        `H${fmt(x + rx)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x)} ${fmt(y + h - ry)}` +
        `V${fmt(y + ry)}A${fmt(rx)} ${fmt(ry)} 0 0 1 ${fmt(x + rx)} ${fmt(y)}Z`;
    }
  }
  return '';
}

export function elementSubpaths(el) {
  return parsePath(toPathData(el));
}

export function role(el) {
  const r = el.attrs['data-role'];
  return r === 'silhouette' || r === 'detail' ? r : 'stroke';
}

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function serializeElement(el) {
  const parts = [el.tag];
  for (const k of GEOMETRY_ATTRS[el.tag] || []) if (el.attrs[k] !== undefined) parts.push(`${k}="${esc(el.attrs[k])}"`);
  return `<${parts.join(' ')}/>`;
}
