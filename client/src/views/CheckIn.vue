<template>
  <div class="checkin-page">
    <div class="page-header">
      <h2>每日打卡</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="currentMonth"
          type="month"
          placeholder="选择月份"
          :clearable="false"
          @change="handleMonthChange"
        />
      </div>
    </div>

    <el-card class="calendar-card" shadow="never">
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell" :class="{ 'is-today': data.isToday }">
            <span class="calendar-day">{{ data.day.split('-')[2]?.replace(/^0/, '') }}</span>
            <div v-if="checkinDates.includes(data.day)" class="checkin-dot" />
          </div>
        </template>
      </el-calendar>
    </el-card>

    <div class="stats-bar">
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ todayCheckedCount }}</div>
        <div class="stat-label">今日已打卡</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ habits.length }}</div>
        <div class="stat-label">习惯总数</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ currentStreakStats }}</div>
        <div class="stat-label">连续打卡</div>
      </el-card>
    </div>

    <div class="section-header">
      <h3>今日打卡</h3>
      <el-switch
        v-model="showUncheckedOnly"
        active-text="仅显示未打卡"
        inactive-text="显示全部"
      />
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <template v-else>
      <div v-if="filteredHabits.length === 0" class="empty-state">
        <el-empty description="暂无习惯，请先在习惯追踪中添加习惯" />
      </div>

      <div v-else class="habit-list">
        <el-card
          v-for="habit in filteredHabits"
          :key="habit.id"
          shadow="never"
          class="habit-card"
        >
          <div class="habit-info">
            <div class="habit-indicator" :style="{ backgroundColor: habit.color || '#409EFF' }" />
            <div class="habit-details">
              <div class="habit-name">{{ habit.name }}</div>
              <div class="habit-meta">
                <el-tag size="small" :color="categoryColor(habit.category)" class="category-tag">
                  {{ categoryLabel(habit.category) }}
                </el-tag>
                <span class="frequency-text">{{ frequencyLabel(habit.frequency) }}</span>
                <span class="streak-text">
                  <el-icon><Chicken /></el-icon>
                  {{ getStreak(habit.id) }}天连续
                </span>
              </div>
            </div>
          </div>
          <div class="habit-action">
            <template v-if="isCheckedInToday(habit.id)">
              <el-button
                type="success"
                :icon="Check"
                round
                disabled
                class="checked-btn"
              >
                已打卡
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="handleUndoCheckin(habit.id)"
                :loading="undoLoading[habit.id]"
              >
                撤销
              </el-button>
            </template>
            <el-button
              v-else
              type="primary"
              round
              :icon="Select"
              @click="handleCheckin(habit)"
              :loading="checkinLoading[habit.id]"
            >
              打卡
            </el-button>
          </div>
        </el-card>
      </div>
    </template>

    <el-dialog
      v-model="dialogVisible"
      title="打卡备注"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="dialog-habit-info">
        <span class="dialog-label">习惯：</span>
        <strong>{{ currentHabit?.name }}</strong>
      </div>
      <el-input
        v-model="checkinNote"
        type="textarea"
        :rows="3"
        placeholder="添加打卡备注（选填）"
        maxlength="255"
        show-word-limit
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCheckin" :loading="confirmLoading">
          确认打卡
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Select, Chicken } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { getHabits } from '@/api/habit'
import { createCheckin, getCheckins, deleteCheckin, getCheckinStats } from '@/api/checkin'
import { useHabitStore } from '@/stores/habit'

const habitStore = useHabitStore()

const today = dayjs().format('YYYY-MM-DD')
const currentMonth = ref(dayjs().toDate())
const calendarDate = ref(new Date())
const showUncheckedOnly = ref(false)
const loading = ref(false)
const checkinLoading = reactive({})
const undoLoading = reactive({})

const habits = ref([])
const todayCheckins = ref([])
const streakData = ref({})
const allCheckinDates = ref([])

const dialogVisible = ref(false)
const currentHabit = ref(null)
const checkinNote = ref('')
const confirmLoading = ref(false)

const checkedHabitIds = computed(() => {
  return new Set(todayCheckins.value.map(c => c.habit_id))
})

const todayCheckedCount = computed(() => {
  return todayCheckins.value.length
})

const currentStreakStats = computed(() => {
  const values = Object.values(streakData.value)
  if (values.length === 0) return 0
  return Math.max(...values)
})

const checkinDates = computed(() => {
  return allCheckinDates.value
})

const filteredHabits = computed(() => {
  if (showUncheckedOnly.value) {
    return habits.value.filter(h => !checkedHabitIds.value.has(h.id))
  }
  return habits.value
})

function categoryLabel(category) {
  const labels = { work: '工作', study: '学习', life: '生活', sports: '运动', other: '其他' }
  return labels[category] || '其他'
}

function categoryColor(category) {
  const colors = { work: '#409EFF', study: '#67C23A', life: '#E6A23C', sports: '#F56C6C', other: '#909399' }
  return colors[category] || '#409EFF'
}

function frequencyLabel(frequency) {
  const labels = { daily: '每天', weekly: '每周', monthly: '每月', custom: '自定义' }
  return labels[frequency] || '每天'
}

function isCheckedInToday(habitId) {
  return checkedHabitIds.value.has(habitId)
}

function getStreak(habitId) {
  return streakData.value[habitId] || 0
}

async function fetchHabits() {
  try {
    const res = await getHabits()
    if (Array.isArray(res.data)) {
      habits.value = res.data
    } else if (Array.isArray(res)) {
      habits.value = res
    } else {
      habits.value = []
    }
  } catch (error) {
    console.error('获取习惯列表失败:', error)
    habits.value = []
  }
}

async function fetchTodayCheckins() {
  try {
    const res = await getCheckins({
      startDate: today,
      endDate: today,
      page: 1,
      pageSize: 100
    })
    if (res.data && res.data.list) {
      todayCheckins.value = res.data.list
    } else if (Array.isArray(res.data)) {
      todayCheckins.value = res.data
    } else {
      todayCheckins.value = []
    }
  } catch (error) {
    console.error('获取今日打卡记录失败:', error)
    todayCheckins.value = []
  }
}

async function fetchCheckinDates(year, month) {
  const startDate = dayjs(new Date(year, month - 1, 1)).format('YYYY-MM-DD')
  const endDate = dayjs(new Date(year, month, 0)).format('YYYY-MM-DD')
  try {
    const res = await getCheckins({
      startDate,
      endDate,
      page: 1,
      pageSize: 200
    })
    let records = []
    if (res.data && res.data.list) {
      records = res.data.list
    } else if (Array.isArray(res.data)) {
      records = res.data
    }
    allCheckinDates.value = [...new Set(records.map(r => r.checkin_date))]
  } catch (error) {
    console.error('获取打卡日期失败:', error)
    allCheckinDates.value = []
  }
}

async function fetchStreakData() {
  try {
    const res = await getCheckinStats({ days: 365 })
    if (res.data && res.data.habits) {
      const data = {}
      res.data.habits.forEach(h => {
        data[h.habitId] = h.currentStreak || 0
      })
      streakData.value = data
    }
  } catch (error) {
    console.error('获取连续打卡数据失败:', error)
    streakData.value = {}
  }
}

async function loadAll() {
  loading.value = true
  await Promise.all([
    fetchHabits(),
    fetchTodayCheckins(),
    fetchStreakData()
  ])
  const now = dayjs()
  await fetchCheckinDates(now.year(), now.month() + 1)
  loading.value = false
}

function handleMonthChange(val) {
  const d = dayjs(val)
  calendarDate.value = d.toDate()
  fetchCheckinDates(d.year(), d.month() + 1)
}

function handleCheckin(habit) {
  currentHabit.value = habit
  checkinNote.value = ''
  dialogVisible.value = true
}

async function confirmCheckin() {
  if (!currentHabit.value) return
  const habitId = currentHabit.value.id
  confirmLoading.value = true
  checkinLoading[habitId] = true
  try {
    const res = await createCheckin({
      habitId,
      note: checkinNote.value || undefined,
      checkinDate: today
    })
    if (res.data) {
      todayCheckins.value.push(res.data)
    }
    allCheckinDates.value.push(today)
    ElMessage.success('打卡成功')
    dialogVisible.value = false
    await fetchStreakData()
  } catch (error) {
    console.error('打卡失败:', error)
  } finally {
    confirmLoading.value = false
    checkinLoading[habitId] = false
  }
}

async function handleUndoCheckin(habitId) {
  undoLoading[habitId] = true
  try {
    const record = todayCheckins.value.find(c => c.habit_id === habitId)
    if (!record) return
    await deleteCheckin(record.id)
    todayCheckins.value = todayCheckins.value.filter(c => c.id !== record.id)
    ElMessage.success('已撤销打卡')
    await fetchStreakData()
  } catch (error) {
    console.error('撤销打卡失败:', error)
  } finally {
    undoLoading[habitId] = false
  }
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
.checkin-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calendar-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  position: relative;
}

.calendar-cell.is-today .calendar-day {
  background-color: var(--el-color-primary);
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day {
  font-size: 13px;
  line-height: 1;
}

.checkin-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-color-success);
  margin-top: 3px;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  border-radius: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 40px 0;
}

.habit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.habit-card {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.habit-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.habit-indicator {
  width: 4px;
  height: 40px;
  border-radius: 2px;
  flex-shrink: 0;
}

.habit-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.habit-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.habit-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.category-tag {
  border: none !important;
}

.frequency-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.streak-text {
  font-size: 12px;
  color: var(--el-color-warning);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.habit-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.checked-btn {
  pointer-events: none;
}

.dialog-habit-info {
  margin-bottom: 16px;
  font-size: 14px;
}

.dialog-label {
  color: var(--el-text-color-secondary);
}

@media (max-width: 600px) {
  .stats-bar {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .habit-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .habit-action {
    align-self: flex-end;
  }
}
</style>
