import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { title: '忘记密码', guest: true }
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/Schedule.vue'),
        meta: { title: '日程管理' }
      },
      {
        path: 'habits',
        name: 'Habits',
        component: () => import('@/views/Habits.vue'),
        meta: { title: '习惯管理' }
      },
      {
        path: 'checkin',
        name: 'CheckIn',
        component: () => import('@/views/CheckIn.vue'),
        meta: { title: '每日打卡' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
        meta: { title: '数据分析' }
      },
      {
        path: 'social',
        name: 'Social',
        component: () => import('@/views/Social.vue'),
        meta: { title: '社区' }
      },
      {
        path: 'achievements',
        name: 'Achievements',
        component: () => import('@/views/Achievements.vue'),
        meta: { title: '成就' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '通知' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 智能生活助手` : '智能生活助手'

  const token = localStorage.getItem('token')

  if (to.matched.some((record) => record.meta.requiresAuth !== false) && !to.meta.guest) {
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else if (to.meta.guest && token) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
