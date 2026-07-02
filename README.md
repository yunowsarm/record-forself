# 工作周报系统

基于 Vue 3 + Element Plus + Supabase 的多人工作周报管理系统。每位用户登录后可独立撰写、管理自己的周报，数据通过 Supabase Row Level Security 隔离。

## 功能

- 邮箱注册 / 登录（Supabase Auth）
- 周报 CRUD：本周完成、进行中、下周计划、问题与风险
- 草稿 / 发布状态
- 按年份、状态筛选列表
- 每人每周仅一份周报（唯一约束）
- 工作日/节假日智能计算（基于 [chinese-workday](https://www.npmjs.com/package/chinese-workday)）

## 前置要求

- Node.js 18+
- pnpm
- [Supabase](https://supabase.com/) 项目（免费 tier 即可）

## Supabase 配置

### 1. 创建项目

在 Supabase Dashboard 创建项目，记录：

- **Project URL**（Settings → API）
- **anon public key** 或 **Publishable key**（Settings → API）

### 2. 开启 Email 登录

Authentication → Providers → Email → 启用

如需本地开发跳过邮件确认：Authentication → Providers → Email → 关闭「Confirm email」

### 3. 执行数据库迁移

在 Supabase Dashboard → SQL Editor 中运行 [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) 的全部内容。

该脚本会创建 `profiles`、`weekly_reports` 表、RLS 策略及注册时自动创建 profile 的 trigger。

### 4. 配置环境变量

```powershell
Copy-Item .env.example .env.local
```

编辑 `.env.local`：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## 本地启动

```bash
pnpm install
pnpm dev
```

浏览器访问 http://localhost:5173

## 构建

```bash
pnpm build
```

## 项目结构

```
src/
├── composables/     # useAuth、useReports
├── layouts/         # AppLayout
├── lib/             # Supabase client
├── router/          # 路由与守卫
├── types/           # TypeScript 类型
├── utils/           # 周期计算工具
└── views/           # 页面组件
```

## 技术栈

- Vue 3 + Vite + TypeScript
- Element Plus
- Vue Router
- Supabase（Auth + Postgres + RLS）
- [chinese-workday](https://www.npmjs.com/package/chinese-workday)（中国法定节假日与调休，npm 更新即可同步新年份数据）

### 节假日数据维护

节假日逻辑由 `chinese-workday` 提供，数据源自国务院公告。新年份发布后升级依赖即可：

```bash
pnpm update chinese-workday
```

## Netlify 部署

Vite 会在**构建时**把环境变量打进前端包，`.env.local` 不会上传到 Git，必须在 Netlify 后台单独配置。

1. 打开 [Netlify](https://app.netlify.com/) → 你的站点 → **Site configuration** → **Environment variables**
2. 添加（与本地 `.env.local` 相同）：

| Key | Value |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://bobvfaovainhjjmwqncg.supabase.co`（你的项目 URL） |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → API → Publishable key |

3. **Deploys** → **Trigger deploy** → **Deploy site**（必须重新部署，仅改变量不会更新已构建的 JS）
4. 构建命令与发布目录见根目录 [`netlify.toml`](netlify.toml)：`pnpm build`，发布 `dist`

`public/_redirects` 已包含 SPA 回退，刷新子路由不会 404。

## 安全说明

- 前端仅使用 **Publishable key**（或 legacy anon key），不可暴露 `service_role` key
- 所有数据访问受 RLS 保护，用户只能操作自己的周报
- 建议仅连接开发环境 Supabase 项目，勿用于生产敏感数据
