import { Router } from 'express'
import { Low } from 'lowdb'
import { getDb, Database, Fund } from '../db.js'
import { fetchFundInfo } from '../utils/fund.js'
import { add, subtract, multiply, divide } from '../utils/math.js'

const router = Router()

interface FundWithProfit {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  totalCost: number
  netAssetValue?: number
  accumulatedValue?: number
  netValueDate?: string
  dayGrowthRate?: number
  currentValue: number
  totalProfit: number
  profitRate: number
  yesterdayProfit: number
  yesterdayProfitRate: number
  createdAt: string
  updatedAt: string
}

const calculateFundProfit = (fund: Fund): FundWithProfit => {
  const currentValue = fund.netAssetValue
    ? multiply(fund.netAssetValue, fund.shares)
    : 0
  const totalCost = multiply(fund.cost, fund.shares)
  const totalProfit = subtract(currentValue, totalCost)
  const profitRate = multiply(divide(totalProfit, totalCost), 100)

  const yesterdayValue =
    fund.netAssetValue != null && fund.dayGrowthRate != null
      ? multiply(
          fund.netAssetValue,
          subtract(1, divide(fund.dayGrowthRate, 100)),
          fund.shares,
        )
      : currentValue
  const yesterdayProfit = subtract(currentValue, yesterdayValue)
  const yesterdayProfitRate = multiply(divide(yesterdayProfit, yesterdayValue), 100)

  return {
    ...fund,
    totalCost,
    currentValue,
    totalProfit,
    profitRate,
    yesterdayProfit,
    yesterdayProfitRate,
  }
}

const updateOverview = async (db: Low<Database>) => {
  const fundsWithProfit = db.data.funds.map(calculateFundProfit)

  const totalValue = fundsWithProfit.reduce((sum, f) => add(sum, f.currentValue), 0)
  const totalCost = fundsWithProfit.reduce((sum, f) => add(sum, multiply(f.cost, f.shares)), 0)
  const totalProfit = subtract(totalValue, totalCost)
  const totalProfitRate = multiply(divide(totalProfit, totalCost), 100)
  const yesterdayProfit = fundsWithProfit.reduce((sum, f) => add(sum, f.yesterdayProfit), 0)

  const totalYesterdayValue = subtract(totalValue, yesterdayProfit)
  const yesterdayProfitRate = multiply(divide(yesterdayProfit, totalYesterdayValue), 100)

  db.data.overview = {
    totalValue,
    totalCost,
    totalProfit,
    totalProfitRate,
    yesterdayProfit,
    yesterdayProfitRate,
    updatedAt: new Date().toISOString(),
  }
  
  await db.write()
}

const getDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const needsSync = (funds: any[]): boolean => {
  if (funds.length === 0) {
    return false
  }

  const now = new Date()
  const currentHour = now.getHours()
  const today = getDateString(now)
  
  // 获取昨天的日期
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getDateString(yesterday)

  // 三点之前(收盘前)
  if (currentHour < 15) {
    // 检查是否所有基金的净值日期都是昨天
    return funds.some(fund => !fund.netValueDate || fund.netValueDate !== yesterdayStr)
  } 
  // 三点之后(收盘后)
  else {
    // 检查是否所有基金的净值日期都是今天
    return funds.some(fund => !fund.netValueDate || fund.netValueDate !== today)
  }
}

// 获取所有数据(自动同步)
router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    const forceUpdate = req.query.forceUpdate === 'true'

    // 强制更新或智能判断是否需要同步
    if (forceUpdate || needsSync(db.data.funds)) {
      const now = new Date()
      const currentHour = now.getHours()
      const today = getDateString(now)
      
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = getDateString(yesterday)
      
      // 确定期望的净值日期
      const expectedDate = currentHour < 15 ? yesterdayStr : today
      
      // 强制更新:所有基金  智能更新:只更新不符合预期的基金
      const fundsToUpdate = forceUpdate 
        ? db.data.funds
        : db.data.funds.filter(fund => !fund.netValueDate || fund.netValueDate !== expectedDate)
      
      if (fundsToUpdate.length > 0) {
        const updatePromises = fundsToUpdate.map(async (fund) => {
          try {
            const fundInfo = await fetchFundInfo(fund.fundCode)
            
            // 只在净值日期变化时更新
            if (fund.netValueDate !== fundInfo.updateDate) {
              fund.netAssetValue = fundInfo.netAssetValue
              fund.accumulatedValue = fundInfo.accumulatedValue
              fund.netValueDate = fundInfo.updateDate
              fund.dayGrowthRate = fundInfo.dayGrowthRate
              fund.updatedAt = new Date().toISOString()
              return { success: true, updated: true, fundCode: fund.fundCode }
            }
            return { success: true, updated: false, fundCode: fund.fundCode }
          } catch (error) {
            return { 
              success: false, 
              updated: false, 
              fundCode: fund.fundCode,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })

        await Promise.all(updatePromises)
        
        // 重新计算总览
        await updateOverview(db)
      }
    }

    // 返回数据
    const fundsWithProfit = db.data.funds.map(calculateFundProfit)

    res.json({
      success: true,
      data: {
        funds: fundsWithProfit,
        overview: db.data.overview,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取数据失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
