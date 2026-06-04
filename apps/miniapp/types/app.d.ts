interface MiniAppGlobalData {
  apiBase: string
  currentUserId: string
}

interface IAppOption {
  globalData: MiniAppGlobalData
}

interface RecordItem {
  id: string
  title: string
  category: string
  department: string
  owner: string
  status: 'todo' | 'doing' | 'done'
  priority: 'high' | 'normal' | 'low'
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
  status: 'unread' | 'read' | 'handled'
  createdAt: string
}

interface ReviewTask {
  id: string
  recordId: string
  assigneeId: string
  status: 'pending' | 'approved' | 'rejected' | 'transferred'
  comment: string
  createdAt: string
  handledAt: string
  record: RecordItem | null
}
