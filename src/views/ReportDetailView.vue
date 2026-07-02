<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReports } from '@/composables/useReports'
import type { WeeklyReport } from '@/types/report'
import WeekRangeDisplay from '@/components/WeekRangeDisplay.vue'

const route = useRoute()
const router = useRouter()
const { getReport } = useReports()

const report = ref<WeeklyReport | null>(null)
const loading = ref(false)

async function loadReport() {
  loading.value = true
  try {
    report.value = await getReport(route.params.id as string)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
    router.push({ name: 'reports' })
  } finally {
    loading.value = false
  }
}

function statusClass(status: string) {
  return status === 'published' ? 'u-badge--published' : 'u-badge--draft'
}

function statusLabel(status: string) {
  return status === 'published' ? '已发布' : '草稿'
}

onMounted(loadReport)
</script>

<template>
  <div v-loading="loading" class="u-page">
    <header v-if="report" class="u-page-header">
      <div>
        <span class="u-badge" :class="statusClass(report.status)">{{ statusLabel(report.status) }}</span>
        <WeekRangeDisplay
          class="detail__range"
          :week-start="report.week_start"
          :week-end="report.week_end"
          show-hint
        />
      </div>
      <div class="detail__actions u-row">
        <el-button @click="router.push({ name: 'reports' })">返回</el-button>
        <el-button type="primary" @click="router.push({ name: 'report-edit', params: { id: report.id } })">
          编辑
        </el-button>
      </div>
    </header>

    <div v-if="report" class="u-card">
      <div class="u-card-body u-stack">
        <section class="detail__section">
          <h3 class="detail__label">本周完成</h3>
          <pre class="detail__content">{{ report.completed_work || '—' }}</pre>
        </section>
        <hr class="u-divider" />
        <section class="detail__section">
          <h3 class="detail__label">进行中</h3>
          <pre class="detail__content">{{ report.in_progress || '—' }}</pre>
        </section>
        <hr class="u-divider" />
        <section class="detail__section">
          <h3 class="detail__label">下周计划</h3>
          <pre class="detail__content">{{ report.next_week_plan || '—' }}</pre>
        </section>
        <hr class="u-divider" />
        <section class="detail__section">
          <h3 class="detail__label">问题与风险</h3>
          <pre class="detail__content">{{ report.issues || '—' }}</pre>
        </section>
        <p class="u-text-muted detail__meta">
          更新于 {{ new Date(report.updated_at).toLocaleString('zh-CN') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail__range {
  margin-top: var(--space-2);
}

.detail__actions {
  flex-shrink: 0;
}

.detail__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.detail__label {
  margin: 0;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: none;
}

.detail__content {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: var(--font-base);
  line-height: 1.6;
  color: var(--color-text);
}

.detail__meta {
  margin: 0;
}

@media (max-width: 768px) {
  .detail__actions {
    width: 100%;
  }

  .detail__actions .el-button {
    flex: 1;
  }
}
</style>
