<template>
  <div class="auth-container">
    <div class="auth-bg">
      <div class="floating-orb orb-1"></div>
      <div class="floating-orb orb-2"></div>
      <div class="floating-orb orb-3"></div>
      <div class="floating-ring ring-1"></div>
      <div class="floating-ring ring-2"></div>
    </div>

    <div class="auth-card glass-card animate-scale-in">
      <div class="step-indicator">
        <div class="steps">
          <div class="step" :class="{ active: step === 1, completed: step > 1 }">
            <div class="step-circle">1</div>
            <span class="step-label">验证邮箱</span>
          </div>
          <div class="step-line" :class="{ filled: step > 1 }"></div>
          <div class="step" :class="{ active: step === 2 }">
            <div class="step-circle">2</div>
            <span class="step-label">重置密码</span>
          </div>
        </div>
      </div>

      <div class="auth-header">
        <h1>找回密码</h1>
        <p class="auth-subtitle">{{ step === 1 ? '请输入您的注册邮箱，我们将发送验证码' : '请设置您的新密码' }}</p>
      </div>

      <div v-if="step === 1">
        <el-form
          ref="emailFormRef"
          :model="emailForm"
          :rules="emailRules"
          label-position="top"
          class="auth-form"
          @keyup.enter="handleSendEmail"
        >
          <el-form-item prop="email">
            <el-input
              v-model="emailForm.email"
              placeholder="请输入注册邮箱"
              size="large"
              :prefix-icon="Message"
              class="custom-input"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="sending"
              @click="handleSendEmail"
              class="auth-btn btn-gradient"
            >
              发送验证码
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="step-two-content">
        <el-alert
          title="验证码已发送"
          :description="`验证码已发送至 ${emailForm.email}，请查收邮件`"
          type="success"
          :closable="false"
          show-icon
          class="email-alert"
        />

        <el-form
          ref="resetFormRef"
          :model="resetForm"
          :rules="resetRules"
          label-position="top"
          class="auth-form"
          @keyup.enter="handleReset"
        >
          <el-form-item prop="code">
            <el-input
              v-model="resetForm.code"
              placeholder="请输入验证码"
              size="large"
              :prefix-icon="Key"
              class="custom-input"
            >
              <template #suffix>
                <span class="resend-timer" v-if="countdown > 0">
                  {{ countdown }}s后重发
                </span>
                <el-button
                  v-else
                  link
                  type="primary"
                  :icon="RefreshRight"
                  @click="handleResend"
                  class="resend-btn"
                >
                  重新发送
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="newPassword">
            <el-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="请输入新密码（8-20位，含大小写字母和数字）"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="resetting"
              @click="handleReset"
              class="auth-btn btn-gradient"
            >
              重置密码
            </el-button>
          </el-form-item>
        </el-form>

        <div class="step-back">
          <el-button text type="primary" @click="goBack" class="back-btn">
            返回上一步
          </el-button>
        </div>
      </div>

      <div class="auth-footer">
        <router-link to="/login">返回登录</router-link>
      </div>

      <div class="auth-decoration">
        <svg viewBox="0 0 100 20" class="decoration-wave">
          <path d="M0 10 Q 25 0, 50 10 T 100 10" stroke="rgba(99,102,241,0.15)" stroke-width="1.5" fill="none"/>
          <path d="M0 14 Q 25 4, 50 14 T 100 14" stroke="rgba(168,85,247,0.1)" stroke-width="1" fill="none"/>
          <path d="M0 18 Q 25 8, 50 18 T 100 18" stroke="rgba(99,102,241,0.07)" stroke-width="1" fill="none"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { forgotPassword, resetPassword } from '@/api/auth'
import { Message, Lock, Key, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const step = ref(1)
const sending = ref(false)
const resetting = ref(false)
const countdown = ref(0)
const emailFormRef = ref(null)
const resetFormRef = ref(null)
let timer = null

const emailForm = reactive({ email: '' })
const resetForm = reactive({
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const resetRules = {
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
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
        if (value !== resetForm.newPassword) return callback(new Error('两次输入的密码不一致'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

function startCountdown() {
  countdown.value = 60
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onUnmounted(() => {
  clearInterval(timer)
})

async function handleSendEmail() {
  const valid = await emailFormRef.value.validate().catch(() => false)
  if (!valid) return
  sending.value = true
  try {
    await forgotPassword({ email: emailForm.email })
    ElMessage.success('验证码已发送，请查收邮件')
    step.value = 2
    startCountdown()
  } catch (err) {
    console.error('发送验证码失败:', err)
  } finally {
    sending.value = false
  }
}

async function handleResend() {
  sending.value = true
  try {
    await forgotPassword({ email: emailForm.email })
    ElMessage.success('验证码已重新发送')
    resetForm.code = ''
    startCountdown()
  } catch (err) {
    console.error('重新发送验证码失败:', err)
  } finally {
    sending.value = false
  }
}

async function handleReset() {
  const valid = await resetFormRef.value.validate().catch(() => false)
  if (!valid) return
  resetting.value = true
  try {
    await resetPassword({
      email: emailForm.email,
      token: resetForm.code,
      newPassword: resetForm.newPassword
    })
    ElMessage.success('密码重置成功，请使用新密码登录')
    router.push('/login')
  } catch (err) {
    console.error('重置密码失败:', err)
  } finally {
    resetting.value = false
  }
}

function goBack() {
  step.value = 1
  clearInterval(timer)
  timer = null
  countdown.value = 0
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.auth-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.auth-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 30%, rgba(99, 102, 241, 0.25) 0%, transparent 50%),
    radial-gradient(circle at 85% 70%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 50% 15%, rgba(251, 146, 60, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 60% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 40%);
}

.floating-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
}

.orb-1 {
  width: 300px;
  height: 300px;
  top: -80px;
  left: -60px;
  background: rgba(99, 102, 241, 0.25);
  animation: float 10s ease-in-out infinite;
}

.orb-2 {
  width: 240px;
  height: 240px;
  bottom: -60px;
  right: -40px;
  background: rgba(168, 85, 247, 0.2);
  animation: floatReverse 9s ease-in-out infinite;
  animation-delay: -2s;
}

.orb-3 {
  width: 180px;
  height: 180px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(251, 146, 60, 0.12);
  animation: float 12s ease-in-out infinite;
  animation-delay: -4s;
}

.floating-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.ring-1 {
  width: 400px;
  height: 400px;
  top: 10%;
  right: -120px;
  animation: float 14s ease-in-out infinite;
  animation-delay: -1s;
}

.ring-2 {
  width: 350px;
  height: 350px;
  bottom: -80px;
  left: -100px;
  animation: floatReverse 16s ease-in-out infinite;
  animation-delay: -3s;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 36px 40px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.step-indicator {
  margin-bottom: 28px;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e8ecf4;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step.active .step-circle {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transform: scale(1.1);
}

.step.completed .step-circle {
  background: var(--gradient-success);
  color: white;
}

.step-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  transition: color 0.3s ease;
}

.step.active .step-label {
  color: var(--primary);
  font-weight: 600;
}

.step.completed .step-label {
  color: var(--success);
}

.step-line {
  width: 60px;
  height: 2px;
  background: #e8ecf4;
  margin: 0 8px;
  margin-top: -26px;
  transition: background 0.4s ease;
  border-radius: 1px;
}

.step-line.filled {
  background: var(--success);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.auth-form :deep(.el-form-item__error) {
  font-size: 12px;
  padding-top: 2px;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: rgba(248, 249, 252, 0.9);
  border: 1px solid #e8ecf4;
  box-shadow: none;
  transition: all 0.25s ease;
  padding: 2px 12px;
}

.custom-input :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.95);
  border-color: #c4b5fd;
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 1);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.custom-input :deep(.el-input__inner) {
  color: #1e293b;
  font-size: 14px;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: #94a3b8;
  font-size: 13px;
}

.email-alert {
  margin-bottom: 20px;
  border-radius: 12px;
}

.email-alert :deep(.el-alert__title) {
  font-size: 14px;
}

.email-alert :deep(.el-alert__description) {
  font-size: 12px;
}

.resend-timer {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  user-select: none;
}

.resend-btn {
  font-size: 12px;
  padding: 0;
  white-space: nowrap;
}

.auth-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 3px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.auth-btn:active {
  transform: translateY(0);
}

.step-back {
  text-align: center;
  margin-top: -8px;
  margin-bottom: 4px;
}

.back-btn {
  font-size: 13px;
  font-weight: 500;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  padding-top: 12px;
}

.auth-footer a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.auth-footer a:hover {
  color: var(--primary-dark);
}

.auth-decoration {
  margin-top: 20px;
  text-align: center;
}

.decoration-wave {
  width: 80%;
  max-width: 260px;
  opacity: 0.6;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(3deg); }
  50% { transform: translateY(-10px) rotate(-2deg); }
  75% { transform: translateY(-25px) rotate(1deg); }
}

@keyframes floatReverse {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(20px) rotate(-3deg); }
  50% { transform: translateY(10px) rotate(2deg); }
  75% { transform: translateY(25px) rotate(-1deg); }
}

@media (max-width: 480px) {
  .auth-card {
    width: calc(100vw - 32px);
    padding: 32px 24px 24px;
    border-radius: 20px;
  }

  .auth-header h1 {
    font-size: 24px;
  }

  .step-line {
    width: 40px;
  }
}
</style>
