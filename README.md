# Alex's Life

Alex XU 的个人博客，记录网络工程、潜水，以及数字世界与深蓝之间的探索。

- 网站：https://safetystop.qzz.io
- GitHub：https://github.com/Alex-Xushjie
- 仓库：https://github.com/Alex-Xushjie/alex-life-astro

## 技术栈

- Astro 6
- Tailwind CSS v4
- Markdown / MDX
- Shiki、KaTeX、Mermaid
- RSS、SEO、PWA
- 可选的 Waline 评论与友链功能

## 本地开发

需要 Node.js 18 或更高版本。

```bash
git clone https://github.com/Alex-Xushjie/alex-life-astro.git
cd alex-life-astro
npm install
npm run dev
```

访问 <http://localhost:4321>。

## 构建

```bash
npm run build
npm run preview
```

静态构建产物位于 `dist/`。

## 站点配置

主要配置位于 `src/consts.ts`：

```typescript
export const SITE_TITLE = "Alex's Life";
export const SITE_DESCRIPTION = 'Bridging the digital world, exploring the deep blue.';
export const SITE_AUTHOR = 'Alex XU';
export const SITE_URL = 'https://safetystop.qzz.io';
export const SITE_AVATAR = '/images/avatar.png';
export const SITE_COVER = '/images/background.jpg';
```

博客文章位于 `src/content/blog/`，个人介绍位于 `src/pages/about.astro`，友链数据位于 `public/links.json`。

## 部署

运行 `npm run build` 后，可将 `dist/` 部署到 Cloudflare Pages、Vercel 或其他静态网站托管平台。

## 作者

Alex XU
