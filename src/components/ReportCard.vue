<script setup lang="ts">
import type { WeeklyReportWithAuthor } from '@/types/report'
import { formatWeekLabel, getWeekWorkSummary, isCurrentWeek } from '@/utils/week'

withDefaults(
  defineProps<{
    report: WeeklyReportWithAuthor
    showAuthor?: boolean
    canEdit?: boolean
    canDelete?: boolean
  }>(),
  {
    showAuthor: false,
    canEdit: true,
    canDelete: true,
  },
)

defineEmits<{
  view: []
  edit: []
  delete: []
}>()

function statusLabel(status: string) {
  return status === 'published' ? '已发布' : '草稿'
}

function workDaySummary(weekStart: string, weekEnd: string) {
  return getWeekWorkSummary(weekStart, weekEnd).label
}
</script>

<template>
  <article class="report-card" @click="$emit('view')">
    <div class="report-card__body">
      <div class="report-card__row1">
        <div class="report-card__range-wrap">
          <span v-if="showAuthor && report.author_name" class="report-card__author">
            {{ report.author_name }}
          </span>
          <span class="report-card__range">{{ formatWeekLabel(report.week_start, report.week_end) }}</span>
        </div>
        <span
          class="status-tag"
          :class="report.status === 'published' ? 'status-tag--published' : 'status-tag--draft'"
        >
          {{ statusLabel(report.status) }}
        </span>
      </div>

      <div class="report-card__row2">
        <span v-if="isCurrentWeek(report.week_start)" class="report-card__chip">本周</span>
        <span>{{ new Date(report.updated_at).toLocaleDateString('zh-CN') }} 提交</span>
        <span class="report-card__dot">·</span>
        <span>{{ workDaySummary(report.week_start, report.week_end) }}</span>
      </div>

      <p class="report-card__preview">
        {{ report.completed_work || '暂无内容' }}
      </p>
    </div>

    <div class="report-card__actions" @click.stop>
      <button type="button" class="action-btn" @click="$emit('view')">查看</button>
      <button v-if="canEdit" type="button" class="action-btn" @click="$emit('edit')">编辑</button>
      <button v-if="canDelete" type="button" class="action-btn action-btn--danger" @click="$emit('delete')">
        删除
      </button>
    </div>
  </article>
</template>

<style scoped>
.report-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  border: 1px solid #eef2f6;
  overflow: hidden;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.report-card:active {
  border-color: #dbe3ec;
}

.report-card__body {
  padding: 16px 16px 12px;
}

.report-card__row1 {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.report-card__range-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.report-card__author {
  font-size: 12px;
  color: #64748b;
}

.report-card__range {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.35;
}

.status-tag {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 999px;
  line-height: 1.2;
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

.report-card__row2 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.report-card__chip {
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11px;
}

.report-card__dot {
  color: #cbd5e1;
}

.report-card__preview {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: #475569;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid #f1f5f9;
}

.action-btn {
  flex: 1;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.action-btn:active {
  background: #f8fafc;
}

.action-btn--danger {
  flex: 0 0 auto;
  min-width: 56px;
  border: none;
  background: transparent;
  color: #dc2626;
}

.action-btn--danger:active {
  background: #fef2f2;
}
</style>
