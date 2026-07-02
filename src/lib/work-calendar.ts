/**
 * 中国工作日/节假日 — 基于 chinese-workday（国务院公告数据，npm 定期更新）
 * @see https://www.npmjs.com/package/chinese-workday
 */
import {
  getWorkdaysInRange,
  getHolidaysInRange,
  isAdditionalWorkday,
  getFestival,
} from 'chinese-workday'

export interface DayAnnotation {
  date: string
  name: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || !DATE_RE.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y!, m! - 1, d)
  return date.getFullYear() === y && date.getMonth() === m! - 1 && date.getDate() === d
}

export const EMPTY_WEEK_CALENDAR = {
  workDays: [] as string[],
  holidays: [] as DayAnnotation[],
  adjustedWorkdays: [] as DayAnnotation[],
  workDayCount: 0,
  label: '',
  hint: '',
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d)
}

function enumerateDateStrings(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = parseLocalDate(start)
  const endDate = parseLocalDate(end)
  while (cursor <= endDate) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function getAdjustedWorkdaysInRange(start: string, end: string): DayAnnotation[] {
  return enumerateDateStrings(start, end)
    .filter((date) => isAdditionalWorkday(date))
    .map((date) => ({
      date,
      name: getFestival(date) === '工作日' ? '调休上班' : getFestival(date),
    }))
}

export function getWeekCalendarData(weekStart: string, weekEnd: string) {
  if (!isValidDateString(weekStart) || !isValidDateString(weekEnd)) {
    return { ...EMPTY_WEEK_CALENDAR }
  }
  if (weekStart > weekEnd) {
    return { ...EMPTY_WEEK_CALENDAR }
  }

  const workDays = getWorkdaysInRange(weekStart, weekEnd)
  const holidays = getHolidaysInRange(weekStart, weekEnd).map((h) => ({
    date: h.date,
    name: h.festival,
  }))
  const adjustedWorkdays = getAdjustedWorkdaysInRange(weekStart, weekEnd)

  const holidayNames = [...new Set(holidays.map((h) => h.name).filter((n) => n !== '周末'))]
  const parts: string[] = [`${workDays.length} 个工作日`]
  if (holidayNames.length) parts.push(`含 ${holidayNames.join('、')}`)
  if (adjustedWorkdays.length) parts.push(`${adjustedWorkdays.length} 天调休上班`)

  const hint =
    holidays.length || adjustedWorkdays.length
      ? '已根据法定节假日与调休安排计算实际工作周期（数据来自 chinese-workday）'
      : '本周为常规工作周'

  return {
    workDays,
    holidays,
    adjustedWorkdays,
    workDayCount: workDays.length,
    label: parts.join('，'),
    hint,
  }
}
