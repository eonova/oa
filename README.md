# oa

监管 OA 简化版 monorepo。

## 结构

- `apps/web`：Vue 3 + TSX + Vite+ + Tailwind CSS 前端
- `apps/api`：Node.js + TypeScript 后端 API
- `apps/miniapp`：微信原生小程序，用于接收 PC 通知和手机端审核

## 命令

```bash
pnpm install
pnpm run dev
pnpm run typecheck
pnpm run build
```

开发服务：

- Web：http://127.0.0.1:5173
- API：http://127.0.0.1:3001

小程序：

- 使用微信开发者工具打开 `apps/miniapp`
- 默认对接本地 API：`http://127.0.0.1:3001`
- 演示审核人：`u-2`

## 部署

### Vercel

仓库根目录已提供 `vercel.json`，部署目标是 `apps/web`：

```bash
pnpm dlx vercel link
pnpm dlx vercel deploy --prod
```

Vercel 配置：

- Install Command：`pnpm install --frozen-lockfile`
- Build Command：`pnpm --filter @oa/web build`
- Output Directory：`apps/web/dist`

### Supabase

Supabase 配置在 `supabase/`，数据库迁移在 `supabase/migrations/`。

```bash
supabase link --project-ref <project-ref>
supabase db push
```

需要的环境变量见 `.env.example`。
