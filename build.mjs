// Copies the static site into dist/ for deployment. No bundler needed.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const p of ['index.html', 'css', 'js']) cpSync(p, `dist/${p}`, { recursive: true });
console.log('dist/ ready');
