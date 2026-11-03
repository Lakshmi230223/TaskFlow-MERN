
import { useState } from 'react'
import './Profile.css'

function Profile({ user, onProfileUpdated, onBack }) {
  const [name, setName] = useState(user.name || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  // Delete account states
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Update profile name
  async function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Name is required.')
      setMessage('')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response = await fetch(
        'http://localhost:5000/api/auth/profile',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: name.trim() }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile.')
      }

      onProfileUpdated(data.user)
      setMessage(data.message || 'Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // Change account password
  async function handlePasswordChange(event) {
    event.preventDefault()

    setPasswordError('')
    setPasswordMessage('')

    if (newPassword.length < 8) {
      setPasswordError('New password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    try {
      setChangingPassword(true)

      const response = await fetch(
        'http://localhost:5000/api/auth/change-password',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to change password.')
      }

      setPasswordMessage(data.message || 'Password changed successfully.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (err) {
      setPasswordError(err.message || 'Unable to change password.')
    } finally {
      setChangingPassword(false)
    }
  }

  // Delete account
  async function handleDeleteAccount(event) {
    event.preventDefault()

    setDeleteError('')
    setDeleteMessage('')

    if (!deletePassword) {
      setDeleteError('Please enter your current password.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account and all your tasks? This action cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingAccount(true)

      const response = await fetch(
        'http://localhost:5000/api/auth/account',
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: deletePassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete account.')
      }

      setDeleteMessage(data.message || 'Account deleted successfully.')

      window.location.reload()
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete account.')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <section className="profile-panel">
      <div className="profile-heading">
        <div>
          <h2>My Profile</h2>
          <p>View and update your profile details.</p>
        </div>

        <button type="button" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>

      {/* Profile details */}
      {message && (
        <p className="profile-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="profile-error" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <h3>Profile Details</h3>

        <label htmlFor="profile-name">Name</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
          required
        />

        <label htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          type="email"
          value={user.email || ''}
          readOnly
        />

        <label htmlFor="profile-role">Role</label>
        <input
          id="profile-role"
          type="text"
          value={user.role || ''}
          readOnly
        />

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <form
        onSubmit={handlePasswordChange}
        className="profile-form password-form"
      >
        <h3>Change Password</h3>

        {passwordMessage && (
          <p className="profile-success" role="status">
            {passwordMessage}
          </p>
        )}

        {passwordError && (
          <p className="profile-error" role="alert">
            {passwordError}
          </p>
        )}

        <label htmlFor="current-password">Current Password</label>
        <div className="password-input-wrapper">
          <input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <label htmlFor="new-password">New Password</label>
        <div className="password-input-wrapper">
          <input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <label htmlFor="confirm-password">Confirm New Password</label>
        <div className="password-input-wrapper">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" disabled={changingPassword}>
          {changingPassword ? 'Updating...' : 'Change Password'}
        </button>
      </form>

      {/* Delete account */}
      <form
        onSubmit={handleDeleteAccount}
        className="profile-form delete-account-form"
      >
        <h3>Delete Account</h3>

        <p>
          Permanently delete your account and all tasks associated
          with it. This action cannot be undone.
        </p>

        {deleteMessage && (
          <p className="profile-success" role="status">
            {deleteMessage}
          </p>
        )}

        {deleteError && (
          <p className="profile-error" role="alert">
            {deleteError}
          </p>
        )}

        <label htmlFor="delete-account-password">
          Enter Current Password
        </label>

        <div className="password-input-wrapper">
          <input
            id="delete-account-password"
            type={showDeletePassword ? 'text' : 'password'}
            value={deletePassword}
            onChange={event => setDeletePassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowDeletePassword(!showDeletePassword)}
          >
            {showDeletePassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button
          type="submit"
          disabled={deletingAccount}
          className="delete-account-button"
        >
          {deletingAccount ? 'Deleting Account...' : 'Delete My Account'}
        </button>
      </form>
    </section>
  )
}

export default Profile
