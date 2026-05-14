import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  updateScheduleStatus
} from '@/api/schedule'
import { ElMessage } from 'element-plus'

export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref([])
  const total = ref(0)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)

  async function fetchSchedules(params = {}) {
    loading.value = true
    try {
      const queryParams = {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...params
      }
      const res = await getSchedules(queryParams)
      if (res.data) {
        schedules.value = res.data.rows || res.data.list || res.data
        total.value = res.data.total || res.data.count || 0
      } else if (res.rows) {
        schedules.value = res.rows
        total.value = res.total || 0
      } else if (Array.isArray(res)) {
        schedules.value = res
        total.value = res.length
      }
    } catch (error) {
      console.error('获取日程列表失败:', error)
      schedules.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function addSchedule(data) {
    try {
      const res = await createSchedule(data)
      ElMessage.success('创建日程成功')
      await fetchSchedules()
      return res
    } catch (error) {
      console.error('创建日程失败:', error)
      throw error
    }
  }

  async function editSchedule(id, data) {
    try {
      const res = await updateSchedule(id, data)
      ElMessage.success('更新日程成功')
      await fetchSchedules()
      return res
    } catch (error) {
      console.error('更新日程失败:', error)
      throw error
    }
  }

  async function removeSchedule(id) {
    try {
      await deleteSchedule(id)
      ElMessage.success('删除日程成功')
      await fetchSchedules()
    } catch (error) {
      console.error('删除日程失败:', error)
      throw error
    }
  }

  async function changeScheduleStatus(id, status) {
    try {
      const res = await updateScheduleStatus(id, status)
      ElMessage.success('更新状态成功')
      await fetchSchedules()
      return res
    } catch (error) {
      console.error('更新状态失败:', error)
      throw error
    }
  }

  function setPage(page) {
    currentPage.value = page
  }

  function setPageSize(size) {
    pageSize.value = size
  }

  return {
    schedules,
    total,
    loading,
    currentPage,
    pageSize,
    fetchSchedules,
    addSchedule,
    editSchedule,
    removeSchedule,
    changeScheduleStatus,
    setPage,
    setPageSize
  }
})
