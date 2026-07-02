<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReports } from '@/composables/useReports'
import type { ReportFormData, ReportStatus } from '@/types/report'
import {
  formatWeekLabel,
  getCurrentWeekRange,
  validateReportWeek,
  getBackfillWeekOptions,
  getWeekWorkSummary,
  type WeekOption,
} from '@/utils/week'
import { isValidDateString } from '@/lib/work-calendar'
import WeekPeriodSelect from '@/components/WeekPeriodSelect.vue'

const route = useRoute()
const router = useRouter()
const { getReport, createReport, updateReport } = useReports()

type EditorMode = 'current' | 'backfill' | 'edit'

const editorMode = computed<EditorMode>(() => {
  const mode = route.meta.editorMode as EditorMode | undefined
  if (mode) return mode
  return route.name === 'report-edit' ? 'edit' : 'current'
})

const isEdit = computed(() => editorMode.value === 'edit')
const reportId = computed(() => route.params.id as string | undefined)

const pageTitle = computed(() => {
  if (isEdit.value) return '编辑周报'
  if (editorMode.value === 'backfill') return '补录往期周报'
  return '填写本周周报'
})

const pageSubtitle = computed(() => {
  if (isEdit.value) return '填写本周工作内容，回顾进展并规划下一步'
  if (editorMode.value === 'backfill') return '可选择历史周补录，不可提前录入未来周'
  return '仅可填写当前周，往期请使用补录'
})

const selectedWeekStart = ref('')
const form = ref<ReportFormData>({
  week_start: '',
  week_end: '',
  completed_work: '',
  in_progress: '',
  next_week_plan: '',
  issues: '',
  status: 'draft',
})

const loading = ref(false)
const saving = ref(false)
const backfillOptions = ref<WeekOption[]>([])

const weekPeriodSummary = computed(() => {
  if (!isValidDateString(form.value.week_start) || !isValidDateString(form.value.week_end)) {
    return null
  }
  return getWeekWorkSummary(form.value.week_start, form.value.week_end)
})

function applyWeekRange(weekStart: string, weekEnd: string) {
  selectedWeekStart.value = weekStart
  form.value.week_start = weekStart
  form.value.week_end = weekEnd
}

function onBackfillChange(weekStart: string) {
  const option = backfillOptions.value.find((o) => o.weekStart === weekStart)
  if (option) applyWeekRange(option.weekStart, option.weekEnd)
}

async function loadReport() {
  if (!isEdit.value || !reportId.value) return

  loading.value = true
  try {
    const report = await getReport(reportId.value)
    form.value = {
      week_start: report.week_start,
      week_end: report.week_end,
      completed_work: report.completed_work,
      in_progress: report.in_progress,
      next_week_plan: report.next_week_plan,
      issues: report.issues ?? '',
      status: report.status,
    }
    selectedWeekStart.value = report.week_start
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
    router.push({ name: 'reports' })
  } finally {
    loading.value = false
  }
}

async function save(status: ReportStatus) {
  const weekError = validateReportWeek(form.value.week_start, editorMode.value)
  if (weekError) {
    ElMessage.warning(weekError)
    return
  }

  if (!form.value.completed_work.trim()) {
    ElMessage.warning('请填写本周完成内容')
    return
  }

  saving.value = true
  form.value.status = status
  try {
    if (isEdit.value && reportId.value) {
      await updateReport(reportId.value, form.value)
      ElMessage.success(status === 'published' ? '已发布' : '草稿已保存')
    } else {
      await createReport(form.value)
      ElMessage.success(status === 'published' ? '已发布' : '草稿已保存')
    }
    router.push({ name: 'reports' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '保存失败'
    if (msg.includes('duplicate') || msg.includes('unique')) {
      ElMessage.error('该周已有周报，请编辑已有记录')
    } else {
      ElMessage.error(msg)
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (editorMode.value === 'current') {
    const current = getCurrentWeekRange()
    applyWeekRange(current.weekStart, current.weekEnd)
  } else if (editorMode.value === 'backfill') {
    backfillOptions.value = getBackfillWeekOptions()
    if (backfillOptions.value.length) {
      const first = backfillOptions.value[0]!
      applyWeekRange(first.weekStart, first.weekEnd)
    }
  } else {
    loadReport()
  }
})
</script>

<template>
  <div v-loading="loading" class="weekly-report-edit-page">
    <main class="weekly-report-edit-page__main">
      <section class="page-title-section">
        <div class="page-title-section__head">
          <div class="page-title-section__text">
            <h2 class="page-title-section__title">{{ pageTitle }}</h2>
            <p class="page-title-section__desc">{{ pageSubtitle }}</p>
          </div>
          <button type="button" class="btn-back" @click="router.back()">返回</button>
        </div>
      </section>

      <section class="period-card">
        <div class="period-card__body">
          <template v-if="editorMode === 'backfill'">
            <p class="period-card__label">选择补录周期</p>
            <WeekPeriodSelect
              v-model="selectedWeekStart"
              :options="backfillOptions"
              placeholder="选择历史周"
              class="period-card__select"
              @change="onBackfillChange"
            />
          </template>
          <template v-else>
            <p class="period-card__label">报告周期</p>
          </template>

          <template v-if="weekPeriodSummary">
            <p class="period-card__range">
              {{ formatWeekLabel(form.week_start, form.week_end) }}
            </p>
            <p class="period-card__meta">
              {{ weekPeriodSummary.label }} ｜ {{ weekPeriodSummary.hint }}
            </p>
            <div
              v-if="weekPeriodSummary.holidays.length || weekPeriodSummary.adjustedWorkdays.length"
              class="period-card__tags"
            >
              <span
                v-for="h in weekPeriodSummary.holidays"
                :key="h.date"
                class="period-card__tag period-card__tag--off"
              >
                {{ h.date.slice(5) }} {{ h.name }}
              </span>
              <span
                v-for="w in weekPeriodSummary.adjustedWorkdays"
                :key="w.date"
                class="period-card__tag period-card__tag--work"
              >
                {{ w.date.slice(5) }} 调休
              </span>
            </div>
          </template>
        </div>
      </section>

      <div class="form-section-list">
        <section class="form-card">
          <div class="form-card__head">
            <label class="form-card__label" for="completed-work">
              本周完成
              <span class="form-card__required">*</span>
            </label>
          </div>
          <textarea
            id="completed-work"
            v-model="form.completed_work"
            class="form-card__textarea form-card__textarea--lg"
            placeholder="列出本周已完成的工作"
            rows="5"
          />
        </section>

        <section class="form-card">
          <div class="form-card__head">
            <label class="form-card__label" for="in-progress">进行中</label>
          </div>
          <textarea
            id="in-progress"
            v-model="form.in_progress"
            class="form-card__textarea"
            placeholder="正在进行的工作"
            rows="4"
          />
        </section>

        <section class="form-card">
          <div class="form-card__head">
            <label class="form-card__label" for="next-week-plan">下周计划</label>
          </div>
          <textarea
            id="next-week-plan"
            v-model="form.next_week_plan"
            class="form-card__textarea"
            placeholder="下周工作计划"
            rows="4"
          />
        </section>

        <section class="form-card">
          <div class="form-card__head">
            <label class="form-card__label" for="issues">问题与风险</label>
          </div>
          <textarea
            id="issues"
            v-model="form.issues"
            class="form-card__textarea form-card__textarea--sm"
            placeholder="可选，遇到的阻碍或风险"
            rows="3"
          />
        </section>
      </div>
    </main>

    <footer class="bottom-action-bar">
      <button
        type="button"
        class="bottom-action-bar__btn bottom-action-bar__btn--outline"
        :disabled="saving"
        @click="save('draft')"
      >
        {{ saving ? '保存中...' : '保存草稿' }}
      </button>
      <button
        type="button"
        class="bottom-action-bar__btn bottom-action-bar__btn--primary"
        :disabled="saving"
        @click="save('published')"
      >
        {{ saving ? '提交中...' : '发布周报' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.weekly-report-edit-page {
  --edit-primary: #2f6bff;
  --edit-primary-soft: rgba(47, 107, 255, 0.12);
  --edit-text: #101828;
  --edit-body: #475467;
  --edit-muted: #667085;
  --edit-border: #e4e7ec;
  --edit-input-border: #d0d5dd;

  min-height: calc(100vh - 56px - 32px);
  display: flex;
  flex-direction: column;
  margin: 0 -16px;
  padding-bottom: 88px;
}

.weekly-report-edit-page__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 16px;
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
  color: var(--edit-text);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.page-title-section__desc {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--edit-muted);
}

.btn-back {
  flex-shrink: 0;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--edit-border);
  border-radius: 10px;
  background: #fff;
  color: var(--edit-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-back:active {
  background: #f9fafb;
}

.period-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(16, 24, 40, 0.06);
  border: 1px solid var(--edit-border);
}

.period-card__body {
  padding: 20px;
}

.period-card__label {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--edit-muted);
}

.period-card__select {
  margin-top: 10px;
}

.period-card__range {
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--edit-text);
  line-height: 1.35;
}

.period-card__select + .period-card__range {
  margin-top: 14px;
}

.period-card__meta {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--edit-body);
  line-height: 1.5;
}

.period-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.period-card__tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--edit-border);
}

.period-card__tag--off {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.period-card__tag--work {
  color: var(--edit-primary);
  background: var(--edit-primary-soft);
  border-color: #bfdbfe;
}

.form-section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--edit-border);
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
}

.form-card__head {
  margin-bottom: 10px;
}

.form-card__label {
  font-size: 15px;
  font-weight: 600;
  color: var(--edit-text);
}

.form-card__required {
  color: #f04438;
  margin-left: 2px;
}

.form-card__textarea {
  display: block;
  width: 100%;
  min-height: 96px;
  padding: 12px 14px;
  border: 1px solid var(--edit-input-border);
  border-radius: 10px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--edit-text);
  background: #fff;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-card__textarea--lg {
  min-height: 132px;
}

.form-card__textarea--sm {
  min-height: 80px;
}

.form-card__textarea::placeholder {
  color: #98a2b3;
}

.form-card__textarea:focus {
  outline: none;
  border-color: var(--edit-primary);
  box-shadow: 0 0 0 3px var(--edit-primary-soft);
}

.bottom-action-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid var(--edit-border);
  box-shadow: 0 -4px 12px rgba(16, 24, 40, 0.06);
  z-index: 90;
  box-sizing: border-box;
}

.bottom-action-bar__btn {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.bottom-action-bar__btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.bottom-action-bar__btn:active:not(:disabled) {
  opacity: 0.88;
}

.bottom-action-bar__btn--outline {
  border: 1px solid var(--edit-primary);
  background: #fff;
  color: var(--edit-primary);
}

.bottom-action-bar__btn--primary {
  border: none;
  background: var(--edit-primary);
  color: #fff;
}
</style>
