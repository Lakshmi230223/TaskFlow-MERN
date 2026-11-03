
import { useState } from 'react'

function Register({ onRegister, onShowLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setError('')
      setLoading(true)

      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      onRegister(data.user)
    } catch (err) {
      setError(err.message || 'Unable to register.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <p>Join TaskFlow and organize your tasks.</p>

        {error && <p className="error-message">{error}</p>}

        <label htmlFor="register-name">Name</label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Enter your name"
          required
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="Enter your email"
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Create a password"
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onShowLogin}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  )
}

export default Register
