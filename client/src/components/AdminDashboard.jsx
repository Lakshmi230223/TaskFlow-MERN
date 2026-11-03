
import { useEffect, useState } from 'react'
import './AdminDashboard.css'

function AdminDashboard({ onLogout, onShowProfile }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [deletingUserId, setDeletingUserId] = useState(null)

  // Search and role filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 5

  // Update a user's role
  async function updateUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'

    try {
      setError('')
      setUpdatingUserId(userId)

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update user role.')
      }

      setUsers(previousUsers =>
        previousUsers.map(user =>
          user._id === userId ? data.user : user
        )
      )
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setUpdatingUserId(null)
    }
  }

  // Delete another user's account
  async function deleteUser(userId, userName) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${userName}'s account and all their tasks? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setDeletingUserId(userId)

      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete user.')
      }

      setUsers(previousUsers =>
        previousUsers.filter(user => user._id !== userId)
      )

      // Update the total user count immediately.
      setStats(previousStats =>
        previousStats
          ? {
              ...previousStats,
              totalUsers: Math.max(0, previousStats.totalUsers - 1)
            }
          : previousStats
      )
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setDeletingUserId(null)
    }
  }

  // Fetch admin dashboard data
  useEffect(() => {
    async function fetchAdminData() {
      try {
        setError('')

        const [statsResponse, usersResponse] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats', {
            credentials: 'include'
          }),
          fetch('http://localhost:5000/api/admin/users', {
            credentials: 'include'
          })
        ])

        if (!statsResponse.ok || !usersResponse.ok) {
          throw new Error('Unable to load admin data.')
        }

        const statsData = await statsResponse.json()
        const usersData = await usersResponse.json()

        setStats(statsData)
        setUsers(Array.isArray(usersData.users) ? usersData.users : [])
      } catch (err) {
        setError(err.message || 'Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  // Filter users by name, email and role
  const filteredUsers = users.filter(user => {
    const searchValue = searchTerm.toLowerCase()

    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchValue) ||
      (user.email || '').toLowerCase().includes(searchValue)

    const matchesRole =
      roleFilter === 'All' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Reset to page 1 when search or role filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage

  const currentUsers = filteredUsers.slice(
    indexOfFirstUser,
    indexOfLastUser
  )

  if (loading) {
    return <p>Loading admin dashboard...</p>
  }

  if (error && !stats) {
    return (
      <div className="admin-dashboard">
        <p role="alert">{error}</p>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome! Here is an overview of TaskFlow.</p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="profile-button"
            onClick={onShowProfile}
          >
            My Profile
          </button>

          <button
            type="button"
            className="admin-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}

      {stats && (
        <section className="admin-stats">
          <div className="stat-card">
            <span>Total Users</span>
            <strong>{stats.totalUsers}</strong>
          </div>

          <div className="stat-card">
            <span>Total Tasks</span>
            <strong>{stats.totalTasks}</strong>
          </div>

          <div className="stat-card">
            <span>Pending Tasks</span>
            <strong>{stats.pendingTasks}</strong>
          </div>

          <div className="stat-card">
            <span>In Progress Tasks</span>
            <strong>{stats.inProgressTasks}</strong>
          </div>

          <div className="stat-card">
            <span>Completed Tasks</span>
            <strong>{stats.completedTasks}</strong>
          </div>
        </section>
      )}

      <section className="admin-users">
        <h2>Registered Users</h2>

        {/* Search and role filter */}
        <div className="user-controls">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />

          <select
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <p>No matching users found.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>

                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN')
                        : 'Not available'}
                    </td>

                    <td>
                      <div className="user-action-buttons">
                        <button
                          type="button"
                          disabled={
                            updatingUserId === user._id ||
                            deletingUserId === user._id
                          }
                          onClick={() =>
                            updateUserRole(user._id, user.role)
                          }
                        >
                          {updatingUserId === user._id
                            ? 'Updating...'
                            : user.role === 'admin'
                              ? 'Demote to User'
                              : 'Promote to Admin'}
                        </button>

                        <button
                          type="button"
                          className="delete-user-button"
                          disabled={
                            updatingUserId === user._id ||
                            deletingUserId === user._id
                          }
                          onClick={() =>
                            deleteUser(user._id, user.name)
                          }
                        >
                          {deletingUserId === user._id
                            ? 'Deleting...'
                            : 'Delete User'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage(previousPage => previousPage - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage(previousPage => previousPage + 1)
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default AdminDashboard
