<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': collapsed }">
    <SideBar :collapsed="collapsed" @toggle="collapsed = !collapsed" />
    <div class="main-area">
      <NavBar @toggle-sidebar="collapsed = !collapsed" />
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SideBar from './SideBar.vue'
import NavBar from './NavBar.vue'

const collapsed = ref(false)
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--bg-base);
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: var(--transition);
}

.content-area {
  flex: 1;
  overflow: hidden;
}
</style>
