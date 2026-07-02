export type ReportStatus = 'draft' | 'published'

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
