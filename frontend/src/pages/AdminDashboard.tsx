import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAttendance, downloadExport, wsUrl, AttendanceRecord } from '../api'

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const token = localStorage.getItem('owner_token') || ''

  const [date, setDate] = useState(todayDate())
  const [session, setSession] = useState<'' | 'Morning' | 'Evening'>('')
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [morningCount, setMorningCount] = useState(0)
  const [eveningCount, setEveningCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [rangeStart, setRangeStart] = useState(todayDate())
  const [rangeEnd, setRangeEnd] = useState(todayDate())
  const [exporting, setExporting] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchAttendance(token, { date, session: session || undefined, search: search || undefined })
      setRecords(res.records)
      setMorningCount(res.morning_count)
      setEveningCount(res.evening_count)
    } catch (err: any) {
      if (err.message?.includes('401') || err.message === 'Failed to load attendance') {
        // Token might be invalid/expired
      }
      setError('Could not load attendance. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }, [token, date, session, search])

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }
    load()
  }, [load, navigate, token])

  // Live updates: refresh silently when a new entry comes in for the date being viewed
  useEffect(() => {
    try {
      const ws = new WebSocket(wsUrl())
      wsRef.current = ws
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'new_attendance' && msg.data?.date === date) {
            load()
          }
        } catch {
          /* ignore malformed messages */
        }
      }
      return () => ws.close()
    } catch {
      /* websocket not available — dashboard still works via manual refresh */
    }
  }, [date, load])

  function handleLogout() {
    localStorage.removeItem('owner_token')
    navigate('/admin/login')
  }

  async function handleExport(format: 'csv' | 'xlsx') {
    setExporting(true)
    try {
      await downloadExport(token, rangeStart, rangeEnd, format)
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen px-5 py-8 sm:px-10 sm:py-10">
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-volt text-xs tracking-[0.2em] mb-1">OWNER DASHBOARD</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-chalk">ATTENDANCE</h1>
        </div>
        <button
          onClick={handleLogout}
          className="font-body text-sm text-muted border border-surface2 rounded-lg px-4 py-2 hover:text-chalk hover:border-muted transition-colors"
        >
          Log out
        </button>
      </header>

      {/* Scoreboard counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-surface2 rounded-2xl p-5">
          <p className="font-body text-muted text-sm mb-1">Morning</p>
          <p className="font-mono tnum text-5xl text-volt">{String(morningCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-surface border border-surface2 rounded-2xl p-5">
          <p className="font-body text-muted text-sm mb-1">Evening</p>
          <p className="font-mono tnum text-5xl text-coral">{String(eveningCount).padStart(2, '0')}</p>
        </div>
        <div className="bg-surface border border-surface2 rounded-2xl p-5 col-span-2 sm:col-span-1">
          <p className="font-body text-muted text-sm mb-1">Total for {date}</p>
          <p className="font-mono tnum text-5xl text-chalk">{String(morningCount + eveningCount).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-surface2 rounded-2xl p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block font-body text-xs text-muted mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-surface2 rounded-lg px-3 py-2 font-mono tnum text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
          />
        </div>
        <div>
          <label className="block font-body text-xs text-muted mb-1">Session</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value as any)}
            className="bg-surface2 rounded-lg px-3 py-2 text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
          >
            <option value="">All</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block font-body text-xs text-muted mb-1">Search name / roll no</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-surface2 rounded-lg px-3 py-2 text-chalk placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-volt"
          />
        </div>
        <button
          onClick={load}
          className="bg-surface2 text-chalk font-body font-semibold rounded-lg px-4 py-2 border border-surface2 hover:border-volt transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Export */}
      <div className="bg-surface border border-surface2 rounded-2xl p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block font-body text-xs text-muted mb-1">From</label>
          <input
            type="date"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="bg-surface2 rounded-lg px-3 py-2 font-mono tnum text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
          />
        </div>
        <div>
          <label className="block font-body text-xs text-muted mb-1">To</label>
          <input
            type="date"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="bg-surface2 rounded-lg px-3 py-2 font-mono tnum text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
          />
        </div>
        <button
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="bg-volt text-charcoal font-display text-lg tracking-wide px-5 py-2 rounded-lg disabled:opacity-60"
        >
          DOWNLOAD CSV
        </button>
        <button
          onClick={() => handleExport('xlsx')}
          disabled={exporting}
          className="bg-surface2 text-chalk font-display text-lg tracking-wide px-5 py-2 rounded-lg border border-muted disabled:opacity-60"
        >
          DOWNLOAD XLSX
        </button>
      </div>

      {error && <p className="text-coral font-body text-sm mb-4">{error}</p>}

      {/* Table */}
      <div className="bg-surface border border-surface2 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface2 text-muted font-body text-sm">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Roll No</th>
              <th className="px-5 py-3">Session</th>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted font-body">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted font-body">
                  No attendance found for this filter.
                </td>
              </tr>
            )}
            {!loading &&
              records.map((r) => (
                <tr key={r.id} className="border-b border-surface2 last:border-0 font-body">
                  <td className="px-5 py-3 text-chalk">{r.name}</td>
                  <td className="px-5 py-3 text-chalk">{r.phone_number}</td>
                  <td className="px-5 py-3 text-muted font-mono">{r.roll_number}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`font-mono text-xs px-2 py-1 rounded ${
                        r.session === 'Morning' ? 'bg-volt/20 text-volt' : 'bg-coral/20 text-coral'
                      }`}
                    >
                      {r.session.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono tnum text-chalk">{r.timing}</td>
                  <td className="px-5 py-3 font-mono tnum text-muted">{r.date}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
