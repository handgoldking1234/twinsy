import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 미리보기 배포용: JS·CSS를 index.html 하나에 인라인
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
});
