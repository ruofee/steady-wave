import express from 'express'
import cors from 'cors'
import fundsRouter from './api/fund.js'
import syncRouter from './api/sync.js'
import dataRouter from './api/data.js'

const app = express()
const PORT = 3000

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 挂载基金相关路由
app.use('/api/funds', fundsRouter)
app.use('/api/sync', syncRouter)
app.use('/api/data', dataRouter)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
