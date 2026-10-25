
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/api/tasks'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('') 
  const [editingTaskId, setEditingTaskId] = useState(null)

  // Convert a MongoDB task into the format used by our dashboard.
  function formatTask(task) {
    return {
      id: task._id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'Medium',
      status: task.completed ? 'Completed' : 'Pending',
    }
  }

  // Load tasks from the backend when the page opens.
  useEffect(() => {
    async function fetchTasks() {
      try {
        setError('')

        const response = await fetch(API_URL)

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
  }, [])

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
      }

      const response = await fetch(
        editingTaskId ? `${API_URL}/${editingTaskId}` : API_URL,
        {
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
    setDueDate(
      task.dueDate ? task.dueDate.slice(0, 10) : ''
    )

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }



  // Update task completion in MongoDB.
  async function changeStatus(id) {
    const task = tasks.find(item => item.id === id)

    if (!task) return

    const newCompleted = task.status !== 'Completed'

    try {
      setError('')

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: newCompleted,
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

  const visibleTasks = tasks.filter(task =>
    filter === 'All' || task.status === filter
  )

  const completed = tasks.filter(
    task => task.status === 'Completed'
  ).length

  const pending = tasks.filter(
    task => task.status === 'Pending'
  ).length

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
            <h1>Task Management</h1>
          </div>
          <span className="today">Personal Dashboard</span>
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
          <div className="stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="stat-card">
            <span>Pending tasks</span>
            <strong>{pending}</strong>
          </div>
          <div className="stat-card">
            <span>Completed tasks</span>
            <strong>{completed}</strong>
          </div>
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
            <input
              id="task-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="What do you need to do?"
              required
            />
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
            />

            <label htmlFor="task-due-date">Due date</label>
            <input
             id="task-due-date"       
             type="date"
             value={dueDate}
              onChange={event => setDueDate(event.target.value)}
           />     

            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={priority}
              onChange={event => setPriority(event.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <button type="submit">
              {editingTaskId ? 'Save changes' : '+ Add task'}
            </button>

          </form>

          <div className="filters">
            {['All', 'Pending', 'Completed'].map(item => (
              <button
                key={item}
                className={
                  filter === item ? 'filter active-filter' : 'filter'
                }
                onClick={() => setFilter(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="task-list">
            {loading ? (
              <p className="empty-state">Loading tasks...</p>
            ) : visibleTasks.length === 0 ? (
              <p className="empty-state">
                No tasks here yet. Add a task to get started!
              </p>
            ) : (
              visibleTasks.map(task => (
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
                    <span>{task.status}</span>

                      {task.dueDate && (
                     <span>
                       Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <span
                    className={`priority priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>

                  <button
                   className="edit-button"
                   onClick={() => editTask(task)}
                   type="button"
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteTask(task.id)}
                    type="button"
                    aria-label={`Delete ${task.title}`}
                  >
                    Delete
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <footer>TaskFlow · Built with React, Express and MongoDB</footer>
      </main>
    </div>
  )

}

export default App

