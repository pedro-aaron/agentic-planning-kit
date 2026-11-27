import { serializeElement, role } from './svg.js';

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// a source may set data-style="filled" on its <svg>: the filled twin of an icon for active states
export function styleOf(src, dna) {
  return src.root?.['data-style'] || dna.style;
}

export function compileSvg(src, dna, opts = {}) {
  const { color = 'currentColor' } = opts;
  const style = opts.style || styleOf(src, dna);
  const stroke = dna.stroke;
  const grid = dna.grid || 24;
  const els = src.elements;
  const sil = els.filter((e) => role(e) === 'silhouette');
  const strokes = els.filter((e) => role(e) === 'stroke');
  const details = els.filter((e) => role(e) === 'detail');
  const rootAttrs = [
    opts.xmlns === false ? null : 'xmlns="http://www.w3.org/2000/svg"',
    `width="${grid}"`, `height="${grid}"`, `viewBox="0 0 ${grid} ${grid}"`,
    'fill="none"', `stroke="${color}"`, `stroke-width="${round(stroke)}"`,
    `stroke-linecap="${dna.caps || 'round'}"`, `stroke-linejoin="${dna.joins || 'round'}"`,
    dna.pixel ? 'shape-rendering="crispEdges"' : null,
  ].filter(Boolean).join(' ');

  const S = (list) => list.map((e) => serializeElement(e)).join('');
  let body = '';
  if (style === 'outline' || sil.length === 0) {
    body = S(strokes) + S(details);
  } else if (style === 'duotone') {
    body = `<g fill="${color}" stroke="none" opacity="${dna.duotoneOpacity ?? 0.2}">${S(sil)}</g>` + S(strokes) + S(details);
  } else if (style === 'filled') {
    const fillGroup = `<g fill="${color}">${S(sil)}</g>` + S(strokes);
    if (details.length) {
      const id = `${opts.idPrefix || 'is'}-${src.name}-${hash(src.name + stroke + els.length)}`.replace(/[^\w-]/g, '');
      const pad = 4;
      body = `<mask id="${id}" maskUnits="userSpaceOnUse" x="${-pad}" y="${-pad}" width="${grid + 2 * pad}" height="${grid + 2 * pad}">` +
        `<rect x="${-pad}" y="${-pad}" width="${grid + 2 * pad}" height="${grid + 2 * pad}" fill="#fff" stroke="none"/>` +
        `<g stroke="#000">${S(details)}</g></mask><g mask="url(#${id})">${fillGroup}</g>`;
    } else body = fillGroup;
  }
  return `<svg ${rootAttrs}>${body}</svg>`;
}

function round(n) { return Math.round(n * 1000) / 1000; }
