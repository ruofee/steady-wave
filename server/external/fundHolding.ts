import http from 'http'
import https from 'https'

export interface StockHolding {
  stockCode: string          // 股票代码
  stockName: string          // 股票名称
  holdRatio: number          // 持仓占净值比例(%)
  holdShares: number         // 持仓数量(万股)
  holdValue: number          // 持仓市值(万元)
  updateDate: string         // 数据更新日期
}

export interface BondHolding {
  bondCode: string           // 债券代码
  bondName: string           // 债券名称
  holdRatio: number          // 持仓占净值比例(%)
  holdValue: number          // 持仓市值(万元)
  updateDate: string         // 数据更新日期
}

export interface AssetAllocation {
  stocks: number             // 股票占比(%)
  bonds: number              // 债券占比(%)
  cash: number               // 现金占比(%)
  other: number              // 其他占比(%)
  updateDate: string         // 数据更新日期
}

export interface FundHoldingInfo {
  fundCode: string
  fundName: string
  assetAllocation: AssetAllocation  // 资产配置
  stockHoldings: StockHolding[]     // 股票持仓
  bondHoldings: BondHolding[]       // 债券持仓
  updateDate: string                // 持仓数据日期
}

/**
 * 获取基金的股票持仓信息
 * 使用天天基金网的持仓接口
 */
export const fetchFundHolding = async (fundCode: string): Promise<FundHoldingInfo> => {
  // 并行获取股票持仓和债券持仓
  const [holdingHtml, bondHtml] = await Promise.all([
    fetchHoldingHtml(fundCode, 'jjcc'), // 股票持仓
    fetchHoldingHtml(fundCode, 'zqcc'), // 债券持仓
  ])

  const result = parseHoldingData(fundCode, holdingHtml)
  const bondResult = parseBondHoldingData(bondHtml)
  
  // 合并债券持仓
  result.bondHoldings = bondResult.bondHoldings
  
  // 从持仓数据计算资产配置
  const stockRatio = result.stockHoldings.reduce((sum, h) => sum + h.holdRatio, 0)
  const bondRatio = result.bondHoldings.reduce((sum, h) => sum + h.holdRatio, 0)
  
  result.assetAllocation = {
    stocks: stockRatio,
    bonds: bondRatio,
    cash: 0, // 无法从持仓数据获取
    other: Math.max(0, 100 - stockRatio - bondRatio),
    updateDate: result.updateDate,
  }
  
  return result
}

/**
 * 获取持仓 HTML
 */
const fetchHoldingHtml = (fundCode: string, type: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 天天基金网持仓接口
    // type: jjcc=股票持仓, zqcc=债券持仓
    const url = `http://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=${type}&code=${fundCode}&topline=10`

    http.get(url, {
      headers: {
        'Referer': `http://fundf10.eastmoney.com/`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        resolve(data)
      })
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch fund holding data: ${error.message}`))
    })
  })
}

/**
 * 解析债券持仓数据
 */
const parseBondHoldingData = (html: string): { bondHoldings: BondHolding[], updateDate: string } => {
  const bondHoldings: BondHolding[] = []
  
  // 提取最新的持仓日期
  let updateDate = ''
  const dateMatch = html.match(/截止至：<font[^>]*>(\d{4}-\d{2}-\d{2})<\/font>/)
  if (dateMatch) {
    updateDate = dateMatch[1]
  }

  // 解析第一个债券持仓表格（最新季度）
  const bondBoxMatch = html.match(/<div class='box'>[\s\S]*?债券投资明细[\s\S]*?<table class='w782 comm tzxq'>(.*?)<\/table>/s)
  if (bondBoxMatch) {
    const tableContent = bondBoxMatch[1]
    
    const tbodyMatch = tableContent.match(/<tbody>(.*?)<\/tbody>/s)
    if (tbodyMatch) {
      const tbodyContent = tbodyMatch[1]
      const rowRegex = /<tr>(.*?)<\/tr>/gs
      const rows = Array.from(tbodyContent.matchAll(rowRegex))
      
      for (const row of rows) {
        const rowContent = row[1]
        const cellRegex = /<td[^>]*>(.*?)<\/td>/g
        const cells = Array.from(rowContent.matchAll(cellRegex)).map(m => 
          m[1].replace(/<[^>]+>/g, '').trim()
        )

        if (cells.length >= 5) {
          // 债券表格格式：序号、债券代码、债券名称、占净值比例、持仓市值
          const bondCode = cells[1] || ''
          const bondName = cells[2] || ''
          const holdRatio = parseFloat(cells[3]?.replace(/%/g, '') || '0')
          const holdValue = parseFloat(cells[4]?.replace(/,/g, '') || '0')

          if (bondCode) {
            bondHoldings.push({
              bondCode,
              bondName,
              holdRatio,
              holdValue,
              updateDate,
            })
          }
        }
      }
    }
  }

  return { bondHoldings, updateDate }
}

/**
 * 解析持仓数据
 */
const parseHoldingData = (fundCode: string, html: string): FundHoldingInfo => {
  const stockHoldings: StockHolding[] = []
  const bondHoldings: BondHolding[] = []
  
  // 提取基金名称
  const fundNameMatch = html.match(/<a[^>]*title='([^']+)'[^>]*href='http:\/\/fund\.eastmoney\.com\/\d+\.html'>/)
  const fundName = fundNameMatch ? fundNameMatch[1] : ''

  // 提取最新的持仓日期（第一个出现的日期）
  let updateDate = ''
  const dateMatch = html.match(/截止至：<font[^>]*>(\d{4}-\d{2}-\d{2})<\/font>/)
  if (dateMatch) {
    updateDate = dateMatch[1]
  }

  // 解析第一个股票持仓表格（最新季度）
  const stockBoxMatch = html.match(/<div class='box'>[\s\S]*?股票投资明细[\s\S]*?<table class='w782 comm tzxq'>(.*?)<\/table>/s)
  if (stockBoxMatch) {
    const tableContent = stockBoxMatch[1]
    
    // 匹配 tbody 中的每一行数据
    const tbodyMatch = tableContent.match(/<tbody>(.*?)<\/tbody>/s)
    if (tbodyMatch) {
      const tbodyContent = tbodyMatch[1]
      const rowRegex = /<tr>(.*?)<\/tr>/gs
      const rows = Array.from(tbodyContent.matchAll(rowRegex))
      
      for (const row of rows) {
        const rowContent = row[1]
        const cellRegex = /<td[^>]*>(.*?)<\/td>/g
        const cells = Array.from(rowContent.matchAll(cellRegex)).map(m => 
          m[1].replace(/<[^>]+>/g, '').trim()
        )

        if (cells.length >= 7) {
          const stockCode = cells[1] || ''
          const stockName = cells[2] || ''
          
          // 判断表格列数（有些表格有"最新价"和"涨跌幅"列）
          let holdRatio = 0
          let holdShares = 0
          let holdValue = 0
          
          if (cells.length >= 9) {
            // 9列格式：序号、代码、名称、最新价、涨跌幅、相关资讯、占净值比例、持股数、持仓市值
            holdRatio = parseFloat(cells[6]?.replace(/%/g, '') || '0')
            holdShares = parseFloat(cells[7]?.replace(/,/g, '') || '0')
            holdValue = parseFloat(cells[8]?.replace(/,/g, '') || '0')
          } else {
            // 7列格式：序号、代码、名称、相关资讯、占净值比例、持股数、持仓市值
            holdRatio = parseFloat(cells[4]?.replace(/%/g, '') || '0')
            holdShares = parseFloat(cells[5]?.replace(/,/g, '') || '0')
            holdValue = parseFloat(cells[6]?.replace(/,/g, '') || '0')
          }

          if (stockCode) {
            stockHoldings.push({
              stockCode,
              stockName,
              holdRatio,
              holdShares,
              holdValue,
              updateDate,
            })
          }
        }
      }
    }
  }

  // 计算股票总仓位（从持仓累加）
  const stockRatio = stockHoldings.reduce((sum, h) => sum + h.holdRatio, 0)

  return {
    fundCode,
    fundName,
    assetAllocation: {
      stocks: stockRatio,
      bonds: 0,
      cash: 0,
      other: Math.max(0, 100 - stockRatio),
      updateDate,
    },
    stockHoldings,
    bondHoldings,
    updateDate,
  }
}

/**
 * 使用备用接口获取持仓（JSON格式）
 */
export const fetchFundHoldingJson = (fundCode: string): Promise<FundHoldingInfo> => {
  return new Promise((resolve, reject) => {
    // 备用接口：天天基金网的 JSON API
    const url = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${fundCode}&topline=10&year=&month=`

    https.get(url, {
      headers: {
        'Referer': `https://fundf10.eastmoney.com/`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = parseHoldingData(fundCode, data)
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse fund holding data: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      })
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch fund holding data: ${error.message}`))
    })
  })
}

/**
 * 批量获取多个基金的持仓
 */
export const fetchMultipleFundHoldings = async (fundCodes: string[]): Promise<FundHoldingInfo[]> => {
  const promises = fundCodes.map(code => fetchFundHolding(code))
  return Promise.all(promises)
}

