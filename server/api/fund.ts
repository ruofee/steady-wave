import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db.js'
import { searchFunds } from '../external/fundSearch.js'
import { fetchFundInfo } from '../external/fund.js'
import { updateOverview, calculateFundProfit } from './data.js'

const router = Router()

// 基金搜索（按代码或名称模糊）
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim()
    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const list = await searchFunds(q, limit)
    res.json({ success: true, data: list })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '搜索失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 新增基金
router.post('/', async (req, res) => {
  try {
    const { fundName, fundCode, cost, shares } = req.body
    if (!fundName || !fundCode || typeof cost !== 'number' || typeof shares !== 'number') {
      res.status(400).json({
        success: false,
        message: '缺少 fundName、fundCode、cost 或 shares',
      })
      return
    }
    const db = await getDb()
    if (db.data.funds.some((f) => f.fundCode === fundCode)) {
      res.status(400).json({
        success: false,
        message: '该基金已存在',
      })
      return
    }
    const now = new Date().toISOString()
    const fund = {
      id: randomUUID(),
      fundName: String(fundName).trim(),
      fundCode: String(fundCode).trim(),
      cost: Number(cost),
      shares: Number(shares),
      createdAt: now,
      updatedAt: now,
    }
    try {
      const info = await fetchFundInfo(fund.fundCode)
      fund.netAssetValue = info.netAssetValue
      fund.accumulatedValue = info.accumulatedValue
      fund.netValueDate = info.updateDate
      fund.dayGrowthRate = info.dayGrowthRate
    } catch {
      // 忽略净值拉取失败，仅保存成本与份额
    }
    db.data.funds.push(fund)
    await updateOverview(db)
    const withProfit = calculateFundProfit(fund)
    res.json({ success: true, data: withProfit })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加基金失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
