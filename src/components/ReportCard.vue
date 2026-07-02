<script setup lang="ts">
import type { WeeklyReport } from '@/types/report'
import { isCurrentWeek } from '@/utils/week'
import WeekRangeDisplay from './WeekRangeDisplay.vue'

defineProps<{
  report: WeeklyReport
}>()

defineEmits<{
  view: []
  edit: []
  delete: []
}>()

function statusClass(status: string) {
  return status === 'published' ? 'u-badge--published' : 'u-badge--draft'
}

function statusLabel(status: string) {
  return status === 'published' ? '已发布' : '草稿'
}
</script>

<template>
  <article class="report-card u-card" @click="$emit('view')">
    <div class="report-card__body">
      <div class="report-card__top">
        <div class="report-card__meta">
          <span v-if="isCurrentWeek(report.week_start)" class="u-badge u-badge--current">本周</span>
          <span class="u-badge" :class="statusClass(report.status)">
            {{ statusLabel(report.status) }}
          </span>
        </div>
        <span class="report-card__time u-text-muted">
          {{ new Date(report.updated_at).toLocaleDateString('zh-CN') }}
        </span>
      </div>

      <WeekRangeDisplay
        :week-start="report.week_start"
        :week-end="report.week_end"
        compact
      />

      <p class="report-card__preview u-text-muted">
        {{ report.completed_work || '暂无内容' }}
      </p>
    </div>

    <div class="report-card__actions" @click.stop>
      <el-button size="small" @click="$emit('view')">查看</el-button>
      <el-button size="small" type="primary" plain @click="$emit('edit')">编辑</el-button>
      <el-button size="small" type="danger" text @click="$emit('delete')">删除</el-button>
    </div>
  </article>
</template>

<style scoped>
.report-card {
  transition: box-shadow var(--transition), border-color var(--transition);
  cursor: pointer;
}

.report-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.report-card__body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.report-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.report-card__meta {
  display: flex;
  gap: var(--space-2);
}

.report-card__preview {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.report-card__actions {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  background: #fafbfc;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
</style>
