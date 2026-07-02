import { getWeekCalendarData } from '@/lib/work-calendar'

export interface WeekRange {
  weekStart: string
  weekEnd: string
}

export interface WeekWorkSummary {
  workDays: string[]
  holidays: { date: string; name: string }[]
  adjustedWorkdays: { date: string; name: string }[]
  workDayCount: number
  label: string
  hint: string
}

export interface WeekOption extends WeekRange {
  label: string
  isCurrent: boolean
  workDayTitle: string
  workDayDetail: string
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function compareDateStrings(a: string, b: string): number {
  return a.localeCompare(b)
}

export function getWeekRange(date: Date): WeekRange {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = addDays(d, diffToMonday)
  const sunday = addDays(monday, 6)
  return { weekStart: formatDate(monday), weekEnd: formatDate(sunday) }
}

export function getCurrentWeekRange(date = new Date()): WeekRange {
  return getWeekRange(date)
}

export function isCurrentWeek(weekStart: string, date = new Date()): boolean {
  return weekStart === getCurrentWeekRange(date).weekStart
}

export function isFutureWeek(weekStart: string, date = new Date()): boolean {
  return compareDateStrings(weekStart, getCurrentWeekRange(date).weekStart) > 0
}

export function isPastWeek(weekStart: string, date = new Date()): boolean {
  return compareDateStrings(weekStart, getCurrentWeekRange(date).weekStart) < 0
}

export function getWeekWorkSummary(weekStart: string, weekEnd: string): WeekWorkSummary {
  return getWeekCalendarData(weekStart, weekEnd)
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  if (!weekStart || !weekEnd) return ''
  return `${weekStart} ~ ${weekEnd}`
}

export function formatWeekLabelWithWork(weekStart: string, weekEnd: string): string {
  const summary = getWeekWorkSummary(weekStart, weekEnd)
  return `${formatWeekLabel(weekStart, weekEnd)}（${summary.label}）`
}

function buildWeekOption(range: WeekRange, isCurrent: boolean): WeekOption {
  const summary = getWeekWorkSummary(range.weekStart, range.weekEnd)
  const detailParts = summary.label.split('，')
  const workDayTitle = detailParts[0] ?? summary.label
  const extra = detailParts.slice(1).join('，')
  const dateRange = formatWeekLabel(range.weekStart, range.weekEnd)
  const workDayDetail = extra ? `${dateRange} · ${extra}` : dateRange

  return {
    ...range,
    isCurrent,
    workDayTitle,
    workDayDetail,
    label: `${workDayTitle} ${dateRange}`,
  }
}

export function getBackfillWeekOptions(maxWeeks = 52, date = new Date()): WeekOption[] {
  const current = getCurrentWeekRange(date)
  const options: WeekOption[] = []
  let cursor = parseDate(current.weekStart)

  for (let i = 0; i < maxWeeks; i++) {
    cursor = addDays(cursor, -7)
    const range = getWeekRange(cursor)
    if (isFutureWeek(range.weekStart, date)) continue

    options.push(buildWeekOption(range, false))
  }

  return options
}

/** 筛选用的周次列表（含当前周，按时间倒序） */
export function getFilterWeekOptions(maxWeeks = 52, date = new Date()): WeekOption[] {
  const current = getCurrentWeekRange(date)
  return [buildWeekOption(current, true), ...getBackfillWeekOptions(maxWeeks, date)]
}

export function enumerateDays(weekStart: string, weekEnd: string): string[] {
  const days: string[] = []
  let cursor = parseDate(weekStart)
  const end = parseDate(weekEnd)
  while (cursor <= end) {
    days.push(formatDate(cursor))
    cursor = addDays(cursor, 1)
  }
  return days
}

export function validateReportWeek(
  weekStart: string,
  mode: 'current' | 'backfill' | 'edit',
): string | null {
  if (mode === 'edit') {
    if (isFutureWeek(weekStart)) return '不能编辑未来周的周报'
    return null
  }

  if (mode === 'current') {
    if (!isCurrentWeek(weekStart)) return '新建周报仅限当前周'
    return null
  }

  if (isFutureWeek(weekStart)) return '不能提前录入未来周的周报'
  if (isCurrentWeek(weekStart)) return '请使用「填写本周周报」录入当前周'
  return null
}
