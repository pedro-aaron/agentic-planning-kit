import { fmt } from './geom.js';

// Squircle corner, measured from Hugeicons' path data. For corner P with tangent length t,
// u = back along the incoming edge, v = along the outgoing edge:
//   c1 = P + a·t·u, c2 = P + b·t·u, M = P + m·t·(u+v), c3 = P + b·t·v, c4 = P + a·t·v
// The two cubics meet at M with matching tangents, so the curve is smooth at any corner angle.
const SQ = { a: 0.5286, b: 0.2929, m: 0.1464 };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
const P = (p) => `${fmt(p[0])} ${fmt(p[1])}`;

export function roundPolyline(pts, radii, family = 'circular', closed = false, opts = {}) {
  const n = pts.length;
  if (n < 2) throw new Error('need at least 2 points');
  const rOf = (i) => (Array.isArray(radii) ? radii[i] ?? radii[radii.length - 1] : radii) || 0;
  const axis = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6;
  const want = [];
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) { want.push(null); continue; }
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let r = family === 'sharp' ? 0 : rOf(i);
    const u = unit(sub(a, p)), v = unit(sub(b, p));
    const cos = Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]));
    const theta = Math.acos(cos);
    if (r <= 0 || theta > Math.PI - 1e-3 || theta < 1e-3) { want.push({ p, sharp: true, t: 0 }); continue; }
    // Lucide: diagonals meeting at 90° get ~1.207× the radius so the corner looks the same size
    if (opts.diagonalBoost && family === 'circular' && Math.abs(theta - Math.PI / 2) < 0.09 && !axis(a, p) && !axis(p, b)) r *= 1.2071;
    const cross = (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
    want.push({ p, u, v, theta, t: r / Math.tan(theta / 2), sweep: cross > 0 ? 1 : 0 });
  }
  // two corners sharing an edge can't use more than the whole edge
  const scale = want.map(() => 1);
  const edges = closed ? n : n - 1;
  for (let e = 0; e < edges; e++) {
    const i = e, j = (e + 1) % n;
    const L = len(sub(pts[j], pts[i]));
    const ti = want[i]?.t || 0, tj = want[j]?.t || 0;
    if (ti + tj > L && ti + tj > 0) { const k = L / (ti + tj); scale[i] = Math.min(scale[i], k); scale[j] = Math.min(scale[j], k); }
  }
  const corners = want.map((c, i) => {
    if (!c || c.sharp) return c;
    const t = c.t * scale[i];
    return { ...c, t, r: t * Math.tan(c.theta / 2) };
  });
  const startOf = (c) => (c && !c.sharp ? add(c.p, mul(c.u, c.t)) : c ? c.p : null);
  const cornerPath = (c) => {
    if (!c || c.sharp) return `L${P(c ? c.p : [0, 0])}`;
    const S = add(c.p, mul(c.u, c.t)), E = add(c.p, mul(c.v, c.t));
    if (family === 'squircle') {
      const c1 = add(c.p, mul(c.u, SQ.a * c.t)), c2 = add(c.p, mul(c.u, SQ.b * c.t));
      const M = add(c.p, mul(add(c.u, c.v), SQ.m * c.t));
      const c3 = add(c.p, mul(c.v, SQ.b * c.t)), c4 = add(c.p, mul(c.v, SQ.a * c.t));
      return `L${P(S)}C${P(c1)} ${P(c2)} ${P(M)}C${P(c3)} ${P(c4)} ${P(E)}`;
    }
    return `L${P(S)}A${fmt(c.r)} ${fmt(c.r)} 0 0 ${c.sweep} ${P(E)}`;
  };
  let d;
  if (!closed) {
    d = `M${P(pts[0])}`;
    for (let i = 1; i < n - 1; i++) d += cornerPath(corners[i]);
    d += `L${P(pts[n - 1])}`;
  } else {
    // start mid-way along the straight part of the first edge, not at the edge's midpoint:
    // with unequal tangents on its two corners, the midpoint would make the path back-track
    const endOf = (c) => (c && !c.sharp ? add(c.p, mul(c.v, c.t)) : c ? c.p : null);
    const mid = mul(add(endOf(corners[0]), startOf(corners[1])), 0.5);
    d = `M${P(mid)}`;
    for (let k = 1; k <= n; k++) d += cornerPath(corners[k % n]);
    d += 'Z';
  }
  return dropZeroLengthLines(d);
}

function dropZeroLengthLines(d) {
  const re = /([MLCA])([^MLCAZ]*)/g;
  let out = '', cur = null, m;
  while ((m = re.exec(d))) {
    const cmd = m[1], args = m[2].trim();
    const nums = args.split(/[\s,]+/).map(Number);
    const end = cmd === 'A' ? nums.slice(5, 7) : nums.slice(-2);
    if (cmd === 'L' && cur && Math.abs(end[0] - cur[0]) < 1e-6 && Math.abs(end[1] - cur[1]) < 1e-6) continue;
    out += cmd + args;
    cur = end;
  }
  if (d.endsWith('Z')) out += 'Z';
  return out;
}

export function rect(x, y, w, h, r, dna) {
  const fam = dna.corners?.family || 'circular';
  if (r === undefined || r === null) {
    const rad = dna.corners?.radius || { large: 2, small: 1 };
    r = Math.min(w, h) >= (dna.corners?.largeThreshold ?? 8) ? rad.large : rad.small;
  }
  return roundPolyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r, fam, true);
}

export function parsePoints(s) {
  const n = s.trim().split(/[\s,]+/).map(Number);
  if (n.length % 2 || n.some(Number.isNaN)) throw new Error(`bad points "${s}" (use "x,y x,y ...")`);
  const pts = [];
  for (let i = 0; i < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  return pts;
}
