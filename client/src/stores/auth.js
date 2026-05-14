import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => user.value?.id || null)
  const username = computed(() => user.value?.username || '')
  const userAvatar = computed(() => user.value?.avatar || '')

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUser(userInfo) {
    user.value = userInfo
    localStorage.setItem('user', JSON.stringify(userInfo))
  }

  async function login(loginData) {
    const res = await loginApi(loginData.username, loginData.password)
    if (res.data && res.data.token) {
      setToken(res.data.token)
    }
    if (res.data && res.data.user) {
      setUser(res.data.user)
    }
    return res
  }

  async function register(registerData) {
    const res = await registerApi(registerData.username, registerData.email, registerData.password)
    if (res.data && res.data.token) {
      setToken(res.data.token)
    }
    if (res.data && res.data.user) {
      setUser(res.data.user)
    }
    return res
  }

  async function checkAuth() {
    if (!token.value) {
      return false
    }
    try {
      const res = await getProfile()
      if (res.user) {
        setUser(res.user)
      }
      return true
    } catch {
      logout()
      return false
    }
  }

  function updateUser(userInfo) {
    setUser(userInfo)
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    userId,
    username,
    userAvatar,
    login,
    register,
    checkAuth,
    updateUser,
    logout
  }
})
