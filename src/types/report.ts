export type ReportStatus = 'draft' | 'published'
export type ReportListScope = 'mine' | 'all'

export interface Profile {
  id: string
  display_name: string
  department: string | null
  created_at: string
}

export interface WeeklyReport {
  id: string
  user_id: string
  week_start: string
  week_end: string
  completed_work: string
  in_progress: string
  next_week_plan: string
  issues: string | null
  status: ReportStatus
  created_at: string
  updated_at: string
}

export interface WeeklyReportWithAuthor extends WeeklyReport {
  author_name?: string
}

export interface ReportFormData {
  week_start: string
  week_end: string
  completed_work: string
  in_progress: string
  next_week_plan: string
  issues: string
  status: ReportStatus
}

export interface ReportFilters {
  year?: number
  status?: ReportStatus | ''
}

export interface ReportListFilters {
  scope: ReportListScope
  status?: ReportStatus | ''
  userId?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedReports {
  items: WeeklyReportWithAuthor[]
  hasMore: boolean
  total: number
}

export const REPORT_PAGE_SIZE = 5
