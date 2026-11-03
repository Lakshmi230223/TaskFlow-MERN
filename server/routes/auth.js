const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Task = require('../models/Task')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
}

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: 'Enter your name, email, and a password of at least 8 characters.'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    })

    const token = createToken(user._id.toString())

    res.cookie('token', token, COOKIE_OPTIONS)

    return res.status(201).json({
      message: 'Registration successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    console.error('Registration error:', error.message)

    return res.status(500).json({
      message: 'Unable to register user.'
    })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required.'
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      })
    }

    const token = createToken(user._id.toString())

    res.cookie('token', token, COOKIE_OPTIONS)

    return res.json({
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Unable to log in.'
    })
  }
})

// CHECK CURRENT LOGIN SESSION
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({
        message: 'Not logged in.'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId)
      .select('-password')

    if (!user) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      return res.status(401).json({
        message: 'User account not found.'
      })
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return res.status(401).json({
      message: 'Session is invalid or expired.'
    })
  }
})

// UPDATE USER PROFILE
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        message: 'Name is required.'
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      })
    }

    user.name = name.trim()

    await user.save()

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Profile update error:', error.message)

    return res.status(500).json({
      message: 'Unable to update profile.'
    })
  }
})

// CHANGE PASSWORD
router.patch('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (
      typeof currentPassword !== 'string' ||
      !currentPassword ||
      typeof newPassword !== 'string' ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: 'Enter your current password and a new password of at least 8 characters.'
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      })
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    )

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: 'Current password is incorrect.'
      })
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    )

    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password must be different from the current password.'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    user.password = hashedPassword

    await user.save()

    return res.json({
      message: 'Password changed successfully.'
    })
  } catch (error) {
    console.error('Change password error:', error.message)

    return res.status(500).json({
      message: 'Unable to change password.'
    })
  }
})

// DELETE ACCOUNT
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body

    if (typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Please enter your current password to delete your account.'
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      })
    }

    // Verify the current password.
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: 'Incorrect password. Account was not deleted.'
      })
    }

    // Prevent deletion of the last admin account.
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({
        role: 'admin'
      })

      if (adminCount <= 1) {
        return res.status(403).json({
          message: 'The last admin account cannot be deleted.'
        })
      }
    }

    // Delete all tasks belonging to this user.
    await Task.deleteMany({
      userId: user._id
    })

    // Delete the user account.
    await User.findByIdAndDelete(user._id)

    // Clear the login cookie.
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return res.json({
      message: 'Your account and associated tasks have been deleted successfully.'
    })
  } catch (error) {
    console.error('Account deletion error:', error.message)

    return res.status(500).json({
      message: 'Unable to delete account.'
    })
  }
})

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  return res.json({
    message: 'Logged out successfully.'
  })
})

module.exports = router
