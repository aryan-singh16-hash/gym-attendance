import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(email, password)
      localStorage.setItem('owner_token', res.access_token)
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-mono text-volt text-xs tracking-[0.2em] mb-2">OWNER ACCESS</p>
        <h1 className="font-display text-5xl text-chalk mb-8 tracking-wide">ADMIN LOGIN</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-sm text-muted mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-surface2 rounded-xl px-4 py-3 text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-muted mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-surface2 rounded-xl px-4 py-3 text-chalk focus:outline-none focus:ring-2 focus:ring-volt"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-coral text-sm font-body">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-volt text-charcoal font-display text-2xl tracking-wide py-3 rounded-xl mt-2 disabled:opacity-60"
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  )
}
