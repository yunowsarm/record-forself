<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReports } from '@/composables/useReports'
import type { WeeklyReport } from '@/types/report'
import { formatWeekLabel, getWeekWorkSummary } from '@/utils/week'
import { isValidDateString } from '@/lib/work-calendar'

const route = useRoute()
const router = useRouter()
const { getReport } = useReports()

const report = ref<WeeklyReport | null>(null)
const loading = ref(false)

const weekPeriodSummary = computed(() => {
  if (!report.value) return null
  if (!isValidDateString(report.value.week_start) || !isValidDateString(report.value.week_end)) {
    return null
  }
  return getWeekWorkSummary(report.value.week_start, report.value.week_end)
})

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

function statusLabel(status: string) {
  return status === 'published' ? '已发布' : '草稿'
}

onMounted(loadReport)
</script>

<template>
  <div v-loading="loading" class="report-detail-page">
    <main v-if="report" class="report-detail-page__main">
      <section class="page-title-section">
        <div class="page-title-section__head">
          <div class="page-title-section__text">
            <h2 class="page-title-section__title">查看周报</h2>
            <p class="page-title-section__desc">浏览周报内容与提交信息</p>
          </div>
          <button type="button" class="btn-back" @click="router.back()">返回</button>
        </div>
      </section>

      <section class="period-card">
        <div class="period-card__body">
          <span
            class="status-tag"
            :class="report.status === 'published' ? 'status-tag--published' : 'status-tag--draft'"
          >
            {{ statusLabel(report.status) }}
          </span>
          <template v-if="weekPeriodSummary">
            <p class="period-card__range">
              {{ formatWeekLabel(report.week_start, report.week_end) }}
            </p>
            <p class="period-card__meta">
              {{ weekPeriodSummary.label }} ｜ {{ weekPeriodSummary.hint }}
            </p>
          </template>
        </div>
      </section>

      <section class="content-card">
        <div class="content-card__section">
          <h3 class="content-card__label">本周完成</h3>
          <pre class="content-card__text">{{ report.completed_work || '—' }}</pre>
        </div>
        <hr class="content-card__divider" />
        <div class="content-card__section">
          <h3 class="content-card__label">进行中</h3>
          <pre class="content-card__text">{{ report.in_progress || '—' }}</pre>
        </div>
        <hr class="content-card__divider" />
        <div class="content-card__section">
          <h3 class="content-card__label">下周计划</h3>
          <pre class="content-card__text">{{ report.next_week_plan || '—' }}</pre>
        </div>
        <hr class="content-card__divider" />
        <div class="content-card__section">
          <h3 class="content-card__label">问题与风险</h3>
          <pre class="content-card__text">{{ report.issues || '—' }}</pre>
        </div>
        <p class="content-card__meta">
          更新于 {{ new Date(report.updated_at).toLocaleString('zh-CN') }}
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.report-detail-page {
  --detail-primary: #2f6bff;
  --detail-text: #101828;
  --detail-body: #475467;
  --detail-muted: #667085;
  --detail-border: #e4e7ec;

  min-height: calc(100vh - 56px - 32px);
  margin: 0 -16px;
}

.report-detail-page__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px 20px;
}

.page-title-section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-title-section__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--detail-text);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.page-title-section__desc {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--detail-muted);
}

.btn-back {
  flex-shrink: 0;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--detail-border);
  border-radius: 10px;
  background: #fff;
  color: var(--detail-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-back:active {
  background: #f9fafb;
}

.period-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
  border: 1px solid var(--detail-border);
}

.period-card__body {
  padding: 20px;
}

.status-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 999px;
}

.status-tag--published {
  color: #15803d;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
}

.status-tag--draft {
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.period-card__range {
  margin: 12px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--detail-text);
  line-height: 1.35;
}

.period-card__meta {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--detail-body);
  line-height: 1.5;
}

.content-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--detail-border);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
}

.content-card__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-card__label {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--detail-text);
}

.content-card__text {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.7;
  color: var(--detail-body);
}

.content-card__divider {
  margin: 14px 0;
  border: none;
  border-top: 1px solid var(--detail-border);
}

.content-card__meta {
  margin: 16px 0 0;
  font-size: 13px;
  color: #98a2b3;
}
</style>
