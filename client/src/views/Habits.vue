<template>
  <div class="habits-container">
    <div class="page-header">
      <h1 class="page-title">习惯追踪</h1>
      <p class="page-desc">培养好习惯，记录每一次坚持</p>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card-sm">
          <div class="stat-body">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-lbl">习惯总数</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card-sm">
          <div class="stat-body">
            <span class="stat-num">{{ activeCount }}</span>
            <span class="stat-lbl">活跃习惯</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" style="text-align: right;">
        <el-button type="primary" size="large" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          添加习惯
        </el-button>
      </el-col>
    </el-row>

    <div v-loading="habitStore.loading" class="habit-grid">
      <div v-if="habitStore.habits.length === 0 && !habitStore.loading" class="empty-state">
        <el-icon :size="64" color="#c0c4cc"><Check /></el-icon>
        <h3>还没有习惯</h3>
        <p>开始创建您的第一个习惯吧</p>
        <el-button type="primary" @click="openCreateDialog">创建习惯</el-button>
      </div>

      <el-row v-else :gutter="20">
        <el-col
          v-for="habit in habitStore.habits"
          :key="habit.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card shadow="hover" class="habit-card" :body-style="{ padding: '0' }">
            <div class="habit-card-header" :style="{ borderLeftColor: habit.color || '#409eff' }">
              <div class="habit-card-top">
                <div class="habit-color-dot" :style="{ background: habit.color || '#409eff' }" />
                <el-switch
                  v-model="habit.active"
                  :loading="toggleLoadingMap[habit.id]"
                  size="small"
                  @change="(val) => handleToggleActive(habit, val)"
                />
              </div>
              <h3 class="habit-card-title">{{ habit.name }}</h3>
              <p v-if="habit.description" class="habit-card-desc">{{ habit.description }}</p>
            </div>
            <div class="habit-card-body">
              <div class="habit-meta">
                <el-tag size="small" effect="plain" type="primary">
                  {{ frequencyLabel(habit.frequency) }}
                </el-tag>
                <el-tag
                  v-if="habit.category"
                  size="small"
                  effect="plain"
                  :type="categoryTagType(habit.category)"
                >
                  {{ habit.category }}
                </el-tag>
                <el-tag v-if="habit.reminderTime" size="small" effect="plain" type="info">
                  <el-icon style="vertical-align: middle; margin-right: 2px;"><Clock /></el-icon>
                  {{ habit.reminderTime }}
                </el-tag>
              </div>
            </div>
            <div class="habit-card-actions">
              <el-button text type="primary" size="small" @click="openEditDialog(habit)">编辑</el-button>
              <el-button text type="danger" size="small" @click="handleDelete(habit)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑习惯' : '添加习惯'"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="90px"
        label-position="top"
      >
        <el-form-item label="习惯名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入习惯名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入习惯描述（可选）"
            maxlength="200"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="频率" prop="frequency">
              <el-radio-group v-model="form.frequency">
                <el-radio-button value="daily">每日</el-radio-button>
                <el-radio-button value="weekly">每周</el-radio-button>
                <el-radio-button value="monthly">每月</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" clearable style="width: 100%">
                <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标识颜色" prop="color">
              <el-color-picker v-model="form.color" show-alpha :predefine="predefineColors" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提醒时间" prop="reminderTime">
              <el-time-picker
                v-model="form.reminderTime"
                placeholder="选择提醒时间"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否启用" prop="active">
          <el-switch v-model="form.active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useHabitStore } from '@/stores/habit'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Clock } from '@element-plus/icons-vue'

const habitStore = useHabitStore()

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)
const toggleLoadingMap = reactive({})

const categoryOptions = ['健康', '学习', '工作', '生活', '运动', '阅读', '冥想', '社交']

const predefineColors = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#9b59b6',
  '#1abc9c',
  '#e74c3c',
  '#3498db',
  '#f39c12'
]

const defaultForm = {
  name: '',
  description: '',
  frequency: 'daily',
  category: '',
  color: '#409eff',
  reminderTime: '',
  active: true
}

const form = reactive({ ...defaultForm })

const formRules = {
  name: [
    { required: true, message: '请输入习惯名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度不能超过 50 个字符', trigger: 'blur' }
  ],
  frequency: [
    { required: true, message: '请选择频率', trigger: 'change' }
  ]
}

const totalCount = computed(() => habitStore.habits.length)
const activeCount = computed(() => habitStore.habits.filter(h => h.active !== false).length)

function frequencyLabel(frequency) {
  const map = {
    'daily': '每日',
    'weekly': '每周',
    'monthly': '每月',
    'custom': '自定义'
  }
  return map[frequency] || frequency || '每日'
}

function categoryTagType(category) {
  const map = {
    '健康': 'success',
    '学习': 'primary',
    '工作': 'warning',
    '生活': '',
    '运动': 'danger',
    '阅读': 'info',
    '冥想': 'info',
    '社交': ''
  }
  return map[category] || ''
}

function resetForm() {
  Object.assign(form, defaultForm)
}

function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(habit) {
  isEditing.value = true
  editingId.value = habit.id
  form.name = habit.name
  form.description = habit.description || ''
  form.frequency = habit.frequency || 'daily'
  form.category = habit.category || ''
  form.color = habit.color || '#409eff'
  form.reminderTime = habit.reminderTime || ''
  form.active = habit.active !== false
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const data = { ...form }
    if (isEditing.value) {
      await habitStore.editHabit(editingId.value, data)
    } else {
      await habitStore.addHabit(data)
    }
    dialogVisible.value = false
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    submitLoading.value = false
  }
}

async function handleToggleActive(habit, val) {
  toggleLoadingMap[habit.id] = true
  try {
    await habitStore.editHabit(habit.id, { active: val })
    ElMessage.success(val ? '习惯已启用' : '习惯已停用')
  } catch (error) {
    habit.active = !val
    const msg = error?.response?.data?.message || error.message || '更新状态失败'
    ElMessage.error(msg)
  } finally {
    toggleLoadingMap[habit.id] = false
  }
}

async function handleDelete(habit) {
  try {
    await ElMessageBox.confirm(
      `确定要删除习惯「${habit.name}」吗？相关的打卡记录也将被删除。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await habitStore.removeHabit(habit.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error === 'cancel') return
    const msg = error?.response?.data?.message || error.message || '删除失败'
    ElMessage.error(msg)
  }
}

onMounted(() => {
  habitStore.fetchHabits()
})
</script>

<style scoped>
.habits-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.stat-row {
  margin-bottom: 24px;
  align-items: center;
}

.stat-card-sm {
  border-radius: 12px;
  margin-bottom: 20px;
}

.stat-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.stat-lbl {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.habit-grid {
  min-height: 200px;
}

.habit-card {
  border-radius: 12px;
  margin-bottom: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.habit-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.habit-card-header {
  padding: 20px 20px 16px;
  border-left: 4px solid #409eff;
}

.habit-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.habit-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.habit-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.habit-card-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.habit-card-body {
  padding: 0 20px 16px;
}

.habit-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.habit-card-actions {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-color-primary-light-9);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

.empty-state h3 {
  font-size: 18px;
  color: var(--el-text-color-primary);
  margin-top: 8px;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 8px;
}
</style>
