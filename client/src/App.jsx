
import { useEffect, useState } from 'react'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import AdminDashboard from './components/AdminDashboard'
import Profile from './components/Profile'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const API_URL = 'http://localhost:5000/api/tasks'

function App() {
  const [tasks, setTasks] = useState([])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('Pending');
  const [showProfile, setShowProfile] = useState(false)
  const [loginFormKey, setLoginFormKey] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 5

  // Handle successful login.
  function handleLogin(userData) {
   setUser(userData)
   setAuthError('')
   setLoading(true)
  }

  // Handle successful registration.
  function handleRegister(userData) {
   setUser(userData)
   setAuthError('')
    setLoading(true)
  }



  // Convert a MongoDB task into the format used by our dashboard.
  function formatTask(task) {
    return {
      id: task._id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'Medium',
      status: task.status || (task.completed ? 'Completed' : 'Pending'),

    }
  }

  // Check whether the user is already logged in.
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }  else {
          setUser(null)
        }
      } catch (error) {
        setAuthError('Unable to connect to the server.')
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Load tasks from the backend when the page opens.
  useEffect(() => {
    async function fetchTasks() {
      if (!user) {
        setTasks([])
        setLoading(false)
        return
      }
      try {
        setError('')

        const response = await fetch(API_URL, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Could not load tasks from the server.')
        }

        const data = await response.json()
        setTasks(data.map(formatTask))
      } catch (err) {
        setError(
          'Unable to connect to the backend. Check that your server is running.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user])

  // Add a task to MongoDB.

  // Add a new task or update an existing task.
  async function addTask(event) {
    event.preventDefault()

    if (!title.trim()) return

    try {
      setError('')

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        priority,
        status,
      }

      const response = await fetch(
        editingTaskId ? `${API_URL}/${editingTaskId}` : API_URL,
        {
          credentials: 'include',
          method: editingTaskId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            editingTaskId
              ? taskData
              : { ...taskData, completed: false }
          ),
        }
      )

      if (!response.ok) {
        throw new Error(
          editingTaskId
            ? 'Could not update task.'
            : 'Could not add task.'
        )
      }

      const savedTask = await response.json()
      const formattedTask = formatTask(savedTask)

      if (editingTaskId) {
        setTasks(previousTasks =>
          previousTasks.map(task =>
            task.id === editingTaskId ? formattedTask : task
          )
        )
      } else {
        setTasks(previousTasks => [
          formattedTask,
          ...previousTasks,
        ])
      }

      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('Medium')
      setEditingTaskId(null)
    } catch (err) {
      setError(err.message || 'Unable to save task.')
    }
  }

  // Load an existing task into the form for editing.
  function editTask(task) {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority || 'Medium')
    setStatus(task.status || 'Pending');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle user logout.
  async function handleLogout() {
  try {
    const response = await fetch(
      'http://localhost:5000/api/auth/logout',
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      throw new Error('Could not log out.')
    }

    // Clear the current user and dashboard data.
    setUser(null)
    setTasks([])
    setAuthMode('login')
    setShowProfile(false)

    // Clear dashboard-related state.
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('Medium')
    setStatus('Pending')
    setFilter('All')
    setSearchTerm('')
    setEditingTaskId(null)

    // Reset the Login component.
    setLoginFormKey(previous => previous + 1)

     setError('')
     setAuthError('')
     setLoading(false)
    } catch (err) {
      setError(err.message || 'Unable to log out.')
    }
  }

  function clearFilters() {
    setFilter('All')
    setPriorityFilter('All')
    setSearchTerm('')
    setSortBy('newest')
  }

  // Update task completion in MongoDB.
  async function changeStatus(id, newStatus) {
    try {
      setError('')

      const response = await fetch(`${API_URL}/${id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
         status: newStatus,
         completed: newStatus === 'Completed',
        }),
      })

      if (!response.ok) {
        throw new Error('Could not update task.')
      }

      const updatedTask = await response.json()

      setTasks(previousTasks =>
        previousTasks.map(item =>
          item.id === id ? formatTask(updatedTask) : item
        )
      )
    } catch (err) {
      setError(err.message || 'Unable to update task.')
    }
  }

  // Delete a task from MongoDB.
  async function deleteTask(id) {
    try {
      setError('')

      const response = await fetch(`${API_URL}/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Could not delete task.')
      }

      setTasks(previousTasks =>
        previousTasks.filter(task => task.id !== id)
      )
    } catch (err) {
      setError(err.message || 'Unable to delete task.')
    }
  }

  const visibleTasks = tasks
    .filter(task => {
      const matchesStatus =
       filter === 'All' || task.status === filter

      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())

      const matchesPriority =
        priorityFilter === 'All' ||
        task.priority === priorityFilter

      return matchesStatus && matchesSearch && matchesPriority
    })
    .sort((a, b) => {
     if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }

      if (sortBy === 'oldest') {
       return new Date(a.createdAt) - new Date(b.createdAt)
      }

      if (sortBy === 'priority') {
        const priorityOrder = {
         High: 1,
         Medium: 2,
         Low: 3,
        }

       return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      if (sortBy === 'dueDate') {
       return new Date(a.dueDate || '9999-12-31') -
              new Date(b.dueDate || '9999-12-31')
      }

     return 0
    })

  const totalPages = Math.ceil(visibleTasks.length / tasksPerPage)

  const startIndex = (currentPage - 1) * tasksPerPage

  const paginatedTasks = visibleTasks.slice(
    startIndex,
    startIndex + tasksPerPage
  )

  const completed = tasks.filter(
    task => task.status === 'Completed'
  ).length

  const pending = tasks.filter(
    task => task.status === 'Pending'
  ).length

  const inProgress = tasks.filter(
   task => task.status === 'In Progress'
  ).length

  // Show loading while checking the login session.
    if (authLoading) {
     return <p>Checking login session...</p>
    }

  // Show login or registration if the user is not logged in.
  if (!user) {
    return authMode === 'login' ? (
      <Login
        key={loginFormKey}
        onLogin={handleLogin}
        onShowRegister={() => setAuthMode('register')}
     />
    ) : (
      <Register
        onRegister={handleRegister}
        onShowLogin={() => setAuthMode('login')}
      />
    )
  }

  // Show the admin dashboard to admin users.
  if (user.role === 'admin') {
    if (showProfile) {
      return (
       <Profile
         user={user}
         onProfileUpdated={setUser}
         onBack={() => setShowProfile(false)}
        />
      )
    }
    return (
      <AdminDashboard
       onLogout={handleLogout}
       onShowProfile={() => setShowProfile(true)}
      />
    )
  }

  // Show the profile page when requested.
  if (showProfile) {
    return (
      <Profile
        user={user}
        onProfileUpdated={setUser}
        onBack={() => setShowProfile(false)}
      />
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="brand">TaskFlow<span>.</span></h2>
        <p className="side-label">WORKSPACE</p>
        <div className="nav-item active">▦ &nbsp; My Tasks</div>
        <div className="nav-item">◷ &nbsp; Overview</div>
        <div className="nav-item">⚙ &nbsp; Settings</div>
        <div className="sidebar-bottom">
          Stay organized. Get things done.
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Task Management Dashboard</h1>
          </div>
          <div className="topbar-actions">
            <span className="today">
              {user.name || user.email}
           </span>

            <button
              type="button"
              className="profile-button"
              onClick={() => setShowProfile(true)}
             >
              My Profile
            </button>

            <button
             type="button"
             className="logout-button"
             onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow light">YOUR DAY, YOUR WAY</p>
            <h2>Make today productive.</h2>
            <p>Organize your tasks and focus on what matters.</p>
          </div>
          <div className="welcome-icon">✓</div>
        </section>

        <section className="stats">

          <Card className="stat-card">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total tasks
              </Typography>
              <Typography variant="h4" component="strong">
                {tasks.length}
             </Typography>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Pending tasks
             </Typography>
             <Typography variant="h4" component="strong">
               {pending}
             </Typography>
           </CardContent>
          </Card>

         <Card className="stat-card">
           <CardContent>
              <Typography variant="body2" color="text.secondary">
                Completed tasks
              </Typography>
              <Typography variant="h4" component="strong">
                {completed}
              </Typography>
            </CardContent>
         </Card>

         <Card className="stat-card">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                In Progress tasks
              </Typography>
              <Typography variant="h4" component="strong">
                {inProgress}
              </Typography>
            </CardContent>
         </Card>

        </section>

        <section className="task-panel">
          <div className="section-heading">
            <div>
              <h2>My tasks</h2>
              <p>Manage your work in one place.</p>
            </div>
            <span className="task-count">{tasks.length} tasks</span>
          </div>

          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}

          <form className="task-form" onSubmit={addTask}>
            <label htmlFor="task-title">New task</label>
            <TextField
              id="task-title"
              label="New task"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="What do you need to do?"
              required
              fullWidth
              size="small"
            />
            
            <TextField
              id="task-description"
              label="Description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Add more details about this task..."
              multiline
              rows={3}
              fullWidth
              size="small"
           />

            <label htmlFor="task-due-date">Due date</label>
            <input
             id="task-due-date"
             type="date"
             value={dueDate}
              onChange={event => setDueDate(event.target.value)}
           />

            <FormControl fullWidth size="small">
              <InputLabel id="task-priority-label">
                Priority
              </InputLabel>

              <Select
                labelId="task-priority-label"
                id="task-priority"
                value={priority}
               label="Priority"
                onChange={event => setPriority(event.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="task-status-label">
                Status
              </InputLabel>

              <Select
               labelId="task-status-label"
                id="status"
               value={status}
               label="Status"
                onChange={(event) => setStatus(event.target.value)}
              >
                <MenuItem value="Pending">Pending</MenuItem>
               <MenuItem value="In Progress">In Progress</MenuItem>
               <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>

            <Button
             type="submit"
             variant="contained"
             color="primary"
            >
             {editingTaskId ? 'Save changes' : '+ Add task'}
           </Button>

          </form>

          <div className="filters">
            <Tabs
              value={filter}
              onChange={(event, newValue) => setFilter(newValue)}
              aria-label="Filter tasks by status"
              variant="scrollable"
             scrollButtons="auto"
            >
              {['All', 'Pending', 'In Progress', 'Completed'].map(item => (
                <Tab
                  key={item}
                  label={item}
                  value={item}
               />
              ))}
            </Tabs>
          </div>
          <TextField
            type="text"
           placeholder="Search tasks by title..."
           value={searchTerm}
           onChange={event => setSearchTerm(event.target.value)}
           aria-label="Search tasks by title"
            variant="outlined"
           size="small"
           fullWidth
         />

          <div className="task-filter-controls">

            {/* Priority Filter */}
            <FormControl size="small" className="priority-filter-control">
              <Select
                value={priorityFilter}
                onChange={event => setPriorityFilter(event.target.value)}
                displayEmpty
                inputProps={{
                 'aria-label': 'Filter by priority',
                }}
             >
                <MenuItem value="All">All Priorities</MenuItem>
                <MenuItem value="High">High Priority</MenuItem>
                <MenuItem value="Medium">Medium Priority</MenuItem>
                <MenuItem value="Low">Low Priority</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Dropdown */}
            <FormControl size="small" className="sort-filter-control">
              <Select
                value={sortBy}
                onChange={event => setSortBy(event.target.value)}
                displayEmpty
                inputProps={{
                  'aria-label': 'Sort tasks',
                }}
             >
               <MenuItem value="newest">Recently Created</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="priority">Priority: High to Low</MenuItem>
                <MenuItem value="dueDate">Due Date: Earliest First</MenuItem>
              </Select>
            </FormControl>

            {/* Clear Filters */}
            <Button
              variant="outlined"
              color="primary"
              onClick={clearFilters}
              type="button"
              className="clear-filters-button"
            >
              Clear All Filters
            </Button>

          </div>

          <div className="task-list">
            {loading ? (
              <p className="empty-state">Loading tasks...</p>
            ) : visibleTasks.length === 0 ? (
              <p className="empty-state">
                No matching tasks found. Try another search.
              </p>
            ) : (
              paginatedTasks.map(task => (
                <article className="task-row" key={task.id}>
                    <button
                      className={
                        task.status === 'Completed'
                          ? 'check checked'
                          : 'check'
                      }
                      onClick={() => changeStatus(task.id)}
                      type="button"
                      aria-label="Toggle task completion"
                    >
                     {task.status === 'Completed' ? '✓' : ''}
                    </button>

                    <div className="task-info">
                      <strong
                        className={
                          task.status === 'Completed' ? 'task-done' : ''
                        }
                      >
                        {task.title}
                      </strong>
                       {task.description && (
                         <span>{task.description} </span>
                       )}
                      <FormControl size="small">
                        <Select
                          className={`task-status-select status-${task.status.toLowerCase().replace(' ', '-')}`}
                          value={task.status}
                         onChange={event => changeStatus(task.id, event.target.value)}
                         inputProps={{
                           'aria-label': `Change status for ${task.title}`,
                         }}
                        >
                         <MenuItem value="Pending">Pending</MenuItem>
                         <MenuItem value="In Progress">In Progress</MenuItem>
                         <MenuItem value="Completed">Completed</MenuItem>
                        </Select>
                     </FormControl>

                      {task.dueDate && (
                        <span
                          className={
                            new Date(task.dueDate).toLocaleDateString() ===
                            new Date().toLocaleDateString()
                              ? 'due-today'
                              : new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0)
                              ? 'overdue'
                              : 'upcoming'
                          }
                        >
                          {new Date(task.dueDate).toLocaleDateString() ===
                          new Date().toLocaleDateString()
                            ? 'Due Today'
                            : new Date(task.dueDate) < new Date().setHours(0, 0, 0, 0)
                              ? 'Overdue'
                              : 'Upcoming'}
                          : {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}                 
                    </div>

                    <span
                      className={`priority priority-${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>

                    <Button
                      className="edit-button"
                      variant="outlined"
                      color="primary"
                      onClick={() => editTask(task)}
                      type="button"
                   >
                      Edit
                   </Button>

                    <Button
                      className="delete-button"
                      variant="outlined"
                      color="error"
                      onClick={() => deleteTask(task.id)}
                      type="button"
                     aria-label={`Delete ${task.title}`}
                    >
                      Delete
                    </Button>
                  </article>
              ))
            )}
            
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <Button
               type="button"
               variant="outlined"
               onClick={() => setCurrentPage(previousPage => previousPage - 1)}
               disabled={currentPage === 1}
              >
               Previous
              </Button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <Button
               type="button"
               variant="outlined"
               onClick={() => setCurrentPage(previousPage => previousPage + 1)}
               disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </section>

        <footer>TaskFlow · Built with React, Express and MongoDB</footer>
      </main>
    </div>
  )

}

export default App