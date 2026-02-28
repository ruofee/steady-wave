import { JSONFilePreset } from 'lowdb/node'

export interface Fund {
  id: string
  fundName: string
  fundCode: string
  cost: number
  shares: number
  netAssetValue?: number     // 单位净值
  accumulatedValue?: number  // 累计净值
  netValueDate?: string      // 净值日期
  dayGrowthRate?: number     // 日增长率
  createdAt: string
  updatedAt: string
}

export interface Overview {
  totalValue: number          // 总持仓金额
  totalCost: number           // 总成本
  totalProfit: number         // 总盈亏
  totalProfitRate: number     // 总盈亏比例(%)
  yesterdayProfit: number     // 昨日盈亏总额
  yesterdayProfitRate: number // 昨日盈亏比例(%)
  updatedAt: string           // 更新时间
}

export interface Database {
  funds: Fund[]
  overview: Overview
}

const defaultData: Database = {
  funds: [],
  overview: {
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalProfitRate: 0,
    yesterdayProfit: 0,
    yesterdayProfitRate: 0,
    updatedAt: new Date().toISOString(),
  },
}

let db: Awaited<ReturnType<typeof JSONFilePreset<Database>>> | null = null

export const getDb = async () => {
  if (!db) {
    db = await JSONFilePreset<Database>('db.json', defaultData)
  }
  return db
}
