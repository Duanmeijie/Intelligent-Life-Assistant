<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">成就殿堂</span></h1>
      <p>记录您的成长里程碑，解锁更多成就，提升等级</p>
    </div>

    <div class="grade-card glass-card">
      <div class="grade-left">
        <div class="grade-badge" :class="currentGrade.level">
          <span class="grade-icon">{{ currentGrade.icon }}</span>
        </div>
        <div class="grade-info">
          <span class="grade-title">{{ currentGrade.name }}</span>
          <span class="grade-desc">{{ currentGrade.description }}</span>
        </div>
      </div>
      <div class="grade-right">
        <div class="grade-stats">
          <div class="grade-stat">
            <span class="grade-stat-value">{{ achievedCount }}</span>
            <span class="grade-stat-label">已解锁</span>
          </div>
          <div class="grade-stat">
            <span class="grade-stat-value">{{ achievements.length }}</span>
            <span class="grade-stat-label">总成就</span>
          </div>
          <div class="grade-stat">
            <span class="grade-stat-value">{{ currentGrade.xp }}</span>
            <span class="grade-stat-label">经验值</span>
          </div>
        </div>
        <div class="grade-progress-wrap">
          <div class="grade-progress-bar">
            <div class="grade-progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="grade-progress-text">{{ progressPercent }}%</span>
        </div>
        <div v-if="nextGrade" class="grade-next">
          下一个等级：<strong>{{ nextGrade.name }}</strong>（还需 {{ nextGrade.need }} 个成就）
        </div>
      </div>
    </div>

    <div class="glass-card">
      <div class="card-header">
        <h3>所有成就</h3>
        <div class="filter-tabs">
          <el-radio-group v-model="filterStatus" size="small">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="unlocked">已解锁</el-radio-button>
            <el-radio-button value="locked">未解锁</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div v-if="loading" class="empty-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredAchievements.length === 0" class="empty-state">
        <span style="font-size:48px">🏆</span>
        <p>{{ filterStatus === 'unlocked' ? '还没有解锁的成就，继续加油！' : filterStatus === 'locked' ? '所有成就已解锁！' : '暂无成就数据' }}</p>
      </div>

      <div v-else class="achievement-grid">
        <div
          v-for="ach in filteredAchievements"
          :key="ach.id"
          class="achievement-card"
          :class="{ unlocked: ach.achieved, locked: !ach.achieved }"
        >
          <div class="ach-icon-wrap">
            <div class="ach-icon" :class="{ unlocked: ach.achieved }">
              {{ ach.icon || (ach.achieved ? '🏆' : '🔒') }}
            </div>
          </div>
          <div class="ach-info">
            <h4>{{ ach.name }}</h4>
            <p>{{ ach.description }}</p>
            <div class="ach-meta-row">
              <el-tag v-if="ach.category" size="small" effect="plain" round>{{ ach.category }}</el-tag>
              <el-tag v-if="ach.xp" size="small" effect="plain" round type="warning">+{{ ach.xp }} XP</el-tag>
            </div>
            <div v-if="ach.achieved" class="ach-date-row">
              <span class="ach-check-mark">✅</span>
              <span class="ach-date">解锁于 {{ formatDate(ach.achieved_at) }}</span>
            </div>
            <div v-else class="ach-progress-row">
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
const filterStatus = ref('all')

const gradeLevels = [
  { min: 0, name: '青铜学徒', icon: '🥉', level: 'bronze', description: '刚刚开始成就之旅', xp: 0 },
  { min: 2, name: '白银进阶', icon: '🥈', level: 'silver', description: '稳步前进的践行者', xp: 50 },
  { min: 5, name: '黄金达人', icon: '🥇', level: 'gold', description: '自律已成为习惯', xp: 150 },
  { min: 8, name: '铂金精英', icon: '💎', level: 'platinum', description: '卓越的自我管理者', xp: 300 },
  { min: 12, name: '钻石大师', icon: '👑', level: 'diamond', description: '登峰造极的生活艺术家', xp: 500 },
]

const achievedCount = computed(() => achievements.value.filter(a => a.achieved).length)
const progressPercent = computed(() => {
  if (achievements.value.length === 0) return 0
  return Math.round((achievedCount.value / achievements.value.length) * 100)
})

const currentGrade = computed(() => {
  const count = achievedCount.value
  let grade = gradeLevels[0]
  for (const g of gradeLevels) {
    if (count >= g.min) grade = g
  }
  return { ...grade, xp: count * 25 }
})

const nextGrade = computed(() => {
  const count = achievedCount.value
  for (let i = 0; i < gradeLevels.length; i++) {
    if (count < gradeLevels[i].min) {
      return { ...gradeLevels[i], need: gradeLevels[i].min - count }
    }
  }
  return null
})

const filteredAchievements = computed(() => {
  if (filterStatus.value === 'unlocked') return achievements.value.filter(a => a.achieved)
  if (filterStatus.value === 'locked') return achievements.value.filter(a => !a.achieved)
  return achievements.value
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
    const all = allRes.data?.achievements || allRes.achievements || allRes.data || allRes || []
    const userAchieved = userRes.data?.achievements || userRes.achievements || userRes.data || userRes || []
    const achievedIds = new Set()
    const achievedMap = {}
    if (Array.isArray(userAchieved)) {
      userAchieved.forEach(a => {
        const id = a.achievement_id || a.id
        achievedIds.add(id)
        achievedMap[id] = a.achieved_at
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
.grade-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  margin-bottom: 24px;
  gap: 24px;
  flex-wrap: wrap;
}

.grade-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.grade-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  flex-shrink: 0;
  border: 3px solid;
  transition: all var(--transition-base);
}

.grade-badge.bronze {
  background: linear-gradient(135deg, #cd7f32, #a0522d);
  border-color: #cd7f32;
  box-shadow: 0 4px 15px rgba(205, 127, 50, 0.3);
}

.grade-badge.silver {
  background: linear-gradient(135deg, #c0c0c0, #808080);
  border-color: #c0c0c0;
  box-shadow: 0 4px 15px rgba(192, 192, 192, 0.3);
}

.grade-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  border-color: #ffd700;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.grade-badge.platinum {
  background: linear-gradient(135deg, #e5e4e2, #b9f2ff);
  border-color: #b9f2ff;
  box-shadow: 0 4px 15px rgba(185, 242, 255, 0.3);
}

.grade-badge.diamond {
  background: linear-gradient(135deg, #b9f2ff, #7dd3fc);
  border-color: #7dd3fc;
  box-shadow: 0 4px 20px rgba(125, 211, 252, 0.4);
  animation: gradePulse 2s ease-in-out infinite;
}

@keyframes gradePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.grade-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grade-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.grade-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.grade-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;
}

.grade-stats {
  display: flex;
  gap: 24px;
}

.grade-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.grade-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.grade-stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.grade-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.grade-progress-bar {
  flex: 1;
  height: 10px;
  background: var(--bg-secondary);
  border-radius: 5px;
  overflow: hidden;
}

.grade-progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.grade-progress-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  min-width: 36px;
}

.grade-next {
  font-size: 13px;
  color: var(--text-secondary);
}

.grade-next strong {
  color: var(--primary);
}

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

.filter-tabs {
  flex-shrink: 0;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  opacity: 0.6;
}

.achievement-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.achievement-card.locked:hover {
  opacity: 0.8;
}

.ach-icon-wrap {
  flex-shrink: 0;
}

.ach-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border: 2px solid var(--border);
  transition: all var(--transition-base);
}

.ach-icon.unlocked {
  border-color: var(--success);
  background: linear-gradient(135deg, rgba(var(--success-rgb), 0.15), rgba(var(--success-rgb), 0.05));
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

.ach-meta-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.ach-date-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.ach-check-mark {
  font-size: 14px;
}

.ach-date {
  font-size: 12px;
  color: var(--success);
  font-weight: 500;
}

.ach-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.ach-progress-row :deep(.el-progress) {
  flex: 1;
}

.progress-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
  min-width: 30px;
  text-align: right;
}

@media (max-width: 768px) {
  .grade-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }
  .grade-right {
    width: 100%;
    min-width: unset;
  }
  .grade-stats {
    justify-content: space-around;
  }
  .achievement-grid {
    grid-template-columns: 1fr;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
