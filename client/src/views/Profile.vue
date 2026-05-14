<template>
  <div class="profile-container">
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
      <p class="page-desc">管理您的个人信息和账户设置</p>
    </div>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="16">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">个人信息</span>
            </div>
          </template>
          <div v-loading="profileLoading" class="profile-form">
            <div class="avatar-section">
              <el-avatar :size="80" :src="avatarPreview || authStore.userAvatar">
                {{ authStore.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="avatar-actions">
                <el-button size="small" @click="triggerUpload">更换头像</el-button>
                <input
                  ref="uploadInputRef"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarChange"
                />
                <span class="avatar-hint">支持 JPG/PNG，建议 1:1 比例</span>
              </div>
            </div>

            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="90px"
              label-position="top"
            >
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="profileForm.nickname" placeholder="请输入昵称" maxlength="30" />
              </el-form-item>
              <el-form-item label="个人简介" prop="bio">
                <el-input
                  v-model="profileForm.bio"
                  type="textarea"
                  :rows="3"
                  placeholder="介绍一下自己吧"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" disabled />
                <div class="form-item-hint">邮箱暂不支持修改</div>
              </el-form-item>
            </el-form>

            <div class="form-actions">
              <el-button type="primary" :loading="profileSaving" @click="handleSaveProfile">
                保存修改
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">修改密码</span>
            </div>
          </template>
          <el-collapse v-model="activePasswordPanel">
            <el-collapse-item title="点击修改密码" name="password">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="110px"
                label-position="top"
              >
                <el-form-item label="当前密码" prop="oldPassword">
                  <el-input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    show-password
                    placeholder="请输入当前密码"
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    show-password
                    placeholder="8-20位，需包含大写字母、小写字母和数字"
                  />
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    show-password
                    placeholder="请再次输入新密码"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="passwordSaving" @click="handleSavePassword">
                    更新密码
                  </el-button>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">账户信息</span>
            </div>
          </template>
          <div v-loading="profileLoading" class="account-info">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ authStore.user?.username || '--' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">注册日期</span>
              <span class="info-value">{{ formatDate(authStore.user?.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">会员天数</span>
              <span class="info-value highlight">{{ memberDays }} 天</span>
            </div>
            <el-divider />
            <div class="info-row">
              <span class="info-label">账户状态</span>
              <el-tag type="success" size="small" effect="plain">正常</el-tag>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="section-card danger-card">
          <template #header>
            <div class="card-header">
              <span class="card-title danger-title">危险区域</span>
            </div>
          </template>
          <div class="danger-actions">
            <p class="danger-desc">退出登录后需要重新输入账号密码</p>
            <el-button type="danger" @click="handleLogout">退出登录</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, updatePassword } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const profileLoading = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const profileFormRef = ref(null)
const passwordFormRef = ref(null)
const uploadInputRef = ref(null)
const activePasswordPanel = ref([])

const avatarPreview = ref('')

const profileForm = reactive({
  nickname: '',
  bio: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileRules = {
  nickname: [
    { max: 30, message: '昵称长度不能超过 30 个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '简介长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符之间', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!passwordRegex.test(value)) {
          callback(new Error('密码需包含大写字母、小写字母和数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const memberDays = computed(() => {
  if (!authStore.user?.createdAt) return 0
  const created = dayjs(authStore.user.createdAt)
  return dayjs().diff(created, 'day')
})

function formatDate(date) {
  if (!date) return '--'
  return dayjs(date).format('YYYY年MM月DD日')
}

function triggerUpload() {
  uploadInputRef.value?.click()
}

function handleAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    avatarPreview.value = event.target.result
  }
  reader.readAsDataURL(file)
}

async function fetchProfile() {
  profileLoading.value = true
  try {
    const res = await getProfile()
    const user = res?.user || res?.data || res
    if (user) {
      profileForm.nickname = user.nickname || user.username || ''
      profileForm.bio = user.bio || ''
      profileForm.email = user.email || ''
      if (user.avatar) {
        avatarPreview.value = user.avatar
      }
      authStore.updateUser(user)
    }
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '获取用户信息失败'
    ElMessage.error(msg)
  } finally {
    profileLoading.value = false
  }
}

async function handleSaveProfile() {
  const valid = await profileFormRef.value.validate().catch(() => false)
  if (!valid) return

  profileSaving.value = true
  try {
    const data = {
      nickname: profileForm.nickname,
      bio: profileForm.bio
    }
    if (avatarPreview.value && avatarPreview.value !== authStore.userAvatar) {
      data.avatar = avatarPreview.value
    }
    const res = await updateProfile(data)
    if (res?.user) {
      authStore.updateUser(res.user)
    }
    ElMessage.success('个人信息更新成功')
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '更新失败'
    ElMessage.error(msg)
  } finally {
    profileSaving.value = false
  }
}

async function handleSavePassword() {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  passwordSaving.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    activePasswordPanel.value = []
    authStore.logout()
    router.push('/login')
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || '密码修改失败'
    ElMessage.error(msg)
  } finally {
    passwordSaving.value = false
  }
}

function handleLogout() {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '确认退出',
    {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.section-card {
  border-radius: 12px;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.profile-form {
  min-height: 200px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avatar-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.form-item-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.account-info {
  min-height: 100px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
}

.info-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.info-value.highlight {
  color: var(--el-color-primary);
  font-weight: 600;
}

.danger-card {
  border: 1px solid var(--el-color-danger-light-5);
}

.danger-title {
  color: var(--el-color-danger);
}

.danger-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.danger-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
