import { Request, Response } from 'express'
import pool from '../db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

interface User {
  id: number
  username: string
  email: string
  password?: string
}

export const register = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    )

    const user: User = result.rows[0]
    return res.status(201).json(user)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error registering user.' })
  }
}

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required.' })
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user: User = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const match = await bcrypt.compare(password, user.password!)

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    )

    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error logging in.' })
  }
}
