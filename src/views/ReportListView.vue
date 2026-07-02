<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReports } from '@/composables/useReports'
import type { ReportStatus, WeeklyReport } from '@/types/report'
import { formatWeekLabel, getCurrentWeekRange } from '@/utils/week'
import ReportCard from '@/components/ReportCard.vue'
import WeekRangeDisplay from '@/components/WeekRangeDisplay.vue'

const router = useRouter()
const { listReports, deleteReport, getReportByWeekStart } = useReports()

const reports = ref<WeeklyReport[]>([])
const currentWeekReport = ref<WeeklyReport | null>(null)
const loading = ref(false)
const filterYear = ref<number | undefined>(new Date().getFullYear())
const filterStatus = ref<ReportStatus | ''>('')

const currentWeek = computed(() => getCurrentWeekRange())
const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

async function loadReports() {
  loading.value = true
  try {
    const [list, current] = await Promise.all([
      listReports({ year: filterYear.value, status: filterStatus.value }),
      getReportByWeekStart(currentWeek.value.weekStart),
    ])
    reports.value = list
    currentWeekReport.value = current
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function goCurrentWeekReport() {
  if (currentWeekReport.value) {
    router.push({ name: 'report-edit', params: { id: currentWeekReport.value.id } })
  } else {
    router.push({ name: 'report-new' })
  }
}

async function handleDelete(row: WeeklyReport) {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${formatWeekLabel(row.week_start, row.week_end)} 的周报？`,
      '确认删除',
      { type: 'warning' },
    )
    await deleteReport(row.id)
    ElMessage.success('已删除')
    await loadReports()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err instanceof Error ? err.message : '删除失败')
    }
  }
}

function statusTagType(status: ReportStatus) {
  return status === 'published' ? 'success' : 'info'
}

function statusLabel(status: ReportStatus) {
  return status === 'published' ? '已发布' : '草稿'
}

onMounted(loadReports)
</script>

<template>
  <div v-loading="loading" class="u-page">
    <header class="u-page-header">
      <div>
        <h2 class="u-page-title">我的周报</h2>
        <p class="u-page-subtitle">管理工作记录，支持本周填写与往期补录</p>
      </div>
    </header>

    <section class="u-card current-week-card">
      <div class="u-card-body">
        <div class="current-week-card__header">
          <div>
            <span class="u-badge u-badge--current">本周</span>
            <WeekRangeDisplay
              :week-start="currentWeek.weekStart"
              :week-end="currentWeek.weekEnd"
              compact
            />
          </div>
          <div class="current-week-card__actions">
            <el-button type="primary" @click="goCurrentWeekReport">
              {{ currentWeekReport ? '继续编辑本周' : '填写本周周报' }}
            </el-button>
            <el-button @click="router.push({ name: 'report-backfill' })">补录往期</el-button>
          </div>
        </div>
        <p v-if="currentWeekReport" class="u-text-muted current-week-card__status">
          本周周报状态：{{ statusLabel(currentWeekReport.status) }}
        </p>
      </div>
    </section>

    <div class="filters u-row">
      <el-select
        v-model="filterYear"
        placeholder="年份"
        clearable
        style="width: 120px"
        @change="loadReports"
      >
        <el-option v-for="y in yearOptions" :key="y" :label="`${y} 年`" :value="y" />
      </el-select>
      <el-select
        v-model="filterStatus"
        placeholder="状态"
        clearable
        style="width: 120px"
        @change="loadReports"
      >
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
      </el-select>
    </div>

    <!-- Desktop table -->
    <div class="u-card u-hidden-mobile">
      <el-table :data="reports" stripe style="width: 100%">
        <el-table-column label="周期" min-width="240">
          <template #default="{ row }">
            <div class="table-week">
              <span>{{ formatWeekLabel(row.week_start, row.week_end) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.updated_at).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push({ name: 'report-detail', params: { id: row.id } })">
              查看
            </el-button>
            <el-button link type="primary" @click="router.push({ name: 'report-edit', params: { id: row.id } })">
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && reports.length === 0" description="暂无周报记录" />
    </div>

    <!-- Mobile cards -->
    <div class="u-hidden-desktop mobile-list">
      <ReportCard
        v-for="report in reports"
        :key="report.id"
        :report="report"
        @view="router.push({ name: 'report-detail', params: { id: report.id } })"
        @edit="router.push({ name: 'report-edit', params: { id: report.id } })"
        @delete="handleDelete(report)"
      />
      <el-empty v-if="!loading && reports.length === 0" description="暂无周报记录" />
    </div>
  </div>
</template>

<style scoped>
.current-week-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.current-week-card__actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.current-week-card__status {
  margin: var(--space-3) 0 0;
}

.mobile-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.table-week {
  font-size: var(--font-sm);
}

@media (max-width: 768px) {
  .current-week-card__actions {
    width: 100%;
    flex-direction: column;
  }

  .current-week-card__actions .el-button {
    width: 100%;
    margin: 0;
  }
}
</style>
