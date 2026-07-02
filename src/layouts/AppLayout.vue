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
          <span class="app-header__user">{{ profile?.display_name ?? '用户' }}</span>
          <span class="app-header__sep">|</span>
          <button type="button" class="app-header__logout" @click="handleLogout">退出</button>
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
  background: #f5f7fb;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ec;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header__inner {
  max-width: 480px;
  margin: 0 auto;
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-header__logo {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #101828;
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
}

.app-header__user {
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #475467;
}

.app-header__sep {
  font-size: 12px;
  color: #d0d5dd;
  user-select: none;
}

.app-header__logout {
  border: none;
  background: transparent;
  color: #475467;
  font-size: 13px;
  padding: 6px 0;
  cursor: pointer;
}

.app-header__logout:active {
  background: #f1f5f9;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
}

@media (min-width: 481px) {
  .app-main {
    padding: 16px 20px 24px;
  }
}
</style>
