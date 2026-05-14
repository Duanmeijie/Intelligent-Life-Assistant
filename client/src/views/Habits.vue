<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">习惯追踪</span></h1>
      <p>培养好习惯，记录每一次坚持</p>
    </div>

    <div class="stats-row">
      <div class="stat-card primary">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <span class="stat-value">{{ habits.length }}</span>
          <span class="stat-label">全部习惯</span>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">进行中</span>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">🔥</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalStreak }}</span>
          <span class="stat-label">总连续天数</span>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <span class="stat-value">{{ completionRate }}%</span>
          <span class="stat-label">完成率</span>
        </div>
      </div>
    </div>

    <div class="glass-card">
      <div class="card-header">
        <h3>我的习惯</h3>
        <el-button type="primary" @click="openCreate" :icon="Plus" size="large">
          添加习惯
        </el-button>
      </div>

      <div v-if="loading" class="empty-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="habits.length === 0" class="empty-state">
        <span style="font-size:48px">🌱</span>
        <p>还没有习惯，点击上方按钮开始添加吧</p>
      </div>

      <div v-else class="habits-grid">
        <div
          v-for="habit in habits"
          :key="habit.id"
          class="habit-card"
          :class="{ inactive: !habit.is_active }"
        >
          <div class="habit-top">
            <div class="habit-icon" :style="{ background: habit.color || '#6366f1' }">
              {{ getCategoryEmoji(habit.category) }}
            </div>
            <div class="habit-top-right">
              <span v-if="habit.current_streak > 0" class="streak-badge">
                🔥 {{ habit.current_streak }}天
              </span>
              <el-switch v-model="habit.is_active" @change="toggleActive(habit)" />
            </div>
          </div>
          <div class="habit-body">
            <h4>{{ habit.name }}</h4>
            <p v-if="habit.description">{{ habit.description }}</p>
          </div>
          <div class="habit-completion-bar" v-if="habit.completion_rate !== undefined">
            <div class="completion-track">
              <div
                class="completion-fill"
                :style="{ width: Math.min(habit.completion_rate, 100) + '%' }"
              ></div>
            </div>
            <span class="completion-label">{{ Math.round(habit.completion_rate) }}%</span>
          </div>
          <div class="habit-meta">
            <el-tag size="small" effect="plain" round>{{ categoryLabel(habit.category) }}</el-tag>
            <el-tag size="small" effect="plain" round>{{ freqLabel(habit.frequency) }}</el-tag>
            <span v-if="habit.reminder_time" class="reminder">
              🔔 {{ habit.reminder_time }}
            </span>
          </div>
          <div class="habit-actions">
            <el-button size="small" text @click="openEdit(habit)">编辑</el-button>
            <el-popconfirm title="确定删除该习惯吗？" @confirm="handleDelete(habit.id)">
              <template #reference>
                <el-button size="small" text type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card" v-if="recentCheckins.length > 0">
      <div class="card-header">
        <h3>⏱ 最近打卡记录</h3>
      </div>
      <div class="recent-checkins">
        <div v-for="(item, idx) in recentCheckins.slice(0, 10)" :key="idx" class="recent-item">
          <span class="recent-date">{{ dayjs(item.checkin_date).format('MM/DD') }}</span>
          <span class="recent-dot" :style="{ background: getHabitColor(item.habit_id) }"></span>
          <span class="recent-habit">{{ getHabitName(item.habit_id) }}</span>
          <span v-if="item.note" class="recent-note">{{ item.note }}</span>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑习惯' : '添加习惯'"
      width="520px"
      destroy-on-close
      class="modern-dialog"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        label-position="top"
      >
        <el-form-item label="习惯名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入习惯名称" size="large" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="简单描述一下这个习惯"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="频率" prop="frequency">
              <el-select v-model="form.frequency" size="large" style="width:100%">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" size="large" style="width:100%">
                <el-option
                  v-for="cat in categories"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="颜色标识">
              <el-color-picker v-model="form.color" size="large" show-alpha />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提醒时间">
              <el-time-picker
                v-model="form.reminder_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择时间"
                size="large"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false" size="large">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
          {{ isEditing ? '保存修改' : '创建习惯' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { Plus, Loading } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useHabitStore } from '@/stores/habit'
import { getCheckins } from '@/api/checkin'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const habitStore = useHabitStore()
const { habits, loading } = storeToRefs(habitStore)
const { fetchHabits, addHabit, editHabit, removeHabit } = habitStore

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)
const recentCheckins = ref([])

const categories = [
  { value: 'health', label: '💪 健康' },
  { value: 'study', label: '📚 学习' },
  { value: 'work', label: '💼 工作' },
  { value: 'life', label: '🏠 生活' },
  { value: 'sports', label: '⚽ 运动' },
  { value: 'reading', label: '📖 阅读' },
  { value: 'meditation', label: '🧘 冥想' },
  { value: 'social', label: '👥 社交' },
]

const defaultForm = {
  name: '',
  description: '',
  frequency: 'daily',
  category: 'health',
  color: '#6366f1',
  reminder_time: null,
  is_active: true
}

const form = reactive({ ...defaultForm })

const rules = {
  name: [{ required: true, message: '请输入习惯名称', trigger: 'blur' }],
  frequency: [{ required: true, message: '请选择频率', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

function getCategoryEmoji(category) {
  const map = {
    health: '💪', study: '📚', work: '💼', life: '🏠',
    sports: '⚽', reading: '📖', meditation: '🧘', social: '👥'
  }
  return map[category] || '⭐'
}

function categoryLabel(cat) {
  return categories.find(c => c.value === cat)?.label || cat
}

function freqLabel(freq) {
  const map = { daily: '每天', weekly: '每周', monthly: '每月' }
  return map[freq] || freq
}

const activeCount = computed(() => habits.value.filter(h => h.is_active).length)
const totalStreak = computed(() => habits.value.reduce((s, h) => s + (h.current_streak || 0), 0))
const completionRate = computed(() => {
  if (habits.value.length === 0) return 0
  const valid = habits.value.filter(h => h.completion_rate !== undefined)
  if (valid.length === 0) return 0
  return Math.round(valid.reduce((s, h) => s + (h.completion_rate || 0), 0) / valid.length)
})

function openCreate() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { ...defaultForm })
  dialogVisible.value = true
}

function openEdit(habit) {
  isEditing.value = true
  editingId.value = habit.id
  Object.assign(form, {
    name: habit.name,
    description: habit.description || '',
    frequency: habit.frequency || 'daily',
    category: habit.category || 'health',
    color: habit.color || '#6366f1',
    reminder_time: habit.reminder_time || null,
    is_active: habit.is_active
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = {
      name: form.name,
      description: form.description,
      frequency: form.frequency,
      category: form.category,
      color: form.color,
      reminder_time: form.reminder_time || null,
      is_active: form.is_active
    }
    if (isEditing.value) {
      await editHabit(editingId.value, data)
    } else {
      await addHabit(data)
    }
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

async function toggleActive(habit) {
  try {
    await editHabit(habit.id, { is_active: habit.is_active })
  } catch {
    habit.is_active = !habit.is_active
  }
}

async function handleDelete(id) {
  try {
    await removeHabit(id)
  } catch (err) {
    console.error(err)
  }
}

function getHabitColor(habitId) {
  const found = habits.value.find(h => h.id === habitId)
  return found?.color || '#6366f1'
}

function getHabitName(habitId) {
  const found = habits.value.find(h => h.id === habitId)
  return found?.name || '未知习惯'
}

async function fetchRecentCheckins() {
  try {
    const res = await getCheckins({
      startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD')
    })
    const data = res.data || res || []
    recentCheckins.value = Array.isArray(data) ? data : []
  } catch {
    recentCheckins.value = []
  }
}

onMounted(() => {
  fetchHabits()
  fetchRecentCheckins()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.habits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.habit-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.habit-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.habit-card.inactive {
  opacity: 0.55;
}

.habit-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.habit-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
}

.habit-body h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.habit-body p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.habit-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.reminder {
  font-size: 12px;
  color: var(--text-tertiary);
}

.habit-actions {
  display: flex;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.habit-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.streak-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--warning);
  white-space: nowrap;
}

.habit-completion-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.completion-track {
  flex: 1;
  height: 6px;
  background: var(--bg-base);
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.completion-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  min-width: 32px;
  text-align: right;
}

.recent-checkins {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  font-size: 13px;
}

.recent-item:hover {
  background: var(--bg-secondary);
}

.recent-date {
  color: var(--text-tertiary);
  font-size: 12px;
  min-width: 48px;
  font-variant-numeric: tabular-nums;
}

.recent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.recent-habit {
  color: var(--text-primary);
  font-weight: 500;
}

.recent-note {
  color: var(--text-tertiary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .habits-grid {
    grid-template-columns: 1fr;
  }
}
</style>
