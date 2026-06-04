const app = getApp<IAppOption>()

type MiniRequestOptions = Partial<Pick<WechatMiniprogram.RequestOption, 'method' | 'data'>>

interface ReviewTaskHistoryView extends ReviewTask {
  statusText: string
}

Page({
  data: {
    items: [] as ReviewTaskHistoryView[],
  },

  onShow() {
    void this.loadHistory()
  },

  async loadHistory() {
    const { apiBase, currentUserId } = app.globalData
    const response = await request<{ reviewTasks: ReviewTask[] }>(`${apiBase}/api/review-history?userId=${currentUserId}`)
    this.setData({
      items: response.reviewTasks.map((task) => ({
        ...task,
        statusText: statusText(task.status),
      })),
    })
  },
})

function statusText(status: ReviewTask['status']) {
  const labels = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    transferred: '已转交',
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
