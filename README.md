# TaskFlow – MERN Task Management Application

## Project Overview

TaskFlow is a full-stack task management application built using the MERN stack. It helps users organize, manage, and track their daily tasks through a user-friendly dashboard.

The application includes user authentication, task management, profile management, and role-based access for administrators.

## Features

### User Authentication
- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based authentication.
- Cookie-based session management.
- Logout functionality.

### Task Management
- Create, view, update, and delete tasks.
- Set task priorities.
- Add task descriptions and due dates.
- Update task completion status.
- Search tasks by title.
- Filter tasks by status.
- Store tasks in MongoDB.

### User Dashboard
- View personal tasks.
- Track task status and statistics.
- Manage tasks through the dashboard.

### Profile Management
- View and update profile information.
- Change password with current password verification.
- Delete personal account with password confirmation.

### Admin Dashboard
- View registered users and dashboard statistics.
- Search and filter users.
- Promote and demote user roles.
- Delete user accounts.
- Role-based access control.
- Protection against deleting the last administrator.

## Technologies Used

| Technology | Purpose |
|---|---|
| MongoDB | Database |
| Express.js | Backend framework |
| React.js | Frontend library |
| Node.js | Backend runtime |
| Mongoose | MongoDB object modeling |
| JavaScript | Application programming |
| CSS | Styling and responsive design |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Git and GitHub | Version control |

## Project Structure

```text
Task management app/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminDashboard.css
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Profile.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── middleware/
│   │   ├── adminMiddleware.js
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   └── tasks.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Prerequisites

Before running the application, install:

- Node.js and npm
- MongoDB Community Server
- MongoDB Compass (optional, for database management)
- Git

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Lakshmi230223/TaskFlow-MERN.git
```

### 2. Navigate to the project directory

```bash
cd TaskFlow-MERN
```

### 3. Install root dependencies

```bash
npm install
```

### 4. Install frontend dependencies

```bash
cd client
npm install
```

### 5. Install backend dependencies

```bash
cd ../server
npm install
```

## Environment Variables

Create a `.env` file inside the `server` folder.

Add the following configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_management
JWT_SECRET=your_long_random_secret
```

Replace the JWT secret placeholder with a strong random secret.

**Important:** Never upload your `.env` file or expose database credentials and authentication secrets on GitHub.

Make sure your local MongoDB server is running before starting the backend.

## Running the Application

The frontend and backend should run in separate terminals.

### Start the backend

Open a terminal:

```bash
cd server
npm run dev
```

Backend server:

```text
http://localhost:5000
```

### Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Vite will display the frontend development URL, normally:

```text
http://localhost:5173
```

Open that URL in your browser to use TaskFlow.

## Production Build

To create a production build of the frontend:

```bash
cd client
npm run build
```

## Database

TaskFlow uses MongoDB to store user and task information.

The default local database connection is:

```text
mongodb://127.0.0.1:27017/task_management
```

You can use MongoDB Compass to view and manage the database collections.

## Future Improvements

- Deploy the application for public access.
- Add additional dashboard analytics.
- Improve application performance and user experience.

## Author

Developed as a MERN stack full-stack project.

## License

This project is developed for learning and portfolio purposes.