<template>
  <div class="schedule-container">
    <div class="page-header">
      <h1 class="page-title">日程管理</h1>
      <p class="page-desc">管理您的日常行程和重要事项</p>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="6" :md="5">
          <el-select
            v-model="filters.category"
            placeholder="分类筛选"
            clearable
            class="filter-item"
            @change="handleFilterChange"
          >
            <el-option label="全部分类" value="" />
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="6" :md="5">
          <el-select
            v-model="filters.status"
            placeholder="状态筛选"
            clearable
            class="filter-item"
            @change="handleFilterChange"
          >
            <el-option label="全部状态" value="" />
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8" :md="7">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="filter-item"
            @change="handleFilterChange"
          />
        </el-col>
        <el-col :xs="12" :sm="4" :md="4" style="text-align: right;">
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新建日程
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        :data="scheduleStore.schedules"
        v-loading="scheduleStore.loading"
        stripe
        style="width: 100%"
        empty-text="暂无日程数据"
      >
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(row.category)" size="small" effect="plain">
              {{ row.category || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ row.status || '待开始' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleStatusChange(row, cmd)">
              <el-button text type="warning" size="small">
                状态 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="待开始">待开始</el-dropdown-item>
                  <el-dropdown-item command="进行中">进行中</el-dropdown-item>
                  <el-dropdown-item command="已完成">已完成</el-dropdown-item>
                  <el-dropdown-item command="已取消">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="scheduleStore.currentPage"
          v-model:page-size="scheduleStore.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="scheduleStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑日程' : '新建日程'"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
        label-position="top"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入日程标题" maxlength="100" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入日程描述（可选）"
            maxlength="500"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" clearable style="width: 100%">
                <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
                <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const scheduleStore = useScheduleStore()

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const submitLoading = ref(false)

const categoryOptions = ['工作', '学习', '生活', '运动', '社交', '娱乐']
const statusOptions = ['待开始', '进行中', '已完成', '已取消']

const filters = reactive({
  category: '',
  status: '',
  dateRange: null
})

const defaultForm = {
  title: '',
  description: '',
  category: '',
  status: '待开始',
  startTime: '',
  endTime: ''
}

const form = reactive({ ...defaultForm })

const formRules = {
  title: [
    { required: true, message: '请输入日程标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度不能超过 100 个字符', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
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

function formatDateTime(time) {
  if (!time) return '--'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function buildParams() {
  const params = {}
  if (filters.category) params.category = filters.category
  if (filters.status) params.status = filters.status
  if (filters.dateRange && filters.dateRange.length === 2) {
    params.startDate = filters.dateRange[0]
    params.endDate = filters.dateRange[1]
  }
  return params
}

async function fetchData() {
  const params = buildParams()
  await scheduleStore.fetchSchedules(params)
}

function handleFilterChange() {
  scheduleStore.setPage(1)
  fetchData()
}

function handlePageChange(page) {
  scheduleStore.setPage(page)
  fetchData()
}

function handleSizeChange(size) {
  scheduleStore.setPageSize(size)
  scheduleStore.setPage(1)
  fetchData()
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

function openEditDialog(row) {
  isEditing.value = true
  editingId.value = row.id
  form.title = row.title
  form.description = row.description || ''
  form.category = row.category || ''
  form.status = row.status || '待开始'
  form.startTime = row.startTime || ''
  form.endTime = row.endTime || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (isEditing.value) {
      await scheduleStore.editSchedule(editingId.value, { ...form })
    } else {
      await scheduleStore.addSchedule({ ...form })
    }
    dialogVisible.value = false
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    submitLoading.value = false
  }
}

async function handleStatusChange(row, newStatus) {
  if (row.status === newStatus) return
  try {
    await scheduleStore.changeScheduleStatus(row.id, newStatus)
    ElMessage.success('状态已更新')
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '更新状态失败'
    ElMessage.error(msg)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除日程「${row.title}」吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await scheduleStore.removeSchedule(row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error === 'cancel') return
    const msg = error?.response?.data?.message || error.message || '删除失败'
    ElMessage.error(msg)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.schedule-container {
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

.filter-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.filter-item {
  width: 100%;
  margin-bottom: 8px;
}

.table-card {
  border-radius: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 0;
}
</style>
