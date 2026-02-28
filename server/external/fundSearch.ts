import http from 'http'

/** fundcode_search.js 返回的单条: [基金代码, 简拼, 基金名称, 基金类型, 全拼] */
type FundCodeSearchRow = [string, string, string, string, string]

export interface FundSearchItem {
  fundCode: string
  fundName: string
  fundType: string
}

const FUNDCODE_SEARCH_URL = 'http://fund.eastmoney.com/js/fundcode_search.js'
const DEFAULT_PAGE_SIZE = 20

const fetchFundCodeList = (): Promise<FundCodeSearchRow[]> => {
  return new Promise((resolve, reject) => {
    http.get(FUNDCODE_SEARCH_URL, {
      headers: { Referer: 'http://fund.eastmoney.com/' },
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          // 格式: var r = [["000001","HXCZHH","华夏成长混合","混合型",...], ...]
          const match = data.match(/var r = (\[[\s\S]*\]);?\s*$/)
          if (!match) {
            reject(new Error('Invalid fundcode_search.js format'))
            return
          }
          const list = JSON.parse(match[1]) as FundCodeSearchRow[]
          resolve(list)
        } catch (e) {
          reject(new Error(`Failed to parse fund list: ${e instanceof Error ? e.message : 'Unknown'}`))
        }
      })
    }).on('error', (e) => reject(e))
  })
}

const normalizeKeyword = (s: string): string => s.trim().toLowerCase()

const matchKeyword = (keyword: string, row: FundCodeSearchRow): boolean => {
  const [code, jp, name, type, pinyin] = row
  const k = normalizeKeyword(keyword)
  if (!k) return false
  return (
    code.toLowerCase().includes(k) ||
    name.includes(keyword.trim()) ||
    jp.toLowerCase().includes(k) ||
    pinyin.toLowerCase().includes(k)
  )
}

let cachedList: FundCodeSearchRow[] | null = null
let cachedAt = 0
const CACHE_MS = 1000 * 60 * 60 // 1 小时

const getFundCodeList = async (): Promise<FundCodeSearchRow[]> => {
  if (cachedList && Date.now() - cachedAt < CACHE_MS) {
    return cachedList
  }
  cachedList = await fetchFundCodeList()
  cachedAt = Date.now()
  return cachedList
}

/**
 * 根据基金代码或名称模糊搜索基金，返回基金列表
 */
export const searchFunds = async (
  keyword: string,
  limit: number = DEFAULT_PAGE_SIZE,
): Promise<FundSearchItem[]> => {
  const k = normalizeKeyword(keyword)
  if (!k) return []

  const list = await getFundCodeList()

  const rows = list.filter((row) => matchKeyword(keyword, row))
  const limited = rows.slice(0, limit)

  return limited.map(([fundCode, , fundName, fundType]) => ({
    fundCode,
    fundName,
    fundType,
  }))
}
