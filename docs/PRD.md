# 监管 OA 简化版 PRD

版本：0.1  
日期：2026-06-04  
状态：草案

## Problem Statement

现有监管/OA 系统功能完整但体量较大，早期验证阶段需要一个简化版系统，用较低成本覆盖核心办公监管场景：账号登录注册、基础角色系统、权限控制、数据看板、台账增删改查和导出。系统需要具备可继续扩展的工程结构，前端、后端分别独立开发与构建，便于后续接入真实数据库、鉴权和业务接口。

## Solution

建设一个 monorepo 版监管 OA 简化系统：

- 前端使用 Vue 3 + TSX + Vite+ + Tailwind CSS，提供后台工作台界面。
- 后端使用 Node.js + TypeScript，提供基础 REST API。
- 小程序端用于接收 PC 端产生的通知和待办，并支持手机端审核。
- 根目录使用 pnpm workspace + Turbo 管理多应用任务。
- 初期数据以内存和本地种子数据为主，先验证产品流程和权限模型。
- 后续可将内存数据替换为数据库，将演示级登录替换为正式 token/session 鉴权。

## Goals

1. 提供可运行的监管 OA 原型。
2. 保留三类基础角色：管理员、经办人、只读用户。
3. 支持登录、注册、角色权限、数据看板、台账 CRUD、CSV 导出。
4. 建立 Node + TypeScript 后端 API 基础。
5. 建立 monorepo 工程结构，支持前后端统一安装、检查、构建和开发启动。
6. 支持 PC 端产生通知/待办，小程序端接收并处理审核。

## Non-Goals

1. 不在当前版本实现真实数据库持久化。
2. 不在当前版本实现生产级密码加密、JWT、SSO、短信验证码或 MFA。
3. 不在当前版本实现复杂组织架构、流程审批、消息通知、附件上传。
4. 不在当前版本复刻原系统全部页面和交互。
5. 不在当前版本处理生产部署、监控、审计日志和合规加固。
6. 当前版本先采用微信原生小程序骨架，uni-app、Taro 等跨端方案暂不纳入。

## Users And Roles

### 管理员

拥有全部权限，负责用户管理、角色权限配置、业务台账维护、数据查看和导出。

### 经办人

可查看看板和台账，可新增、编辑、导出台账数据，不可删除数据，不可管理用户和权限。

### 只读用户

可查看看板和台账，不可新增、编辑、删除、导出，不可管理用户和权限。

### 手机审核人

通过小程序接收 PC 端通知和待办，可查看审核详情，并在手机端执行通过、驳回或转交等审核动作。

## Permissions

| 权限标识 | 含义 | 管理员 | 经办人 | 只读用户 |
| --- | --- | --- | --- | --- |
| `dashboard.view` | 查看数据看板 | 是 | 是 | 是 |
| `records.view` | 查看业务台账 | 是 | 是 | 是 |
| `records.create` | 新增业务数据 | 是 | 是 | 否 |
| `records.update` | 编辑业务数据 | 是 | 是 | 否 |
| `records.delete` | 删除业务数据 | 是 | 否 | 否 |
| `records.export` | 导出业务数据 | 是 | 是 | 否 |
| `users.manage` | 管理用户角色 | 是 | 否 | 否 |
| `roles.manage` | 配置角色权限 | 是 | 否 | 否 |
| `notifications.receive` | 接收通知和待办 | 是 | 是 | 是 |
| `reviews.approve` | 手机端审核 | 是 | 是 | 否 |

## User Stories

1. As an 管理员, I want to 使用账号密码登录系统, so that 我可以进入监管 OA 工作台。
2. As an 新用户, I want to 注册账号, so that 我可以获得默认只读访问能力。
3. As an 管理员, I want to 查看所有用户, so that 我可以了解系统账号情况。
4. As an 管理员, I want to 调整用户角色, so that 我可以按职责分配系统权限。
5. As an 管理员, I want to 删除无效用户, so that 系统账号保持干净。
6. As an 管理员, I want to 查看权限矩阵, so that 我可以理解每个角色能做什么。
7. As an 管理员, I want to 调整经办人和只读用户权限, so that 我可以灵活控制访问范围。
8. As an 管理员, I want to 保持管理员默认全部权限, so that 系统不会失去最高管理能力。
9. As an 用户, I want to 根据我的权限看到不同导航, so that 我不会进入无权操作的页面。
10. As an 用户, I want to 查看数据看板, so that 我可以快速了解台账总数、处理中、已办结和高优先级事项。
11. As an 用户, I want to 查看状态分布, so that 我可以判断当前工作积压情况。
12. As an 用户, I want to 查看部门事项量, so that 我可以比较不同部门的监管事项数量。
13. As an 用户, I want to 查看业务台账列表, so that 我可以掌握具体事项。
14. As an 用户, I want to 搜索标题、分类、部门和负责人, so that 我可以快速定位事项。
15. As an 用户, I want to 按状态筛选台账, so that 我可以聚焦待处理、处理中或已办结事项。
16. As an 用户, I want to 按部门筛选台账, so that 我可以查看某个部门的事项。
17. As an 管理员或经办人, I want to 新增事项, so that 新监管任务可以进入台账。
18. As an 管理员或经办人, I want to 编辑事项, so that 台账信息能保持最新。
19. As an 管理员, I want to 删除错误事项, so that 台账数据保持准确。
20. As an 管理员或经办人, I want to 导出 CSV, so that 我可以离线汇总和流转数据。
21. As an 只读用户, I want to 只能查看数据, so that 我不会误改业务记录。
22. As an 开发者, I want to 前后端拆分到 monorepo, so that 我可以独立维护 Web 和 API。
23. As an 开发者, I want to 用统一命令执行检查和构建, so that 我可以快速确认项目健康。
24. As an 开发者, I want to 后端提供 REST API, so that 后续前端可以切换到真实接口。
25. As an 开发者, I want to 后端以 TypeScript 编写, so that 数据结构和接口逻辑更容易维护。
26. As an PC 端经办人, I want to 提交需要审核的事项, so that 手机端审核人可以及时处理。
27. As an 手机审核人, I want to 在小程序收到待办通知, so that 我不需要一直登录 PC 系统。
28. As an 手机审核人, I want to 查看待审核事项详情, so that 我可以判断是否通过。
29. As an 手机审核人, I want to 在手机端通过审核, so that 业务可以继续流转。
30. As an 手机审核人, I want to 在手机端驳回审核并填写意见, so that 经办人可以按原因修改。
31. As an 手机审核人, I want to 查看历史审核记录, so that 我可以追踪自己处理过的事项。
32. As an 管理员, I want to 查看通知发送和审核处理状态, so that 我可以监督事项是否及时闭环。
33. As an 开发者, I want to 后端提供通知和审核 API, so that PC 端、小程序端可以通过同一套服务协作。

## Functional Requirements

### Authentication

1. 系统必须支持登录。
2. 系统必须支持注册。
3. 注册账号默认角色为只读用户。
4. 登录成功后返回当前用户基础信息和权限列表。
5. 登录失败时必须返回明确错误信息。

### Role And Permission Management

1. 系统必须内置管理员、经办人、只读用户三类角色。
2. 管理员必须拥有所有权限。
3. 管理员必须可以查看用户列表。
4. 管理员必须可以调整用户角色。
5. 管理员必须可以查看角色权限矩阵。
6. 管理员必须可以调整非管理员角色权限。

### Dashboard

1. 系统必须展示台账总数。
2. 系统必须展示处理中事项数。
3. 系统必须展示已办结事项数。
4. 系统必须展示高优先级事项数。
5. 系统必须展示按状态统计。
6. 系统必须展示按部门统计。

### Records CRUD

1. 系统必须支持查看台账列表。
2. 系统必须支持新增台账。
3. 系统必须支持编辑台账。
4. 系统必须支持删除台账。
5. 系统必须支持搜索台账。
6. 系统必须支持按状态筛选台账。
7. 系统必须支持按部门筛选台账。
8. 系统必须支持 CSV 导出。

### Mini Program Notifications And Reviews

1. PC 端必须可以为需要处理的事项生成通知或待办。
2. 后端必须保存通知状态，包括未读、已读、已处理。
3. 小程序端必须可以拉取当前用户的通知和待办列表。
4. 小程序端必须可以查看待办详情。
5. 小程序端必须支持审核通过。
6. 小程序端必须支持审核驳回，并要求填写驳回意见。
7. 小程序端必须支持查看自己的审核历史。
8. PC 端必须可以查看通知发送状态和审核结果。
9. 后端必须记录审核动作、审核人、审核时间和审核意见。
10. 小程序端必须只展示当前用户有权限处理的待办。

### Monorepo

1. 根目录必须使用 pnpm workspace 管理 package。
2. 根目录必须使用 Turbo 编排任务。
3. Web 和 API 必须是独立 workspace package。
4. 根目录脚本只委托 Turbo，不直接写 package 内部命令。

## Data Model

### User

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 用户 ID |
| `username` | string | 登录用户名 |
| `password` | string | 演示密码，生产版本需加密 |
| `name` | string | 用户姓名 |
| `role` | `admin` / `operator` / `viewer` | 用户角色 |
| `createdAt` | string | 创建日期 |

### Role

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `permissions` | string[] | 角色拥有的权限 |

### RecordItem

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 台账 ID |
| `title` | string | 事项名称 |
| `category` | string | 事项分类 |
| `department` | string | 责任部门 |
| `owner` | string | 负责人 |
| `status` | `todo` / `doing` / `done` | 处理状态 |
| `priority` | `high` / `normal` / `low` | 优先级 |
| `dueDate` | string | 截止日期 |
| `amount` | number | 数量 |
| `updatedAt` | string | 更新日期 |

### Notification

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 通知 ID |
| `title` | string | 通知标题 |
| `message` | string | 通知内容 |
| `recordId` | string | 关联台账 ID |
| `receiverId` | string | 接收人 ID |
| `status` | `unread` / `read` / `handled` | 通知状态 |
| `createdAt` | string | 创建时间 |

### ReviewTask

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 审核任务 ID |
| `recordId` | string | 关联台账 ID |
| `assigneeId` | string | 审核人 ID |
| `status` | `pending` / `approved` / `rejected` / `transferred` | 审核状态 |
| `comment` | string | 审核意见 |
| `createdAt` | string | 创建时间 |
| `handledAt` | string | 处理时间 |

## API Contract

基础地址：`http://127.0.0.1:3001`

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/users` | 用户列表 |
| GET | `/api/roles` | 角色权限 |
| GET | `/api/dashboard` | 看板统计 |
| GET | `/api/records` | 台账列表 |
| POST | `/api/records` | 新增台账 |
| PUT | `/api/records/:id` | 更新台账 |
| DELETE | `/api/records/:id` | 删除台账 |
| GET | `/api/notifications` | 当前用户通知列表 |
| POST | `/api/notifications` | PC 端创建通知/待办 |
| PUT | `/api/notifications/:id/read` | 标记通知已读 |
| GET | `/api/review-tasks` | 当前用户审核任务列表 |
| GET | `/api/review-tasks/:id` | 审核任务详情 |
| POST | `/api/review-tasks/:id/approve` | 审核通过 |
| POST | `/api/review-tasks/:id/reject` | 审核驳回 |
| GET | `/api/review-history` | 当前用户审核历史 |

## Implementation Decisions

1. 使用 pnpm workspace 管理 monorepo。
2. 使用 Turbo 管理 `dev`、`typecheck`、`build`、`preview` 等任务。
3. Web package 使用 Vue 3 + TSX，避免引入 Vue SFC 模板复杂度。
4. Web package 使用 Vite+ 作为构建和开发服务入口。
5. Web package 使用 Tailwind CSS v4，并通过 `@tailwindcss/vite` 接入 Vite。
6. API package 使用 Node 原生 HTTP server，避免初期引入 Express 等框架依赖。
7. API package 使用 TypeScript 编译到 `dist`。
8. 初期 API 使用内存数据，便于快速验证接口契约。
9. 初期前端仍可保留本地状态模式，后续再接入 API。
10. 管理员角色固定具备全部权限，避免误操作导致系统无管理员能力。
11. 经办人默认不可删除数据，降低误删风险。
12. 只读用户默认只能查看看板和台账。
13. 小程序需求按“通知”和“审核任务”两个模型拆分，避免把消息提醒和业务审批混在同一张概念表里。
14. PC 端负责发起通知和查看处理结果，小程序端负责接收通知和完成移动审核。
15. 小程序先采用微信原生结构放入 monorepo，后端接口仍按平台无关的 REST 契约设计。

## Testing Decisions

1. 测试应优先覆盖外部行为，不测试组件内部实现细节。
2. API 应测试 HTTP 状态码、响应体结构、CRUD 行为和错误分支。
3. 权限模块应测试不同角色可见导航和可用操作。
4. 台账模块应测试新增、编辑、删除、筛选和导出行为。
5. 看板模块应测试统计结果是否随台账变化更新。
6. Monorepo 应至少在 CI 或本地脚本中执行 `pnpm run typecheck` 和 `pnpm run build`。
7. 通知模块应测试通知创建、列表拉取、已读标记和权限过滤。
8. 审核模块应测试通过、驳回、意见必填、历史记录和重复处理保护。
9. 后续可引入 Vitest 测 API 纯函数和前端权限计算。
10. 后续可引入 Playwright 测端到端登录、台账、权限、通知和审核流程。

## Acceptance Criteria

1. 执行 `pnpm install` 可以安装全部 workspace 依赖。
2. 执行 `pnpm run dev` 可以同时启动 Web 和 API。
3. Web 服务可通过 `http://127.0.0.1:5173` 访问。
4. API 服务可通过 `http://127.0.0.1:3001/health` 返回健康状态。
5. 执行 `pnpm run typecheck` 必须通过。
6. 执行 `pnpm run build` 必须通过。
7. 管理员可访问所有页面。
8. 经办人不可访问用户管理和权限配置。
9. 只读用户不可新增、编辑、删除或导出台账。
10. 台账 CRUD API 能返回预期状态码和响应。
11. PC 端创建通知后，小程序端可在待办列表中看到。
12. 小程序端审核通过后，PC 端可查看处理结果。
13. 小程序端审核驳回时必须提交审核意见。
14. 无权限用户不可处理他人的审核任务。

## Out Of Scope

1. 生产级认证授权。
2. 数据库建模和迁移。
3. 复杂审批流、流程引擎和外部通知通道。
4. 附件上传、预览和下载。
5. 操作审计和合规报表。
6. 多租户、组织架构和部门层级权限。
7. 与原 OA 系统的数据同步。
8. 小程序订阅消息模板、服务号推送、短信推送等外部通知通道。
9. 复杂多级审批流、会签、加签、条件分支。

## Milestones

### M1：原型可运行

- 完成 Web 登录注册、权限、看板、台账和导出。
- 完成基础视觉样式。

### M2：monorepo 和后端基础

- 完成 pnpm workspace。
- 完成 Turbo 任务编排。
- 完成 Node + TypeScript API。

### M3：前后端联调

- Web 登录注册接入 API。
- Web 台账 CRUD 接入 API。
- Web 看板统计接入 API。

### M4：小程序通知与审核

- 采用微信原生小程序作为当前技术方案。
- 建立 `apps/miniapp` workspace。
- 增加通知和审核任务 API。
- 小程序接收 PC 端通知。
- 小程序完成审核通过和驳回。

### M5：持久化与鉴权

- 接入数据库。
- 接入密码加密。
- 接入 token/session。
- 增加 API 权限中间件。

### M6：测试与部署

- 增加 API 单元/集成测试。
- 增加前端核心流程 E2E。
- 增加部署脚本和运行配置。

## Open Questions

1. 后续数据库优先选 PostgreSQL、MySQL 还是 SQLite？
2. 用户认证采用 JWT、server session 还是接入统一身份系统？
3. 业务台账字段是否需要按真实监管业务扩展？
4. 是否需要导入 Excel/CSV？
5. 是否需要审批流或整改闭环状态机？
6. 是否需要保留与原系统的菜单和字段命名一致性？
7. 当前微信原生小程序是否满足后续维护诉求，还是需要迁移到 uni-app/Taro？
8. 小程序通知依赖站内待办轮询、微信订阅消息，还是企业微信/短信等外部推送？
9. 手机审核是单级审核，还是多级审批流？
10. 审核通过后是否需要自动修改台账状态？
11. 审核驳回后是否回到经办人修改，还是直接结束？

## Further Notes

当前版本适合做产品和工程骨架验证。真实上线前必须补齐数据库持久化、密码安全、后端权限校验、审计日志、错误处理、接口测试和部署配置。
