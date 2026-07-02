import { supabase } from '@/lib/supabase'
import type {
  PaginatedReports,
  Profile,
  ReportFormData,
  ReportListFilters,
  WeeklyReport,
  WeeklyReportWithAuthor,
} from '@/types/report'
import { REPORT_PAGE_SIZE } from '@/types/report'

async function attachAuthorNames(reports: WeeklyReport[]): Promise<WeeklyReportWithAuthor[]> {
  if (!reports.length) return []

  const userIds = [...new Set(reports.map((r) => r.user_id))]
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)

  if (error) throw error

  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))

  return reports.map((report) => ({
    ...report,
    author_name: nameMap.get(report.user_id) ?? '未知用户',
  }))
}

export function useReports() {
  async function listReportsPaginated(
    filters: ReportListFilters,
    page: number,
    pageSize: number = REPORT_PAGE_SIZE,
  ): Promise<PaginatedReports> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const from = page * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('weekly_reports')
      .select('*', { count: 'exact' })
      .order('week_start', { ascending: false })
      .order('updated_at', { ascending: false })

    if (filters.scope === 'all') {
      query = query.eq('status', 'published')
    } else {
      query = query.eq('user_id', user.id)
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.dateFrom) {
      query = query.gte('week_start', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('week_start', filters.dateTo)
    }

    const { data, error, count } = await query.range(from, to)
    if (error) throw error

    const items = await attachAuthorNames((data ?? []) as WeeklyReport[])
    const total = count ?? 0

    return {
      items,
      hasMore: from + items.length < total,
      total,
    }
  }

  async function listProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name', { ascending: true })

    if (error) throw error
    return (data ?? []) as Profile[]
  }

  async function getReport(id: string) {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as WeeklyReport
  }

  async function getReportByWeekStart(weekStart: string) {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle()

    if (error) throw error
    return data as WeeklyReport | null
  }

  async function createReport(form: ReportFormData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { data, error } = await supabase
      .from('weekly_reports')
      .insert({
        user_id: user.id,
        week_start: form.week_start,
        week_end: form.week_end,
        completed_work: form.completed_work,
        in_progress: form.in_progress,
        next_week_plan: form.next_week_plan,
        issues: form.issues || null,
        status: form.status,
      })
      .select()
      .single()

    if (error) throw error
    return data as WeeklyReport
  }

  async function updateReport(id: string, form: ReportFormData) {
    const { data, error } = await supabase
      .from('weekly_reports')
      .update({
        week_start: form.week_start,
        week_end: form.week_end,
        completed_work: form.completed_work,
        in_progress: form.in_progress,
        next_week_plan: form.next_week_plan,
        issues: form.issues || null,
        status: form.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as WeeklyReport
  }

  async function deleteReport(id: string) {
    const { error } = await supabase.from('weekly_reports').delete().eq('id', id)
    if (error) throw error
  }

  return {
    listReportsPaginated,
    listProfiles,
    getReport,
    getReportByWeekStart,
    createReport,
    updateReport,
    deleteReport,
    REPORT_PAGE_SIZE,
  }
}
