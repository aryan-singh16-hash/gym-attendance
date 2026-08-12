import { useState, useEffect } from 'react'
import { markAttendance } from '../api'

function currentTime() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function todayDate() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function AttendancePage() {
  const [name, setName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [session, setSession] = useState<'Morning' | 'Evening'>('Morning')
  const [timing, setTiming] = useState(currentTime())
  const [date, setDate] = useState(todayDate())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Suggest the session automatically based on time of day, member can still override
  useEffect(() => {
    const hour = new Date().getHours()
    setSession(hour < 15 ? 'Morning' : 'Evening')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !rollNumber.trim() || !phoneNumber.trim()) {
      setError('Fill in your name, phone number and roll number.')
      return
    }
    setSubmitting(true)
    try {
      await markAttendance({ name: name.trim(),phone_number: phoneNumber.trim(),roll_number: rollNumber.trim(), session, timing, date })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-volt flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-12 h-12 text-charcoal" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-5xl tracking-wide text-volt mb-2">CHECKED IN</h1>
        <p className="text-muted font-body text-lg mb-1">Attendance marked successfully</p>
        <p className="text-chalk font-mono tnum text-sm mb-8">
          {name} &middot; {session} &middot; {timing}
        </p>
        <button
          onClick={() => {
            setDone(false)
            setName('')
            setRollNumber('')
            setTiming(currentTime())
          }}
          className="font-body font-semibold text-sm text-muted underline underline-offset-4"
        >
          Mark another entry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-10 sm:py-16 sm:items-center">
      <div className="w-full sm:max-w-md">
        <div className="mb-8">
          <p className="font-mono text-volt text-xs tracking-[0.2em] mb-2">DAILY CHECK-IN</p>
          <h1 className="font-display text-6xl leading-none tracking-wide text-chalk">
            MARK YOUR<br />ATTENDANCE
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-body text-sm text-muted mb-2">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-surface border border-surface2 rounded-xl px-4 py-4 text-lg text-chalk placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-volt"
              autoComplete="off"
            />
          </div>

          <div>
  <label className="block font-body text-sm text-muted mb-2">
    Phone Number
  </label>

  <input
    value={phoneNumber}
    onChange={(e) => setPhoneNumber(e.target.value)}
    placeholder="Enter your phone number"
    className="w-full bg-surface border border-surface2 rounded-xl px-4 py-4 text-lg text-chalk placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-volt"
    autoComplete="off"
  />
</div>

          <div>
            <label className="block font-body text-sm text-muted mb-2">Roll Number</label>
            <input
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. GYM-042"
              className="w-full bg-surface border border-surface2 rounded-xl px-4 py-4 text-lg text-chalk placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-volt"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-muted mb-2">Session</label>
            <div className="grid grid-cols-2 gap-3">
              {(['Morning', 'Evening'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSession(s)}
                  className={`py-4 rounded-xl font-display text-2xl tracking-wide transition-colors ${
                    session === s
                      ? 'bg-volt text-charcoal'
                      : 'bg-surface text-muted border border-surface2'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-body text-sm text-muted mb-2">Time</label>
              <input
                type="time"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full bg-surface border border-surface2 rounded-xl px-4 py-4 font-mono tnum text-lg text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-muted mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface border border-surface2 rounded-xl px-4 py-4 font-mono tnum text-lg text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
              />
            </div>
          </div>

          {error && <p className="text-coral font-body text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-volt text-charcoal font-display text-3xl tracking-wide py-5 rounded-xl mt-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {submitting ? 'MARKING...' : 'MARK ATTENDANCE'}
          </button>
        </form>
      </div>
    </div>
  )
}
