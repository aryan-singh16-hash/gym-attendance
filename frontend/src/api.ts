const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface AttendancePayload {
  name: string
  phone_number: string
  roll_number: string
  session: 'Morning' | 'Evening'
  timing: string
  date: string
}

export interface AttendanceRecord extends AttendancePayload {
  id: string
  created_at: string
}

export async function markAttendance(payload: AttendancePayload) {
  const res = await fetch(`${API_BASE}/api/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Something went wrong. Please try again.')
  }

  return res.json()
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error('Invalid email or password')
  }
  return res.json() as Promise<{ access_token: string; token_type: string }>
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchAttendance(token: string, params: { date?: string; session?: string; search?: string }) {
  const qs = new URLSearchParams()
  if (params.date) qs.set('date', params.date)
  if (params.session) qs.set('session', params.session)
  if (params.search) qs.set('search', params.search)

  const res = await fetch(`${API_BASE}/api/admin/attendance?${qs.toString()}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to load attendance')
  return res.json() as Promise<{
    records: AttendanceRecord[]
    total: number
    morning_count: number
    evening_count: number
  }>
}

export function exportUrl(token: string, startDate: string, endDate: string, format: 'csv' | 'xlsx') {
  return `${API_BASE}/api/admin/export?start_date=${startDate}&end_date=${endDate}&file_format=${format}`
}

export async function downloadExport(token: string, startDate: string, endDate: string, format: 'csv' | 'xlsx') {
  const res = await fetch(exportUrl(token, startDate, endDate, format), {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance_${startDate}_to_${endDate}.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export function wsUrl() {
  const base = API_BASE.replace('http', 'ws')
  return `${base}/ws/dashboard`
}
