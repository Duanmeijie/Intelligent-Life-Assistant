<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-logo">
      <el-icon class="logo-icon" :size="28"><Odometer /></el-icon>
      <transition name="fade">
        <span v-show="!isCollapsed" class="logo-text">智能生活助手</span>
      </transition>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      :router="true"
      :unique-opened="true"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      class="sidebar-menu"
    >
      <el-menu-item index="/">
        <el-icon><Odometer /></el-icon>
        <template #title>仪表盘</template>
      </el-menu-item>
      <el-menu-item index="/schedule">
        <el-icon><Calendar /></el-icon>
        <template #title>日程管理</template>
      </el-menu-item>
      <el-menu-item index="/habits">
        <el-icon><Aim /></el-icon>
        <template #title>习惯追踪</template>
      </el-menu-item>
      <el-menu-item index="/checkin">
        <el-icon><Select /></el-icon>
        <template #title>每日打卡</template>
      </el-menu-item>
      <el-menu-item index="/analytics">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>数据统计</template>
      </el-menu-item>
      <el-menu-item index="/social">
        <el-icon><ChatLineSquare /></el-icon>
        <template #title>社交社区</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Odometer,
  Calendar,
  Aim,
  Select,
  DataAnalysis,
  ChatLineSquare
} from '@element-plus/icons-vue'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()

const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 220px;
  height: 100vh;
  background-color: #304156;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  z-index: 100;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  overflow: hidden;
}

.logo-icon {
  color: #409eff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.sidebar-menu.el-menu--collapse {
  width: 64px;
}

.sidebar-menu .el-menu-item {
  display: flex;
  align-items: center;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.15) !important;
}

:deep(.el-menu--collapse .el-menu-item .el-tooltip) {
  padding: 0;
  justify-content: center;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu) {
  border-right: none;
}
</style>
