<template>
  <div class="app-layout">
    <SideBar :isCollapsed="sidebarCollapsed" />
    <div class="layout-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <NavBar :sidebarCollapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />
      <div class="main-content">
        <router-view />
      </div>
    </div>
    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="220px"
      :with-header="false"
      :modal="true"
      :modal-class="'sidebar-drawer-modal'"
    >
      <SideBar :isCollapsed="false" />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SideBar from './SideBar.vue'
import NavBar from './NavBar.vue'

const sidebarCollapsed = ref(false)
const drawerVisible = ref(false)
const isMobile = ref(window.innerWidth < 768)

function toggleSidebar() {
  if (isMobile.value) {
    drawerVisible.value = !drawerVisible.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    drawerVisible.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 220px;
  transition: margin-left 0.3s;
  min-width: 0;
}

.layout-main.sidebar-collapsed {
  margin-left: 64px;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

@media screen and (max-width: 768px) {
  .layout-main {
    margin-left: 0 !important;
  }

  .main-content {
    padding: 12px;
  }
}
</style>
