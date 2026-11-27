import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CONFIG_NAME, findConfig, loadConfig, resolved, validate } from './lib/config.js';
import { sourceDir, select, loadSource, listSources } from './lib/source.js';
import { lintIcon, applyWaivers, waivers } from './lib/lint.js';
import { roundPolyline, rect, parsePoints } from './lib/shape.js';
import * as usageLib from './lib/usage.js';

const USAGE = `icons CLI — run from the project root.
  check                        validate ${CONFIG_NAME}; list what is still missing, imports that
                               would break and sizes the icons weren't drawn for
  shape rect X Y W H [R]       rounded rectangle path in the project's corner family
  shape poly "x,y x,y ..." [--r R|R1,R2..] [--closed]   rounded polyline/polygon path
                               (both take --family circular|squircle|sharp to override the DNA)
  lint [names|all] [--json]    rule checks on sources ("all" includes parts/)
  render <names> [--out name.png]
                               one construction-sheet PNG for the named icons (into a temp review folder)
  sheet [names|all] [--size 16] [--out name.png] [--no-keylines]
                               consistency sheet PNG (+ blurred copy)
  preview <template.html> [--candidates a.yaml,b.yaml] [--out name.html] [--open]
                               the template (a piece of the product's UI with <i data-icon="name"> placeholders)
                               with the icons filled in, one copy per candidate DNA, as a self-contained page
  build [--force]              lint + check imports, then write <dir>/<name>.svg
Names may be space- or comma-separated. Global: --config <file>  --source <dir>`;

const BOOLEAN = new Set(['closed', 'force', 'json', 'no-keylines', 'help', 'open']);
function parseArgs(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!BOOLEAN.has(k) && next !== undefined && !next.startsWith('--')) {
        if (flags[k] !== undefined) flags[k] = [].concat(flags[k], next); else flags[k] = next;
        i++;
      } else flags[k] = true;
    } else pos.push(a);
  }
  return { pos, flags };
}

const { pos, flags } = parseArgs(process.argv.slice(2));
const cmd = pos.shift();
const names = () => pos.flatMap((p) => p.split(',')).map((p) => p.trim()).filter(Boolean);

// with --config (candidate DNAs during setup) the project is still the cwd, not the config's folder
function context({ needConfig = true } = {}) {
  const file = findConfig(process.cwd(), flags.config);
  if (!file || !fs.existsSync(file)) {
    if (needConfig) die(`No ${CONFIG_NAME} found. Set the project up first (see references/setup.md).`);
    return { file: null, root: process.cwd(), raw: {}, cfg: resolved({}) };
  }
  const raw = loadConfig(file);
  const cfg = resolved(raw);
  const root = flags.config ? process.cwd() : path.dirname(file);
  const src = flags.source ? path.resolve(flags.source) : sourceDir(cfg, root);
  return { file, root, raw, cfg, src };
}

function die(msg) { console.error(msg); process.exit(1); }

const rel = (p) => path.relative(process.cwd(), p) || '.';

function reviewDir(root) {
  const id = createHash('sha1').update(root).digest('hex').slice(0, 8);
  const dir = path.join(os.tmpdir(), 'draw-icons', `${path.basename(root)}-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function main() {
  switch (cmd) {
    case 'check': {
      const { raw, file, cfg, root, src } = context();
      const v = validate(raw);
      console.log(rel(file));
      for (const e of v.errors) console.log(`  ✗ ${e}`);
      for (const w of v.warnings) console.log(`  ! ${w}`);
      if (v.missing.length) console.log(`  missing: ${v.missing.join(', ')}`);
      if (!v.errors.length && !v.missing.length) console.log('  ✓ complete');
      process.exitCode = v.errors.length || v.missing.length ? 1 : 0;
      if (!v.errors.length && !v.missing.length) {
        const p = usageCheck(cfg, root, src);
        if (p.errors.length || p.warnings.length) console.log('\nIn the code:');
        printUsageProblems(p);
        if (p.errors.length) process.exitCode = 1;
      }
      break;
    }
    case 'preview': {
      const candidates = [].concat(flags.candidates || []).flatMap((c) => String(c).split(',')).map((c) => c.trim()).filter(Boolean);
      const { cfg, src, root } = context({ needConfig: !candidates.length });
      const tpl = pos[0];
      if (!tpl || !fs.existsSync(tpl)) die(`usage: preview <template.html> [--candidates a.yaml,b.yaml] [--out name.html] [--open]\nWrite the template outside the project, e.g. ${path.join(reviewDir(root), 'ui.html')}`);
      const variants = candidates.length
        ? candidates.map((c) => {
          const file = path.resolve(c);
          const dir = file.replace(/\.ya?ml$/, '');
          if (!fs.existsSync(file)) die(`No candidate config ${c}`);
          if (!fs.existsSync(dir)) die(`No source folder for ${c}: expected ${dir}/ next to it`);
          return { label: path.basename(dir), cfg: resolved(loadConfig(file)), src: dir };
        })
        : [{ label: '', cfg, src }];
      const { buildPreview } = await import('./lib/preview.js');
      const { html, missing, problems } = buildPreview(tpl, variants);
      const out = path.join(reviewDir(root), flags.out || 'preview.html');
      fs.writeFileSync(out, html);
      console.log(out);
      for (const p of problems) console.log(`  ✗ ${p}`);
      for (const m of missing) console.log(`  ! not found, left as is: ${m}`);
      if (flags.open) {
        const { spawn } = await import('node:child_process');
        const [cmd, args] = process.platform === 'darwin' ? ['open', [out]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', out]] : ['xdg-open', [out]];
        spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
      }
      process.exitCode = problems.length ? 1 : 0;
      break;
    }
    case 'shape': {
      const { cfg } = context({ needConfig: false });
      const dna = { ...cfg.dna, corners: { ...cfg.dna.corners, ...(flags.family ? { family: flags.family } : {}) } };
      const kind = pos.shift();
      let d;
      if (kind === 'rect') {
        const [x, y, w, h, r] = pos.map(Number);
        if ([x, y, w, h].some(Number.isNaN)) die('usage: shape rect X Y W H [R]');
        d = rect(x, y, w, h, Number.isNaN(r) ? undefined : r, dna);
      } else if (kind === 'poly') {
        const pts = parsePoints(pos.join(' '));
        const r = flags.r === undefined ? dna.corners.radius.large : String(flags.r).includes(',') ? String(flags.r).split(',').map(Number) : Number(flags.r);
        d = roundPolyline(pts, r, dna.corners.family, !!flags.closed, { diagonalBoost: flags.r === undefined });
      } else die('usage: shape rect X Y W H [R]  |  shape poly "x,y x,y ..." [--r R] [--closed] [--family circular|squircle|sharp]');
      console.log(d);
      break;
    }
    case 'lint': {
      const { cfg, src } = context();
      const results = await lintAll(cfg, src, names());
      if (flags.json) { console.log(JSON.stringify(results, null, 2)); break; }
      printLint(results);
      process.exitCode = results.some((r) => r.findings.some((f) => f.level === 'error')) ? 1 : 0;
      break;
    }
    case 'render': {
      const { cfg, src, root } = context();
      const R = await import('./lib/render.js');
      await R.loadResvg();
      const entries = select(src, names());
      if (!entries.length) die(`No icons to render in ${rel(src)}.`);
      const list = entries.flatMap((e) => {
        const s = loadSource(e);
        return s.smallSrc ? [s, { ...s, name: `${s.name}@${s.smallSrc.size}`, elements: s.smallSrc.elements }] : [s];
      });
      const auto = entries.length === 1 ? entries[0].name : `${entries[0].name}+${entries.length - 1}`;
      const file = path.join(reviewDir(root), flags.out || `render-${auto}.png`);
      fs.writeFileSync(file, R.png(R.constructionSheet(list, cfg)));
      console.log(file);
      break;
    }
    case 'sheet': {
      const { cfg, src, root } = context();
      const R = await import('./lib/render.js');
      const { compileSvg } = await import('./lib/compile.js');
      await R.loadResvg();
      const size = Number(flags.size) || 24;
      const entries = select(src, names());
      const items = [
        ...(flags['no-keylines'] ? [] : R.keylineRefs(cfg)),
        ...entries.map((e) => {
          const s = loadSource(e);
          return { name: e.name, kind: 'icon', svg: compileSvg(s, cfg.dna, { color: '#1d1d1f', idPrefix: 'sh' }) };
        }),
      ];
      const file = path.join(reviewDir(root), flags.out || 'sheet.png');
      if (!entries.length) die(`No icons to show in ${rel(src)}.`);
      fs.writeFileSync(file, R.png(R.setSheet(items, { size, zoom: size <= 20 ? 3 : 2, title: cfg.dna.style })));
      console.log(file);
      break;
    }
    case 'build': {
      const { cfg, raw, src, root } = context();
      const v = validate(raw);
      const problems = [...v.errors, ...v.missing.map((m) => `missing ${m}`)];
      if (problems.length) die('Config problems:\n' + problems.map((e) => '  ✗ ' + e).join('\n'));
      const results = await lintAll(cfg, src, []);
      const bad = results.filter((r) => r.findings.some((f) => f.level === 'error'));
      if (bad.length && !flags.force) { printLint(bad); die(`\nBuild stopped: ${bad.length} icon(s) have errors.`); }
      const usage = usageCheck(cfg, root, src);
      if (usage.errors.length && !flags.force) {
        printUsageProblems({ errors: usage.errors, warnings: [] });
        die('\nBuild stopped: these imports would break. Point them at an icon that exists (ask the user which, if it is not what they asked you to change), or keep the old source.');
      }
      const { build } = await import('./lib/build.js');
      const sources = select(src, []).map(loadSource);
      const written = build(sources, cfg, root);
      console.log(`Built ${sources.length} icons → ${written.length} files in ${cfg.dir}/`);
      printUsageProblems(usage);
      break;
    }
    default:
      console.log(USAGE);
      if (cmd) process.exitCode = 1;
  }
}

function usageCheck(cfg, root, src) {
  return usageLib.usageProblems(usageLib.findUsages(cfg, root), cfg, src);
}

function printUsageProblems({ errors, warnings }) {
  for (const e of errors) console.log(`  ✗ ${e}`);
  for (const w of warnings) console.log(`  ! ${w}`);
}

async function lintAll(cfg, src, names) {
  const entries = names.length && !names.includes('all') ? select(src, names) : listSources(src);
  let R = null;
  try { R = await import('./lib/render.js'); await R.loadResvg(); } catch { R = null; }
  const { compileSvg } = await import('./lib/compile.js');
  let ref = null;
  if (R) {
    const G = cfg.dna.grid, k = cfg.dna.keylines;
    ref = R.inkCoverage(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${G} ${G}" fill="none" stroke="#000" stroke-width="${cfg.dna.stroke}"><circle cx="${G / 2}" cy="${G / 2}" r="${k.circle / 2}"/></svg>`);
  }
  const results = [];
  for (const e of entries) {
    let s;
    try { s = loadSource(e); } catch (err) { results.push({ name: e.name, kind: e.kind, findings: [{ rule: 'parse', level: 'error', message: err.message }] }); continue; }
    let findings = lintIcon(s, cfg, { kind: e.kind });
    if (s.smallSrc) {
      const small = lintIcon({ ...s, name: e.name, root: s.smallSrc.root, elements: s.smallSrc.elements, others: s.smallSrc.others }, cfg, { kind: 'part', detailOverride: 'minimal' });
      findings = findings.concat(small.map((f) => ({ ...f, message: `[@${s.smallSrc.size}] ${f.message}` })));
    }
    if (R && ref && !findings.some((f) => f.level === 'error') && e.kind === 'icon') {
      const ink = R.inkCoverage(compileSvg(s, cfg.dna, { style: 'outline', color: '#000' }));
      const ratio = ink / ref;
      if (ratio > 1.6) findings.push({ rule: 'heavy', level: 'warn', message: `${ratio.toFixed(2)}× the ink of the keyline circle; it will look darker and busier than its neighbours` });
      else if (ratio < 0.3) findings.push({ rule: 'light', level: 'info', message: `only ${ratio.toFixed(2)}× the ink of the keyline circle; fine for simple glyphs (minus, chevron), otherwise it will look faint` });
      findings.push({ rule: 'ink', level: 'info', message: `ink ${ratio.toFixed(2)}× keyline circle` });
    }
    results.push({ name: e.name, kind: e.kind, findings: applyWaivers(findings, waivers(s.root)) });
  }
  return results;
}

function printLint(results) {
  const icon = { error: '✗', warn: '!', info: '·', waived: '~' };
  let errors = 0, warns = 0;
  for (const r of results) {
    const bad = r.findings.filter((f) => f.level === 'error').length, w = r.findings.filter((f) => f.level === 'warn').length;
    errors += bad; warns += w;
    const head = bad ? '✗' : w ? '!' : '✓';
    const ink = r.findings.find((f) => f.rule === 'ink');
    console.log(`${head} ${r.kind === 'part' ? 'part ' : ''}${r.name}${ink ? `  (${ink.message})` : ''}`);
    for (const f of r.findings) if (f.rule !== 'ink') console.log(`    ${icon[f.level]} ${f.rule}: ${f.message}`);
  }
  console.log(`\n${results.length} checked · ${errors} errors · ${warns} warnings`);
}

main().catch((e) => die(e.message));
