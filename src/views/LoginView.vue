<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuth } from '@/composables/useAuth'
import { isSupabaseConfigured, supabaseConfigError } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!isSupabaseConfigured) {
    ElMessage.error(supabaseConfigError ?? 'Supabase 未配置')
    return
  }

  if (!email.value || !password.value) {
    ElMessage.warning('请填写邮箱和密码')
    return
  }

  loading.value = true
  try {
    await signIn(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__container">
      <div class="auth-page__brand">
        <h1 class="auth-page__title">工作周报</h1>
        <p class="auth-page__desc">记录工作、追踪进度</p>
      </div>

      <div class="u-card auth-card">
        <div class="u-card-body">
          <h2 class="auth-card__heading">登录</h2>
          <el-form label-position="top" @submit.prevent="handleSubmit">
            <el-form-item label="邮箱">
              <el-input v-model="email" type="email" placeholder="请输入邮箱" size="large" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="password"
                type="password"
                placeholder="请输入密码"
                show-password
                size="large"
              />
            </el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" size="large" style="width: 100%">
              登录
            </el-button>
          </el-form>
          <p class="auth-card__footer u-text-muted">
            还没有账号？
            <router-link to="/register">立即注册</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg);
}

.auth-page__container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.auth-page__brand {
  text-align: center;
}

.auth-page__title {
  margin: 0;
  font-size: var(--font-2xl);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.auth-page__desc {
  margin: var(--space-2) 0 0;
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.auth-card__heading {
  margin: 0 0 var(--space-5);
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-text);
}

.auth-card__footer {
  margin: var(--space-4) 0 0;
  text-align: center;
  font-size: var(--font-sm);
}

.auth-card :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--color-text-secondary);
}
</style>
