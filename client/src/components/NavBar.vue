<template>
  <header class="navbar">
    <div class="navbar-left">
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        <el-icon :size="20"><Fold /></el-icon>
      </button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentTitle && currentTitle !== '仪表盘'">
          {{ currentTitle }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="navbar-center">
      <el-input
        v-model="searchQuery"
        placeholder="搜索..."
        :prefix-icon="Search"
        class="search-input"
        clearable
      />
    </div>

    <div class="navbar-right">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <button class="icon-btn" @click="router.push('/notifications')">
          <el-icon :size="20"><Bell /></el-icon>
        </button>
      </el-badge>

      <el-tooltip :content="darkMode ? '切换亮色模式' : '切换暗色模式'" placement="bottom">
        <button class="theme-toggle" @click="themeStore.toggleTheme()">
          <el-icon :size="20">
            <Sunny v-if="darkMode" />
            <Moon v-else />
          </el-icon>
        </button>
      </el-tooltip>

      <el-dropdown trigger="click" placement="bottom-end">
        <button class="user-btn">
          <el-avatar :size="32" :src="userAvatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <span class="user-name" v-if="authStore.user">{{ authStore.user.nickname || authStore.user.username }}</span>
          <el-icon :size="14" class="dropdown-arrow"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/profile')">
              <el-icon><UserFilled /></el-icon> 个人中心
            </el-dropdown-item>
            <el-dropdown-item @click="router.push('/achievements')">
              <el-icon><Trophy /></el-icon> 成就
            </el-dropdown-item>
            <el-dropdown-item @click="router.push('/profile')">
              <el-icon><Setting /></el-icon> 设置
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { getUnreadCount, getNotifications } from '@/api/notification'
import { ElBadge } from 'element-plus'
import {
  Bell,
  Search,
  Expand,
  Fold,
  UserFilled,
  Setting,
  Trophy,
  SwitchButton,
  ArrowDown,
  Sunny,
  Moon
} from '@element-plus/icons-vue'

defineEmits(['toggle-sidebar'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const searchQuery = ref('')
const unreadCount = ref(0)

let pollingTimer = null

const darkMode = computed(() => themeStore.darkMode)

const userAvatar = computed(() => {
  return authStore.user?.avatar || ''
})

const currentTitle = computed(() => route.meta?.title || '')

async function fetchUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = (res.data || res)?.count || 0
  } catch {
    // silent
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchUnreadCount()
  themeStore.syncFromServer()
  pollingTimer = setInterval(fetchUnreadCount, 30000)
})

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
})
</script>

<style scoped>
.navbar {
  height: var(--navbar-height);
  background: var(--bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 50;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.menu-toggle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.menu-toggle:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.navbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 24px;
  max-width: 480px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: none;
  transition: var(--transition-fast);
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: var(--primary);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.15);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.theme-toggle,
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
  position: relative;
}

.theme-toggle:hover,
.icon-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: var(--radius);
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.user-btn:hover {
  background: var(--bg-tertiary);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: var(--text-tertiary);
  transition: var(--transition-fast);
}

.user-btn:hover .dropdown-arrow {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 12px;
  }

  .navbar-left {
    gap: 8px;
  }

  .navbar-center {
    display: none;
  }

  .user-name {
    display: none;
  }

  .user-btn {
    padding: 4px;
  }

  .el-breadcrumb {
    display: none;
  }
}
</style>
