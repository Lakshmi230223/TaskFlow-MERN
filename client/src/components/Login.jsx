
import { useState } from 'react'

function EyeIcon({ visible }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {visible ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.8" />
          <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8" />
        </>
      )}
    </svg>
  )
}

function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setError('')
      setLoading(true)

      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.')
      }

      // Clear the login fields after successful login.
      setEmail('')
      setPassword('')
      setShowPassword(false)

      onLogin(data.user)
    } catch (err) {
      setError(err.message || 'Unable to log in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <h2>Welcome Back!</h2>
        <p>Log in to your TaskFlow account.</p>

        {error && <p className="error-message">{error}</p>}

        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="taskflow-login-email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="off"
          required
        />

        <label htmlFor="login-password">Password</label>

        <div className="login-password-wrapper">
          <input
            id="login-password"
            name="taskflow-login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            className="password-eye-button"
            onClick={() => setShowPassword(previous => !previous)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon visible={showPassword} />
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p>
          Don't have an account?{' '}
          <button type="button" onClick={onShowRegister}>
            Register
          </button>
        </p>
      </form>
    </div>
  )
}

export default Login
