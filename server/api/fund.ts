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
    const { fundName, fundCode, code, name, cost, shares } = req.body
    
    const finalFundCode = String(fundCode || code || '').trim()
    const finalFundName = String(fundName || name || '').trim()
    
    if (!finalFundName || !finalFundCode) {
      res.status(400).json({
        success: false,
        message: '缺少基金名称或基金代码',
      })
      return
    }
    
    if (typeof cost !== 'number' || cost <= 0) {
      res.status(400).json({
        success: false,
        message: '持仓成本价必须大于0',
      })
      return
    }
    
    if (typeof shares !== 'number' || shares <= 0) {
      res.status(400).json({
        success: false,
        message: '持仓数量必须大于0',
      })
      return
    }
    
    const db = await getDb()
    if (db.data.funds.some((f) => f.fundCode === finalFundCode)) {
      res.status(400).json({
        success: false,
        message: '该基金已存在',
      })
      return
    }
    
    const now = new Date().toISOString()
    const fund = {
      id: randomUUID(),
      fundName: finalFundName,
      fundCode: finalFundCode,
      cost: Number(cost),
      shares: Number(shares),
      createdAt: now,
      updatedAt: now,
      totalCost: 0,
      totalProfit: 0,
      profitRate: 0,
      yesterdayProfit: 0,
      yesterdayProfitRate: 0,
      netAssetValue: 0,
      accumulatedValue: 0,
      netValueDate: '',
      dayGrowthRate: 0,
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
