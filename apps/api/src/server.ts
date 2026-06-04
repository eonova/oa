import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'

type RoleKey = 'admin' | 'operator' | 'viewer'
type PermissionKey =
  | 'dashboard.view'
  | 'records.view'
  | 'records.create'
  | 'records.update'
  | 'records.delete'
  | 'records.export'
  | 'users.manage'
  | 'roles.manage'
  | 'notifications.receive'
  | 'reviews.approve'
type RecordStatus = 'todo' | 'doing' | 'done'
type Priority = 'high' | 'normal' | 'low'
type NotificationStatus = 'unread' | 'read' | 'handled'
type ReviewTaskStatus = 'pending' | 'approved' | 'rejected' | 'transferred'

interface User {
  id: string
  username: string
  password: string
  name: string
  role: RoleKey
  createdAt: string
}

interface RecordItem {
  id: string
  title: string
  category: string
  department: string
  owner: string
  status: RecordStatus
  priority: Priority
  dueDate: string
  amount: number
  updatedAt: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  recordId: string
  receiverId: string
  status: NotificationStatus
  createdAt: string
}

interface ReviewTask {
  id: string
  recordId: string
  assigneeId: string
  status: ReviewTaskStatus
  comment: string
  createdAt: string
  handledAt: string
}

const roles: Record<RoleKey, { permissions: PermissionKey[] }> = {
  admin: {
    permissions: [
      'dashboard.view',
      'records.view',
      'records.create',
      'records.update',
      'records.delete',
      'records.export',
      'users.manage',
      'roles.manage',
      'notifications.receive',
      'reviews.approve',
    ],
  },
  operator: {
    permissions: [
      'dashboard.view',
      'records.view',
      'records.create',
      'records.update',
      'records.export',
      'notifications.receive',
      'reviews.approve',
    ],
  },
  viewer: {
    permissions: ['dashboard.view', 'records.view', 'notifications.receive'],
  },
}

const users: User[] = [
  { id: 'u-1', username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', createdAt: '2026-06-01' },
  { id: 'u-2', username: 'operator', password: 'operator123', name: '业务经办', role: 'operator', createdAt: '2026-06-01' },
  { id: 'u-3', username: 'viewer', password: 'viewer123', name: '监管查看', role: 'viewer', createdAt: '2026-06-01' },
]

let records: RecordItem[] = [
  { id: 'r-1', title: '校园安全巡查', category: '安全监管', department: '后勤处', owner: '张明', status: 'doing', priority: 'high', dueDate: '2026-06-10', amount: 18, updatedAt: '2026-06-04' },
  { id: 'r-2', title: '采购合同备案', category: '合同管理', department: '资产处', owner: '李娜', status: 'todo', priority: 'normal', dueDate: '2026-06-12', amount: 6, updatedAt: '2026-06-03' },
  { id: 'r-3', title: '培训资料归档', category: '档案管理', department: '办公室', owner: '王磊', status: 'done', priority: 'low', dueDate: '2026-06-02', amount: 32, updatedAt: '2026-06-02' },
  { id: 'r-4', title: '整改事项复核', category: '整改闭环', department: '督查室', owner: '赵婷', status: 'doing', priority: 'high', dueDate: '2026-06-08', amount: 11, updatedAt: '2026-06-04' },
]

let notifications: NotificationItem[] = [
  {
    id: 'n-1',
    title: '整改事项待审核',
    message: '整改事项复核需要手机端审核确认。',
    recordId: 'r-4',
    receiverId: 'u-2',
    status: 'unread',
    createdAt: '2026-06-04',
  },
]

let reviewTasks: ReviewTask[] = [
  {
    id: 'rt-1',
    recordId: 'r-4',
    assigneeId: 'u-2',
    status: 'pending',
    comment: '',
    createdAt: '2026-06-04',
    handledAt: '',
  },
]

const statusCodeText: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function countBy<T extends object, K extends keyof T>(items: T[], key: K) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key])
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    permissions: roles[user.role].permissions,
    createdAt: user.createdAt,
  }
}

function sendJson(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(data))
}

function sendEmpty(response: ServerResponse, status: number) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end()
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? (JSON.parse(raw) as T) : ({} as T)
}

function dashboardPayload() {
  return {
    total: records.length,
    doing: records.filter((record) => record.status === 'doing').length,
    done: records.filter((record) => record.status === 'done').length,
    highPriority: records.filter((record) => record.priority === 'high').length,
    byStatus: countBy(records, 'status'),
    byDepartment: countBy(records, 'department'),
  }
}

function queryUserId(url: URL) {
  return url.searchParams.get('userId') ?? 'u-2'
}

function enrichReviewTask(task: ReviewTask) {
  return {
    ...task,
    record: records.find((record) => record.id === task.recordId) ?? null,
    assignee: users.find((user) => user.id === task.assigneeId) ? toPublicUser(users.find((user) => user.id === task.assigneeId) as User) : null,
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`)
  const method = request.method ?? 'GET'

  if (method === 'OPTIONS') {
    sendEmpty(response, 204)
    return
  }

  try {
    if (method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: '@oa/api' })
      return
    }

    if (method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readJson<{ username?: string; password?: string }>(request)
      const user = users.find((item) => item.username === body.username && item.password === body.password)
      if (!user) {
        sendJson(response, 400, { message: '用户名或密码不正确' })
        return
      }
      sendJson(response, 200, { user: toPublicUser(user) })
      return
    }

    if (method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readJson<{ username?: string; password?: string; name?: string }>(request)
      const username = body.username?.trim()
      const password = body.password ?? ''
      const name = body.name?.trim()
      if (!username || !password || !name) {
        sendJson(response, 400, { message: '姓名、用户名和密码必填' })
        return
      }
      if (users.some((user) => user.username === username)) {
        sendJson(response, 400, { message: '用户名已存在' })
        return
      }
      const user: User = { id: randomUUID(), username, password, name, role: 'viewer', createdAt: today() }
      users.push(user)
      sendJson(response, 201, { user: toPublicUser(user) })
      return
    }

    if (method === 'GET' && url.pathname === '/api/roles') {
      sendJson(response, 200, { roles })
      return
    }

    if (method === 'GET' && url.pathname === '/api/users') {
      sendJson(response, 200, { users: users.map(toPublicUser) })
      return
    }

    if (method === 'GET' && url.pathname === '/api/dashboard') {
      sendJson(response, 200, dashboardPayload())
      return
    }

    if (method === 'GET' && url.pathname === '/api/records') {
      sendJson(response, 200, { records })
      return
    }

    if (method === 'GET' && url.pathname === '/api/notifications') {
      const receiverId = queryUserId(url)
      sendJson(response, 200, {
        notifications: notifications.filter((notification) => notification.receiverId === receiverId),
      })
      return
    }

    if (method === 'POST' && url.pathname === '/api/notifications') {
      const body = await readJson<{ title?: string; message?: string; recordId?: string; receiverId?: string }>(request)
      if (!body.title || !body.message || !body.recordId || !body.receiverId) {
        sendJson(response, 400, { message: 'title、message、recordId、receiverId 必填' })
        return
      }
      const notification: NotificationItem = {
        id: randomUUID(),
        title: body.title,
        message: body.message,
        recordId: body.recordId,
        receiverId: body.receiverId,
        status: 'unread',
        createdAt: today(),
      }
      const reviewTask: ReviewTask = {
        id: randomUUID(),
        recordId: body.recordId,
        assigneeId: body.receiverId,
        status: 'pending',
        comment: '',
        createdAt: today(),
        handledAt: '',
      }
      notifications.unshift(notification)
      reviewTasks.unshift(reviewTask)
      sendJson(response, 201, { notification, reviewTask })
      return
    }

    const notificationReadMatch = url.pathname.match(/^\/api\/notifications\/([^/]+)\/read$/)
    if (notificationReadMatch && method === 'PUT') {
      const notification = notifications.find((item) => item.id === notificationReadMatch[1])
      if (!notification) {
        sendJson(response, 404, { message: '通知不存在' })
        return
      }
      notification.status = 'read'
      sendJson(response, 200, { notification })
      return
    }

    if (method === 'GET' && url.pathname === '/api/review-tasks') {
      const assigneeId = queryUserId(url)
      sendJson(response, 200, {
        reviewTasks: reviewTasks.filter((task) => task.assigneeId === assigneeId && task.status === 'pending').map(enrichReviewTask),
      })
      return
    }

    const reviewTaskMatch = url.pathname.match(/^\/api\/review-tasks\/([^/]+)$/)
    if (reviewTaskMatch && method === 'GET') {
      const task = reviewTasks.find((item) => item.id === reviewTaskMatch[1])
      if (!task) {
        sendJson(response, 404, { message: '审核任务不存在' })
        return
      }
      sendJson(response, 200, { reviewTask: enrichReviewTask(task) })
      return
    }

    const approveMatch = url.pathname.match(/^\/api\/review-tasks\/([^/]+)\/approve$/)
    if (approveMatch && method === 'POST') {
      const body = await readJson<{ comment?: string }>(request)
      const task = reviewTasks.find((item) => item.id === approveMatch[1])
      if (!task) {
        sendJson(response, 404, { message: '审核任务不存在' })
        return
      }
      if (task.status !== 'pending') {
        sendJson(response, 400, { message: '审核任务已处理' })
        return
      }
      task.status = 'approved'
      task.comment = body.comment?.trim() || '同意'
      task.handledAt = today()
      notifications = notifications.map((notification) => (
        notification.recordId === task.recordId && notification.receiverId === task.assigneeId
          ? { ...notification, status: 'handled' }
          : notification
      ))
      sendJson(response, 200, { reviewTask: enrichReviewTask(task) })
      return
    }

    const rejectMatch = url.pathname.match(/^\/api\/review-tasks\/([^/]+)\/reject$/)
    if (rejectMatch && method === 'POST') {
      const body = await readJson<{ comment?: string }>(request)
      const comment = body.comment?.trim()
      const task = reviewTasks.find((item) => item.id === rejectMatch[1])
      if (!task) {
        sendJson(response, 404, { message: '审核任务不存在' })
        return
      }
      if (!comment) {
        sendJson(response, 400, { message: '驳回必须填写意见' })
        return
      }
      if (task.status !== 'pending') {
        sendJson(response, 400, { message: '审核任务已处理' })
        return
      }
      task.status = 'rejected'
      task.comment = comment
      task.handledAt = today()
      notifications = notifications.map((notification) => (
        notification.recordId === task.recordId && notification.receiverId === task.assigneeId
          ? { ...notification, status: 'handled' }
          : notification
      ))
      sendJson(response, 200, { reviewTask: enrichReviewTask(task) })
      return
    }

    if (method === 'GET' && url.pathname === '/api/review-history') {
      const assigneeId = queryUserId(url)
      sendJson(response, 200, {
        reviewTasks: reviewTasks
          .filter((task) => task.assigneeId === assigneeId && task.status !== 'pending')
          .map(enrichReviewTask),
      })
      return
    }

    if (method === 'POST' && url.pathname === '/api/records') {
      const body = await readJson<Omit<RecordItem, 'id' | 'updatedAt'>>(request)
      const record: RecordItem = {
        id: randomUUID(),
        title: body.title,
        category: body.category,
        department: body.department,
        owner: body.owner,
        status: body.status,
        priority: body.priority,
        dueDate: body.dueDate,
        amount: Number(body.amount),
        updatedAt: today(),
      }
      records.unshift(record)
      sendJson(response, 201, { record })
      return
    }

    const recordMatch = url.pathname.match(/^\/api\/records\/([^/]+)$/)
    if (recordMatch && method === 'PUT') {
      const id = recordMatch[1]
      const body = await readJson<Partial<Omit<RecordItem, 'id' | 'updatedAt'>>>(request)
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) {
        sendJson(response, 404, { message: '台账不存在' })
        return
      }
      records[index] = { ...records[index], ...body, amount: Number(body.amount ?? records[index].amount), updatedAt: today() }
      sendJson(response, 200, { record: records[index] })
      return
    }

    if (recordMatch && method === 'DELETE') {
      const id = recordMatch[1]
      const before = records.length
      records = records.filter((record) => record.id !== id)
      if (records.length === before) {
        sendJson(response, 404, { message: '台账不存在' })
        return
      }
      sendEmpty(response, 204)
      return
    }

    sendJson(response, 404, { message: statusCodeText[404] })
  } catch (error) {
    sendJson(response, 400, { message: error instanceof Error ? error.message : statusCodeText[400] })
  }
})

const port = Number(process.env.PORT ?? 3001)
server.listen(port, '127.0.0.1', () => {
  console.log(`@oa/api listening on http://127.0.0.1:${port}`)
})
