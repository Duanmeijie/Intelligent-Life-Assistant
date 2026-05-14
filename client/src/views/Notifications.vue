<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">消息通知</span></h1>
      <p>查看您的系统通知和消息提醒</p>
    </div>

    <div class="glass-card">
      <div class="card-header">
        <h3>
          全部消息
          <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
        </h3>
        <el-button v-if="notifications.length > 0" @click="markAllRead" :loading="markingAll" size="default">
          全部已读
        </el-button>
      </div>

      <div v-if="loading" class="empty-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <span style="font-size:48px">🔔</span>
        <p>暂无消息通知</p>
      </div>

      <div v-else class="notification-list">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.is_read }"
          @click="handleClick(item)"
        >
          <div class="notif-icon">
            <span>{{ typeIcon(item.type) }}</span>
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <span class="notif-title" :class="{ bold: !item.is_read }">{{ item.title }}</span>
              <span class="notif-time">{{ formatTime(item.created_at) }}</span>
            </div>
            <p class="notif-body">{{ item.content }}</p>
          </div>
          <div class="notif-actions">
            <el-button
              v-if="!item.is_read"
              text
              size="small"
              type="primary"
              @click.stop="markAsRead(item.id)"
            >
              标记已读
            </el-button>
            <el-button
              text
              size="small"
              type="danger"
              @click.stop="handleDelete(item.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchData"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import {
  getNotifications, getUnreadCount,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  deleteNotification
} from '@/api/notification'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const notifications = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const unreadCount = ref(0)
const markingAll = ref(false)

function typeIcon(type) {
  const map = {
    like: '❤️', comment: '💬', system: '📢',
    achievement: '🏆', reminder: '⏰'
  }
  return map[type] || '📌'
}

function formatTime(date) {
  if (!date) return ''
  const d = dayjs(date)
  if (d.isToday()) return d.format('HH:mm')
  if (d.year() === dayjs().year()) return d.format('MM-DD HH:mm')
  return d.format('YYYY-MM-DD')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getNotifications({ page: page.value, pageSize: pageSize.value })
    const list = res.rows || res.data?.rows || res.data || res || []
    notifications.value = Array.isArray(list) ? list : []
    total.value = res.total || res.data?.total || notifications.value.length
  } catch (err) {
    console.error('获取通知失败:', err)
    notifications.value = []
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data?.count ?? res.count ?? 0
  } catch (err) {
    console.error('获取未读数量失败:', err)
  }
}

async function handleClick(item) {
  if (!item.is_read) {
    await markAsRead(item.id)
  }
}

async function markAsRead(id) {
  try {
    await markAsReadApi(id)
    const item = notifications.value.find(n => n.id === id)
    if (item) {
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (err) {
    console.error('标记已读失败:', err)
  }
}

async function markAllRead() {
  markingAll.value = true
  try {
    await markAllAsReadApi()
    notifications.value.forEach(n => { n.is_read = true })
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (err) {
    console.error('全部已读失败:', err)
  } finally {
    markingAll.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteNotification(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
    total.value = Math.max(0, total.value - 1)
    ElMessage.success('已删除')
  } catch (err) {
    console.error('删除通知失败:', err)
  }
}

onMounted(() => {
  fetchData()
  fetchUnreadCount()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  padding: 0 6px;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-radius: var(--radius-sm);
}

.notification-item:hover {
  background: var(--bg-secondary);
}

.notification-item.unread {
  background: rgba(var(--primary-rgb), 0.04);
}

.notification-item:last-child {
  border-bottom: none;
}

.notif-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.notif-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.notif-title.bold {
  font-weight: 700;
}

.notif-time {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  margin-left: 12px;
}

.notif-body {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.notif-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
