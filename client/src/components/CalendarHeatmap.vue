<template>
  <div class="calendar-heatmap">
    <div ref="chartRef" class="chart-container"></div>
    <el-empty v-if="!data || data.length === 0" description="暂无打卡数据" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  year: {
    type: Number,
    default: () => dayjs().year()
  }
})

const chartRef = ref(null)
let chartInstance = null

function initChart() {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const dataMap = {}
  props.data.forEach(item => {
    dataMap[item.date] = item.count || 0
  })

  const startDate = dayjs(`${props.year}-01-01`)
  const endDate = dayjs(`${props.year}-12-31`)
  const heatmapData = []
  let current = startDate

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const dateStr = current.format('YYYY-MM-DD')
    heatmapData.push([dateStr, dataMap[dateStr] || 0])
    current = current.add(1, 'day')
  }

  const maxCount = Math.max(...heatmapData.map(d => d[1]), 1)

  const option = {
    tooltip: {
      formatter: function (params) {
        const date = params.value[0]
        const count = params.value[1]
        return `${date}<br/>打卡次数：${count} 次`
      }
    },
    visualMap: {
      min: 0,
      max: maxCount,
      type: 'piecewise',
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      pieces: generatePieces(maxCount),
      calculable: true,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 11
      }
    },
    calendar: {
      top: 20,
      left: 30,
      right: 30,
      bottom: 60,
      range: props.year,
      cellSize: ['auto', 16],
      splitLine: {
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 2
      },
      yearLabel: {
        show: true,
        fontSize: 16,
        fontWeight: 'bold'
      },
      dayLabel: {
        firstDay: 1,
        nameMap: 'zh-cn',
        fontSize: 11
      },
      monthLabel: {
        nameMap: 'zh-cn',
        fontSize: 12
      }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData,
        animationDelay: function (idx) {
          return idx * 5
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

function generatePieces(max) {
  if (max <= 0) {
    return [
      { min: 0, max: 0, label: '无打卡', color: '#ebedf0' }
    ]
  }
  if (max <= 1) {
    return [
      { min: 0, max: 0, label: '无打卡', color: '#ebedf0' },
      { min: 1, max: 1, label: '已打卡', color: '#7bc96f' }
    ]
  }
  const step = max / 4
  return [
    { min: 0, max: 0, label: '无打卡', color: '#ebedf0' },
    { min: 1, max: Math.floor(step), label: '较少', color: '#c6e48b' },
    { min: Math.floor(step) + 1, max: Math.floor(step * 2), label: '一般', color: '#7bc96f' },
    { min: Math.floor(step * 2) + 1, max: Math.floor(step * 3), label: '较多', color: '#239a3b' },
    { min: Math.floor(step * 3) + 1, max: max, label: '频繁', color: '#196127' }
  ]
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.data,
  () => {
    nextTick(initChart)
  },
  { deep: true }
)

watch(
  () => props.year,
  () => {
    nextTick(initChart)
  }
)

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.calendar-heatmap {
  width: 100%;
  min-height: 200px;
}

.chart-container {
  width: 100%;
  height: 200px;
}
</style>
