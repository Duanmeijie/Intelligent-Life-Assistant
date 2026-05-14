<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">每日打卡</span></h1>
      <p>坚持每天打卡，养成良好习惯</p>
    </div>

    <div class="stats-row">
      <div class="stat-card primary">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ todayCheckinCount }}/{{ todayHabitCount }}</span>
          <span class="stat-label">今日打卡</span>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <span class="stat-value">{{ habits.length }}</span>
          <span class="stat-label">总习惯数</span>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <span class="stat-value">{{ overallStreak }}</span>
          <span class="stat-label">最长连续打卡</span>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <span class="stat-value">{{ checkinRate }}%</span>
          <span class="stat-label">今日完成率</span>
        </div>
      </div>
    </div>

    <div class="two-col-layout">
      <div class="glass-card calendar-card">
        <div class="card-header">
          <h3>打卡日历</h3>
          <el-date-picker
            v-model="currentMonth"
            type="month"
            placeholder="选择月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            size="default"
            @change="fetchMonthlyCheckins"
          />
        </div>
        <el-calendar v-model="calendarDate">
          <template #date-cell="{ data }">
            <div class="calendar-day" :class="{ checked: isCheckedDate(data.day) }">
              <span>{{ data.day.split('-')[2] }}</span>
              <span v-if="isCheckedDate(data.day)" class="dot"></span>
            </div>
          </template>
        </el-calendar>
      </div>

      <div class="glass-card checkin-card">
        <div class="card-header">
          <h3>今日习惯</h3>
          <el-switch
            v-model="showUncheckedOnly"
            active-text="未打卡"
            inactive-text="全部"
            size="small"
          />
        </div>

        <div v-if="loading" class="empty-state">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <p>加载中...</p>
        </div>

        <div v-else-if="filteredHabits.length === 0" class="empty-state">
          <span style="font-size:48px">🎉</span>
          <p>{{ showUncheckedOnly ? '全部打卡完成，太棒了！' : '今天没有需要打卡的习惯' }}</p>
        </div>

        <div v-else class="habit-checkin-list">
          <div
            v-for="habit in filteredHabits"
            :key="habit.id"
            class="checkin-item"
            :class="{ done: isCheckedInToday(habit.id) }"
          >
            <div class="checkin-left">
              <div class="habit-icon" :style="{ background: habit.color || '#6366f1' }">
                {{ getCategoryEmoji(habit.category) }}
              </div>
              <div class="checkin-info">
                <span class="habit-name">{{ habit.name }}</span>
                <span class="habit-streak" v-if="streaks[habit.id]">
                  🔥 连续 {{ streaks[habit.id] }} 天
                </span>
              </div>
            </div>
            <div class="checkin-right">
              <el-button
                v-if="!isCheckedInToday(habit.id)"
                type="primary"
                size="default"
                round
                @click="openCheckinDialog(habit)"
              >
                打卡
              </el-button>
              <el-button
                v-else
                type="danger"
                size="default"
                round
                plain
                @click="undoCheckin(habit.id)"
              >
                撤销
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card weekly-section">
      <div class="card-header">
        <h3>📊 本周打卡概览</h3>
        <span class="week-streak" v-if="weekCheckinRate > 0">
          {{ weekCheckinRate }}% 完成率
        </span>
      </div>
      <div class="weekly-bar">
        <div
          v-for="(day, idx) in weekDays"
          :key="idx"
          class="week-bar-item"
          :class="{ active: day.checked, today: day.isToday }"
          @click="scrollToHabit"
        >
          <div class="week-bar-label">{{ day.label }}</div>
          <div class="week-bar-track">
            <div
              class="week-bar-fill"
              :style="{ height: day.checked ? '100%' : '15%' }"
            ></div>
          </div>
          <div class="week-bar-date">{{ day.dateNum }}</div>
        </div>
      </div>
      <div class="motivation-banner" v-if="streakMessage">
        <span class="motivation-icon">{{ streakMessage.icon }}</span>
        <span class="motivation-text">{{ streakMessage.text }}</span>
      </div>
    </div>

    <el-dialog
      v-model="noteDialogVisible"
      title="添加打卡备注"
      width="420px"
      destroy-on-close
      class="modern-dialog"
    >
      <el-form label-position="top">
        <el-form-item label="今日感想">
          <el-input
            v-model="checkinNote"
            type="textarea"
            :rows="3"
            placeholder="记录今天的感受和想法..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noteDialogVisible = false" size="large">取消</el-button>
        <el-button type="primary" @click="confirmCheckin" :loading="checkingIn" size="large">
          确认打卡 ✅
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useHabitStore } from '@/stores/habit'
import { createCheckin, getCheckins, deleteCheckin, getCheckinStats } from '@/api/checkin'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const habitStore = useHabitStore()
const { habits, loading } = storeToRefs(habitStore)
const { fetchHabits } = habitStore

const calendarDate = ref(new Date())
const currentMonth = ref(dayjs().format('YYYY-MM'))
const todayCheckins = ref([])
const monthlyCheckins = ref([])
const weeklyCheckins = ref([])
const streaks = ref({})
const showUncheckedOnly = ref(false)
const noteDialogVisible = ref(false)
const checkinNote = ref('')
const currentCheckinHabit = ref(null)
const checkingIn = ref(false)

const todayStr = computed(() => dayjs().format('YYYY-MM-DD'))
const todayHabitCount = computed(() => habits.value.length)
const todayCheckinCount = computed(() => todayCheckins.value.length)
const checkinRate = computed(() => {
  if (todayHabitCount.value === 0) return 0
  return Math.round((todayCheckinCount.value / todayHabitCount.value) * 100)
})

const overallStreak = computed(() => {
  let max = 0
  Object.values(streaks.value).forEach(s => {
    if (s > max) max = s
  })
  return max
})

const weekDays = computed(() => {
  const start = dayjs().startOf('week')
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = start.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const checked = weeklyCheckins.value.some(c => dayjs(c.checkin_date || c.date).format('YYYY-MM-DD') === dateStr)
    days.push({
      label: ['一', '二', '三', '四', '五', '六', '日'][i],
      dateNum: d.date(),
      date: dateStr,
      isToday: dateStr === dayjs().format('YYYY-MM-DD'),
      checked
    })
  }
  return days
})

const weekCheckinRate = computed(() => {
  if (weekDays.value.length === 0) return 0
  const checked = weekDays.value.filter(d => d.checked).length
  return Math.round((checked / 7) * 100)
})

const streakMessage = computed(() => {
  const rate = weekCheckinRate.value
  if (rate >= 100) return { icon: '🏆', text: '本周全勤！你是真正的自律达人！' }
  if (rate >= 80) return { icon: '🌟', text: '本周表现优秀，继续保持！' }
  if (rate >= 50) return { icon: '💪', text: '不错的进度，再加把劲就能完成目标！' }
  if (rate >= 30) return { icon: '🌱', text: '好的开始是成功的一半，坚持打卡！' }
  if (overallStreak.value >= 7) return { icon: '🔥', text: `已连续打卡 ${overallStreak.value} 天，毅力可嘉！` }
  return null
})

const filteredHabits = computed(() => {
  if (!showUncheckedOnly.value) return habits.value
  return habits.value.filter(h => !isCheckedInToday(h.id))
})

function isCheckedInToday(habitId) {
  return todayCheckins.value.some(c => c.habit_id === habitId)
}

function isCheckedDate(dateStr) {
  return monthlyCheckins.value.some(c => dayjs(c.checkin_date).format('YYYY-MM-DD') === dateStr)
}

function getCategoryEmoji(cat) {
  const map = {
    health: '💪', study: '📚', work: '💼', life: '🏠',
    sports: '⚽', reading: '📖', meditation: '🧘', social: '👥'
  }
  return map[cat] || '⭐'
}

function getTodayCheckinId(habitId) {
  const found = todayCheckins.value.find(c => c.habit_id === habitId)
  return found ? found.id : null
}

async function fetchTodayCheckins() {
  try {
    const res = await getCheckins({ date: todayStr.value })
    if (Array.isArray(res.data)) {
      todayCheckins.value = res.data
    } else if (Array.isArray(res)) {
      todayCheckins.value = res
    } else {
      todayCheckins.value = []
    }
  } catch (err) {
    console.error('获取今日打卡失败:', err)
    todayCheckins.value = []
  }
}

async function fetchMonthlyCheckins() {
  try {
    const res = await getCheckins({
      startDate: dayjs(currentMonth.value).startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs(currentMonth.value).endOf('month').format('YYYY-MM-DD')
    })
    if (Array.isArray(res.data)) {
      monthlyCheckins.value = res.data
    } else if (Array.isArray(res)) {
      monthlyCheckins.value = res
    } else {
      monthlyCheckins.value = []
    }
  } catch (err) {
    console.error('获取月度打卡失败:', err)
    monthlyCheckins.value = []
  }
}

async function fetchWeekCheckins() {
  try {
    const start = dayjs().startOf('week').format('YYYY-MM-DD')
    const end = dayjs().endOf('week').format('YYYY-MM-DD')
    const res = await getCheckins({ startDate: start, endDate: end })
    const data = res.data || res || []
    weeklyCheckins.value = Array.isArray(data) ? data : []
  } catch {
    weeklyCheckins.value = []
  }
}

function scrollToHabit() {
  document.querySelector('.checkin-card')?.scrollIntoView({ behavior: 'smooth' })
}

async function fetchStreaks() {
  try {
    const res = await getCheckinStats()
    const stats = res.data || res
    if (stats) {
      habits.value.forEach(h => {
        if (stats[h.id]) {
          streaks.value[h.id] = stats[h.id].streak || 0
        }
      })
    }
  } catch (err) {
    console.error('获取打卡统计失败:', err)
  }
}

function openCheckinDialog(habit) {
  currentCheckinHabit.value = habit
  checkinNote.value = ''
  noteDialogVisible.value = true
}

async function confirmCheckin() {
  if (!currentCheckinHabit.value) return
  checkingIn.value = true
  try {
    await createCheckin({
      habit_id: currentCheckinHabit.value.id,
      checkin_date: todayStr.value,
      note: checkinNote.value
    })
    ElMessage.success('打卡成功！')
    noteDialogVisible.value = false
    await refresh()
  } catch (err) {
    console.error('打卡失败:', err)
  } finally {
    checkingIn.value = false
  }
}

async function undoCheckin(habitId) {
  const checkinId = getTodayCheckinId(habitId)
  if (!checkinId) return
  try {
    await deleteCheckin(checkinId)
    ElMessage.success('已撤销打卡')
    await refresh()
  } catch (err) {
    console.error('撤销打卡失败:', err)
  }
}

async function refresh() {
  await Promise.all([fetchTodayCheckins(), fetchMonthlyCheckins(), fetchWeekCheckins(), fetchStreaks()])
}

onMounted(async () => {
  await fetchHabits()
  await refresh()
})

watch(currentMonth, () => {
  fetchMonthlyCheckins()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.two-col-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.calendar-day .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: 2px;
}

.calendar-day.checked span:first-child {
  font-weight: 700;
  color: var(--primary);
}

.habit-checkin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 480px;
  overflow-y: auto;
}

.checkin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  transition: all var(--transition-base);
}

.checkin-item.done {
  background: rgba(var(--success-rgb), 0.06);
  border-color: rgba(var(--success-rgb), 0.2);
}

.checkin-item:hover {
  border-color: var(--primary);
}

.checkin-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.habit-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.checkin-info {
  display: flex;
  flex-direction: column;
}

.habit-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 15px;
}

.habit-streak {
  font-size: 12px;
  color: var(--warning);
  margin-top: 2px;
}

.checkin-right {
  flex-shrink: 0;
}

.weekly-section {
  margin-top: 24px;
}

.week-streak {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.weekly-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 0;
}

.week-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  cursor: pointer;
  padding: 6px 4px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.week-bar-item:hover {
  background: var(--bg-secondary);
}

.week-bar-item.today .week-bar-label {
  color: var(--primary);
  font-weight: 700;
}

.week-bar-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.week-bar-track {
  width: 16px;
  height: 60px;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  border: 1px solid var(--border-color);
}

.week-bar-item.active .week-bar-track {
  border-color: var(--primary);
}

.week-bar-fill {
  width: 100%;
  background: var(--gradient-primary);
  border-radius: 8px;
  transition: height 0.3s ease;
  min-height: 4px;
}

.week-bar-item.today .week-bar-fill {
  background: var(--gradient-success);
}

.week-bar-date {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.motivation-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(var(--success-rgb), 0.08));
  border-radius: var(--radius);
  margin-top: 8px;
  border: 1px solid rgba(var(--primary-rgb), 0.1);
}

.motivation-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.motivation-text {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-col-layout {
    grid-template-columns: 1fr;
  }
  .weekly-bar {
    gap: 4px;
  }
  .week-bar-track {
    height: 40px;
    width: 12px;
  }
}
</style>
