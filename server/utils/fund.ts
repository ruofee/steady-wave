import http from 'http'

export interface FundInfo {
  fundCode: string
  fundName: string
  netAssetValue: number      // 单位净值(官方)
  accumulatedValue: number   // 累计净值
  updateDate: string         // 净值日期
  dayGrowthRate: number      // 日增长率
}

const fetchFundInfo = (fundCode: string): Promise<FundInfo> => {
  return new Promise((resolve, reject) => {
    const url = `http://api.fund.eastmoney.com/f10/lsjz?fundCode=${fundCode}&pageIndex=1&pageSize=1`

    http.get(url, {
      headers: {
        'Referer': 'http://fundf10.eastmoney.com/',
      },
    }, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          
          if (!json.Data || !json.Data.LSJZList || json.Data.LSJZList.length === 0) {
            throw new Error('No fund data found')
          }

          const latestData = json.Data.LSJZList[0]

          const fundInfo: FundInfo = {
            fundCode: fundCode,
            fundName: json.Data.FCODE || '',
            netAssetValue: parseFloat(latestData.DWJZ || '0'),
            accumulatedValue: parseFloat(latestData.LJJZ || '0'),
            updateDate: latestData.FSRQ || '',
            dayGrowthRate: parseFloat(latestData.JZZZL || '0'),
          }

          resolve(fundInfo)
        } catch (error) {
          reject(new Error(`Failed to parse fund data: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      })
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch fund data: ${error.message}`))
    })
  })
}

const fetchMultipleFunds = async (fundCodes: string[]): Promise<FundInfo[]> => {
  const promises = fundCodes.map(code => fetchFundInfo(code))
  return Promise.all(promises)
}

export { fetchFundInfo, fetchMultipleFunds }
