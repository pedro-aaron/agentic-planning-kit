// APK adaptation: load the bundled WASM renderer and sheet font. See UPSTREAM.md.
import { readFileSync } from 'node:fs';
import { initWasm, Resvg } from '../deps/resvg/index.mjs';
import { compileSvg } from './compile.js';
import { elementSubpaths, role } from './svg.js';

const fontFamily = 'ABeeZee';
const fontBuffers = [readFileSync(new URL('../deps/abeezee/ABeeZee-Regular.ttf', import.meta.url))];
let initialization;
export async function loadResvg() {
  initialization ??= initWasm(readFileSync(new URL('../deps/resvg/index_bg.wasm', import.meta.url)));
  await initialization;
  return Resvg;
}

function rasterize(svg, options, readImage) {
  const renderer = new Resvg(svg, options);
  try {
    const image = renderer.render();
    try {
      return readImage(image);
    } finally {
      image.free();
    }
  } finally {
    renderer.free();
  }
}

export function png(svg, width) {
  return rasterize(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: fontFamily, sansSerifFamily: fontFamily },
    shapeRendering: 2, textRendering: 1,
  }, (image) => image.asPng());
}

export function inkCoverage(svg, size = 48) {
  const pixels = rasterize(svg, { fitTo: { mode: 'width', value: size } }, (image) => image.pixels);
  let a = 0;
  for (let i = 3; i < pixels.length; i += 4) a += pixels[i] / 255;
  return a / (pixels.length / 4);
}

const dataUri = (buf) => `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const label = (x, y, text, opts = {}) =>
  `<text x="${x}" y="${y}" font-family="${fontFamily}, sans-serif" font-size="${opts.size || 11}" fill="${opts.color || '#555'}"${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}${opts.weight ? ` font-weight="${opts.weight}"` : ''}>${esc(text)}</text>`;

function place(svg, x, y, size) {
  return svg.replace(/^<svg /, `<svg x="${x}" y="${y}" `).replace(/width="[^"]*" height="[^"]*"/, `width="${size}" height="${size}"`);
}

function pixelTile(svg, x, y, px, zoom, bg = '#fff') {
  const buf = png(svg.replace(/width="[^"]*" height="[^"]*"/, `width="${px}" height="${px}"`), px);
  return `<rect x="${x}" y="${y}" width="${px * zoom}" height="${px * zoom}" fill="${bg}"/>` +
    `<image x="${x}" y="${y}" width="${px * zoom}" height="${px * zoom}" href="${dataUri(buf)}" image-rendering="optimizeSpeed"/>`;
}

function constructionView(src, cfg, x, y, scale) {
  const { dna } = cfg;
  const G = dna.grid, p = dna.padding, k = dna.keylines || {};
  const W = G * scale;
  let g = `<svg x="${x}" y="${y}" width="${W}" height="${W}" viewBox="0 0 ${G} ${G}">`;
  g += `<rect width="${G}" height="${G}" fill="#fde8e8"/><rect x="${p}" y="${p}" width="${G - 2 * p}" height="${G - 2 * p}" fill="#fff"/>`;
  for (let i = 0; i <= G; i++) {
    const c = i === G / 2 ? '#c9c9c9' : '#ececec';
    g += `<line x1="${i}" y1="0" x2="${i}" y2="${G}" stroke="${c}" stroke-width="0.04"/><line x1="0" y1="${i}" x2="${G}" y2="${i}" stroke="${c}" stroke-width="0.04"/>`;
  }
  const kl = 'fill="none" stroke="#8ec5ff" stroke-width="0.06" stroke-dasharray="0.3 0.2"';
  if (k.circle) g += `<circle cx="${G / 2}" cy="${G / 2}" r="${k.circle / 2}" ${kl}/>`;
  if (k.square) g += `<rect x="${(G - k.square) / 2}" y="${(G - k.square) / 2}" width="${k.square}" height="${k.square}" ${kl}/>`;
  if (k.portrait) g += `<rect x="${(G - k.portrait[0]) / 2}" y="${(G - k.portrait[1]) / 2}" width="${k.portrait[0]}" height="${k.portrait[1]}" ${kl}/>`;
  if (k.landscape) g += `<rect x="${(G - k.landscape[0]) / 2}" y="${(G - k.landscape[1]) / 2}" width="${k.landscape[0]}" height="${k.landscape[1]}" ${kl}/>`;
  const icon = compileSvg(src, dna, { style: 'outline', color: '#1d1d1f', xmlns: false });
  g += icon.replace(/^<svg [^>]*>/, `<g fill="none" stroke="#1d1d1f" stroke-opacity="0.82" stroke-width="${dna.stroke}" stroke-linecap="${dna.caps}" stroke-linejoin="${dna.joins}">`).replace(/<\/svg>$/, '</g>');
  for (const el of src.elements) {
    const r = role(el);
    let subs = [];
    try { subs = elementSubpaths(el); } catch { continue; }
    const shape = `<${el.tag} ${Object.entries(el.attrs).filter(([a]) => !a.startsWith('data-')).map(([a, v]) => `${a}="${v}"`).join(' ')}`;
    if (r === 'silhouette') {
      g += `${shape} fill="#2f80ed" fill-opacity="0.10" stroke="#2f80ed" stroke-width="0.07" stroke-dasharray="0.25 0.15"/>`;
      continue;
    }
    const col = r === 'detail' ? '#d97706' : '#e5484d';
    g += `${shape} fill="none" stroke="${col}" stroke-width="0.07"/>`;
    for (const s of subs) {
      g += `<circle cx="${s.start[0]}" cy="${s.start[1]}" r="0.14" fill="${col}"/>`;
      for (const sg of s.segs) g += `<circle cx="${sg.to[0]}" cy="${sg.to[1]}" r="0.1" fill="${col}"/>`;
    }
  }
  g += '</svg>';
  return g;
}

export function constructionSheet(sources, cfg) {
  const { dna } = cfg;
  const blockH = 300;
  const blocks = sources.map((src, i) => {
    const y0 = 10;
    const built = compileSvg(src, dna, { color: '#1d1d1f', idPrefix: `c${i}` });
    let body = '';
    body += label(14, y0 + 16, src.name, { size: 15, color: '#111', weight: 'bold' });
    body += constructionView(src, cfg, 14, y0 + 26, 264 / (dna.grid || 24));
    const x0 = 300;
    body += label(x0, y0 + 16, 'as built');
    body += place(built, x0, y0 + 26, 64);
    body += label(x0, y0 + 124, 'real pixels (enlarged ×4): sizes used in the product');
    const ctx = cfg.sizes.filter((n) => n <= 32);
    const sizes = [...new Set(ctx.length ? ctx : [16, 24])].sort((a, b) => a - b).slice(0, 4);
    let px = x0;
    for (const size of sizes) {
      body += pixelTile(built, px, y0 + 132, size, 4) + label(px, y0 + 132 + size * 4 + 13, `${size}px`, { size: 10 });
      px += size * 4 + 14;
    }
    return { body, w: px + 10 };
  });
  // two columns from 4 icons on, so a batch stays one image that is readable without zooming
  const cols = sources.length > 3 ? 2 : 1;
  const bw = Math.max(760, ...blocks.map((b) => b.w));
  const rows = Math.ceil(sources.length / cols);
  const W = cols * bw;
  let body = '';
  blocks.forEach((b, i) => { body += `<g transform="translate(${(i % cols) * bw} ${Math.floor(i / cols) * blockH})">${b.body}</g>`; });
  for (let r = 1; r <= rows; r++) body += `<line x1="0" y1="${r * blockH + 4}" x2="${W}" y2="${r * blockH + 4}" stroke="#e5e5e5"/>`;
  if (cols > 1) body += `<line x1="${bw}" y1="0" x2="${bw}" y2="${rows * blockH}" stroke="#e5e5e5"/>`;
  const H = rows * blockH + 10;
  const legend = label(14, H + 4, 'red = centreline + nodes · orange = detail (cut out of the fill) · blue = silhouette · pink frame = padding · dashed = keylines', { size: 10, color: '#888' });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + 14}" viewBox="0 0 ${W} ${H + 14}"><rect width="100%" height="100%" fill="#fafafa"/>${body}${legend}</svg>`;
}

export function setSheet(items, { size = 24, zoom = 2, cols = 10, title = '' } = {}) {
  const cell = size * zoom + 26;
  const rows = Math.ceil(items.length / cols);
  const gridW = cols * cell, gridH = rows * (cell + 12);
  let tiles = '', names = '';
  items.forEach((it, i) => {
    const cx = (i % cols) * cell + 13, cy = Math.floor(i / cols) * (cell + 12) + 8;
    tiles += pixelTile(it.svg, cx, cy, size, zoom, 'none');
    const col = it.kind === 'key' ? '#2f80ed' : '#111';
    names += label(cx + (size * zoom) / 2, cy + size * zoom + 14, it.name.length > 14 ? it.name.slice(0, 13) + '…' : it.name, { size: 9, color: col, anchor: 'middle' });
  });
  const top = 28;
  const W = gridW + 20;
  const H = top + gridH * 2 + 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs><filter id="blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${zoom * 1.6}"/></filter></defs>` +
    `<rect width="100%" height="100%" fill="#fff"/>` +
    label(12, 18, `${title} — ${size}px real pixels ×${zoom}. black = icons, blue = keylines`, { size: 11, color: '#333' }) +
    `<g transform="translate(0 ${top})">${tiles}${names}</g>` +
    label(12, top + gridH + 26, 'blurred: every blob should look about as dark and as big as its neighbours', { size: 11, color: '#333' }) +
    `<g transform="translate(0 ${top + gridH + 36})" filter="url(#blur)">${tiles}</g></svg>`;
}

export function keylineRefs(cfg) {
  const { dna } = cfg;
  const G = dna.grid, k = dna.keylines || {}, w = dna.stroke;
  const root = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${G}" height="${G}" viewBox="0 0 ${G} ${G}" fill="none" stroke="#2f80ed" stroke-width="${w}" stroke-linecap="${dna.caps}" stroke-linejoin="${dna.joins}">${inner}</svg>`;
  const r = dna.corners.family === 'sharp' ? 0 : dna.corners.radius.large;
  const out = [];
  if (k.circle) out.push({ name: 'keyline circle', kind: 'key', svg: root(`<circle cx="${G / 2}" cy="${G / 2}" r="${k.circle / 2}"/>`) });
  if (k.square) out.push({ name: 'keyline square', kind: 'key', svg: root(`<rect x="${(G - k.square) / 2}" y="${(G - k.square) / 2}" width="${k.square}" height="${k.square}" rx="${r}"/>`) });
  return out;
}
