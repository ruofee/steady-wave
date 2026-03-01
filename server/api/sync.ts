import { Router } from 'express'
import { getDb, type Overview } from '../db.js'
import { fetchFundBasicInfo } from '../external/fundApi.js'

const router = Router()

interface FundWithProfit {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  netAssetValue?: number
  accumulatedValue?: number
  netValueDate?: string
  dayGrowthRate?: number
  currentValue: number        // 当前市值
  totalProfit: number         // 总盈亏
  profitRate: number          // 盈亏比例(%)
  yesterdayProfit: number     // 昨日盈亏
  yesterdayProfitRate: number // 昨日盈亏比例(%)
  createdAt: string
  updatedAt: string
}

const calculateFundProfit = (fund: any): FundWithProfit => {
  const currentValue = fund.netAssetValue ? fund.netAssetValue * fund.shares : 0
  const totalCost = fund.cost * fund.shares
  const totalProfit = currentValue - totalCost
  const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  
  // 计算昨日盈亏
  const yesterdayValue = fund.netAssetValue && fund.dayGrowthRate
    ? fund.netAssetValue * (1 - fund.dayGrowthRate / 100) * fund.shares
    : currentValue
  const yesterdayProfit = currentValue - yesterdayValue
  const yesterdayProfitRate = yesterdayValue > 0 ? (yesterdayProfit / yesterdayValue) * 100 : 0

  return {
    ...fund,
    currentValue,
    totalProfit,
    profitRate,
    yesterdayProfit,
    yesterdayProfitRate,
  }
}

const calculateOverview = (funds: FundWithProfit[]): Overview => {
  const totalValue = funds.reduce((sum, f) => sum + f.currentValue, 0)
  const totalCost = funds.reduce((sum, f) => sum + f.cost * f.shares, 0)
  const totalProfit = totalValue - totalCost
  const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const yesterdayProfit = funds.reduce((sum, f) => sum + f.yesterdayProfit, 0)
  
  const totalYesterdayValue = totalValue - yesterdayProfit
  const yesterdayProfitRate = totalYesterdayValue > 0 
    ? (yesterdayProfit / totalYesterdayValue) * 100 
    : 0

  return {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitRate,
    yesterdayProfit,
    yesterdayProfitRate,
    updatedAt: new Date().toISOString(),
  }
}

const updateOverview = async (db: any) => {
  const fundsWithProfit = db.data.funds.map(calculateFundProfit)
  db.data.overview = calculateOverview(fundsWithProfit)
  await db.write()
}

// 同步单个基金净值
router.post('/:fundCode', async (req, res) => {
  try {
    const { fundCode } = req.params
    const db = await getDb()

    const fund = db.data.funds.find(f => f.fundCode === fundCode)
    if (!fund) {
      res.status(404).json({
        success: false,
        message: '基金不存在',
      })
      return
    }

    const response = await fetchFundBasicInfo(fundCode)
    
    if (!response.Datas) {
      res.status(500).json({
        success: false,
        message: '无法获取基金信息',
      })
      return
    }
    
    const fundInfo = response.Datas
    const updateDate = fundInfo.FSRQ || fundInfo.ESTABDATE || ''

    // 如果净值日期没有变化,不需要更新
    if (fund.netValueDate === updateDate) {
      const fundWithProfit = calculateFundProfit(fund)
      
      res.json({
        success: true,
        data: {
          fund: fundWithProfit,
          overview: db.data.overview,
        },
        message: '基金净值未更新,无需同步',
      })
      return
    }

    fund.netAssetValue = parseFloat(fundInfo.DWJZ || '0')
    fund.accumulatedValue = parseFloat(fundInfo.LJJZ || '0')
    fund.netValueDate = updateDate
    fund.dayGrowthRate = parseFloat(fundInfo.RZDF || '0')
    fund.updatedAt = new Date().toISOString()

    // 更新总览数据
    await updateOverview(db)

    const fundWithProfit = calculateFundProfit(fund)

    res.json({
      success: true,
      data: {
        fund: fundWithProfit,
        overview: db.data.overview,
      },
      message: '基金信息同步成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '同步失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 批量同步所有基金净值
router.post('/', async (_req, res) => {
  try {
    const db = await getDb()

    if (db.data.funds.length === 0) {
      res.json({
        success: true,
        data: {
          funds: [],
          overview: db.data.overview,
        },
        message: '没有需要同步的基金',
      })
      return
    }

    const updatePromises = db.data.funds.map(async (fund) => {
      try {
        const response = await fetchFundBasicInfo(fund.fundCode)
        
        if (!response.Datas) {
          return { 
            success: false, 
            fundCode: fund.fundCode, 
            skipped: false, 
            reason: '无法获取基金信息' 
          }
        }
        
        const fundInfo = response.Datas
        const updateDate = fundInfo.FSRQ || fundInfo.ESTABDATE || ''
        
        // 如果净值日期没有变化,跳过更新
        if (fund.netValueDate === updateDate) {
          return { success: true, fundCode: fund.fundCode, skipped: true, reason: '净值未更新' }
        }
        
        fund.netAssetValue = parseFloat(fundInfo.DWJZ || '0')
        fund.accumulatedValue = parseFloat(fundInfo.LJJZ || '0')
        fund.netValueDate = updateDate
        fund.dayGrowthRate = parseFloat(fundInfo.RZDF || '0')
        fund.updatedAt = new Date().toISOString()
        return { success: true, fundCode: fund.fundCode, skipped: false }
      } catch (error) {
        return { 
          success: false, 
          fundCode: fund.fundCode,
          skipped: false,
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    })

    const results = await Promise.all(updatePromises)
    
    // 只有在有数据更新时才重新计算总览
    const hasUpdates = results.some(r => r.success && !r.skipped)
    if (hasUpdates) {
      await updateOverview(db)
    }

    const fundsWithProfit = db.data.funds.map(calculateFundProfit)

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const skippedCount = results.filter(r => r.success && r.skipped).length

    res.json({
      success: true,
      data: {
        funds: fundsWithProfit,
        overview: db.data.overview,
        syncDetails: {
          total: results.length,
          success: successCount,
          failed: failCount,
          skipped: skippedCount,
          details: results,
        },
      },
      message: `同步完成: 成功 ${successCount} 个, 失败 ${failCount} 个, 跳过 ${skippedCount} 个`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量同步失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
