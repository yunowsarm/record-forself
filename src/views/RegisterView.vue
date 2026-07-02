<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuth } from "@/composables/useAuth";
import { isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase";

const router = useRouter();
const { signUp } = useAuth();

const displayName = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);

async function handleSubmit() {
  if (!isSupabaseConfigured) {
    ElMessage.error(supabaseConfigError ?? "Supabase 未配置");
    return;
  }

  if (!displayName.value || !email.value || !password.value) {
    ElMessage.warning("请填写完整信息");
    return;
  }

  if (password.value.length < 6) {
    ElMessage.warning("密码至少 6 位");
    return;
  }

  loading.value = true;
  try {
    const { session } = await signUp(
      email.value,
      password.value,
      displayName.value,
    );
    if (session) {
      ElMessage.success("注册成功");
      router.push("/");
    } else {
      ElMessage.success("注册成功，请查收邮件确认");
      router.push("/login");
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "注册失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__container">
      <div class="auth-page__brand">
        <h1 class="auth-page__title">工作周报</h1>
        <p class="auth-page__desc">创建账号，开始记录</p>
      </div>

      <div class="u-card auth-card">
        <div class="u-card-body">
          <h2 class="auth-card__heading">注册</h2>
          <el-form label-position="top" @submit.prevent="handleSubmit">
            <el-form-item label="显示名称">
              <el-input
                v-model="displayName"
                placeholder="你的姓名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                size="large"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="password"
                type="password"
                placeholder="至少 6 位"
                show-password
                size="large"
              />
            </el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              size="large"
              style="width: 100%"
            >
              注册
            </el-button>
          </el-form>
          <p class="auth-card__footer u-text-muted">
            已有账号？
            <router-link to="/login">去登录</router-link>
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
