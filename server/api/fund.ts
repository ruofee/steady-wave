import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../db.js'
import { searchFunds, fetchFundBasicInfo, fetchFundAssetAllocation, fetchFundPosition, fetchFundSectorAllocation, fetchFundNetDiagram } from '../external/fundApi.js'
import { fetchFundHolding } from '../external/fundHolding.js'
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
      const response = await fetchFundBasicInfo(fund.fundCode)
      if (response.Datas) {
        const info = response.Datas
        fund.netAssetValue = parseFloat(info.DWJZ || '0')
        fund.accumulatedValue = parseFloat(info.LJJZ || '0')
        fund.netValueDate = info.FSRQ || info.ESTABDATE || ''
        fund.dayGrowthRate = parseFloat(info.RZDF || '0')
      }
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

// 修改基金
router.put('/:fundCode', async (req, res) => {
  try {
    const { fundCode } = req.params
    const { cost, shares } = req.body
    
    if (!fundCode) {
      res.status(400).json({
        success: false,
        message: '缺少基金代码',
      })
      return
    }
    
    if (cost !== undefined && (typeof cost !== 'number' || cost <= 0)) {
      res.status(400).json({
        success: false,
        message: '持仓成本价必须大于0',
      })
      return
    }
    
    if (shares !== undefined && (typeof shares !== 'number' || shares <= 0)) {
      res.status(400).json({
        success: false,
        message: '持仓数量必须大于0',
      })
      return
    }
    
    const db = await getDb()
    const fund = db.data.funds.find((f) => f.fundCode === fundCode)
    
    if (!fund) {
      res.status(404).json({
        success: false,
        message: '基金不存在',
      })
      return
    }
    
    if (cost !== undefined) {
      fund.cost = Number(cost)
    }
    
    if (shares !== undefined) {
      fund.shares = Number(shares)
    }
    
    fund.updatedAt = new Date().toISOString()
    
    await updateOverview(db)
    const withProfit = calculateFundProfit(fund)
    
    res.json({ success: true, data: withProfit })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '修改基金失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 获取基金持仓
router.get('/:fundCode/holding', async (req, res) => {
  try {
    const { fundCode } = req.params
    
    if (!fundCode) {
      res.status(400).json({
        success: false,
        message: '缺少基金代码',
      })
      return
    }
    
    // 并行获取资产配置和持仓信息
    const [assetAllocationResult, positionResult] = await Promise.all([
      fetchFundAssetAllocation(fundCode),
      fetchFundPosition(fundCode),
    ])
    
    const assetAllocation = assetAllocationResult.Datas?.[0]
    const position = positionResult.Datas
    
    // 转换持仓数据格式
    const stockHoldings = (position?.fundStocks || []).map(stock => {
      return {
        stockCode: stock.GPDM,
        stockName: stock.GPJC,
        holdRatio: parseFloat(stock.JZBL || '0'),
        holdShares: 0, // 新接口没有提供持有数量
        holdValue: 0, // 新接口没有提供市值数据
        updateDate: assetAllocation?.FSRQ || '',
      }
    })
    
    const bondHoldings = (position?.fundboods || []).map(bond => ({
      bondCode: bond.ZQDM,
      bondName: bond.ZQMC,
      holdRatio: parseFloat(bond.ZJZBL || '0'),
      holdValue: 0, // 新接口没有提供市值数据
      updateDate: assetAllocation?.FSRQ || '',
    }))
    
    // 组装完整的持仓信息
    const holdingInfo = {
      fundCode,
      fundName: position?.ETFSHORTNAME || '',
      assetAllocation: {
        stocks: parseFloat(assetAllocation?.GP || '0'),
        bonds: parseFloat(assetAllocation?.ZQ || '0'),
        cash: parseFloat(assetAllocation?.HB || '0'),
        other: parseFloat(assetAllocation?.QT || '0'),
        updateDate: assetAllocation?.FSRQ || '',
      },
      stockHoldings,
      bondHoldings,
      updateDate: assetAllocation?.FSRQ || '',
    }
    
    res.json({ 
      success: true, 
      data: holdingInfo,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取基金持仓失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 获取基金行业配比
router.get('/:fundCode/sector', async (req, res) => {
  try {
    const { fundCode } = req.params
    
    if (!fundCode) {
      res.status(400).json({
        success: false,
        message: '缺少基金代码',
      })
      return
    }
    
    const sectorResult = await fetchFundSectorAllocation(fundCode)

    const sectorData = (sectorResult.Datas || [])
      .map(sector => ({
        industryName: sector.HYMC,
        ratio: parseFloat(sector.ZJZBL || '0'),
        date: sector.FSRQ,
        marketValue: parseFloat(sector.SZ || '0'),
      }))
      .filter(sector => sector.industryName !== '合计')
    
    res.json({ 
      success: true, 
      data: sectorData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取基金行业配比失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 获取基金基本信息
router.get('/:fundCode/info', async (req, res) => {
  try {
    const { fundCode } = req.params
    
    if (!fundCode) {
      res.status(400).json({
        success: false,
        message: '缺少基金代码',
      })
      return
    }
    
    const result = await fetchFundBasicInfo(fundCode)
    const basicInfo = result.Datas
    
    // 转换为前端友好的格式,只返回常用字段
    const formattedInfo = {
      fundCode: basicInfo.FCODE,
      fundName: basicInfo.SHORTNAME,
      fundType: basicInfo.FUNDTYPE,
      fundFeature: basicInfo.FEATURE,
      riskLevel: basicInfo.RISKLEVEL,
      
      // 净值信息
      unitNav: parseFloat(basicInfo.DWJZ || '0'),
      accumulatedNav: parseFloat(basicInfo.LJJZ || '0'),
      dailyGrowth: parseFloat(basicInfo.RZDF || '0'),
      
      // 费率信息
      rate: basicInfo.RATE,
      sourceRate: basicInfo.SOURCERATE,
      
      // 申购赎回
      subscribeStatus: basicInfo.SGZT,
      redeemStatus: basicInfo.SHZT,
      minSubscribe: basicInfo.MINSG,
      
      // 基金公司
      fundCompany: basicInfo.JJGS,
      fundCompanyId: basicInfo.JJGSID,
      
      // 成立信息
      establishDate: basicInfo.ESTABDATE,
      
      // 指数信息
      indexCode: basicInfo.INDEXCODE,
      indexName: basicInfo.INDEXNAME,
      
      // 评级
      rating: basicInfo.RLEVEL_SZ,
      
      // 风险指标
      sharp1: basicInfo.SHARP1,
      sharp2: basicInfo.SHARP2,
      sharp3: basicInfo.SHARP3,
      maxDrawdown: basicInfo.MAXRETRA1,
      
      // 基金介绍
      description: basicInfo.COMMENTS,
      benchmark: basicInfo.BENCH,
      investmentIdea: basicInfo.INVESTMENTIDEAR,
    }
    
    res.json({ 
      success: true, 
      data: formattedInfo,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取基金基本信息失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 获取基金净值走势
router.get('/:fundCode/net-diagram', async (req, res) => {
  try {
    const { fundCode } = req.params
    const range = String(req.query.range || 'y')
    
    if (!fundCode) {
      res.status(400).json({
        success: false,
        message: '缺少基金代码',
      })
      return
    }
    
    // 验证时间范围参数
    const validRanges = ['y', '3y', '6y', 'n', '3n', '5n']
    if (!validRanges.includes(range)) {
      res.status(400).json({
        success: false,
        message: `无效的时间范围参数，支持的值: ${validRanges.join(', ')}`,
      })
      return
    }
    
    const result = await fetchFundNetDiagram(fundCode, range)
    
    res.json({ 
      success: true, 
      data: result.Datas,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取基金净值走势失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
