import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getHabits, createHabit, updateHabit, deleteHabit } from '@/api/habit'
import { ElMessage } from 'element-plus'

export const useHabitStore = defineStore('habit', () => {
  const habits = ref([])
  const loading = ref(false)

  async function fetchHabits() {
    loading.value = true
    try {
      const res = await getHabits()
      if (res.data) {
        habits.value = res.data
      } else if (Array.isArray(res)) {
        habits.value = res
      } else {
        habits.value = []
      }
    } catch (error) {
      console.error('获取习惯列表失败:', error)
      habits.value = []
    } finally {
      loading.value = false
    }
  }

  async function addHabit(data) {
    try {
      const res = await createHabit(data)
      ElMessage.success('创建习惯成功')
      await fetchHabits()
      return res
    } catch (error) {
      console.error('创建习惯失败:', error)
      throw error
    }
  }

  async function editHabit(id, data) {
    try {
      const res = await updateHabit(id, data)
      ElMessage.success('更新习惯成功')
      await fetchHabits()
      return res
    } catch (error) {
      console.error('更新习惯失败:', error)
      throw error
    }
  }

  async function removeHabit(id) {
    try {
      await deleteHabit(id)
      ElMessage.success('删除习惯成功')
      await fetchHabits()
    } catch (error) {
      console.error('删除习惯失败:', error)
      throw error
    }
  }

  return {
    habits,
    loading,
    fetchHabits,
    addHabit,
    editHabit,
    removeHabit
  }
})
