import fs from 'node:fs';
import path from 'node:path';
import { compileSvg } from './compile.js';

// the SVGs at the top of <dir> belong to build: they are removed first so renamed or deleted icons don't linger
export function build(sources, cfg, root) {
  const dir = path.resolve(root, cfg.dir);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.svg')) fs.rmSync(path.join(dir, f));
  const written = [];
  const write = (name, src) => {
    const p = path.join(dir, `${name}.svg`);
    fs.writeFileSync(p, compileSvg(src, cfg.dna) + '\n');
    written.push(path.relative(root, p));
  };
  for (const src of sources) {
    write(src.name, src);
    if (src.smallSrc) write(`${src.name}@${src.smallSrc.size}`, { name: src.name, root: src.root, elements: src.smallSrc.elements });
  }
  return written;
}
