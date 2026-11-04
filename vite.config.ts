import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 기본 빌드는 일반 SPA (Vercel 배포용).
// ARTIFACT=1 npm run build 이면 JS·CSS를 index.html 하나에 인라인 (Claude 미리보기 페이지용)
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.ARTIFACT ? [viteSingleFile()] : [])],
});
