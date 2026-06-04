const app = getApp<IAppOption>()

type MiniRequestOptions = Partial<Pick<WechatMiniprogram.RequestOption, 'method' | 'data'>>

interface ReviewTaskView extends ReviewTask {
  statusText: string
}

Page({
  data: {
    taskId: '',
    comment: '',
    task: null as ReviewTaskView | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    const taskId = query.id ?? ''
    this.setData({ taskId })
    void this.loadTask(taskId)
  },

  async loadTask(taskId: string) {
    const response = await request<{ reviewTask: ReviewTask }>(`${app.globalData.apiBase}/api/review-tasks/${taskId}`)
    this.setData({
      task: {
        ...response.reviewTask,
        statusText: statusText(response.reviewTask.status),
      },
    })
  },

  onCommentInput(event: WechatMiniprogram.Input) {
    this.setData({ comment: String(event.detail.value) })
  },

  async approve() {
    await request(`${app.globalData.apiBase}/api/review-tasks/${this.data.taskId}/approve`, {
      method: 'POST',
      data: { comment: this.data.comment },
    })
    wx.showToast({ title: '已通过', icon: 'success' })
    wx.navigateBack()
  },

  async reject() {
    if (!this.data.comment.trim()) {
      wx.showToast({ title: '请填写驳回意见', icon: 'none' })
      return
    }
    await request(`${app.globalData.apiBase}/api/review-tasks/${this.data.taskId}/reject`, {
      method: 'POST',
      data: { comment: this.data.comment },
    })
    wx.showToast({ title: '已驳回', icon: 'success' })
    wx.navigateBack()
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
