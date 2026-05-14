<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">数据分析</span></h1>
      <p>全面了解您的习惯、打卡和日程数据</p>
    </div>

    <div class="glass-card date-filter">
      <span class="filter-label">时间范围：</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        size="default"
        @change="handleDateChange"
      />
    </div>

    <div class="glass-card">
      <el-tabs v-model="activeTab" type="card" class="analytics-tabs">
        <el-tab-pane label="📊 习惯统计" name="habits">
          <div class="charts-grid">
            <div class="chart-card">
              <h4>习惯完成率（近30天）</h4>
              <div ref="habitBarChart" class="chart-box"></div>
            </div>
            <div class="chart-card">
              <h4>习惯分类分布</h4>
              <div ref="habitPieChart" class="chart-box"></div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="📅 打卡热力图" name="checkin">
          <div class="charts-grid">
            <div class="chart-card">
              <h4>年度打卡热力图</h4>
              <CalendarHeatmap :checkins="checkinData" />
            </div>
            <div class="chart-card">
              <h4>月度打卡趋势</h4>
              <div ref="checkinTrendChart" class="chart-box"></div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="📋 日程分析" name="schedule">
          <div class="charts-grid">
            <div class="chart-card">
              <h4>日程分类分布</h4>
              <div ref="schedulePieChart" class="chart-box"></div>
            </div>
            <div class="chart-card">
              <h4>每周日程数量</h4>
              <div ref="scheduleBarChart" class="chart-box"></div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="🤖 AI 效率分析" name="ai">
          <div v-if="aiLoading" class="empty-state">
            <el-icon class="is-loading" :size="32"><Loading /></el-icon>
            <p>AI 正在分析您的数据...</p>
          </div>
          <div v-else-if="aiReport" class="ai-report">
            <h4>📋 AI 效率分析报告</h4>
            <div class="report-content" v-html="parsedReport"></div>
          </div>
          <div v-else class="empty-state">
            <span style="font-size:48px">🤖</span>
            <p>选择时间范围后点击查询获取 AI 分析报告</p>
            <el-button type="primary" @click="fetchAiAnalysis" style="margin-top:12px">
              开始分析
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import CalendarHeatmap from '@/components/CalendarHeatmap.vue'
import { getHabits } from '@/api/habit'
import { getCheckins } from '@/api/checkin'
import { getSchedules } from '@/api/schedule'
import { getAnalysis } from '@/api/ai'
import dayjs from 'dayjs'

const activeTab = ref('habits')
const dateRange = ref([dayjs().subtract(30, 'day').toDate(), new Date()])

const habitBarChart = ref(null)
const habitPieChart = ref(null)
const schedulePieChart = ref(null)
const scheduleBarChart = ref(null)
const checkinTrendChart = ref(null)

const checkinData = ref([])
const aiLoading = ref(false)
const aiReport = ref('')

let barChartInstance = null
let pieChartInstance = null
let schedPieInstance = null
let schedBarInstance = null
let checkinTrendInstance = null

const parsedReport = ref('')

const categoryLabels = {
  health: '健康', study: '学习', work: '工作', life: '生活',
  sports: '运动', reading: '阅读', meditation: '冥想', social: '社交', other: '其他'
}

function formatDate(d) {
  if (!d) return ''
  return dayjs(d).format('YYYY-MM-DD')
}

async function fetchHabitStats() {
  try {
    const res = await getHabits()
    const habits = res.data || res || []
    const names = habits.map(h => h.name)
    const rates = habits.map(h => h.completion_rate || 0)
    if (barChartInstance) {
      barChartInstance.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
        yAxis: { type: 'category', data: names.reverse(), axisLabel: { fontSize: 12 } },
        series: [{
          type: 'bar', data: rates.reverse(), itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#6366f1' }, { offset: 1, color: '#8b5cf6' }
            ]),
            borderRadius: [0, 6, 6, 0]
          },
          label: { show: true, position: 'right', formatter: '{c}%' }
        }]
      })
    }
    const catCount = {}
    habits.forEach(h => {
      const cat = h.category || 'other'
      catCount[cat] = (catCount[cat] || 0) + 1
    })
    const catData = Object.entries(catCount).map(([k, v]) => ({
      name: categoryLabels[k] || k, value: v
    }))
    if (pieChartInstance) {
      pieChartInstance.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
          data: catData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } },
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 3 }
        }]
      })
    }
  } catch (err) {
    console.error('获取习惯统计失败:', err)
  }
}

async function fetchCheckinData() {
  try {
    const res = await getCheckins({
      startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD')
    })
    const data = res.data || res || []
    checkinData.value = Array.isArray(data) ? data : []
    renderCheckinTrend()
  } catch (err) {
    console.error('获取打卡数据失败:', err)
  }
}

function renderCheckinTrend() {
  if (!checkinTrendChart.value || !checkinTrendInstance) return
  const monthlyData = {}
  checkinData.value.forEach(item => {
    const date = dayjs(item.checkin_date || item.date)
    const monthKey = date.format('YYYY-MM')
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (item.count || 1)
  })
  const sortedMonths = Object.keys(monthlyData).sort()
  const months = sortedMonths.map(m => {
    const names = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    return names[parseInt(m.split('-')[1]) - 1] || m
  })
  const counts = sortedMonths.map(m => monthlyData[m])
  checkinTrendInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '5%', right: '5%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: months, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line', data: counts, smooth: true, areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0.02)' }
        ])
      },
      itemStyle: { color: '#6366f1' },
      lineStyle: { width: 2 },
      symbol: 'circle', symbolSize: 6
    }]
  })
}

async function fetchScheduleStats() {
  try {
    const res = await getSchedules({
      startDate: formatDate(dateRange.value[0]),
      endDate: formatDate(dateRange.value[1])
    })
    const schedules = res.rows || res.data?.rows || res.data || res || []
    if (Array.isArray(schedules)) {
      const catCount = {}
      schedules.forEach(s => {
        const cat = s.category || 'other'
        catCount[cat] = (catCount[cat] || 0) + 1
      })
      const catData = Object.entries(catCount).map(([k, v]) => ({
        name: categoryLabels[k] || k, value: v
      }))
      if (schedPieInstance) {
        schedPieInstance.setOption({
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
            data: catData, itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 3 }
          }]
        })
      }
      const weekly = Array(7).fill(0)
      schedules.forEach(s => {
        if (s.start_time) {
          const day = dayjs(s.start_time).day()
          weekly[day]++
        }
      })
      const weekLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      if (schedBarInstance) {
        schedBarInstance.setOption({
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '5%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', data: weekLabels },
          yAxis: { type: 'value' },
          series: [{
            type: 'bar', data: weekly, itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#f59e0b' }, { offset: 1, color: '#f97316' }
              ]),
              borderRadius: [6, 6, 0, 0]
            }
          }]
        })
      }
    }
  } catch (err) {
    console.error('获取日程统计失败:', err)
  }
}

async function fetchAiAnalysis() {
  aiLoading.value = true
  try {
    const res = await getAnalysis({
      startDate: formatDate(dateRange.value[0]),
      endDate: formatDate(dateRange.value[1])
    })
    aiReport.value = res.data?.report || res.report || ''
    parsedReport.value = aiReport.value.replace(/\n/g, '<br>')
  } catch (err) {
    console.error('AI分析失败:', err)
    aiReport.value = ''
  } finally {
    aiLoading.value = false
  }
}

function handleDateChange() {
  if (activeTab.value === 'schedule') fetchScheduleStats()
  if (activeTab.value === 'ai') fetchAiAnalysis()
}

function initCharts() {
  if (habitBarChart.value && !barChartInstance) {
    barChartInstance = echarts.init(habitBarChart.value)
  }
  if (habitPieChart.value && !pieChartInstance) {
    pieChartInstance = echarts.init(habitPieChart.value)
  }
  if (schedulePieChart.value && !schedPieInstance) {
    schedPieInstance = echarts.init(schedulePieChart.value)
  }
  if (scheduleBarChart.value && !schedBarInstance) {
    schedBarInstance = echarts.init(scheduleBarChart.value)
  }
  if (checkinTrendChart.value && !checkinTrendInstance) {
    checkinTrendInstance = echarts.init(checkinTrendChart.value)
  }
}

function destroyCharts() {
  barChartInstance?.dispose()
  pieChartInstance?.dispose()
  schedPieInstance?.dispose()
  schedBarInstance?.dispose()
  checkinTrendInstance?.dispose()
  barChartInstance = null
  pieChartInstance = null
  schedPieInstance = null
  schedBarInstance = null
  checkinTrendInstance = null
}

watch(activeTab, async (tab) => {
  await nextTick()
  if (tab === 'habits') {
    initCharts()
    await fetchHabitStats()
  } else if (tab === 'checkin') {
    await fetchCheckinData()
  } else if (tab === 'schedule') {
    initCharts()
    await fetchScheduleStats()
  } else if (tab === 'ai') {
    if (!aiReport.value) await fetchAiAnalysis()
  }
})

onMounted(async () => {
  await nextTick()
  initCharts()
  await fetchHabitStats()
  await fetchCheckinData()
})

onUnmounted(() => {
  destroyCharts()
})
</script>

<style scoped>
.date-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
}

.filter-label {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.analytics-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.analytics-tabs :deep(.el-tabs__nav) {
  border: none;
}

.analytics-tabs :deep(.el-tabs__item) {
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  font-weight: 500;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
  border: 1px solid var(--border);
}

.chart-card h4 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-box {
  width: 100%;
  height: 320px;
}

.ai-report {
  padding: 8px;
}

.ai-report h4 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.report-content {
  line-height: 1.8;
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
