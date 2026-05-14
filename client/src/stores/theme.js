import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSettings, updateSettings } from '@/api/auth'

export const useThemeStore = defineStore('theme', () => {
  const darkMode = ref(false)

  function initTheme() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      darkMode.value = saved === 'dark'
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      darkMode.value = true
    }
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', darkMode.value ? 'dark' : 'light')
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', darkMode.value ? 'dark' : 'light')
  }

  async function toggleTheme() {
    darkMode.value = !darkMode.value
    applyTheme()
    try {
      await updateSettings({ theme: darkMode.value ? 'dark' : 'light' })
    } catch {
      // silently fail
    }
  }

  async function syncFromServer() {
    try {
      const res = await getSettings()
      const settings = res.data || res
      if (settings && settings.theme) {
        const serverTheme = settings.theme
        if (serverTheme === 'dark' && !darkMode.value) {
          darkMode.value = true
          applyTheme()
        } else if (serverTheme === 'light' && darkMode.value) {
          darkMode.value = false
          applyTheme()
        }
      }
    } catch {
      // use local
    }
  }

  return {
    darkMode,
    initTheme,
    applyTheme,
    toggleTheme,
    syncFromServer
  }
})
