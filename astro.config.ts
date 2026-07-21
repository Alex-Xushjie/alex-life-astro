import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from '@astrojs/markdown-remark';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  site: 'https://safetystop.qzz.io',
  integrations: [mdx()],
  vite: {
    plugins: [
      tsconfigPaths(),
    ],
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
