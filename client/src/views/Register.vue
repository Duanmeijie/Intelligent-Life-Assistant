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
      <div class="auth-header">
        <div class="auth-logo">
          <svg viewBox="0 0 48 48" width="48" height="48">
            <defs>
              <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1"/>
                <stop offset="100%" style="stop-color:#a855f7"/>
              </linearGradient>
            </defs>
            <rect x="6" y="4" width="36" height="40" rx="8" fill="url(#logoGrad2)" opacity="0.15"/>
            <circle cx="24" cy="18" r="14" stroke="url(#logoGrad2)" stroke-width="2.5" fill="none"/>
            <path d="M24 14 L24 20 L30 26" stroke="url(#logoGrad2)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="text-gradient">创建账户</h1>
        <p class="auth-subtitle">填写以下信息开始使用智能生活助手</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="auth-form"
        @keyup.enter="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名（3-20位）"
            size="large"
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入邮箱"
            size="large"
            :prefix-icon="Message"
            class="custom-input"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（8-20位，含大小写字母和数字）"
            size="large"
            :prefix-icon="Lock"
            show-password
            class="custom-input"
            @input="onPasswordInput"
          />
          <div v-if="form.password" class="password-strength">
            <div class="strength-bars">
              <span
                v-for="i in 4"
                :key="i"
                class="strength-bar"
                :class="barClass(i)"
              ></span>
            </div>
            <span class="strength-text" :class="strengthTextClass">{{ strengthLabel }}</span>
          </div>
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            class="custom-input"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="agreedToTerms" class="terms-checkbox">
            <span class="terms-text">
              我已阅读并同意
              <a href="#" class="terms-link" @click.prevent>服务条款</a>
              和
              <a href="#" class="terms-link" @click.prevent>隐私政策</a>
            </span>
          </el-checkbox>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!agreedToTerms"
            @click="handleRegister"
            class="auth-btn btn-gradient"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <span>已有账户？</span>
        <router-link to="/login">立即登录</router-link>
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const agreedToTerms = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

let passwordStrength = ref(0)

function evaluateStrength(password) {
  let score = 0
  if (!password) return 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return Math.min(score, 4)
}

function onPasswordInput() {
  passwordStrength.value = evaluateStrength(form.password)
}

const strengthLabel = computed(() => {
  const labels = ['', '弱', '一般', '较强', '强']
  return labels[passwordStrength.value] || ''
})

const strengthTextClass = computed(() => {
  return `strength-level-${passwordStrength.value}`
})

function barClass(index) {
  if (passwordStrength.value === 0) return ''
  if (index <= passwordStrength.value) {
    return `bar-level-${passwordStrength.value}`
  }
  return 'bar-empty'
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 8 || value.length > 20) {
    callback(new Error('密码长度为8-20位'))
  } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    callback(new Error('密码需包含大写字母、小写字母和数字'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!agreedToTerms.value) {
    ElMessage.warning('请先同意服务条款和隐私政策')
    return
  }
  loading.value = true
  try {
    await register({
      username: form.username,
      email: form.email,
      password: form.password
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err) {
    console.error('注册失败:', err)
  } finally {
    loading.value = false
  }
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
  width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 48px 40px 32px;
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

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  margin-bottom: 20px;
  display: inline-block;
  animation: float 6s ease-in-out infinite;
}

.auth-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 18px;
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

.password-strength {
  margin-top: 10px;
}

.strength-bars {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #e8ecf4;
  transition: all 0.3s ease;
}

.bar-empty {
  background: #e8ecf4;
}

.bar-level-1 {
  background: #ef4444;
}

.bar-level-2 {
  background: #f59e0b;
}

.bar-level-3 {
  background: #3b82f6;
}

.bar-level-4 {
  background: #22c55e;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
}

.strength-level-1 { color: #ef4444; }
.strength-level-2 { color: #f59e0b; }
.strength-level-3 { color: #3b82f6; }
.strength-level-4 { color: #22c55e; }

.form-options {
  margin-bottom: 24px;
}

.terms-checkbox :deep(.el-checkbox__label) {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

.terms-checkbox :deep(.el-checkbox__inner) {
  border-radius: 4px;
}

.terms-text {
  color: #64748b;
}

.terms-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.terms-link:hover {
  color: var(--primary-dark);
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

.auth-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.auth-btn:not(:disabled):active {
  transform: translateY(0);
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
  padding-top: 8px;
}

.auth-footer a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
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
    padding: 36px 24px 24px;
    border-radius: 20px;
  }

  .auth-header h1 {
    font-size: 24px;
  }
}
</style>
