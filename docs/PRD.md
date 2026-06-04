# 监管 OA 简化版 PRD

日期：2026-06-04  
版本：0.3

## 1. 项目目标

做一个简化版监管 OA 系统，先满足内部演示和试用。

系统分三块：

- PC 管理端：登录、角色权限、看板、台账、导出、发起通知。
- 后端服务：提供用户、权限、台账、通知、审核接口。
- 小程序：接收 PC 通知，在手机上处理审核。

当前阶段只跑核心流程，不复刻完整 OA。

## 2. 技术结构

项目放在一个 monorepo 里：

```text
apps/web       PC 管理端
apps/api       Node + TypeScript 后端
apps/miniapp   微信原生小程序
supabase       数据库配置和迁移
```

技术栈：

- PC：Vue 3、TSX、Vite+、Tailwind CSS
- API：Node.js、TypeScript
- 小程序：微信原生小程序
- 工程：pnpm workspace、Turbo
- 数据库目标：Supabase PostgreSQL
- 部署目标：Vercel + Supabase

## 3. 用户角色

### 管理员

能做所有事：用户管理、权限配置、台账管理、看板、导出、通知、审核。

### 经办人

能看台账和看板，能新增、编辑、导出台账，能接收通知和手机审核。

默认不能删除台账，不能管理用户和权限。

### 只读用户

只能查看看板和台账，可以接收通知，不能改数据，不能审核。

## 4. 核心功能

### 登录注册

- 用户可以登录。
- 用户可以注册。
- 新注册用户默认是只读用户。
- 登录后根据权限显示不同菜单和按钮。

### 数据看板

展示这些信息：

- 台账总数
- 处理中数量
- 已办结数量
- 高优先级数量
- 状态分布
- 部门事项量

### 台账管理

台账支持：

- 查看列表
- 搜索
- 按状态筛选
- 按部门筛选
- 新增
- 编辑
- 删除
- 导出 CSV

台账字段先保留这些：

- 事项名称
- 分类
- 部门
- 负责人
- 状态
- 优先级
- 截止日期
- 数量

### 用户和权限

管理员可以：

- 查看用户
- 调整用户角色
- 删除用户
- 查看权限矩阵
- 调整非管理员角色权限

管理员永远保留全部权限，避免误操作把系统锁死。

## 5. 小程序功能

小程序主要做移动待办。

### 待办通知

PC 端发起通知后，小程序能看到。

通知里展示：

- 标题
- 内容
- 关联台账
- 创建时间
- 状态：未读、已读、已处理

用户可以标记已读，也可以进入审核详情。

### 手机审核

审核详情展示关联台账的基本信息。

审核人可以：

- 通过
- 驳回

驳回必须填写意见。

### 审核历史

小程序可以查看自己处理过的审核记录。

## 6. 权限范围

当前权限先按这些控制：

```text
dashboard.view          查看看板
records.view            查看台账
records.create          新增台账
records.update          编辑台账
records.delete          删除台账
records.export          导出台账
users.manage            管理用户
roles.manage            管理权限
notifications.receive   接收通知
reviews.approve         手机审核
```

默认分配：

- 管理员：全部权限
- 经办人：看板、台账、新增、编辑、导出、接收通知、审核
- 只读用户：看板、台账、接收通知

## 7. 后端接口

本地 API 地址：

```text
http://127.0.0.1:3001
```

当前接口：

```text
GET    /health
POST   /api/auth/login
POST   /api/auth/register
GET    /api/users
GET    /api/roles

GET    /api/dashboard
GET    /api/records
POST   /api/records
PUT    /api/records/:id
DELETE /api/records/:id

GET    /api/notifications
POST   /api/notifications
PUT    /api/notifications/:id/read

GET    /api/review-tasks
GET    /api/review-tasks/:id
POST   /api/review-tasks/:id/approve
POST   /api/review-tasks/:id/reject
GET    /api/review-history
```

当前后端先用内存数据。后续再接 Supabase。

## 8. 数据表方向

后续 Supabase 至少需要这些表：

- 用户表
- 角色表
- 台账表
- 通知表
- 审核任务表

注意：

- 当前密码只是演示字段，正式版本必须加密。
- 当前审核只是单级审核，多级审批后续再设计。
- 通知和审核任务要分开，不要混成一张表。

## 9. 当前进度

已经完成：

- monorepo
- PC 管理端基础功能
- Node + TypeScript API
- 微信小程序基础页面
- 通知和审核 API
- Vercel 配置
- Supabase 初始迁移

可运行命令：

```bash
pnpm install
pnpm run dev
pnpm run typecheck
pnpm run build
```

本地地址：

- PC：http://127.0.0.1:5173
- API：http://127.0.0.1:3001
- 小程序：微信开发者工具打开 `apps/miniapp`

## 10. 下一步

### 1. 前端接后端

把 PC 端从本地状态改成调用 API：

- 登录注册
- 台账 CRUD
- 看板统计
- 用户权限

### 2. 接 Supabase

把后端内存数据换成数据库：

- 写入真实表
- 加密码加密
- 加登录态
- 加后端权限校验

### 3. 完善小程序

补齐：

- 小程序登录或用户绑定
- 待办刷新
- 审核通过
- 审核驳回
- 审核历史
- 通知状态同步

### 4. 部署

目标：

- PC 部署到 Vercel
- 数据库部署到 Supabase
- API 部署方式待定

说明：当前 API 是普通 Node HTTP 服务，不是 Vercel serverless 结构。后续要决定 API 独立部署，还是改成 Vercel Functions / Supabase Edge Functions。

## 11. 暂时不做

当前版本先不做：

- 完整审批流
- 多级审批
- 会签、加签、转交完整流程
- 附件上传
- 短信、企业微信、订阅消息推送
- 复杂组织架构
- 与原 OA 系统同步
- 生产级审计日志

## 12. 需要确认

1. 小程序最终是否继续用微信原生？
2. 审核是单级，还是后续要多级？
3. PC 发起通知时，审核人是手动选，还是按部门/角色自动匹配？
4. 审核通过后，台账状态要不要自动变化？
5. 审核驳回后，是回到经办人修改，还是直接结束？
6. API 最后部署在哪里？
7. Supabase 只做数据库，还是也用 Supabase Auth？
