// src/algorithm 을 엣지 함수(Deno)용으로 복사한다. Deno는 import 경로에 .ts 확장자가 필요하다.
//   npm run functions:sync
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../src/algorithm/', import.meta.url);
const dst = new URL('../supabase/functions/_shared/algorithm/', import.meta.url);
mkdirSync(dst, { recursive: true });
for (const f of readdirSync(src)) {
  if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue;
  const code = readFileSync(new URL(f, src), 'utf8').replace(/from '(\.\/[\w-]+)'/g, "from '$1.ts'");
  writeFileSync(new URL(f, dst), `// 자동 복사본 — 원본은 src/algorithm/${f} (npm run functions:sync)\n${code}`);
}
console.log('synced src/algorithm → supabase/functions/_shared/algorithm');
