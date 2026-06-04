import { computed, defineComponent, ref, watch } from 'vue'

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
type PageKey = 'dashboard' | 'records' | 'users' | 'roles'
type RecordStatus = 'todo' | 'doing' | 'done'
type Priority = 'high' | 'normal' | 'low'

interface Role {
  permissions: PermissionKey[]
}

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

interface AppState {
  roles: Record<RoleKey, Role>
  users: User[]
  records: RecordItem[]
}

interface Filters {
  keyword: string
  status: RecordStatus | 'all'
  department: string
}

const STORAGE_KEY = 'oa-opc-state-v2'
const SESSION_KEY = 'oa-opc-current-user-v2'

const permissionLabels: Record<PermissionKey, string> = {
  'dashboard.view': '查看数据看板',
  'records.view': '查看业务台账',
  'records.create': '新增业务数据',
  'records.update': '编辑业务数据',
  'records.delete': '删除业务数据',
  'records.export': '导出业务数据',
  'users.manage': '管理用户角色',
  'roles.manage': '配置角色权限',
}

const roleNames: Record<RoleKey, string> = {
  admin: '管理员',
  operator: '经办人',
  viewer: '只读用户',
}

const statusNames: Record<RecordStatus, string> = {
  todo: '待处理',
  doing: '处理中',
  done: '已办结',
}

const priorityNames: Record<Priority, string> = {
  high: '高',
  normal: '中',
  low: '低',
}

const navItems: Array<{
  id: PageKey
  label: string
  permission: PermissionKey
  title: string
  eyebrow: string
}> = [
  { id: 'dashboard', label: '数据看板', permission: 'dashboard.view', title: '工作总览', eyebrow: '数据看板' },
  { id: 'records', label: '业务台账', permission: 'records.view', title: '台账管理', eyebrow: '增删改查' },
  { id: 'users', label: '用户管理', permission: 'users.manage', title: '用户与角色', eyebrow: '基础角色系统' },
  { id: 'roles', label: '权限配置', permission: 'roles.manage', title: '角色权限', eyebrow: '权限系统' },
]

const defaultState: AppState = {
  roles: {
    admin: {
      permissions: Object.keys(permissionLabels) as PermissionKey[],
    },
    operator: {
      permissions: ['dashboard.view', 'records.view', 'records.create', 'records.update', 'records.export'],
    },
    viewer: {
      permissions: ['dashboard.view', 'records.view'],
    },
  },
  users: [
    { id: 'u-1', username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', createdAt: '2026-06-01' },
    { id: 'u-2', username: 'operator', password: 'operator123', name: '业务经办', role: 'operator', createdAt: '2026-06-01' },
    { id: 'u-3', username: 'viewer', password: 'viewer123', name: '监管查看', role: 'viewer', createdAt: '2026-06-01' },
  ],
  records: [
    { id: 'r-1', title: '校园安全巡查', category: '安全监管', department: '后勤处', owner: '张明', status: 'doing', priority: 'high', dueDate: '2026-06-10', amount: 18, updatedAt: '2026-06-04' },
    { id: 'r-2', title: '采购合同备案', category: '合同管理', department: '资产处', owner: '李娜', status: 'todo', priority: 'normal', dueDate: '2026-06-12', amount: 6, updatedAt: '2026-06-03' },
    { id: 'r-3', title: '培训资料归档', category: '档案管理', department: '办公室', owner: '王磊', status: 'done', priority: 'low', dueDate: '2026-06-02', amount: 32, updatedAt: '2026-06-02' },
    { id: 'r-4', title: '整改事项复核', category: '整改闭环', department: '督查室', owner: '赵婷', status: 'doing', priority: 'high', dueDate: '2026-06-08', amount: 11, updatedAt: '2026-06-04' },
  ],
}

const makeDefaultState = (): AppState => structuredClone(defaultState)
const today = () => new Date().toISOString().slice(0, 10)
const makeId = () => crypto.randomUUID()

function loadState(): AppState {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    const initialState = makeDefaultState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState))
    return initialState
  }
  return JSON.parse(saved) as AppState
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key])
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`
}

export default defineComponent({
  name: 'App',
  setup() {
    const state = ref<AppState>(loadState())
    const sessionId = ref(sessionStorage.getItem(SESSION_KEY))
    const authMode = ref<'login' | 'register'>('login')
    const activePage = ref<PageKey>('dashboard')
    const toast = ref('')
    const editingRecordId = ref<string | null>(null)
    const filters = ref<Filters>({ keyword: '', status: 'all', department: 'all' })
    const loginForm = ref({ username: '', password: '' })
    const registerForm = ref({ name: '', username: '', password: '' })
    const recordForm = ref<Omit<RecordItem, 'id' | 'updatedAt'>>({
      title: '',
      category: '',
      department: '',
      owner: '',
      status: 'todo',
      priority: 'normal',
      dueDate: today(),
      amount: 1,
    })

    const currentUser = computed(() => state.value.users.find((user) => user.id === sessionId.value) ?? null)
    const currentNavItem = computed(() => navItems.find((item) => item.id === activePage.value) ?? navItems[0])
    const departments = computed(() => [...new Set(state.value.records.map((record) => record.department))])
    const filteredRecords = computed(() => {
      const keyword = filters.value.keyword.toLowerCase()
      return state.value.records.filter((record) => {
        const matchesKeyword = [record.title, record.category, record.department, record.owner]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
        const matchesStatus = filters.value.status === 'all' || record.status === filters.value.status
        const matchesDepartment = filters.value.department === 'all' || record.department === filters.value.department
        return matchesKeyword && matchesStatus && matchesDepartment
      })
    })

    const hasPermission = (permission: PermissionKey, user = currentUser.value) => {
      if (!user) return false
      return state.value.roles[user.role]?.permissions.includes(permission) ?? false
    }

    const allowedNavItems = computed(() => navItems.filter((item) => hasPermission(item.permission)))

    watch(
      state,
      (value) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      },
      { deep: true },
    )

    watch(currentUser, (user) => {
      if (!user) return
      const canOpenActivePage = hasPermission(navItems.find((item) => item.id === activePage.value)?.permission ?? 'dashboard.view', user)
      if (!canOpenActivePage) {
        activePage.value = allowedNavItems.value[0]?.id ?? 'dashboard'
      }
    })

    function notify(message: string) {
      toast.value = message
      window.setTimeout(() => {
        if (toast.value === message) toast.value = ''
      }, 2600)
    }

    function setSession(user: User | null) {
      sessionId.value = user?.id ?? null
      if (user) sessionStorage.setItem(SESSION_KEY, user.id)
      else sessionStorage.removeItem(SESSION_KEY)
    }

    function login() {
      const user = state.value.users.find((item) => item.username === loginForm.value.username.trim() && item.password === loginForm.value.password)
      if (!user) {
        notify('用户名或密码不正确')
        return
      }
      setSession(user)
      activePage.value = allowedNavItems.value[0]?.id ?? 'dashboard'
    }

    function register() {
      const username = registerForm.value.username.trim()
      if (state.value.users.some((user) => user.username === username)) {
        notify('用户名已存在')
        return
      }
      const user: User = {
        id: makeId(),
        username,
        password: registerForm.value.password,
        name: registerForm.value.name.trim(),
        role: 'viewer',
        createdAt: today(),
      }
      state.value.users.push(user)
      setSession(user)
      registerForm.value = { name: '', username: '', password: '' }
      activePage.value = allowedNavItems.value[0]?.id ?? 'dashboard'
    }

    function logout() {
      setSession(null)
      loginForm.value = { username: '', password: '' }
      authMode.value = 'login'
    }

    function resetRecordForm() {
      editingRecordId.value = null
      recordForm.value = {
        title: '',
        category: '',
        department: '',
        owner: '',
        status: 'todo',
        priority: 'normal',
        dueDate: today(),
        amount: 1,
      }
    }

    function editRecord(record: RecordItem) {
      editingRecordId.value = record.id
      recordForm.value = {
        title: record.title,
        category: record.category,
        department: record.department,
        owner: record.owner,
        status: record.status,
        priority: record.priority,
        dueDate: record.dueDate,
        amount: record.amount,
      }
    }

    function saveRecord() {
      const payload = {
        ...recordForm.value,
        amount: Number(recordForm.value.amount),
        updatedAt: today(),
      }

      if (editingRecordId.value) {
        state.value.records = state.value.records.map((record) => (record.id === editingRecordId.value ? { ...record, ...payload } : record))
        notify('已保存修改')
      } else {
        state.value.records.unshift({ id: makeId(), ...payload })
        notify('已新增事项')
      }
      resetRecordForm()
    }

    function deleteRecord(id: string) {
      if (!confirm('确认删除这条台账数据？')) return
      state.value.records = state.value.records.filter((record) => record.id !== id)
      notify('已删除')
    }

    function exportCsv() {
      const headers = ['事项', '分类', '部门', '负责人', '状态', '优先级', '截止日期', '数量', '更新日期']
      const rows = filteredRecords.value.map((record) => [
        record.title,
        record.category,
        record.department,
        record.owner,
        statusNames[record.status],
        priorityNames[record.priority],
        record.dueDate,
        record.amount,
        record.updatedAt,
      ])
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `监管台账-${today()}.csv`
      link.click()
      URL.revokeObjectURL(url)
      notify('CSV 已导出')
    }

    function updateUserRole(userId: string, role: RoleKey) {
      const user = state.value.users.find((item) => item.id === userId)
      if (!user) return
      user.role = role
      notify('用户角色已更新')
    }

    function removeUser(userId: string) {
      if (userId === currentUser.value?.id) {
        notify('不能删除当前登录账号')
        return
      }
      if (!confirm('确认删除这个用户？')) return
      state.value.users = state.value.users.filter((user) => user.id !== userId)
      notify('用户已删除')
    }

    function togglePermission(role: RoleKey, permission: PermissionKey, checked: boolean) {
      if (role === 'admin') return
      const permissions = new Set(state.value.roles[role].permissions)
      if (checked) permissions.add(permission)
      else permissions.delete(permission)
      state.value.roles[role].permissions = [...permissions]
      notify('权限已更新')
    }

    const MetricCard = (props: { label: string; value: number; note: string }) => (
      <article class="metric">
        <span class="muted">{props.label}</span>
        <strong>{props.value}</strong>
        <span class="muted">{props.note}</span>
      </article>
    )

    const BarRow = (props: { label: string; value: number; total: number; tone?: string }) => {
      const percent = props.total ? Math.round((props.value / props.total) * 100) : 0
      return (
        <div class="bar-row">
          <span>{props.label}</span>
          <div class="bar-track">
            <div class="bar-fill" style={{ width: `${percent}%`, background: props.tone ?? 'var(--green)' }} />
          </div>
          <strong>{props.value}</strong>
        </div>
      )
    }

    const DashboardPage = () => {
      const total = state.value.records.length
      const doing = state.value.records.filter((record) => record.status === 'doing').length
      const done = state.value.records.filter((record) => record.status === 'done').length
      const high = state.value.records.filter((record) => record.priority === 'high').length
      const departmentCounts = countBy(state.value.records, 'department')
      const statusCounts = countBy(state.value.records, 'status')

      return (
        <section class="page-section">
          <section class="metric-grid">
            <MetricCard label="台账总数" value={total} note="当前业务记录" />
            <MetricCard label="处理中" value={doing} note="需要继续跟进" />
            <MetricCard label="已办结" value={done} note="闭环完成事项" />
            <MetricCard label="高优先级" value={high} note="重点监管事项" />
          </section>
          <section class="panel">
            <div class="toolbar">
              <h3>状态分布</h3>
              <span class="muted">{today()}</span>
            </div>
            <div class="chart-list">
              {Object.entries(statusNames).map(([key, label]) => (
                <BarRow
                  key={key}
                  label={label}
                  value={statusCounts[key] ?? 0}
                  total={total}
                  tone={key === 'todo' ? 'var(--amber)' : key === 'doing' ? 'var(--blue)' : 'var(--green)'}
                />
              ))}
            </div>
          </section>
          <section class="panel">
            <div class="toolbar">
              <h3>部门事项量</h3>
              <span class="muted">按当前台账统计</span>
            </div>
            <div class="chart-list">
              {Object.entries(departmentCounts).map(([label, value]) => (
                <BarRow key={label} label={label} value={value} total={total} />
              ))}
            </div>
          </section>
        </section>
      )
    }

    const RecordsPage = () => (
      <section class="page-section">
        <section class="panel">
          <div class="toolbar">
            <div class="filter-row">
              <input v-model={filters.value.keyword} placeholder="搜索标题、分类、部门、负责人" />
              <select v-model={filters.value.status}>
                <option value="all">全部状态</option>
                {Object.entries(statusNames).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select v-model={filters.value.department}>
                <option value="all">全部部门</option>
                {departments.value.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div class="action-row">
              {hasPermission('records.export') && <button class="secondary-action" type="button" onClick={exportCsv}>导出 CSV</button>}
              {hasPermission('records.create') && <button class="primary-action" type="button" onClick={resetRecordForm}>新增事项</button>}
            </div>
          </div>
        </section>

        {hasPermission('records.create') || editingRecordId.value
          ? (
              <section class="panel">
                <form onSubmit={(event) => { event.preventDefault(); saveRecord() }}>
                  <div class="toolbar">
                    <h3>{editingRecordId.value ? '编辑事项' : '新增事项'}</h3>
                    <button class="ghost-button" type="button" onClick={resetRecordForm}>清空</button>
                  </div>
                  <div class="form-grid">
                    <label class="wide">事项名称<input v-model={recordForm.value.title} required /></label>
                    <label>分类<input v-model={recordForm.value.category} required /></label>
                    <label>部门<input v-model={recordForm.value.department} required /></label>
                    <label>负责人<input v-model={recordForm.value.owner} required /></label>
                    <label>状态
                      <select v-model={recordForm.value.status}>
                        {Object.entries(statusNames).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>优先级
                      <select v-model={recordForm.value.priority}>
                        {Object.entries(priorityNames).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </label>
                    <label>截止日期<input v-model={recordForm.value.dueDate} type="date" required /></label>
                    <label>数量<input v-model={recordForm.value.amount} type="number" min="0" required /></label>
                  </div>
                  <div class="form-actions">
                    <button class="primary-action" type="submit">{editingRecordId.value ? '保存修改' : '新增入库'}</button>
                  </div>
                </form>
              </section>
            )
          : null}

        <section class="panel">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>事项</th>
                  <th>分类</th>
                  <th>部门</th>
                  <th>负责人</th>
                  <th>状态</th>
                  <th>优先级</th>
                  <th>截止日期</th>
                  <th>数量</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.value.length
                  ? filteredRecords.value.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <strong>{record.title}</strong>
                          <div class="muted">更新：{record.updatedAt}</div>
                        </td>
                        <td>{record.category}</td>
                        <td>{record.department}</td>
                        <td>{record.owner}</td>
                        <td><span class={`status ${record.status}`}>{statusNames[record.status]}</span></td>
                        <td><span class={`priority ${record.priority}`}>{priorityNames[record.priority]}</span></td>
                        <td>{record.dueDate}</td>
                        <td>{record.amount}</td>
                        <td>
                          <div class="action-row">
                            {hasPermission('records.update') && <button class="icon-button" type="button" onClick={() => editRecord(record)}>编辑</button>}
                            {hasPermission('records.delete') && <button class="danger-action" type="button" onClick={() => deleteRecord(record.id)}>删除</button>}
                            {!hasPermission('records.update') && !hasPermission('records.delete') && <span class="muted">只读</span>}
                          </div>
                        </td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colspan={9}>
                          <div class="empty-state">没有匹配的台账数据</div>
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    )

    const UsersPage = () => (
      <section class="page-section">
        <section class="panel">
          <div class="toolbar">
            <h3>用户列表</h3>
            <span class="muted">共 {state.value.users.length} 个账号</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>用户名</th>
                  <th>角色</th>
                  <th>创建日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {state.value.users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.username}</td>
                    <td>
                      <select value={user.role} onChange={(event) => updateUserRole(user.id, (event.target as HTMLSelectElement).value as RoleKey)}>
                        {Object.entries(roleNames).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td>{user.createdAt}</td>
                    <td>
                      <button class="danger-action" type="button" onClick={() => removeUser(user.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    )

    const RolesPage = () => (
      <section class="page-section">
        <section class="role-summary">
          {Object.entries(roleNames).map(([key, label]) => {
            const role = key as RoleKey
            return (
              <article class="role-box" key={key}>
                <h3>{label}</h3>
                <p class="muted">{state.value.roles[role].permissions.length} 项权限 · {state.value.users.filter((user) => user.role === role).length} 个用户</p>
              </article>
            )
          })}
        </section>
        <section class="panel">
          <div class="toolbar">
            <h3>权限矩阵</h3>
            <span class="muted">管理员角色默认拥有全部权限</span>
          </div>
          <div class="permission-grid">
            {Object.entries(permissionLabels).map(([permission, label]) => {
              const permissionKey = permission as PermissionKey
              return (
                <div class="permission-row" key={permission}>
                  <strong>{label}</strong>
                  <div class="record-meta">
                    {Object.entries(roleNames).map(([role, roleLabel]) => {
                      const roleKey = role as RoleKey
                      return (
                        <label key={role}>
                          {roleLabel}
                          <input
                            type="checkbox"
                            checked={state.value.roles[roleKey].permissions.includes(permissionKey)}
                            disabled={roleKey === 'admin'}
                            onChange={(event) => togglePermission(roleKey, permissionKey, (event.target as HTMLInputElement).checked)}
                          />
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </section>
    )

    const AuthView = () => (
      <main class="auth-shell">
        <section class="auth-panel">
          <div class="brand-block">
            <span class="brand-mark">OA</span>
            <div>
              <h1>监管 OA 简化版</h1>
              <p>角色权限、数据看板、业务台账和导出。</p>
            </div>
          </div>

          <div class="auth-tabs" role="tablist" aria-label="登录注册切换">
            <button class={`tab-button ${authMode.value === 'login' ? 'active' : ''}`} type="button" onClick={() => { authMode.value = 'login' }}>登录</button>
            <button class={`tab-button ${authMode.value === 'register' ? 'active' : ''}`} type="button" onClick={() => { authMode.value = 'register' }}>注册</button>
          </div>

          {authMode.value === 'login'
            ? (
                <form class="auth-form" onSubmit={(event) => { event.preventDefault(); login() }}>
                  <label>用户名<input v-model={loginForm.value.username} autocomplete="username" required /></label>
                  <label>密码<input v-model={loginForm.value.password} type="password" autocomplete="current-password" required /></label>
                  <button class="primary-action" type="submit">进入系统</button>
                  <p class="hint">演示账号：admin / admin123，operator / operator123，viewer / viewer123</p>
                </form>
              )
            : (
                <form class="auth-form" onSubmit={(event) => { event.preventDefault(); register() }}>
                  <label>姓名<input v-model={registerForm.value.name} required /></label>
                  <label>用户名<input v-model={registerForm.value.username} autocomplete="username" required /></label>
                  <label>密码<input v-model={registerForm.value.password} type="password" minlength="6" autocomplete="new-password" required /></label>
                  <button class="primary-action" type="submit">创建账号</button>
                  <p class="hint">新注册账号默认是只读角色，管理员可在用户管理中调整。</p>
                </form>
              )}
        </section>
      </main>
    )

    const WorkspaceView = () => (
      <main class="app-shell">
        <aside class="sidebar">
          <div class="sidebar-brand">
            <span class="brand-mark">OA</span>
            <strong>监管系统</strong>
          </div>
          <nav class="nav-list" aria-label="主导航">
            {allowedNavItems.value.map((item) => (
              <button
                key={item.id}
                class={`nav-button ${activePage.value === item.id ? 'active' : ''}`}
                type="button"
                onClick={() => { activePage.value = item.id }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section class="workspace">
          <header class="topbar">
            <div>
              <p class="eyebrow">{currentNavItem.value.eyebrow}</p>
              <h2>{currentNavItem.value.title}</h2>
            </div>
            <div class="user-strip">
              <span id="currentUserBadge">{currentUser.value?.name} · {roleNames[currentUser.value?.role ?? 'viewer']}</span>
              <button class="ghost-button" type="button" onClick={logout}>退出</button>
            </div>
          </header>

          {activePage.value === 'dashboard' && <DashboardPage />}
          {activePage.value === 'records' && <RecordsPage />}
          {activePage.value === 'users' && <UsersPage />}
          {activePage.value === 'roles' && <RolesPage />}
        </section>
      </main>
    )

    return () => (
      <>
        {currentUser.value ? <WorkspaceView /> : <AuthView />}
        {toast.value && <div class="toast" role="status" aria-live="polite">{toast.value}</div>}
      </>
    )
  },
})
