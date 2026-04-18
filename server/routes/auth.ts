import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import db from '../db.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'mercora-dev-secret'

const RegisterSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  role: z.enum(['buyer', 'seller']).default('buyer'),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message })
    return
  }

  const { name, email, password, role } = parsed.data
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' })
    return
  }

  const password_hash = await bcrypt.hash(password, 10)
  const id = randomUUID()
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, email, password_hash, role)

  const token = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ user: { id, name, email, role, token } })
})

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Geçersiz giriş bilgileri' })
    return
  }

  const { email, password } = parsed.data
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as {
    id: string; name: string; email: string; role: string; password_hash: string
  } | undefined

  if (!user) {
    res.status(401).json({ error: 'E-posta veya şifre hatalı' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'E-posta veya şifre hatalı' })
    return
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, token } })
})

export default router
