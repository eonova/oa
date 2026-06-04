const app = getApp<IAppOption>()

type MiniRequestOptions = Partial<Pick<WechatMiniprogram.RequestOption, 'method' | 'data'>>

interface NotificationView extends NotificationItem {
  statusText: string
  reviewTaskId: string
}

Page({
  data: {
    items: [] as NotificationView[],
  },

  onShow() {
    void this.loadNotifications()
  },

  async loadNotifications() {
    const { apiBase, currentUserId } = app.globalData
    const [notificationsResponse, tasksResponse] = await Promise.all([
      request<{ notifications: NotificationItem[] }>(`${apiBase}/api/notifications?userId=${currentUserId}`),
      request<{ reviewTasks: ReviewTask[] }>(`${apiBase}/api/review-tasks?userId=${currentUserId}`),
    ])
    const items = notificationsResponse.notifications.map((notification) => {
      const task = tasksResponse.reviewTasks.find((item) => item.recordId === notification.recordId)
      return {
        ...notification,
        statusText: statusText(notification.status),
        reviewTaskId: task?.id ?? '',
      }
    })
    this.setData({ items })
  },

  async markRead(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    await request(`${app.globalData.apiBase}/api/notifications/${id}/read`, { method: 'PUT' })
    await this.loadNotifications()
  },

  openReview(event: WechatMiniprogram.TouchEvent) {
    const taskId = event.currentTarget.dataset.taskId as string
    if (!taskId) {
      wx.showToast({ title: '暂无审核任务', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/review/index?id=${taskId}` })
  },
})

function statusText(status: NotificationItem['status']) {
  const labels = {
    unread: '未读',
    read: '已读',
    handled: '已处理',
  }
  return labels[status]
}

function request<T>(url: string, options: MiniRequestOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url,
      method: options.method ?? 'GET',
      data: options.data,
      success: (response) => resolve(response.data as T),
      fail: reject,
    })
  })
}

export {}
