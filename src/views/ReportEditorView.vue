<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useReports } from '@/composables/useReports'
import type { ReportFormData, ReportStatus } from '@/types/report'
import {
  getCurrentWeekRange,
  validateReportWeek,
  getBackfillWeekOptions,
  type WeekOption,
} from '@/utils/week'
import WeekRangeDisplay from '@/components/WeekRangeDisplay.vue'

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

function applyWeekRange(weekStart: string, weekEnd: string) {
  selectedWeekStart.value = weekStart
  form.value.week_start = weekStart
  form.value.week_end = weekEnd
}

const selectedBackfillOption = computed(() =>
  backfillOptions.value.find((o) => o.weekStart === selectedWeekStart.value),
)

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
  <div v-loading="loading" class="u-page editor">
    <header class="u-page-header">
      <div>
        <h2 class="u-page-title">{{ pageTitle }}</h2>
        <p v-if="editorMode === 'current'" class="u-page-subtitle">
          仅可填写当前周，往期请使用补录
        </p>
        <p v-else-if="editorMode === 'backfill'" class="u-page-subtitle">
          可选择历史周补录，不可提前录入未来周
        </p>
      </div>
      <el-button @click="router.back()">返回</el-button>
    </header>

    <div class="u-card editor__card">
      <div class="u-card-body u-stack">
        <section v-if="editorMode === 'current' || isEdit" class="editor__week">
          <label class="editor__label">报告周期</label>
          <WeekRangeDisplay
            v-if="form.week_start && form.week_end"
            :week-start="form.week_start"
            :week-end="form.week_end"
            show-hint
          />
        </section>

        <section v-else-if="editorMode === 'backfill'" class="editor__week">
          <label class="editor__label">选择补录周期</label>
          <el-select
            v-model="selectedWeekStart"
            placeholder="选择历史周"
            filterable
            fit-input-width
            class="backfill-select"
            popper-class="backfill-week-popper"
            @change="onBackfillChange"
          >
            <template v-if="selectedBackfillOption" #label>
              <div class="week-opt week-opt--selected">
                <span class="week-opt__title">{{ selectedBackfillOption.workDayTitle }}</span>
                <span class="week-opt__detail">{{ selectedBackfillOption.workDayDetail }}</span>
              </div>
            </template>
            <el-option
              v-for="opt in backfillOptions"
              :key="opt.weekStart"
              :label="opt.label"
              :value="opt.weekStart"
            >
              <div class="week-opt">
                <span class="week-opt__title">{{ opt.workDayTitle }}</span>
                <span class="week-opt__detail">{{ opt.workDayDetail }}</span>
              </div>
            </el-option>
          </el-select>
          <WeekRangeDisplay
            v-if="form.week_start"
            :week-start="form.week_start"
            :week-end="form.week_end"
            show-hint
          />
        </section>

        <hr class="u-divider" />

        <el-form label-position="top" class="editor__form">
          <el-form-item label="本周完成" required>
            <el-input
              v-model="form.completed_work"
              type="textarea"
              :rows="4"
              placeholder="列出本周已完成的工作"
            />
          </el-form-item>

          <el-form-item label="进行中">
            <el-input
              v-model="form.in_progress"
              type="textarea"
              :rows="3"
              placeholder="正在进行的工作"
            />
          </el-form-item>

          <el-form-item label="下周计划">
            <el-input
              v-model="form.next_week_plan"
              type="textarea"
              :rows="3"
              placeholder="下周工作计划"
            />
          </el-form-item>

          <el-form-item label="问题与风险">
            <el-input
              v-model="form.issues"
              type="textarea"
              :rows="2"
              placeholder="可选，遇到的阻碍或风险"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="editor__footer">
        <el-button :loading="saving" @click="save('draft')">保存草稿</el-button>
        <el-button type="primary" :loading="saving" @click="save('published')">发布</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor__card {
  overflow: hidden;
}

.editor__label {
  display: block;
  font-size: var(--font-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.editor__week {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.editor__form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  background: #fafbfc;
}

@media (max-width: 768px) {
  .editor__footer {
    position: sticky;
    bottom: 0;
    padding: var(--space-3) var(--space-4);
    box-shadow: 0 -2px 8px rgba(15, 23, 42, 0.06);
  }

  .editor__footer .el-button {
    flex: 1;
  }
}

.backfill-select {
  width: 100%;
}

.backfill-select :deep(.el-select__wrapper) {
  min-height: 52px;
  height: auto;
  padding-top: 6px;
  padding-bottom: 6px;
}

.week-opt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
  line-height: 1.4;
  min-width: 0;
}

.week-opt--selected {
  padding: 0;
}

.week-opt__title {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text);
}

.week-opt__detail {
  font-size: var(--font-xs);
  color: var(--color-text-muted);
  white-space: normal;
  word-break: break-word;
}
</style>

<style>
.backfill-week-popper.el-select__popper {
  box-sizing: border-box;
}

.backfill-week-popper .el-select-dropdown__wrap {
  max-width: 100%;
}

.backfill-week-popper .el-select-dropdown__item {
  height: auto;
  min-height: 48px;
  padding: 10px 12px;
  line-height: 1.4;
  white-space: normal;
}
</style>
