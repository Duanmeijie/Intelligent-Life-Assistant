<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">日程管理</span></h1>
      <p>管理您的日常行程和重要事项</p>
    </div>

    <div class="glass-card filter-bar">
      <div class="filter-row">
        <el-select v-model="filters.category" placeholder="分类筛选" clearable size="large" style="width:160px">
          <el-option
            v-for="cat in categories"
            :key="cat.value"
            :label="cat.label"
            :value="cat.value"
          />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态筛选" clearable size="large" style="width:160px">
          <el-option label="待开始" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="large"
          style="width:280px"
        />
        <el-button type="primary" @click="fetchData" :icon="Search" size="large">查询</el-button>
        <div class="filter-spacer"></div>
        <el-button type="primary" @click="openCreate" :icon="Plus" size="large">
          添加日程
        </el-button>
      </div>
    </div>

    <div class="glass-card">
      <div v-if="loading" class="empty-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="schedules.length === 0" class="empty-state">
        <span style="font-size:48px">📅</span>
        <p>暂无日程，点击上方按钮开始添加</p>
      </div>

      <el-table v-else :data="schedules" style="width:100%" stripe>
        <el-table-column prop="title" label="标题" min-width="180">
          <template #default="{ row }">
            <span class="schedule-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag effect="plain" round size="small">{{ categoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="220">
          <template #default="{ row }">
            <div class="time-cell">
              <span>🕐 {{ formatTime(row.start_time) }}</span>
              <span class="time-sep">-</span>
              <span>{{ formatTime(row.end_time) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="statusType(row.status)"
              effect="dark"
              size="small"
              round
            >
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
            <el-dropdown @command="(cmd) => handleStatusChange(row.id, cmd)" trigger="click">
              <el-button size="small" text>状态 ▾</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pending">待开始</el-dropdown-item>
                  <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                  <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-popconfirm title="确定删除该日程吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button size="small" text type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑日程' : '添加日程'"
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
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入日程标题" size="large" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="日程详细描述（可选）"
          />
        </el-form-item>
        <el-row :gutter="16">
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
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" size="large" style="width:100%">
                <el-option label="待开始" value="pending" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker
                v-model="form.start_time"
                type="datetime"
                placeholder="选择开始时间"
                size="large"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker
                v-model="form.end_time"
                type="datetime"
                placeholder="选择结束时间"
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
          {{ isEditing ? '保存修改' : '创建日程' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Loading } from '@element-plus/icons-vue'
import { useScheduleStore } from '@/stores/schedule'
import dayjs from 'dayjs'

const scheduleStore = useScheduleStore()
const { schedules, total, loading, currentPage, pageSize, fetchSchedules, addSchedule, editSchedule, removeSchedule, changeScheduleStatus, setPage } = scheduleStore

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const categories = [
  { value: 'work', label: '💼 工作' },
  { value: 'study', label: '📚 学习' },
  { value: 'life', label: '🏠 生活' },
  { value: 'health', label: '💪 健康' },
  { value: 'social', label: '👥 社交' },
  { value: 'other', label: '📌 其他' },
]

const filters = reactive({
  category: '',
  status: '',
  dateRange: null
})

const defaultForm = {
  title: '',
  description: '',
  category: 'work',
  status: 'pending',
  start_time: null,
  end_time: null
}

const form = reactive({ ...defaultForm })

const rules = {
  title: [{ required: true, message: '请输入日程标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

function categoryLabel(cat) {
  return categories.find(c => c.value === cat)?.label || cat
}

function statusLabel(status) {
  const map = { pending: '待开始', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

function statusType(status) {
  const map = { pending: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

function formatTime(time) {
  if (!time) return ''
  return dayjs(time).format('MM-DD HH:mm')
}

function fetchData() {
  const params = {}
  if (filters.category) params.category = filters.category
  if (filters.status) params.status = filters.status
  if (filters.dateRange && filters.dateRange.length === 2) {
    params.startDate = dayjs(filters.dateRange[0]).format('YYYY-MM-DD')
    params.endDate = dayjs(filters.dateRange[1]).format('YYYY-MM-DD')
  }
  fetchSchedules(params)
}

function openCreate() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { ...defaultForm })
  dialogVisible.value = true
}

function openEdit(schedule) {
  isEditing.value = true
  editingId.value = schedule.id
  Object.assign(form, {
    title: schedule.title,
    description: schedule.description || '',
    category: schedule.category || 'work',
    status: schedule.status || 'pending',
    start_time: schedule.start_time ? new Date(schedule.start_time) : null,
    end_time: schedule.end_time ? new Date(schedule.end_time) : null
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = {
      title: form.title,
      description: form.description,
      category: form.category,
      status: form.status,
      start_time: form.start_time,
      end_time: form.end_time
    }
    if (isEditing.value) {
      await editSchedule(editingId.value, data)
    } else {
      await addSchedule(data)
    }
    dialogVisible.value = false
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(id, status) {
  try {
    await changeScheduleStatus(id, status)
  } catch (err) {
    console.error(err)
  }
}

async function handleDelete(id) {
  try {
    await removeSchedule(id)
  } catch (err) {
    console.error(err)
  }
}

function handlePageChange(page) {
  setPage(page)
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.filter-bar {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-spacer {
  flex: 1;
}

.schedule-title {
  font-weight: 600;
  color: var(--text-primary);
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.time-sep {
  color: var(--text-tertiary);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
