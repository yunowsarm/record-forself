<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { profile, signOut } = useAuth()

async function handleLogout() {
  await signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="app-header__inner">
        <h1 class="app-header__logo">工作周报</h1>
        <div class="app-header__actions">
          <span class="app-header__user u-text-muted">{{ profile?.display_name ?? '用户' }}</span>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.app-header__logo {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__user {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-main {
  flex: 1;
  max-width: var(--content-max-width);
  width: 100%;
  margin: 0 auto;
  padding: var(--space-4);
}

@media (min-width: 769px) {
  .app-main {
    padding: var(--space-6);
  }
}
</style>
