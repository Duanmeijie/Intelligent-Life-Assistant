<template>
  <div class="habit-chart">
    <div ref="chartRef" class="chart-container"></div>
    <div v-if="loading" class="chart-loading">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <el-empty v-if="!loading && (!data || data.length === 0)" description="暂无习惯数据" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
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

  const names = props.data.map(item => item.name)
  const rates = props.data.map(item => Math.round((item.completionRate || 0) * 100))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function (params) {
        const index = params[0].dataIndex
        const item = props.data[index]
        return `<strong>${item.name}</strong><br/>
          完成率：${Math.round((item.completionRate || 0) * 100)}%<br/>
          已完成：${item.completed || 0} 天<br/>
          总计：${item.total || 0} 天`
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        fontSize: 12
      }
    },
    series: [
      {
        type: 'bar',
        data: rates,
        barWidth: 20,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          formatter: function (params) {
            return params.value + '%'
          },
          fontSize: 12,
          color: '#606266'
        },
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      }
    ]
  }

  chartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
}

watch(
  () => props.data,
  () => {
    nextTick(() => {
      if (props.data && props.data.length > 0) {
        initChart()
      }
    })
  },
  { deep: true }
)

watch(
  () => props.loading,
  (val) => {
    if (!val && props.data && props.data.length > 0) {
      nextTick(initChart)
    }
  }
)

onMounted(() => {
  if (props.data && props.data.length > 0) {
    nextTick(initChart)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.habit-chart {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  z-index: 10;
}

.loading-icon {
  animation: rotating 1.5s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
