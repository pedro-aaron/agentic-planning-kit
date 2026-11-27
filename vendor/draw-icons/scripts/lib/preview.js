import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileSvg } from './compile.js';
import { listSources, loadSource } from './source.js';

const MIME = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

// Bundler output uses site-root URLs ("/assets/font.ttf"), so a leading slash is also tried
// against every folder above the file that referenced it.
function resolveLocal(ref, baseDir) {
  const clean = ref.trim().replace(/^["']|["']$/g, '').split(/[?#]/)[0];
  if (!clean || /^(https?:|data:|blob:|\/\/|#)/i.test(ref.trim().replace(/^["']/, ''))) return null;
  const candidates = [];
  if (clean.startsWith('file://')) candidates.push(fileURLToPath(clean));
  else if (path.isAbsolute(clean)) {
    candidates.push(clean);
    for (let d = baseDir; ; d = path.dirname(d)) { candidates.push(path.join(d, clean)); if (path.dirname(d) === d) break; }
  } else candidates.push(path.resolve(baseDir, clean));
  return candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
}

function inlineCss(css, baseDir, missing) {
  return css.replace(/url\(\s*([^)]+?)\s*\)/g, (m, ref) => {
    const file = resolveLocal(ref, baseDir);
    if (!file) { if (!/^["']?(https?:|data:|#)/.test(ref)) missing.add(ref); return m; }
    const mime = MIME[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream';
    return `url("data:${mime};base64,${fs.readFileSync(file).toString('base64')}")`;
  });
}

// The page is opened from a temp folder, and browsers block fonts over file://, so local CSS,
// fonts and images are inlined.
function inlineAssets(html, baseDir, missing) {
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel=["']?stylesheet/i.test(tag)) return tag;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    const file = href && resolveLocal(href, baseDir);
    if (!file) { if (href && !/^https?:|^\/\//.test(href)) missing.add(href); return tag; }
    return `<style>${inlineCss(fs.readFileSync(file, 'utf8'), path.dirname(file), missing)}</style>`;
  });
  html = html.replace(/<img\b([^>]*?)\bsrc=["']([^"']+)["']/gi, (m, pre, src) => {
    const file = resolveLocal(src, baseDir);
    if (!file) return m;
    const mime = MIME[path.extname(file).slice(1).toLowerCase()] || 'application/octet-stream';
    return `<img${pre}src="data:${mime};base64,${fs.readFileSync(file).toString('base64')}"`;
  });
  return inlineCss(html, baseDir, missing);
}

const PLACEHOLDER = /<i\b([^>]*\bdata-icon=["']([^"']+)["'][^>]*)>\s*<\/i>/gi;

function fillIcons(body, variant, v, problems) {
  const icons = new Map(listSources(variant.src).filter((e) => e.kind === 'icon').map((e) => [e.name, e]));
  let k = 0;
  return body.replace(PLACEHOLDER, (m, attrs, name) => {
    const entry = icons.get(name);
    if (!entry) {
      problems.add(`${variant.label ? variant.label + ': ' : ''}no icon "${name}" in ${variant.src}`);
      return `<span title="missing icon: ${name}" style="display:inline-block;width:1em;height:1em;outline:1px dashed red"></span>`;
    }
    let svg = compileSvg(loadSource(entry), variant.cfg.dna, { idPrefix: `pv${v}-${k++}` });
    const rest = attrs.replace(/\s*data-icon=["'][^"']*["']/g, '').trim();
    if (/\b(width|height)=/.test(rest)) svg = svg.replace(/ width="[^"]*" height="[^"]*"/, '');
    return rest ? svg.replace('<svg ', `<svg ${rest} `) : svg;
  });
}

export function buildPreview(templateFile, variants) {
  const missing = new Set(), problems = new Set();
  let html = inlineAssets(fs.readFileSync(templateFile, 'utf8'), path.dirname(path.resolve(templateFile)), missing);
  const bodyRe = /(<body\b[^>]*>)([\s\S]*?)(<\/body>)/i;
  const b = bodyRe.exec(html);
  const body = b ? b[2] : html;
  let filled;
  if (variants.length === 1) filled = fillIcons(body, variants[0], 0, problems);
  else {
    filled = '<div style="display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start;padding:24px">' +
      variants.map((variant, v) => `<section><div style="font:600 13px/1.4 system-ui,sans-serif;color:#888;margin-bottom:10px">${variant.label}</div>${fillIcons(body, variant, v, problems)}</section>`).join('') +
      '</div>';
  }
  html = b ? html.replace(bodyRe, (m, open, _, close) => open + filled + close) : filled;
  return { html, missing: [...missing], problems: [...problems] };
}
