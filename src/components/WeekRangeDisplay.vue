<script setup lang="ts">
import { computed } from 'vue'
import { formatWeekLabel, getWeekWorkSummary } from '@/utils/week'
import { isValidDateString } from '@/lib/work-calendar'

const props = defineProps<{
  weekStart: string
  weekEnd: string
  showHint?: boolean
  compact?: boolean
}>()

const isReady = computed(() => isValidDateString(props.weekStart) && isValidDateString(props.weekEnd))

const summary = computed(() =>
  isReady.value ? getWeekWorkSummary(props.weekStart, props.weekEnd) : null,
)
</script>

<template>
  <div v-if="isReady && summary" class="week-range" :class="{ 'week-range--compact': compact }">
    <div class="week-range__main">
      <span class="week-range__dates">{{ formatWeekLabel(weekStart, weekEnd) }}</span>
      <span class="week-range__work">{{ summary.label }}</span>
    </div>
    <p v-if="showHint && !compact" class="week-range__hint">{{ summary.hint }}</p>
    <div v-if="!compact && (summary.holidays.length || summary.adjustedWorkdays.length)" class="week-range__tags">
      <span
        v-for="h in summary.holidays"
        :key="h.date"
        class="week-range__tag week-range__tag--off"
      >
        {{ h.date.slice(5) }} {{ h.name }}
      </span>
      <span
        v-for="w in summary.adjustedWorkdays"
        :key="w.date"
        class="week-range__tag week-range__tag--work"
      >
        {{ w.date.slice(5) }} 调休
      </span>
    </div>
  </div>
</template>

<style scoped>
.week-range {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.week-range__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.week-range__dates {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-text);
}

.week-range--compact .week-range__dates {
  font-size: var(--font-base);
}

.week-range__work {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.week-range__hint {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--color-text-muted);
}

.week-range__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.week-range__tag {
  font-size: var(--font-xs);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.week-range__tag--off {
  color: var(--color-warning);
  background: #fffbeb;
  border-color: #fde68a;
}

.week-range__tag--work {
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-color: #bfdbfe;
}
</style>
