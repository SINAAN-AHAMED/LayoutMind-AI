import express from 'express'
import cors from 'cors'
import axios from 'axios'
import { z } from 'zod'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001
const PY_BASE = process.env.SOFT_ENGINE_URL || 'http://127.0.0.1:8000'

const StyleChipSchema = z.union([
  z.literal('Cozy'),
  z.literal('Minimal'),
  z.literal('Modern'),
  z.literal('Luxury'),
  z.literal('Compact'),
  z.literal('Bohemian'),
  z.literal('Industrial'),
  z.literal('Coastal'),
])

const OptimizeBodySchema = z.object({
  prompt: z.string().min(4).max(600),
  explicitStyle: z.union([StyleChipSchema, z.literal('')]).optional(),
  addPlants: z.boolean().optional(),
  addRugs: z.boolean().optional(),
  roomType: z.enum(['Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office']).optional(),
  lengthM: z.number().min(2).max(15).optional(),
  widthM: z.number().min(2).max(15).optional(),
  budgetINR: z.number().min(20000).max(1000000).optional(),
})

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req,res)=>{try{const r=await axios.get(`${PY_BASE}/health`,{timeout:3000});res.json(r.data)}catch{res.status(503).json({ok:false})}})

app.post('/api/optimize', async (req, res) => {
  const parsed = OptimizeBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', issues: parsed.error.issues })
    return
  }

  try {
    const r = await axios.post(`${PY_BASE}/optimize`, parsed.data, {
      timeout: 120_000,
      headers: { 'Content-Type': 'application/json' },
    })
    res.status(200).json(r.data)
  } catch (err) {
    const e = err
    const status = e?.response?.status ?? 502
    const detail = e?.response?.data ?? { error: 'Soft computing service unavailable' }
    res.status(status).json(detail)
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${PORT} (proxying ${PY_BASE})`)
})

