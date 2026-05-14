<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <div class="welcome-left">
        <h1 class="welcome-title">{{ welcomeMessage }}</h1>
        <p class="welcome-time">{{ currentDate }} {{ currentWeekday }}</p>
      </div>
      <div class="welcome-right">
        <el-avatar :size="48" :src="authStore.userAvatar">
          {{ authStore.username.charAt(0).toUpperCase() }}
        </el-avatar>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon" style="background: #ecf5ff">
              <el-icon :size="24" color="#409eff"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todaySchedules }}</span>
              <span class="stat-label">今日日程</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon" style="background: #f0f9eb">
              <el-icon :size="24" color="#67c23a"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.activeHabits }}</span>
              <span class="stat-label">活跃习惯</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon" style="background: #fdf6ec">
              <el-icon :size="24" color="#e6a23c"><DataBoard /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.checkinRate }}%</span>
              <span class="stat-label">今日打卡率</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon" style="background: #fef0f0">
              <el-icon :size="24" color="#f56c6c"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.consecutiveDays }}</span>
              <span class="stat-label">连续打卡</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-section">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">今日日程</span>
              <el-button text type="primary" @click="$router.push('/schedule')">查看全部</el-button>
            </div>
          </template>
          <div v-loading="scheduleLoading" class="schedule-list">
            <div v-if="todaySchedules.length === 0 && !scheduleLoading" class="empty-state">
              <el-icon :size="48" color="#c0c4cc"><Calendar /></el-icon>
              <p>今天没有日程安排</p>
            </div>
            <div
              v-for="item in todaySchedules"
              :key="item.id"
              class="schedule-item"
            >
              <div class="schedule-time">
                <span class="time-start">{{ formatTime(item.startTime) }}</span>
                <span class="time-separator">-</span>
                <span class="time-end">{{ formatTime(item.endTime) }}</span>
              </div>
              <div class="schedule-info">
                <span class="schedule-title">{{ item.title }}</span>
                <el-tag :type="categoryTagType(item.category)" size="small" effect="plain">
                  {{ item.category || '未分类' }}
                </el-tag>
              </div>
              <el-tag :type="statusTagType(item.status)" size="small">
                {{ statusLabel(item.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">习惯打卡</span>
              <el-button text type="primary" @click="$router.push('/habits')">管理习惯</el-button>
            </div>
          </template>
          <div v-loading="habitLoading" class="habit-list">
            <div v-if="habits.length === 0 && !habitLoading" class="empty-state">
              <el-icon :size="48" color="#c0c4cc"><Check /></el-icon>
              <p>还没有习惯，去创建一些吧</p>
              <el-button type="primary" size="small" @click="$router.push('/habits')">创建习惯</el-button>
            </div>
            <div
              v-for="habit in habits"
              :key="habit.id"
              class="habit-item"
            >
              <div class="habit-indicator" :style="{ background: habit.color || '#409eff' }" />
              <div class="habit-info">
                <span class="habit-name">{{ habit.name }}</span>
                <span class="habit-frequency">{{ frequencyLabel(habit.frequency) }}</span>
              </div>
              <el-button
                :type="habit.checkedIn ? 'success' : 'default'"
                :disabled="habit.checkedIn"
                size="small"
                :loading="checkinLoadingMap[habit.id]"
                @click="handleCheckin(habit)"
              >
                {{ habit.checkedIn ? '已打卡' : '打卡' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getSchedules } from '@/api/schedule'
import { getHabits } from '@/api/habit'
import { createCheckin, getCheckinStats } from '@/api/checkin'
import { ElMessage } from 'element-plus'
import { Calendar, Check, DataBoard, TrendCharts } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const scheduleLoading = ref(false)
const habitLoading = ref(false)
const todaySchedules = ref([])
const habits = ref([])
const checkinLoadingMap = reactive({})

const stats = reactive({
  todaySchedules: 0,
  activeHabits: 0,
  checkinRate: 0,
  consecutiveDays: 0
})

const currentDate = ref('')
const currentWeekday = ref('')
let timer = null

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const welcomeMessage = computed(() => {
  const hour = new Date().getHours()
  let greeting = '你好'
  if (hour < 6) greeting = '夜深了'
  else if (hour < 9) greeting = '早上好'
  else if (hour < 12) greeting = '上午好'
  else if (hour < 14) greeting = '中午好'
  else if (hour < 18) greeting = '下午好'
  else greeting = '晚上好'
  return `${greeting}，${authStore.username}`
})

function updateTime() {
  const now = dayjs()
  currentDate.value = now.format('YYYY年MM月DD日')
  currentWeekday.value = weekdayMap[now.day()]
}

function formatTime(time) {
  if (!time) return '--'
  return dayjs(time).format('HH:mm')
}

function categoryTagType(category) {
  const map = {
    '工作': 'primary',
    '学习': 'success',
    '生活': 'warning',
    '运动': 'danger',
    '社交': 'info',
    '娱乐': ''
  }
  return map[category] || ''
}

function statusTagType(status) {
  const map = {
    '待开始': 'info',
    '进行中': 'warning',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return map[status] || 'info'
}

function statusLabel(status) {
  return status || '待开始'
}

function frequencyLabel(frequency) {
  const map = {
    'daily': '每日',
    'weekly': '每周',
    'monthly': '每月',
    'custom': '自定义'
  }
  return map[frequency] || frequency || '每日'
}

async function fetchTodaySchedules() {
  scheduleLoading.value = true
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const res = await getSchedules({ date: today, pageSize: 100 })
    const list = res?.data?.rows || res?.rows || res?.data || []
    todaySchedules.value = Array.isArray(list) ? list.slice(0, 10) : []
    stats.todaySchedules = todaySchedules.value.length
  } catch {
    todaySchedules.value = []
    stats.todaySchedules = 0
  } finally {
    scheduleLoading.value = false
  }
}

async function fetchHabits() {
  habitLoading.value = true
  try {
    const res = await getHabits()
    const list = res?.data || (Array.isArray(res) ? res : [])
    habits.value = list
    stats.activeHabits = list.filter(h => h.active !== false).length
  } catch {
    habits.value = []
    stats.activeHabits = 0
  } finally {
    habitLoading.value = false
  }
}

async function fetchCheckinStats() {
  try {
    const res = await getCheckinStats({ date: dayjs().format('YYYY-MM-DD') })
    if (res?.data) {
      stats.checkinRate = res.data.checkinRate || 0
      stats.consecutiveDays = res.data.consecutiveDays || 0
    }
  } catch {
    stats.checkinRate = 0
    stats.consecutiveDays = 0
  }
}

async function handleCheckin(habit) {
  if (checkinLoadingMap[habit.id]) return
  checkinLoadingMap[habit.id] = true
  try {
    await createCheckin({ habitId: habit.id })
    habit.checkedIn = true
    ElMessage.success(`${habit.name} 打卡成功`)
    await fetchCheckinStats()
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '打卡失败'
    ElMessage.error(msg)
  } finally {
    checkinLoadingMap[habit.id] = false
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 60000)
  fetchTodaySchedules()
  fetchHabits()
  fetchCheckinStats()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.welcome-time {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.stat-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.content-section {
  margin-bottom: 24px;
}

.section-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.schedule-list {
  min-height: 100px;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 16px;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  flex-shrink: 0;
}

.time-start {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.time-separator {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.time-end {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.schedule-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schedule-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.habit-list {
  min-height: 100px;
}

.habit-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 12px;
}

.habit-item:last-child {
  border-bottom: none;
}

.habit-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.habit-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.habit-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.habit-frequency {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
