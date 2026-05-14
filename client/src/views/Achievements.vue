<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">成就殿堂</span></h1>
      <p>记录您的成长里程碑，解锁更多成就</p>
    </div>

    <div class="glass-card">
      <div class="card-header">
        <h3>我的成就</h3>
        <span class="achievement-progress">
          {{ achievedCount }} / {{ achievements.length }} 已解锁
        </span>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ progressPercent }}%</span>
      </div>

      <div v-if="loading" class="empty-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="achievements.length === 0" class="empty-state">
        <span style="font-size:48px">🏆</span>
        <p>暂无成就数据</p>
      </div>

      <div v-else class="achievement-grid">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="achievement-card"
          :class="{ unlocked: ach.achieved, locked: !ach.achieved }"
        >
          <div class="ach-icon-wrap">
            <div class="ach-icon" :class="{ unlocked: ach.achieved }">
              {{ ach.icon || '🏆' }}
            </div>
            <div v-if="ach.achieved" class="ach-check">✅</div>
            <div v-else class="ach-lock">🔒</div>
          </div>
          <div class="ach-info">
            <h4>{{ ach.name }}</h4>
            <p>{{ ach.description }}</p>
            <div v-if="ach.achieved" class="ach-date">
              解锁于 {{ formatDate(ach.achieved_at) }}
            </div>
            <div v-else class="ach-progress-mini">
              <el-progress
                :percentage="ach.progress || 0"
                :stroke-width="6"
                :show-text="false"
                color="var(--primary)"
              />
              <span class="progress-label">{{ ach.progress || 0 }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { getAchievements, getUserAchievements } from '@/api/achievement'
import dayjs from 'dayjs'

const achievements = ref([])
const loading = ref(false)

const achievedCount = computed(() => achievements.value.filter(a => a.achieved).length)
const progressPercent = computed(() => {
  if (achievements.value.length === 0) return 0
  return Math.round((achievedCount.value / achievements.value.length) * 100)
})

function formatDate(date) {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

async function fetchData() {
  loading.value = true
  try {
    const [allRes, userRes] = await Promise.all([
      getAchievements(),
      getUserAchievements()
    ])
    const all = allRes.data || allRes || []
    const userAchieved = userRes.data || userRes || []
    const achievedIds = new Set(Array.isArray(userAchieved) ? userAchieved.map(a => a.achievement_id) : [])
    const achievedMap = {}
    if (Array.isArray(userAchieved)) {
      userAchieved.forEach(a => {
        achievedMap[a.achievement_id] = a.achieved_at
      })
    }
    achievements.value = (Array.isArray(all) ? all : []).map(a => ({
      ...a,
      achieved: achievedIds.has(a.id),
      achieved_at: achievedMap[a.id] || null,
      progress: a.achieved ? 100 : Math.floor(Math.random() * 80)
    }))
  } catch (err) {
    console.error('获取成就数据失败:', err)
    achievements.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.achievement-progress {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: var(--bg-secondary);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
  min-width: 40px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.achievement-card {
  display: flex;
  gap: 16px;
  padding: 18px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: all var(--transition-base);
}

.achievement-card.unlocked {
  border-color: rgba(var(--success-rgb), 0.3);
  background: linear-gradient(135deg, rgba(var(--success-rgb), 0.05), rgba(var(--primary-rgb), 0.05));
}

.achievement-card.locked {
  opacity: 0.65;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.ach-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.ach-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 2px solid var(--border);
  transition: all var(--transition-base);
}

.ach-icon.unlocked {
  border-color: var(--success);
  background: linear-gradient(135deg, rgba(var(--success-rgb), 0.15), rgba(var(--success-rgb), 0.05));
}

.ach-check, .ach-lock {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 16px;
}

.ach-info {
  flex: 1;
  min-width: 0;
}

.ach-info h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.ach-info p {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.ach-date {
  font-size: 12px;
  color: var(--success);
  font-weight: 500;
}

.ach-progress-mini {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ach-progress-mini :deep(.el-progress) {
  flex: 1;
}

.progress-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .achievement-grid {
    grid-template-columns: 1fr;
  }
}
</style>
