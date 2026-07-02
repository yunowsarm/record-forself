import { supabase } from '@/lib/supabase'
import type { ReportFilters, ReportFormData, WeeklyReport } from '@/types/report'

export function useReports() {
  async function listReports(filters: ReportFilters = {}) {
    let query = supabase
      .from('weekly_reports')
      .select('*')
      .order('week_start', { ascending: false })

    if (filters.year) {
      query = query
        .gte('week_start', `${filters.year}-01-01`)
        .lte('week_start', `${filters.year}-12-31`)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as WeeklyReport[]
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
    listReports,
    getReport,
    getReportByWeekStart,
    createReport,
    updateReport,
    deleteReport,
  }
}
