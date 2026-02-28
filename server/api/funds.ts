import { Router } from 'express'
import { getDb, type Fund } from '../db.js'

const router = Router()

// 查询基金列表
router.get('/', async (_req, res) => {
  try {
    const db = await getDb()
    res.json({
      success: true,
      data: db.data.funds,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 查询总览数据
router.get('/overview', async (_req, res) => {
  try {
    const db = await getDb()
    res.json({
      success: true,
      data: db.data.overview,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 新增基金
router.post('/', async (req, res) => {
  try {
    const { fundName, fundCode, cost, shares } = req.body

    if (!fundName || !fundCode || cost === undefined || shares === undefined) {
      res.status(400).json({
        success: false,
        message: '参数不完整,需要: fundName, fundCode, cost, shares',
      })
      return
    }

    const db = await getDb()
    
    // 检查是否已存在相同代码的基金
    const existingFund = db.data.funds.find(f => f.fundCode === fundCode)
    if (existingFund) {
      res.status(400).json({
        success: false,
        message: '该基金已存在',
      })
      return
    }

    const newFund: Fund = {
      id: Date.now().toString(),
      fundName,
      fundCode,
      cost: Number(cost),
      shares: Number(shares),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    db.data.funds.push(newFund)
    await db.write()

    res.json({
      success: true,
      data: newFund,
      message: '添加成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 删除基金
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = await getDb()

    const index = db.data.funds.findIndex(f => f.id === id)
    
    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '基金不存在',
      })
      return
    }

    db.data.funds.splice(index, 1)
    await db.write()

    res.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 生成测试数据
router.post('/mock', async (_req, res) => {
  try {
    const db = await getDb()

    // 清空现有数据
    db.data.funds = []

    const mockFunds: Fund[] = [
      {
        id: Date.now().toString(),
        fundName: '易方达蓝筹精选混合',
        fundCode: '005827',
        cost: 25000,
        shares: 10000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 1).toString(),
        fundName: '华夏上证50ETF联接A',
        fundCode: '001051',
        cost: 18000,
        shares: 8500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 2).toString(),
        fundName: '南方中证500ETF联接A',
        fundCode: '160119',
        cost: 32000,
        shares: 12000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: (Date.now() + 3).toString(),
        fundName: '广发科技创新混合',
        fundCode: '008903',
        cost: 17000,
        shares: 9000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    db.data.funds = mockFunds
    await db.write()

    res.json({
      success: true,
      data: mockFunds,
      message: `成功生成 ${mockFunds.length} 条测试数据`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成测试数据失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
