<template>
  <div class="page-container">
    <div class="profile-cover">
      <div class="cover-gradient"></div>
      <div class="cover-pattern"></div>
    </div>

    <div class="profile-wrapper">
      <div class="profile-avatar-section">
        <div class="avatar-container">
          <div class="avatar-ring">
            <el-avatar
              :size="100"
              :src="profileForm.avatar || undefined"
              class="profile-avatar"
            >
              <span class="avatar-fallback">{{ avatarFallback }}</span>
            </el-avatar>
          </div>
          <h2 class="profile-username">{{ profileForm.nickname || authStore.user?.username || '用户' }}</h2>
          <p class="profile-bio">{{ profileForm.bio || '这个人很懒，什么都没写...' }}</p>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card primary">
          <div class="stat-icon"><el-icon :size="20"><Finished /></el-icon></div>
          <div class="stat-value">{{ stats.totalHabits }}</div>
          <div class="stat-label">习惯总数</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon"><el-icon :size="20"><CircleCheck /></el-icon></div>
          <div class="stat-value">{{ stats.totalCheckins }}</div>
          <div class="stat-label">打卡总数</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon"><el-icon :size="20"><Trophy /></el-icon></div>
          <div class="stat-value">{{ stats.totalAchievements }}</div>
          <div class="stat-label">成就数量</div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon"><el-icon :size="20"><Odometer /></el-icon></div>
          <div class="stat-value">{{ stats.consecutiveDays }}</div>
          <div class="stat-label">连续打卡</div>
        </div>
      </div>

      <div class="profile-content glass-card">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <el-icon :size="16"><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="tab-content">
          <transition name="slide-up" mode="out-in">
            <div v-if="activeTab === 'info'" key="info" class="tab-pane">
              <el-form :model="profileForm" label-position="top" class="profile-form">
                <el-form-item label="头像链接">
                  <el-input
                    v-model="profileForm.avatar"
                    placeholder="输入头像图片 URL"
                    size="large"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Picture /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="昵称">
                  <el-input
                    v-model="profileForm.nickname"
                    placeholder="设置你的昵称"
                    size="large"
                    maxlength="30"
                    show-word-limit
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="个人简介">
                  <el-input
                    v-model="profileForm.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="写一段自我介绍..."
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input
                    :model-value="authStore.user?.email || '-'"
                    disabled
                    size="large"
                  >
                    <template #prefix>
                      <el-icon><Message /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    size="large"
                    class="btn-gradient save-btn"
                    @click="handleUpdateProfile"
                    :loading="updating"
                  >
                    <el-icon v-if="!updating"><Refresh /></el-icon>
                    {{ updating ? '保存中...' : '保存修改' }}
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-else-if="activeTab === 'security'" key="security" class="tab-pane">
              <el-form
                :model="passwordForm"
                label-position="top"
                ref="passwordFormRef"
                :rules="passwordRules"
                class="profile-form"
              >
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    size="large"
                    show-password
                  >
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="8-20位，含大小写字母和数字"
                    size="large"
                    show-password
                  >
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    size="large"
                    show-password
                  >
                    <template #prefix>
                      <el-icon><Lock /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="warning"
                    size="large"
                    class="btn-save"
                    @click="handleChangePassword"
                    :loading="changingPassword"
                  >
                    {{ changingPassword ? '修改中...' : '修改密码' }}
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-else-if="activeTab === 'preferences'" key="preferences" class="tab-pane">
              <div class="preferences-list">
                <div class="pref-item">
                  <div class="pref-info">
                    <div class="pref-label">深色模式</div>
                    <div class="pref-desc">切换应用的明暗主题</div>
                  </div>
                  <el-switch
                    :model-value="themeStore.darkMode"
                    @change="themeStore.toggleTheme()"
                    inline-prompt
                    active-text="🌙"
                    inactive-text="☀️"
                    size="large"
                  />
                </div>
                <div class="pref-item">
                  <div class="pref-info">
                    <div class="pref-label">通知提醒</div>
                    <div class="pref-desc">接收习惯提醒和系统通知</div>
                  </div>
                  <el-switch
                    v-model="settingsForm.notificationsEnabled"
                    size="large"
                    @change="handleUpdateSettings"
                  />
                </div>
                <div class="pref-item">
                  <div class="pref-info">
                    <div class="pref-label">界面语言</div>
                    <div class="pref-desc">选择应用显示语言</div>
                  </div>
                  <el-select
                    v-model="settingsForm.language"
                    size="large"
                    @change="handleUpdateSettings"
                    style="width: 140px"
                  >
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en" />
                  </el-select>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'stats'" key="stats" class="tab-pane">
              <div class="stats-grid">
                <div class="stats-card">
                  <div class="stats-card-icon habits-icon">
                    <el-icon :size="24"><Finished /></el-icon>
                  </div>
                  <div class="stats-card-body">
                    <div class="stats-card-value">{{ stats.totalHabits }}</div>
                    <div class="stats-card-label">创建的习惯</div>
                    <div class="stats-card-desc">你一共创建的习惯数量</div>
                  </div>
                </div>
                <div class="stats-card">
                  <div class="stats-card-icon checkins-icon">
                    <el-icon :size="24"><CircleCheck /></el-icon>
                  </div>
                  <div class="stats-card-body">
                    <div class="stats-card-value">{{ stats.totalCheckins }}</div>
                    <div class="stats-card-label">总打卡次数</div>
                    <div class="stats-card-desc">累计完成的打卡记录</div>
                  </div>
                </div>
                <div class="stats-card">
                  <div class="stats-card-icon achieve-icon">
                    <el-icon :size="24"><Trophy /></el-icon>
                  </div>
                  <div class="stats-card-body">
                    <div class="stats-card-value">{{ stats.totalAchievements }}</div>
                    <div class="stats-card-label">获得成就</div>
                    <div class="stats-card-desc">解锁的成就徽章数量</div>
                  </div>
                </div>
                <div class="stats-card">
                  <div class="stats-card-icon streak-icon">
                    <el-icon :size="24"><Odometer /></el-icon>
                  </div>
                  <div class="stats-card-body">
                    <div class="stats-card-value">{{ stats.consecutiveDays }}</div>
                    <div class="stats-card-label">连续打卡天数</div>
                    <div class="stats-card-desc">当前连续打卡天数</div>
                  </div>
                </div>
                <div class="stats-card">
                  <div class="stats-card-icon date-icon">
                    <el-icon :size="24"><Calendar /></el-icon>
                  </div>
                  <div class="stats-card-body">
                    <div class="stats-card-value">{{ formatDate(authStore.user?.created_at) }}</div>
                    <div class="stats-card-label">注册日期</div>
                    <div class="stats-card-desc">你加入的日期</div>
                  </div>
                </div>
                <div class="stats-card">
                  <div class="stats-card-icon days-icon">
                    <el-icon :size="24"><Clock /></el-icon>
                  </div>
                  <div class="stats-card-body">
                    <div class="stats-card-value">{{ memberDays }} 天</div>
                    <div class="stats-card-label">使用天数</div>
                    <div class="stats-card-desc">从注册至今的累计天数</div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="bottom-actions">
        <button class="logout-btn" @click="handleLogout">
          <el-icon :size="18"><SwitchButton /></el-icon>
          <span>退出登录</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { getSettings, updateSettings, updateProfile, changePassword } from '@/api/auth'
import { getNotifications } from '@/api/notification'
import { getHabits } from '@/api/habit'
import { getCheckinStats } from '@/api/checkin'
import { getUserAchievements } from '@/api/achievement'
import {
  User,
  Lock,
  Message,
  Upload,
  Plus,
  Picture,
  Refresh,
  Loading,
  Finished,
  CircleCheck,
  Trophy,
  Odometer,
  Calendar,
  Clock,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const activeTab = ref('info')
const updating = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref(null)
const loadingStats = ref(false)

const tabs = [
  { key: 'info', label: '个人信息', icon: User },
  { key: 'security', label: '账户安全', icon: Lock },
  { key: 'preferences', label: '偏好设置', icon: Refresh },
  { key: 'stats', label: '数据统计', icon: Odometer }
]

const profileForm = reactive({
  avatar: '',
  nickname: '',
  bio: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const settingsForm = reactive({
  notificationsEnabled: true,
  language: 'zh-CN'
})

const stats = reactive({
  totalHabits: 0,
  totalCheckins: 0,
  totalAchievements: 0,
  consecutiveDays: 0
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback(new Error('请输入密码'))
        if (value.length < 8 || value.length > 20) return callback(new Error('密码长度为8-20位'))
        if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
          return callback(new Error('密码需包含大写字母、小写字母和数字'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) return callback(new Error('两次输入的密码不一致'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const avatarFallback = computed(() => {
  const name = profileForm.nickname || authStore.user?.username || '?'
  return name.charAt(0).toUpperCase()
})

const memberDays = computed(() => {
  if (!authStore.user?.created_at) return 0
  return Math.max(1, dayjs().diff(dayjs(authStore.user.created_at), 'day'))
})

function formatDate(date) {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

function loadProfile() {
  const user = authStore.user
  if (user) {
    profileForm.avatar = user.avatar || ''
    profileForm.nickname = user.nickname || ''
    profileForm.bio = user.bio || ''
  }
}

async function loadSettings() {
  try {
    const res = await getSettings()
    const data = res.data || res
    if (data) {
      settingsForm.notificationsEnabled = data.notificationsEnabled !== false
      settingsForm.language = data.language || 'zh-CN'
    }
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

async function loadStats() {
  loadingStats.value = true
  try {
    const [habitsRes, checkinRes, achieveRes] = await Promise.all([
      getHabits().catch(() => ({ data: [] })),
      getCheckinStats().catch(() => ({ data: {} })),
      getUserAchievements().catch(() => ({ data: [] }))
    ])

    const habitList = Array.isArray(habitsRes.data) ? habitsRes.data : (Array.isArray(habitsRes) ? habitsRes : [])
    stats.totalHabits = habitList.length

    const checkinData = checkinRes.data || checkinRes || {}
    stats.totalCheckins = checkinData.total || checkinData.totalCheckins || 0
    stats.consecutiveDays = checkinData.streak || checkinData.consecutiveDays || 0

    const achievements = Array.isArray(achieveRes.data) ? achieveRes.data : (Array.isArray(achieveRes) ? achieveRes : [])
    stats.totalAchievements = achievements.length
  } catch (err) {
    console.error('加载统计数据失败:', err)
  } finally {
    loadingStats.value = false
  }
}

async function handleUpdateProfile() {
  updating.value = true
  try {
    await updateProfile({
      nickname: profileForm.nickname,
      bio: profileForm.bio,
      avatar: profileForm.avatar
    })
    await authStore.checkAuth()
    loadProfile()
    ElMessage.success('个人信息更新成功')
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '更新失败')
  } finally {
    updating.value = false
  }
}

async function handleChangePassword() {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return
  changingPassword.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    setTimeout(() => {
      authStore.logout()
      router.push('/login')
    }, 1200)
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

async function handleUpdateSettings() {
  try {
    await updateSettings({
      notificationsEnabled: settingsForm.notificationsEnabled,
      language: settingsForm.language
    })
    ElMessage.success('设置已保存')
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '设置保存失败')
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
  ElMessage.success('已退出登录')
}

onMounted(() => {
  loadProfile()
  loadSettings()
  loadStats()
})
</script>

<style scoped>
.profile-cover {
  position: relative;
  height: 180px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: -50px;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: var(--gradient-primary);
}

.cover-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 50% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 45%);
}

.profile-wrapper {
  position: relative;
  z-index: 1;
  padding: 0 4px;
}

.profile-avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-container {
  text-align: center;
}

.avatar-ring {
  display: inline-flex;
  padding: 4px;
  border-radius: 50%;
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-lg);
  margin-bottom: 12px;
}

.profile-avatar {
  border: 3px solid var(--bg-primary);
  transition: var(--transition);
}

.avatar-fallback {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-inverse);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.profile-username {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.profile-bio {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  max-width: 360px;
  margin-inline: auto;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  text-align: center;
  transition: var(--transition);
  cursor: default;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.stat-card.primary::before { background: var(--gradient-primary); }
.stat-card.success::before { background: var(--gradient-success); }
.stat-card.warning::before { background: var(--gradient-warning); }
.stat-card.info::before { background: var(--gradient-info); }

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  background: var(--bg-glass-hover);
}

.stat-card .stat-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 20px;
}

.stat-card.primary .stat-icon {
  background: rgba(var(--primary-rgb), 0.12);
  color: var(--primary);
}

.stat-card.success .stat-icon {
  background: rgba(var(--success-rgb), 0.12);
  color: var(--success);
}

.stat-card.warning .stat-icon {
  background: rgba(var(--warning-rgb), 0.12);
  color: var(--warning);
}

.stat-card.info .stat-icon {
  background: rgba(var(--info-rgb), 0.12);
  color: var(--info);
}

.stat-card .stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card .stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.profile-content {
  padding: 0;
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  white-space: nowrap;
}

.tab-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 3px 3px 0 0;
  transition: width 0.3s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-glass);
}

.tab-btn.active {
  color: var(--primary);
  background: var(--bg-glass);
}

.tab-btn.active::after {
  width: 60%;
}

.tab-content {
  padding: 24px;
  min-height: 400px;
}

.tab-pane {
  max-width: 560px;
}

.profile-form .el-form-item {
  margin-bottom: 18px;
}

.save-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
}

.btn-save {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  background: var(--gradient-warning) !important;
  border: none !important;
  color: white !important;
  border-radius: var(--radius) !important;
  transition: var(--transition) !important;
}

.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(var(--warning-rgb), 0.4) !important;
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pref-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-light);
}

.pref-item:first-child {
  padding-top: 0;
}

.pref-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.pref-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pref-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.pref-desc {
  font-size: 13px;
  color: var(--text-tertiary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 100%;
}

.stats-card {
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: var(--transition);
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--bg-glass-hover);
}

.stats-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.habits-icon {
  background: rgba(var(--primary-rgb), 0.12);
  color: var(--primary);
}

.checkins-icon {
  background: rgba(var(--success-rgb), 0.12);
  color: var(--success);
}

.achieve-icon {
  background: rgba(var(--warning-rgb), 0.12);
  color: var(--warning);
}

.streak-icon {
  background: rgba(var(--info-rgb), 0.12);
  color: var(--info);
}

.date-icon {
  background: rgba(var(--primary-rgb), 0.12);
  color: var(--info);
}

.days-icon {
  background: rgba(var(--success-rgb), 0.12);
  color: var(--primary);
}

.stats-card-body {
  flex: 1;
  min-width: 0;
}

.stats-card-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2px;
}

.stats-card-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.stats-card-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.bottom-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-bottom: 16px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border: 1px solid rgba(var(--danger-rgb), 0.3);
  background: transparent;
  color: var(--danger);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.logout-btn:hover {
  background: rgba(var(--danger-rgb), 0.1);
  border-color: var(--danger);
  transform: translateY(-1px);
}

.slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .profile-cover {
    height: 140px;
    border-radius: var(--radius-md);
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-card .stat-value {
    font-size: 22px;
  }

  .tabs-nav {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .tab-btn {
    flex: none;
    padding: 12px 14px;
    font-size: 13px;
    white-space: nowrap;
  }

  .tab-content {
    padding: 16px;
  }

  .tab-pane {
    max-width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .profile-username {
    font-size: 20px;
  }
}
</style>
