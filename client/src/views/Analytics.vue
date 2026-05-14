<template>
  <div class="analytics-container">
    <div class="page-header">
      <h1 class="page-title">数据分析</h1>
      <p class="page-desc">全面了解您的习惯、打卡和日程数据</p>
    </div>

    <div class="toolbar">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="handleDateRangeChange"
      />
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="analytics-tabs">
      <el-tab-pane label="习惯统计" name="habits">
        <div v-loading="habitsLoading" class="tab-content">
          <el-row :gutter="24">
            <el-col :xs="24" :lg="14">
              <h3 class="chart-title">习惯完成率（近30天）</h3>
              <div ref="barChartRef" class="chart-container" />
            </el-col>
            <el-col :xs="24" :lg="10">
              <h3 class="chart-title">分类分布</h3>
              <div ref="pieChartRef" class="chart-container" />
            </el-col>
          </el-row>
          <div v-if="!habitsLoading && habitBarData.length === 0" class="empty-state">
            <p>暂无习惯数据</p>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="打卡热力图" name="heatmap">
        <div v-loading="heatmapLoading" class="tab-content">
          <div class="heatmap-header">
            <h3 class="chart-title">{{ heatmapYear }} 年打卡记录</h3>
          </div>
          <CalendarHeatmap :data="heatmapData" :year="heatmapYear" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="日程统计" name="schedules">
        <div v-loading="scheduleLoading" class="tab-content">
          <el-row :gutter="24">
            <el-col :xs="24" :lg="10">
              <h3 class="chart-title">日程分类分布</h3>
              <div ref="schedulePieRef" class="chart-container" />
            </el-col>
            <el-col :xs="24" :lg="14">
              <h3 class="chart-title">每周日程数量</h3>
              <div ref="scheduleBarRef" class="chart-container" />
            </el-col>
          </el-row>
          <div v-if="!scheduleLoading && schedulePieData.length === 0" class="empty-state">
            <p>暂无日程数据</p>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="效率分析" name="analysis">
        <div v-loading="analysisLoading" class="tab-content">
          <div v-if="analysisReport" class="analysis-card">
            <div class="analysis-header">
              <el-icon :size="28" color="#409eff"><DataAnalysis /></el-icon>
              <h3>AI 效率分析报告</h3>
            </div>
            <el-divider />
            <div class="analysis-body">
              <div v-for="(section, index) in parsedSections" :key="index" class="analysis-section">
                <h4 v-if="section.title" class="section-title">{{ section.title }}</h4>
                <p class="section-content">{{ section.content }}</p>
              </div>
              <p v-if="!parsedSections.length" class="analysis-raw">{{ analysisReport }}</p>
            </div>
            <div class="analysis-footer">
              <span class="analysis-date">报告生成时间：{{ analysisGeneratedAt }}</span>
            </div>
          </div>
          <div v-else-if="!analysisLoading" class="empty-state">
            <el-icon :size="48" color="#c0c4cc"><DataAnalysis /></el-icon>
            <p>暂无分析报告，请积累更多数据后再来查看</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { DataAnalysis } from '@element-plus/icons-vue'
import { getCheckinStats, getCheckins } from '@/api/checkin'
import { getHabits } from '@/api/habit'
import { getSchedules } from '@/api/schedule'
import { getAnalysis } from '@/api/ai'
import CalendarHeatmap from '@/components/CalendarHeatmap.vue'

const activeTab = ref('habits')
const dateRange = ref([
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
])

const habitsLoading = ref(false)
const heatmapLoading = ref(false)
const scheduleLoading = ref(false)
const analysisLoading = ref(false)

const habitBarData = ref([])
const habitPieData = ref([])
const heatmapData = ref([])
const heatmapYear = ref(dayjs().year())
const schedulePieData = ref([])
const scheduleBarData = ref([])
const analysisReport = ref('')
const analysisGeneratedAt = ref('')

const barChartRef = ref(null)
const pieChartRef = ref(null)
const schedulePieRef = ref(null)
const scheduleBarRef = ref(null)

let barChartInstance = null
let pieChartInstance = null
let schedulePieInstance = null
let scheduleBarInstance = null

const categoryColorMap = {
  '健康': '#67c23a',
  '学习': '#409eff',
  '工作': '#e6a23c',
  '生活': '#909399',
  '运动': '#f56c6c',
  '阅读': '#9b59b6',
  '冥想': '#1abc9c',
  '社交': '#3498db',
  '娱乐': '#f39c12',
  '其他': '#b0b0b0'
}

const parsedSections = computed(() => {
  if (!analysisReport.value) return []
  const lines = analysisReport.value.split('\n').filter(l => l.trim())
  const sections = []
  let currentTitle = ''
  let currentContent = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[#*]{1,3}\s/.test(trimmed) || /^[一二三四五六七八九十、]+/.test(trimmed)) {
      if (currentTitle || currentContent.length) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n')
        })
      }
      currentTitle = trimmed.replace(/^[#*]{1,3}\s*/, '').replace(/^[一二三四五六七八九十、]+/, '')
      currentContent = []
    } else {
      currentContent.push(trimmed)
    }
  }
  if (currentTitle || currentContent.length) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n')
    })
  }
  return sections
})

function getCategoryColor(category) {
  return categoryColorMap[category] || '#409eff'
}

function initBarChart() {
  if (!barChartRef.value) return
  if (barChartInstance) barChartInstance.dispose()
  barChartInstance = echarts.init(barChartRef.value)

  const names = habitBarData.value.map(d => d.name)
  const values = habitBarData.value.map(d => d.completionRate)

  barChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `${p.name}<br/>完成率：${p.value}%`
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: { type: 'dashed', color: '#eee' }
      }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#79bbff' }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: 20,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 12,
          fontWeight: 600
        }
      }
    ]
  })
}

function initPieChart() {
  if (!pieChartRef.value) return
  if (pieChartInstance) pieChartInstance.dispose()
  pieChartInstance = echarts.init(pieChartRef.value)

  pieChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}：{c} 个 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: habitPieData.value.map(d => ({
          name: d.name,
          value: d.count,
          itemStyle: { color: getCategoryColor(d.name) }
        }))
      }
    ]
  })
}

function initSchedulePie() {
  if (!schedulePieRef.value) return
  if (schedulePieInstance) schedulePieInstance.dispose()
  schedulePieInstance = echarts.init(schedulePieRef.value)

  schedulePieInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}：{c} 项 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: schedulePieData.value.map(d => ({
          name: d.name,
          value: d.count,
          itemStyle: { color: getCategoryColor(d.name) }
        }))
      }
    ]
  })
}

function initScheduleBar() {
  if (!scheduleBarRef.value) return
  if (scheduleBarInstance) scheduleBarInstance.dispose()
  scheduleBarInstance = echarts.init(scheduleBarRef.value)

  const weeks = scheduleBarData.value.map(d => d.week)
  const counts = scheduleBarData.value.map(d => d.count)

  scheduleBarInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLabel: { fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: {
        lineStyle: { type: 'dashed', color: '#eee' }
      }
    },
    series: [
      {
        type: 'bar',
        data: counts.map(v => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67c23a' },
              { offset: 1, color: '#95d475' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: 24,
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 600
        }
      }
    ]
  })
}

function handleResize() {
  barChartInstance?.resize()
  pieChartInstance?.resize()
  schedulePieInstance?.resize()
  scheduleBarInstance?.resize()
}

function getDefaultDateRange() {
  return [
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]
}

async function fetchHabitStats() {
  habitsLoading.value = true
  try {
    const [days, end] = dateRange.value || getDefaultDateRange()
    const startDate = days
    const endDate = end

    const statsRes = await getCheckinStats({ startDate, endDate })
    const stats = statsRes?.data || statsRes || {}

    const habitsRes = await getHabits()
    const habitsList = habitsRes?.data || (Array.isArray(habitsRes) ? habitsRes : [])

    if (Array.isArray(habitsList)) {
      const categoryMap = {}
      habitsList.forEach(h => {
        const cat = h.category || '其他'
        if (!categoryMap[cat]) categoryMap[cat] = 0
        categoryMap[cat]++
      })

      habitPieData.value = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count
      }))

      const completionMap = stats?.completionRates || stats?.habitStats || {}
      habitBarData.value = habitsList.map(h => ({
        name: h.name,
        completionRate: Math.round(completionMap[h.id] || completionMap[h.name] || 0)
      }))
    }

    await nextTick()
    initBarChart()
    initPieChart()
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '获取习惯统计失败'
    ElMessage.error(msg)
    habitBarData.value = []
    habitPieData.value = []
  } finally {
    habitsLoading.value = false
  }
}

async function fetchHeatmapData() {
  heatmapLoading.value = true
  try {
    const year = heatmapYear.value
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const res = await getCheckins({ startDate, endDate, pageSize: 1000 })
    const list = res?.data?.rows || res?.rows || res?.data || (Array.isArray(res) ? res : [])

    const dateCountMap = {}
    if (Array.isArray(list)) {
      list.forEach(item => {
        const date = item.date || dayjs(item.createdAt).format('YYYY-MM-DD')
        if (date) {
          dateCountMap[date] = (dateCountMap[date] || 0) + 1
        }
      })
    }

    heatmapData.value = Object.entries(dateCountMap).map(([date, count]) => ({
      date,
      count
    }))
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '获取打卡数据失败'
    ElMessage.error(msg)
    heatmapData.value = []
  } finally {
    heatmapLoading.value = false
  }
}

async function fetchScheduleStats() {
  scheduleLoading.value = true
  try {
    const [startDate, endDate] = dateRange.value || getDefaultDateRange()
    const res = await getSchedules({ startDate, endDate, pageSize: 1000 })
    const list = res?.data?.rows || res?.rows || res?.data || (Array.isArray(res) ? res : [])

    if (Array.isArray(list)) {
      const categoryMap = {}
      const weekMap = {}

      list.forEach(item => {
        const cat = item.category || '其他'
        categoryMap[cat] = (categoryMap[cat] || 0) + 1

        const date = item.date || dayjs(item.startTime).format('YYYY-MM-DD')
        if (date) {
          const weekStr = dayjs(date).format('YYYY年第WW周')
          weekMap[weekStr] = (weekMap[weekStr] || 0) + 1
        }
      })

      schedulePieData.value = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count
      }))

      const sortedWeeks = Object.keys(weekMap).sort()
      scheduleBarData.value = sortedWeeks.map(week => ({
        week,
        count: weekMap[week]
      }))
    }

    await nextTick()
    initSchedulePie()
    initScheduleBar()
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '获取日程统计失败'
    ElMessage.error(msg)
    schedulePieData.value = []
    scheduleBarData.value = []
  } finally {
    scheduleLoading.value = false
  }
}

async function fetchAnalysis() {
  analysisLoading.value = true
  try {
    const [startDate, endDate] = dateRange.value || getDefaultDateRange()
    const res = await getAnalysis({ startDate, endDate })
    const data = res?.data || res
    analysisReport.value = data?.report || data?.analysis || data?.text || ''
    analysisGeneratedAt.value = data?.generatedAt || dayjs().format('YYYY-MM-DD HH:mm')
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '获取分析报告失败'
    ElMessage.error(msg)
    analysisReport.value = ''
  } finally {
    analysisLoading.value = false
  }
}

function handleDateRangeChange() {
  switch (activeTab.value) {
    case 'habits':
      fetchHabitStats()
      break
    case 'schedules':
      fetchScheduleStats()
      break
    case 'analysis':
      fetchAnalysis()
      break
  }
}

watch(activeTab, (tab) => {
  switch (tab) {
    case 'habits':
      if (habitBarData.value.length === 0) fetchHabitStats()
      break
    case 'heatmap':
      if (heatmapData.value.length === 0) fetchHeatmapData()
      break
    case 'schedules':
      if (schedulePieData.value.length === 0) fetchScheduleStats()
      break
    case 'analysis':
      if (!analysisReport.value) fetchAnalysis()
      break
  }
})

onMounted(() => {
  fetchHabitStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  barChartInstance?.dispose()
  pieChartInstance?.dispose()
  schedulePieInstance?.dispose()
  scheduleBarInstance?.dispose()
})
</script>

<style scoped>
.analytics-container {
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

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.analytics-tabs {
  border-radius: 12px;
  min-height: 400px;
}

.tab-content {
  min-height: 350px;
  padding: 8px 0;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 350px;
  margin-bottom: 24px;
}

.heatmap-header {
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.analysis-card {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: 12px;
  padding: 28px;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.analysis-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.analysis-body {
  padding: 8px 0;
}

.analysis-section {
  margin-bottom: 20px;
}

.analysis-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.section-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

.analysis-raw {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

.analysis-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.analysis-date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
