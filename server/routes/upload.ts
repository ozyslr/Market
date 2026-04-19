import { Router, type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'server', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Sadece görsel dosyaları kabul edilir'))
  },
})

router.post('/image', authenticate, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Dosya bulunamadı' }); return }
  const url = `/uploads/${req.file.filename}`
  res.json({ url })
})

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(400).json({ error: err.message })
})

export default router
