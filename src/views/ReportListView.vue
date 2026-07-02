<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReports } from '@/composables/useReports'
import { useAuth } from '@/composables/useAuth'
import type { Profile, ReportListScope, ReportStatus, WeeklyReportWithAuthor } from '@/types/report'
import { REPORT_PAGE_SIZE } from '@/types/report'
import {
  formatWeekLabel,
  getCurrentWeekRange,
  getFilterWeekOptions,
  getWeekWorkSummary,
  type WeekOption,
} from '@/utils/week'
import ReportCard from '@/components/ReportCard.vue'
import WeekPeriodSelect from '@/components/WeekPeriodSelect.vue'

const router = useRouter()
const { user } = useAuth()
const { listReportsPaginated, listProfiles, deleteReport, getReportByWeekStart } = useReports()

const viewScope = ref<ReportListScope>('mine')
const reports = ref<WeeklyReportWithAuthor[]>([])
const profiles = ref<Profile[]>([])
const currentWeekReport = ref<WeeklyReportWithAuthor | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const page = ref(0)

const filterStatus = ref<ReportStatus | ''>('')
const filterUserId = ref('')
const filterWeek = ref('')

const weekFilterOptions = ref<WeekOption[]>(getFilterWeekOptions())
const loadMoreRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const currentWeek = computed(() => getCurrentWeekRange())
const isAllView = computed(() => viewScope.value === 'all')
const currentWeekSummary = computed(() =>
  getWeekWorkSummary(currentWeek.value.weekStart, currentWeek.value.weekEnd),
)

const pageSubtitle = computed(() =>
  isAllView.value
    ? '查看团队已发布周报，支持人员与周期筛选'
    : '管理工作记录，支持本周填写与往期补录',
)

const listFilters = computed(() => ({
  scope: viewScope.value,
  status: filterStatus.value,
  userId: filterUserId.value || undefined,
  dateFrom: filterWeek.value || undefined,
  dateTo: filterWeek.value || undefined,
}))

function isOwnReport(report: WeeklyReportWithAuthor) {
  return report.user_id === user.value?.id
}

function statusLabel(status: ReportStatus) {
  return status === 'published' ? '已发布' : '草稿'
}

async function fetchPage(pageIndex: number, append: boolean) {
  const result = await listReportsPaginated(listFilters.value, pageIndex, REPORT_PAGE_SIZE)
  reports.value = append ? [...reports.value, ...result.items] : result.items
  hasMore.value = result.hasMore
  page.value = pageIndex
}

async function loadReports(reset = true) {
  if (reset) {
    loading.value = true
    page.value = 0
  }
  try {
    await fetchPage(0, false)
    if (viewScope.value === 'mine') {
      currentWeekReport.value = await getReportByWeekStart(currentWeek.value.weekStart)
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  try {
    await fetchPage(page.value + 1, true)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载更多失败')
  } finally {
    loadingMore.value = false
  }
}

function setupObserver() {
  observer?.disconnect()
  if (!loadMoreRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadMore()
    },
    { rootMargin: '80px' },
  )
  observer.observe(loadMoreRef.value)
}

function onFiltersChange() {
  loadReports(true)
}

function goCurrentWeekReport() {
  if (currentWeekReport.value) {
    router.push({ name: 'report-edit', params: { id: currentWeekReport.value.id } })
  } else {
    router.push({ name: 'report-new' })
  }
}

async function handleDelete(row: WeeklyReportWithAuthor) {
  if (!isOwnReport(row)) return

  try {
    await ElMessageBox.confirm(
      `确定删除 ${formatWeekLabel(row.week_start, row.week_end)} 的周报？`,
      '确认删除',
      { type: 'warning' },
    )
    await deleteReport(row.id)
    ElMessage.success('已删除')
    await loadReports(true)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err instanceof Error ? err.message : '删除失败')
    }
  }
}

watch(viewScope, (scope) => {
  if (scope === 'all') filterStatus.value = ''
  loadReports(true)
})

watch(loadMoreRef, () => setupObserver())

onMounted(async () => {
  weekFilterOptions.value = getFilterWeekOptions()
  try {
    profiles.value = await listProfiles()
  } catch {
    // 未执行迁移时仅影响人员筛选
  }
  await loadReports(true)
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div v-loading="loading" class="report-list-page">
    <header class="page-head">
      <h2 class="page-head__title">{{ isAllView ? '全部周报' : '我的周报' }}</h2>
      <p class="page-head__desc">{{ pageSubtitle }}</p>
    </header>

    <div class="scope-tabs">
      <button
        type="button"
        class="scope-tabs__btn"
        :class="{ 'scope-tabs__btn--active': viewScope === 'mine' }"
        @click="viewScope = 'mine'"
      >
        我的周报
      </button>
      <button
        type="button"
        class="scope-tabs__btn"
        :class="{ 'scope-tabs__btn--active': viewScope === 'all' }"
        @click="viewScope = 'all'"
      >
        全部周报
      </button>
    </div>

    <section v-if="!isAllView" class="hero-card">
      <div class="hero-card__badge">本周周报</div>
      <p class="hero-card__range">
        {{ formatWeekLabel(currentWeek.weekStart, currentWeek.weekEnd) }}
      </p>
      <p class="hero-card__meta">{{ currentWeekSummary.label }}</p>
      <div v-if="currentWeekReport" class="hero-card__status-row">
        <span
          class="status-tag"
          :class="currentWeekReport.status === 'published' ? 'status-tag--published' : 'status-tag--draft'"
        >
          {{ statusLabel(currentWeekReport.status) }}
        </span>
      </div>
      <div class="hero-card__actions">
        <button type="button" class="btn btn--primary" @click="goCurrentWeekReport">
          {{ currentWeekReport ? '继续编辑本周' : '填写本周周报' }}
        </button>
        <button type="button" class="btn btn--outline" @click="router.push({ name: 'report-backfill' })">
          补录往期
        </button>
      </div>
    </section>

    <section class="filter-card">
      <div v-if="isAllView" class="filter-card__row">
        <label class="filter-label">人员</label>
        <el-select
          v-model="filterUserId"
          placeholder="全部人员"
          clearable
          filterable
          class="filter-select"
          @change="onFiltersChange"
        >
          <el-option
            v-for="p in profiles"
            :key="p.id"
            :label="p.display_name"
            :value="p.id"
          />
        </el-select>
      </div>

      <div class="filter-card__row">
        <label class="filter-label">周期</label>
        <WeekPeriodSelect
          v-model="filterWeek"
          :options="weekFilterOptions"
          placeholder="不限"
          @change="onFiltersChange"
        />
      </div>

      <div v-if="!isAllView" class="filter-card__row">
        <label class="filter-label">状态</label>
        <el-select
          v-model="filterStatus"
          placeholder="全部状态"
          clearable
          class="filter-select"
          @change="onFiltersChange"
        >
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
        </el-select>
      </div>
    </section>

    <div class="list-section">
      <ReportCard
        v-for="report in reports"
        :key="report.id"
        :report="report"
        :show-author="isAllView"
        :can-edit="isOwnReport(report)"
        :can-delete="isOwnReport(report)"
        @view="router.push({ name: 'report-detail', params: { id: report.id } })"
        @edit="router.push({ name: 'report-edit', params: { id: report.id } })"
        @delete="handleDelete(report)"
      />
      <el-empty v-if="!loading && reports.length === 0" description="暂无周报记录" />
    </div>

    <div ref="loadMoreRef" class="load-more">
      <p v-if="loadingMore" class="load-more__text">加载中...</p>
      <p v-else-if="!hasMore && reports.length > 0" class="load-more__text">没有更多了</p>
    </div>
  </div>
</template>

<style scoped>
.report-list-page {
  min-height: calc(100vh - var(--header-height) - 32px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 20px;
}

.page-head__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.page-head__desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.scope-tabs {
  display: flex;
  padding: 4px;
  background: #e9eef5;
  border-radius: 12px;
  gap: 4px;
}

.scope-tabs__btn {
  flex: 1;
  height: 36px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.scope-tabs__btn--active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.hero-card {
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 18px 16px;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
}

.hero-card__badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 2px 8px;
}

.hero-card__range {
  margin: 12px 0 0;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.hero-card__meta {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.hero-card__status-row {
  margin-top: 12px;
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

.hero-card__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.btn {
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn:active {
  opacity: 0.88;
}

.btn--primary {
  border: none;
  background: #2563eb;
  color: #fff;
}

.btn--outline {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.filter-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  border: 1px solid #eef2f6;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.filter-select {
  width: 100%;
}

.filter-select :deep(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 10px;
  box-shadow: none;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

.list-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-more {
  min-height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.load-more__text {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}
</style>
