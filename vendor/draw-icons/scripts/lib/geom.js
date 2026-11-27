const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

function tokenize(d) {
  const out = [];
  let i = 0;
  const n = d.length;
  while (i < n) {
    const ch = d[i];
    if (/[a-zA-Z]/.test(ch)) { out.push(ch); i++; continue; }
    if (/[\s,]/.test(ch)) { i++; continue; }
    const m = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(d.slice(i));
    if (!m) throw new Error(`Bad path data near "${d.slice(i, i + 12)}"`);
    out.push(m[0]);
    i += m[0].length;
  }
  return out;
}

// arc flags may have no separators ("a2 2 0 011 1"), so split such tokens
function readArgs(tokens, idx, cmd) {
  const count = ARGS[cmd.toUpperCase()];
  const args = [];
  let i = idx;
  while (args.length < count) {
    let t = tokens[i];
    if (t === undefined || /[a-zA-Z]/.test(t)) throw new Error(`Path command ${cmd} is missing arguments`);
    const pos = args.length;
    if (cmd.toUpperCase() === 'A' && (pos === 3 || pos === 4) && /^[01]./.test(t)) {
      args.push(Number(t[0]));
      tokens[i] = t.slice(1);
      continue;
    }
    args.push(Number(t));
    i++;
  }
  return [args, i];
}

export function parsePath(d) {
  const tokens = tokenize(d);
  const subpaths = [];
  let cur = null;
  let x = 0, y = 0, sx = 0, sy = 0;
  let lastC = null, lastQ = null;
  let i = 0;
  let cmd = null;
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) { cmd = tokens[i]; i++; }
    else if (!cmd) throw new Error('Path data must start with a command');
    const C = cmd.toUpperCase();
    const rel = cmd !== C;
    if (C === 'Z') {
      if (cur) {
        if (Math.hypot(x - sx, y - sy) > 1e-9) cur.segs.push({ type: 'L', from: [x, y], to: [sx, sy] });
        cur.closed = true;
      }
      x = sx; y = sy; lastC = lastQ = null;
      cmd = null;
      continue;
    }
    let args;
    [args, i] = readArgs(tokens, i, cmd);
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (C) {
      case 'M': {
        x = args[0] + ox; y = args[1] + oy; sx = x; sy = y;
        cur = { start: [x, y], segs: [], closed: false };
        subpaths.push(cur);
        cmd = rel ? 'l' : 'L';
        lastC = lastQ = null;
        break;
      }
      case 'L': case 'H': case 'V': {
        let nx = x, ny = y;
        if (C === 'L') { nx = args[0] + ox; ny = args[1] + oy; }
        if (C === 'H') nx = args[0] + (rel ? x : 0);
        if (C === 'V') ny = args[0] + (rel ? y : 0);
        ensure();
        cur.segs.push({ type: 'L', from: [x, y], to: [nx, ny] });
        x = nx; y = ny; lastC = lastQ = null;
        break;
      }
      case 'C': case 'S': {
        let c1, c2, to;
        if (C === 'C') {
          c1 = [args[0] + ox, args[1] + oy]; c2 = [args[2] + ox, args[3] + oy]; to = [args[4] + ox, args[5] + oy];
        } else {
          c1 = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
          c2 = [args[0] + ox, args[1] + oy]; to = [args[2] + ox, args[3] + oy];
        }
        ensure();
        cur.segs.push({ type: 'C', from: [x, y], c1, c2, to });
        lastC = c2; lastQ = null; [x, y] = to;
        break;
      }
      case 'Q': case 'T': {
        let q, to;
        if (C === 'Q') { q = [args[0] + ox, args[1] + oy]; to = [args[2] + ox, args[3] + oy]; }
        else { q = lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y]; to = [args[0] + ox, args[1] + oy]; }
        ensure();
        cur.segs.push({ type: 'Q', from: [x, y], q, to });
        lastQ = q; lastC = null; [x, y] = to;
        break;
      }
      case 'A': {
        const to = [args[5] + ox, args[6] + oy];
        ensure();
        const seg = arcSeg([x, y], args[0], args[1], args[2], args[3], args[4], to);
        cur.segs.push(seg);
        [x, y] = to; lastC = lastQ = null;
        break;
      }
    }
  }
  return subpaths;

  function ensure() {
    if (!cur) { cur = { start: [x, y], segs: [], closed: false }; subpaths.push(cur); }
  }
}

// SVG spec F.6.5: endpoint → centre parameterisation
function arcSeg(from, rx, ry, rotDeg, large, sweep, to) {
  rx = Math.abs(rx); ry = Math.abs(ry);
  if (rx < 1e-9 || ry < 1e-9 || (from[0] === to[0] && from[1] === to[1])) {
    return { type: 'L', from, to };
  }
  const phi = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (from[0] - to[0]) / 2, dy = (from[1] - to[1]) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let coef = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) coef = -coef;
  const cxp = (coef * rx * y1p) / ry, cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (from[0] + to[0]) / 2;
  const cy = sin * cxp + cos * cyp + (from[1] + to[1]) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  return { type: 'A', from, to, rx, ry, phi, cx, cy, t1, dt, large, sweep };
}

function pointAt(seg, t) {
  const [x0, y0] = seg.from;
  switch (seg.type) {
    case 'L': return [x0 + (seg.to[0] - x0) * t, y0 + (seg.to[1] - y0) * t];
    case 'Q': {
      const m = 1 - t;
      return [m * m * x0 + 2 * m * t * seg.q[0] + t * t * seg.to[0], m * m * y0 + 2 * m * t * seg.q[1] + t * t * seg.to[1]];
    }
    case 'C': {
      const m = 1 - t;
      const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
      return [a * x0 + b * seg.c1[0] + c * seg.c2[0] + d * seg.to[0], a * y0 + b * seg.c1[1] + c * seg.c2[1] + d * seg.to[1]];
    }
    case 'A': {
      const th = seg.t1 + seg.dt * t;
      const ex = seg.rx * Math.cos(th), ey = seg.ry * Math.sin(th);
      return [Math.cos(seg.phi) * ex - Math.sin(seg.phi) * ey + seg.cx, Math.sin(seg.phi) * ex + Math.cos(seg.phi) * ey + seg.cy];
    }
  }
}

export function segLength(seg) {
  if (seg.type === 'L') return Math.hypot(seg.to[0] - seg.from[0], seg.to[1] - seg.from[1]);
  let len = 0, p = seg.from;
  for (let i = 1; i <= 32; i++) { const q = pointAt(seg, i / 32); len += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; }
  return len;
}

export function tangentAt(seg, t) {
  const e = 1e-4;
  const a = pointAt(seg, Math.max(0, t - e)), b = pointAt(seg, Math.min(1, t + e));
  let dx = b[0] - a[0], dy = b[1] - a[1];
  let l = Math.hypot(dx, dy);
  if (l < 1e-12) {
    // control point sits on the endpoint: sample further in
    const a2 = pointAt(seg, Math.max(0, t - 0.02)), b2 = pointAt(seg, Math.min(1, t + 0.02));
    dx = b2[0] - a2[0]; dy = b2[1] - a2[1]; l = Math.hypot(dx, dy) || 1;
  }
  return [dx / l, dy / l];
}

export function flatten(sub, step = 0.2) {
  const pts = [{ x: sub.start[0], y: sub.start[1], s: 0 }];
  let s = 0;
  for (const seg of sub.segs) {
    const len = segLength(seg);
    const n = Math.max(1, Math.ceil(len / step));
    let prev = seg.from;
    for (let i = 1; i <= n; i++) {
      const p = pointAt(seg, i / n);
      s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      pts.push({ x: p[0], y: p[1], s });
      prev = p;
    }
  }
  if (sub.segs.length === 0) pts.push({ x: sub.start[0], y: sub.start[1], s: 0 }); // a dot
  return pts;
}

function distPointSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function polylineDistance(A, B) {
  let best = Infinity, at = null;
  const check = (P, Q) => {
    for (const p of P) {
      if (Q.length === 1) {
        const d = Math.hypot(p.x - Q[0].x, p.y - Q[0].y);
        if (d < best) { best = d; at = [p.x, p.y]; }
        continue;
      }
      for (let j = 1; j < Q.length; j++) {
        const d = distPointSeg(p.x, p.y, Q[j - 1].x, Q[j - 1].y, Q[j].x, Q[j].y);
        if (d < best) { best = d; at = [p.x, p.y]; }
      }
    }
  };
  check(A, B);
  check(B, A);
  return { d: best, at };
}

export function selfNarrowest(P, minArcSep, closed = false, touch = 0) {
  let best = Infinity, at = null;
  const total = P.length ? P[P.length - 1].s : 0;
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const ds = P[j].s - P[i].s;
      if ((closed ? Math.min(ds, total - ds) : ds) < minArcSep) continue;
      const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
      if (d <= touch) continue; // touching on purpose: a loop closing, a curl
      if (d < best) { best = d; at = [P[i].x, P[i].y]; }
    }
  }
  return { d: best, at };
}

export function pointInPolygons(x, y, polys) {
  let inside = false;
  for (const P of polys) {
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const xi = P[i].x, yi = P[i].y, xj = P[j].x, yj = P[j].y;
      if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

export const fmt = (n) => {
  const r = Math.round(n * 1000) / 1000;
  return (Object.is(r, -0) ? 0 : r).toString();
};

export function distToPolyline(p, Q) {
  if (Q.length === 1) return Math.hypot(p.x - Q[0].x, p.y - Q[0].y);
  let best = Infinity;
  for (let j = 1; j < Q.length; j++) best = Math.min(best, distPointSeg(p.x, p.y, Q[j - 1].x, Q[j - 1].y, Q[j].x, Q[j].y));
  return best;
}
