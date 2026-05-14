<template>
  <div class="page-container dashboard">
    <section class="welcome-section">
      <div class="welcome-main">
        <h1 class="welcome-greeting">
          <span class="gradient-text">{{ greeting }}</span>
          <span class="welcome-name">，{{ displayName }}</span>
        </h1>
        <p class="welcome-date">{{ currentDate }} · {{ dayOfWeek }} · {{ currentTime }}</p>
        <p class="welcome-quote">{{ motivationalQuote }}</p>
      </div>
    </section>

    <section class="stat-row">
      <div class="stat-card-new primary">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon-wrapper">
            <el-icon :size="22"><Aim /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value-new">{{ todayCheckinCount }}/{{ totalHabitsCount }}</span>
            <span class="stat-label-new">今日打卡</span>
          </div>
        </div>
      </div>

      <div class="stat-card-new success">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon-wrapper">
            <span style="font-size:18px">📋</span>
          </div>
          <div class="stat-info">
            <span class="stat-value-new">{{ activeHabitsCount }}</span>
            <span class="stat-label-new">活跃习惯</span>
          </div>
        </div>
      </div>

      <div class="stat-card-new warning">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon-wrapper">
            <el-icon :size="22"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value-new">{{ todayScheduleCount }}</span>
            <span class="stat-label-new">今日日程</span>
          </div>
        </div>
      </div>

      <div class="stat-card-new info">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon-wrapper">
            <span style="font-size:18px">🏆</span>
          </div>
          <div class="stat-info">
            <span class="stat-value-new">{{ achievementProgress }}%</span>
            <span class="stat-label-new">成就进度</span>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="dashboard-left">
        <div class="glass-card section-card">
          <div class="section-header">
            <h3><el-icon :size="18"><Calendar /></el-icon> 今日日程</h3>
            <router-link to="/schedule" class="section-link">
              查看全部 <el-icon :size="14"><Right /></el-icon>
            </router-link>
          </div>
          <div v-if="todaySchedules.length > 0" class="schedule-list">
            <div
              v-for="(item, index) in todaySchedules.slice(0, 5)"
              :key="item.id"
              class="schedule-item"
              :style="{ animationDelay: `${index * 0.05}s` }"
            >
              <div class="schedule-time">
                <el-icon :size="14"><Clock /></el-icon>
                {{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}
              </div>
              <div class="schedule-info">
                <span class="schedule-title">{{ item.title }}</span>
                <span class="schedule-category" :class="`cat-${item.category}`">
                  {{ getCategoryLabel(item.category) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon"><el-icon :size="44"><Calendar /></el-icon></div>
            <div class="empty-text">今天暂无日程安排</div>
          </div>
        </div>

        <div class="glass-card section-card">
          <div class="section-header">
            <h3><el-icon :size="18"><Aim /></el-icon> 今日习惯打卡</h3>
            <router-link to="/habits" class="section-link">
              管理习惯 <el-icon :size="14"><Right /></el-icon>
            </router-link>
          </div>
          <div v-if="activeHabits.length > 0" class="habit-grid">
            <div
              v-for="habit in activeHabits"
              :key="habit.id"
              class="habit-card"
              :class="{ 'habit-checked': checkedHabitIds.has(habit.id) }"
              :style="{ '--habit-color': habit.color || '#6366f1' }"
            >
              <div class="habit-main">
                <span class="habit-emoji">{{ getHabitEmoji(habit.category) }}</span>
                <div class="habit-detail">
                  <span class="habit-name">{{ habit.name }}</span>
                  <span class="habit-meta" v-if="habit.description">{{ habit.description }}</span>
                </div>
              </div>
              <button
                class="habit-checkin-btn"
                :class="{ 'is-checked': checkedHabitIds.has(habit.id) }"
                :disabled="checkingInIds.has(habit.id) || checkedHabitIds.has(habit.id)"
                @click="handleQuickCheckin(habit)"
              >
                <el-icon v-if="checkingInIds.has(habit.id)" class="is-loading"><Loading /></el-icon>
                <template v-else-if="checkedHabitIds.has(habit.id)">✓</template>
                <template v-else>打卡</template>
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon"><span style="font-size:44px">📋</span></div>
            <div class="empty-text">还没有习惯，去创建一个吧</div>
          </div>
        </div>
      </div>

      <div class="dashboard-right">
        <div class="glass-card section-card">
          <div class="section-header">
            <h3><el-icon :size="18"><Timer /></el-icon> 每日打卡</h3>
            <span class="section-subtitle">{{ currentWeekLabel }}</span>
          </div>
          <div class="weekly-heat">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="heat-day"
              :class="{ 'is-today': day.isToday, 'has-checkin': day.checkinCount > 0 }"
            >
              <div class="heat-day-label">{{ day.weekday }}</div>
              <div class="heat-day-dot" :class="getHeatLevel(day.checkinCount)">
                <span class="heat-day-count" v-if="day.checkinCount > 0">{{ day.checkinCount }}</span>
              </div>
              <div class="heat-day-date">{{ day.dayNum }}</div>
            </div>
          </div>
        </div>

        <div class="glass-card section-card">
          <div class="section-header">
            <h3><span style="margin-right:6px">🤖</span> AI 推荐</h3>
          </div>
          <div v-if="aiRecommendations.length > 0" class="recommend-list">
            <div
              v-for="(rec, index) in aiRecommendations"
              :key="index"
              class="recommend-item"
            >
              <div class="recommend-icon">{{ rec.emoji || '💡' }}</div>
              <div class="recommend-content">
                <span class="recommend-name">{{ rec.name || rec.title }}</span>
                <span class="recommend-desc" v-if="rec.description || rec.reason">
                  {{ rec.description || rec.reason }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon-small">🤖</div>
            <div class="empty-text-small">AI 正在为你生成推荐...</div>
          </div>
        </div>

        <div class="glass-card section-card">
          <div class="section-header">
            <h3><el-icon :size="18"><WarningFilled /></el-icon> 快速操作</h3>
          </div>
          <div class="quick-actions">
            <button class="quick-action-btn" @click="router.push('/schedule')">
              <el-icon :size="18"><Plus /></el-icon>
              <span>添加日程</span>
            </button>
            <button class="quick-action-btn" @click="router.push('/habits')">
              <el-icon :size="18"><Plus /></el-icon>
              <span>添加习惯</span>
            </button>
            <button class="quick-action-btn" @click="router.push('/checkin')">
              <el-icon :size="18"><Aim /></el-icon>
              <span>去打卡</span>
            </button>
            <button class="quick-action-btn" @click="router.push('/analytics')">
              <el-icon :size="18"><Timer /></el-icon>
              <span>数据统计</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-bottom">
      <div class="glass-card section-card">
        <div class="section-header">
          <h3>📣 最近动态</h3>
          <router-link to="/social" class="section-link">
            查看更多 <el-icon :size="14"><Right /></el-icon>
          </router-link>
        </div>
        <div v-if="recentPosts.length > 0" class="posts-compact">
          <div
            v-for="post in recentPosts.slice(0, 3)"
            :key="post.id"
            class="post-compact-item"
          >
            <el-avatar :size="36" :src="post.user?.avatar" class="post-avatar">
              {{ post.user?.username?.charAt(0).toUpperCase() || 'U' }}
            </el-avatar>
            <div class="post-compact-body">
              <div class="post-compact-header">
                <span class="post-compact-user">{{ post.user?.username || '匿名用户' }}</span>
                <span class="post-compact-time">{{ formatRelativeTime(post.createdAt) }}</span>
              </div>
              <p class="post-compact-text">{{ truncateText(post.content, 120) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📣</div>
          <div class="empty-text">暂无动态</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useHabitStore } from '@/stores/habit'
import { useScheduleStore } from '@/stores/schedule'
import { getCheckins, getCheckinStats, createCheckin } from '@/api/checkin'
import { getRecommendHabits } from '@/api/ai'
import { getPosts } from '@/api/social'
import { getAchievements, getUserAchievements } from '@/api/achievement'
import { Plus, Right, Calendar, Clock, Timer, Aim, WarningFilled, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const habitStore = useHabitStore()
const scheduleStore = useScheduleStore()

const currentTime = ref('')
const todaySchedules = ref([])
const activeHabits = ref([])
const checkedHabitIds = reactive(new Set())
const checkingInIds = reactive(new Set())
const aiRecommendations = ref([])
const recentPosts = ref([])
const totalAchievements = ref(0)
const obtainedAchievements = ref(0)
const weekCheckinData = ref([])
let timeTimer = null

const quotes = [
  '每一个微小的习惯，都是通往卓越的基石。',
  '自律不是束缚，而是通往自由的阶梯。',
  '今天的一小步，是明天的一大步。',
  '坚持做正确的事，时间会给你答案。',
  '优秀的习惯，成就优秀的你。',
  '不积跬步，无以至千里。',
  '生活不是等待风暴过去，而是学会在雨中起舞。',
  '每一天都是一个新的开始，抓住它。',
]

const motivationalQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])

const displayName = computed(() => {
  return authStore.user?.nickname || authStore.user?.username || '朋友'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentDate = computed(() => dayjs().format('YYYY年M月D日'))
const dayOfWeek = computed(() => {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[new Date().getDay()]
})

const todayCheckinCount = computed(() => checkedHabitIds.size)
const totalHabitsCount = computed(() => activeHabits.value.length)
const activeHabitsCount = computed(() => activeHabits.value.length)
const todayScheduleCount = computed(() => todaySchedules.value.length)

const achievementProgress = computed(() => {
  if (totalAchievements.value === 0) return 0
  return Math.round((obtainedAchievements.value / totalAchievements.value) * 100)
})

const currentWeekLabel = computed(() => {
  const start = dayjs().startOf('week')
  const end = dayjs().endOf('week')
  return `${start.format('M/D')} - ${end.format('M/D')}`
})

const weekDays = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const start = dayjs().startOf('week')
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = start.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const found = weekCheckinData.value.find((c) => c.date === dateStr)
    days.push({
      date: dateStr,
      weekday: ['一', '二', '三', '四', '五', '六', '日'][i],
      dayNum: d.date(),
      isToday: dateStr === today,
      checkinCount: found ? found.count : 0,
    })
  }
  return days
})

function formatTime(dateStr) {
  return dayjs(dateStr).format('HH:mm')
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  return dayjs(dateStr).fromNow()
}

function truncateText(text, maxLen = 120) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function getCategoryLabel(category) {
  const map = { work: '工作', study: '学习', life: '生活', sports: '运动' }
  return map[category] || category
}

function getHabitEmoji(category) {
  const map = { work: '💼', study: '📚', life: '🌟', sports: '🏃' }
  return map[category] || '✨'
}

function getHeatLevel(count) {
  if (count === 0) return 'level-0'
  if (count <= 2) return 'level-1'
  if (count <= 4) return 'level-2'
  return 'level-3'
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data
  if (data && data.rows) return data.rows
  if (data && data.list) return data.list
  return []
}

async function fetchData() {
  try {
    const todayStr = dayjs().format('YYYY-MM-DD')
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD')
    const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD')

    const [
      schedRes,
      habitRes,
      checkinRes,
      achievRes,
      allAchievRes,
      aiRes,
      postsRes,
      weekStatsRes,
    ] = await Promise.allSettled([
      getCheckins({ startTime: todayStr + ' 00:00:00', endTime: todayStr + ' 23:59:59' }).catch(() => null),
      getCheckins({}).catch(() => null),
      getCheckins({ date: todayStr }).catch(() => null),
      getUserAchievements().catch(() => null),
      getAchievements().catch(() => null),
      getRecommendHabits().catch(() => null),
      getPosts({ page: 1, pageSize: 3 }).catch(() => null),
      getCheckinStats({ startDate: weekStart, endDate: weekEnd }).catch(() => null),
    ])

    const pd = (result) => (result.status === 'fulfilled' && result.value ? result.value : null)

    const schedData = pd(schedRes)
    if (schedData) {
      const body = schedData.data || schedData
      todaySchedules.value = normalizeArray(body)
    }

    const checkinTodayData = pd(checkinRes) || pd(schedRes)
    if (checkinTodayData) {
      const body = checkinTodayData.data || checkinTodayData
      const checkins = normalizeArray(body)
      checkedHabitIds.clear()
      checkins.forEach((c) => {
        if (c.habit_id) checkedHabitIds.add(c.habit_id)
      })
    }

    const habitData = pd(habitRes)
    if (habitData) {
      const body = habitData.data || habitData
      activeHabits.value = normalizeArray(body)
    } else {
      await habitStore.fetchHabits()
      activeHabits.value = habitStore.habits || []
    }

    const achievData = pd(achievRes)
    if (achievData) {
      const body = achievData.data || achievData
      obtainedAchievements.value = body.count || body.achievements?.length || 0
    }

    const allAchievData = pd(allAchievRes)
    if (allAchievData) {
      const body = allAchievData.data || allAchievData
      totalAchievements.value = body.total || body.count || body.length || body.achievements?.length || 0
    }

    const aiData = pd(aiRes)
    if (aiData) {
      const body = aiData.data || aiData
      aiRecommendations.value = normalizeArray(body).slice(0, 3)
    }

    const postsData = pd(postsRes)
    if (postsData) {
      const body = postsData.data || postsData
      recentPosts.value = normalizeArray(body)
    }

    const statsData = pd(weekStatsRes)
    if (statsData) {
      const body = statsData.data || statsData
      weekCheckinData.value = normalizeArray(body)
    }
  } catch {
    // show empty states gracefully
  }
}

async function handleQuickCheckin(habit) {
  if (checkingInIds.has(habit.id) || checkedHabitIds.has(habit.id)) return
  checkingInIds.add(habit.id)
  try {
    await createCheckin({ habit_id: habit.id, checkin_date: dayjs().format('YYYY-MM-DD') })
    checkedHabitIds.add(habit.id)
    ElMessage.success('打卡成功！')
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '打卡失败')
  } finally {
    checkingInIds.delete(habit.id)
  }
}

onMounted(() => {
  fetchData()
  currentTime.value = dayjs().format('HH:mm')
  timeTimer = setInterval(() => {
    currentTime.value = dayjs().format('HH:mm')
  }, 60000)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-section {
  position: relative;
  padding: 4px 0;
}

.welcome-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.welcome-greeting {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.welcome-name {
  color: var(--text-primary);
}

.welcome-date {
  font-size: 14px;
  color: var(--text-secondary);
}

.welcome-quote {
  font-size: 14px;
  color: var(--text-tertiary);
  font-style: italic;
  margin-top: 4px;
  padding-left: 12px;
  border-left: 3px solid var(--primary);
  line-height: 1.6;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card-new {
  position: relative;
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  overflow: hidden;
  cursor: default;
  transition: var(--transition);
}

.stat-card-new:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  background: var(--bg-glass-hover);
}

.stat-card-new .stat-accent {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
}

.stat-card-new.primary .stat-accent {
  background: var(--gradient-primary);
}

.stat-card-new.success .stat-accent {
  background: var(--gradient-success);
}

.stat-card-new.warning .stat-accent {
  background: var(--gradient-warning);
}

.stat-card-new.info .stat-accent {
  background: var(--gradient-info);
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon-wrapper {
  width: 46px;
  height: 46px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-new.primary .stat-icon-wrapper {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
}

.stat-card-new.success .stat-icon-wrapper {
  background: rgba(var(--success-rgb), 0.1);
  color: var(--success);
}

.stat-card-new.warning .stat-icon-wrapper {
  background: rgba(var(--warning-rgb), 0.1);
  color: var(--warning);
}

.stat-card-new.info .stat-icon-wrapper {
  background: rgba(var(--info-rgb), 0.1);
  color: var(--info);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value-new {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label-new {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 20px;
}

.dashboard-left,
.dashboard-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  padding: 20px 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-link {
  font-size: 13px;
  color: var(--primary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: var(--transition-fast);
}

.section-link:hover {
  color: var(--primary-light);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  animation: fadeSlideUp 0.4s ease both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.schedule-item:hover {
  background: var(--bg-tertiary);
  transform: translateX(3px);
}

.schedule-time {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  min-width: 115px;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: 4px;
}

.schedule-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.schedule-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-category {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}

.cat-work {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
}

.cat-study {
  background: rgba(var(--info-rgb), 0.1);
  color: var(--info);
}

.cat-life {
  background: rgba(var(--success-rgb), 0.1);
  color: var(--success);
}

.cat-sports {
  background: rgba(var(--warning-rgb), 0.1);
  color: var(--warning);
}

.habit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.habit-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1.5px solid transparent;
  border-radius: var(--radius);
  transition: var(--transition-fast);
}

.habit-card:hover {
  border-color: var(--habit-color, var(--primary));
  background: rgba(var(--primary-rgb), 0.03);
}

.habit-card.habit-checked {
  border-color: var(--success);
  background: rgba(var(--success-rgb), 0.05);
}

.habit-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.habit-emoji {
  font-size: 20px;
  flex-shrink: 0;
}

.habit-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.habit-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.habit-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.habit-checkin-btn {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--habit-color, var(--primary));
  background: transparent;
  color: var(--habit-color, var(--primary));
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: 50px;
  text-align: center;
}

.habit-checkin-btn:hover:not(:disabled) {
  background: var(--habit-color, var(--primary));
  color: #fff;
}

.habit-checkin-btn.is-checked {
  background: var(--success);
  border-color: var(--success);
  color: #fff;
  cursor: default;
}

.habit-checkin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.habit-checkin-btn .is-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.weekly-heat {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8px 0;
}

.heat-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: var(--transition-fast);
  padding: 6px 4px;
  border-radius: var(--radius-sm);
}

.heat-day:hover {
  background: var(--bg-secondary);
}

.heat-day-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.heat-day.is-today .heat-day-label {
  color: var(--primary);
  font-weight: 700;
}

.heat-day-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  transition: var(--transition-fast);
}

.heat-day-dot.level-1 {
  background: rgba(var(--primary-rgb), 0.15);
  border-color: rgba(var(--primary-rgb), 0.3);
}

.heat-day-dot.level-2 {
  background: rgba(var(--primary-rgb), 0.3);
  border-color: rgba(var(--primary-rgb), 0.5);
}

.heat-day-dot.level-3 {
  background: var(--primary);
  border-color: var(--primary);
}

.heat-day.is-today .heat-day-dot {
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
}

.heat-day-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.heat-day-dot.level-3 .heat-day-count {
  color: #fff;
}

.heat-day-date {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.heat-day.is-today .heat-day-date {
  color: var(--primary);
  font-weight: 700;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommend-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.recommend-item:hover {
  background: var(--bg-tertiary);
}

.recommend-icon {
  font-size: 22px;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--primary-rgb), 0.08);
  border-radius: var(--radius-sm);
}

.recommend-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.recommend-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.recommend-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 12px;
  background: var(--bg-secondary);
  border: 1.5px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  transition: var(--transition-fast);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
}

.quick-action-btn:hover {
  border-color: var(--primary);
  background: rgba(var(--primary-rgb), 0.04);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.quick-action-btn .el-icon {
  color: var(--primary);
}

.dashboard-bottom {
  margin-top: 0;
}

.posts-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-compact-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.post-compact-item:hover {
  background: var(--bg-tertiary);
}

.post-avatar {
  flex-shrink: 0;
}

.post-compact-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.post-compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-compact-user {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.post-compact-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.post-compact-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state-small {
  padding: 16px 0;
}

.empty-icon-small {
  font-size: 28px;
  opacity: 0.4;
  margin-bottom: 6px;
  text-align: center;
}

.empty-text-small {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .habit-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-greeting {
    font-size: 22px;
  }

  .stat-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card-new {
    padding: 16px;
  }

  .stat-value-new {
    font-size: 18px;
  }

  .section-card {
    padding: 16px;
  }

  .weekly-heat {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .quick-actions {
    grid-template-columns: 1fr 1fr;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .stat-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .stat-card-new {
    padding: 12px 14px;
  }

  .stat-icon-wrapper {
    width: 38px;
    height: 38px;
  }

  .stat-value-new {
    font-size: 16px;
  }

  .habit-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
