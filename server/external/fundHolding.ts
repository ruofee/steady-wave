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

export interface FundHoldingInfo {
  fundCode: string
  fundName: string
  stockHoldings: StockHolding[]     // 股票持仓
  totalStockRatio: number           // 股票总仓位(%)
  updateDate: string                // 持仓数据日期
}

/**
 * 获取基金的股票持仓信息
 * 使用天天基金网的持仓接口
 */
export const fetchFundHolding = (fundCode: string): Promise<FundHoldingInfo> => {
  return new Promise((resolve, reject) => {
    // 天天基金网持仓接口
    const url = `http://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${fundCode}&topline=10`

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
        try {
          // 解析返回的 HTML 内容
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
 * 解析持仓数据
 */
const parseHoldingData = (fundCode: string, html: string): FundHoldingInfo => {
  const stockHoldings: StockHolding[] = []
  
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
  const firstBoxMatch = html.match(/<div class='box'>.*?<table class='w782 comm tzxq'>(.*?)<\/table>/s)
  if (!firstBoxMatch) {
    // 如果没有持仓数据，返回空列表
    return {
      fundCode,
      fundName,
      stockHoldings: [],
      totalStockRatio: 0,
      updateDate,
    }
  }

  const tableContent = firstBoxMatch[1]
  
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
        // cells[0]: 序号
        // cells[1]: 股票代码
        // cells[2]: 股票名称
        // cells[3]: 相关资讯 或 最新价
        // cells[4]: 涨跌幅 或 占净值比例
        // cells[5]: 相关资讯 或 持股数
        // cells[6]: 占净值比例 或 持仓市值
        // cells[7]: 持股数（如果有8列）
        // cells[8]: 持仓市值（如果有8列）
        
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

  // 计算股票总仓位（累加所有持仓比例）
  const totalStockRatio = stockHoldings.reduce((sum, holding) => sum + holding.holdRatio, 0)

  return {
    fundCode,
    fundName,
    stockHoldings,
    totalStockRatio,
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
