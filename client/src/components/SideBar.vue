<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo" v-show="!collapsed">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#logo-gradient)" />
            <path d="M2 17l10 5 10-5" stroke="url(#logo-gradient)" stroke-width="2" fill="none" />
            <path d="M2 12l10 5 10-5" stroke="url(#logo-gradient)" stroke-width="2" fill="none" />
            <defs>
              <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22">
                <stop stop-color="#6366f1" />
                <stop offset="1" stop-color="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="logo-text">智能助手</span>
      </div>
      <div class="logo-compact" v-show="collapsed">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#logo-gradient-2)" />
          <defs>
            <linearGradient id="logo-gradient-2" x1="2" y1="2" x2="22" y2="22">
              <stop stop-color="#6366f1" />
              <stop offset="1" stop-color="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
        <span class="nav-label" v-show="!collapsed">{{ item.label }}</span>
        <span v-if="item.badge && !collapsed" class="nav-badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer" v-show="!collapsed">
      <div class="sidebar-footer-text">v1.0 · 用心生活</div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  collapsed: Boolean
})

const emit = defineEmits(['toggle'])

const route = useRoute()

const menuItems = [
  { path: '/', label: '仪表盘', icon: 'Odometer' },
  { path: '/schedule', label: '日程管理', icon: 'Calendar' },
  { path: '/habits', label: '习惯管理', icon: 'List' },
  { path: '/checkin', label: '每日打卡', icon: 'CircleCheck' },
  { path: '/analytics', label: '数据分析', icon: 'DataAnalysis' },
  { path: '/social', label: '社区', icon: 'ChatDotRound' },
  { path: '/achievements', label: '成就', icon: 'Trophy' }
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed);
}

.sidebar-header {
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon,
.logo-compact {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-icon svg,
.logo-compact svg {
  width: 100%;
  height: 100%;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.logo-compact {
  margin: 0 auto;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 11px 14px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-fast);
  position: relative;
  white-space: nowrap;
  cursor: pointer;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.nav-item.active {
  color: var(--primary);
  background: rgba(var(--primary-rgb), 0.08);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--gradient-primary);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.nav-label {
  margin-left: 12px;
  flex: 1;
}

.nav-badge {
  background: var(--gradient-primary);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
}

.sidebar-footer-text {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 11px 0;
}

.sidebar.collapsed .nav-item.active::before {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    width: var(--sidebar-width) !important;
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
    width: var(--sidebar-width) !important;
  }
}
</style>
