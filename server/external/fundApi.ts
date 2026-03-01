import { get } from '../utils/httpClient.js'

const BASE_URL = 'https://fundmobapi.eastmoney.com/FundMNewApi'

// 通用设备信息参数
const DEVICE_PARAMS = {
  deviceid: '3EA024C2-7F22-408B-95E4-383D38160FB3',
  plat: 'Iphone',
  product: 'EFund',
  version: '6.3.8',
}

/**
 * 基金搜索相关类型
 */
type FundCodeSearchRow = [string, string, string, string, string]

export interface FundSearchItem {
  fundCode: string
  fundName: string
  fundType: string
}

/**
 * 基金实时估算信息
 */
export interface FundRealtimeInfo {
  FCODE: string          // 基金代码
  SHORTNAME: string      // 基金简称
  GSZ: string            // 估算净值
  GSZZL: string          // 估算涨跌幅(%)
  GZTIME: string         // 估值时间
  DWJZ: string           // 单位净值
  JZRQ: string           // 净值日期
}

/**
 * 基金持仓占比数据
 */
export interface FundPosition {
  fundStocks: {
  GPDM: string,      // 股票代码
  GPJC: string,      // 股票简称
  JZBL: string,      // 占基金净值比例(%)
  TEXCH: string,     // 所属交易所
  ISINVISBL: string, // 是否隐藏
  PCTNVCHGTYPE: string, // 持仓变动类型
  PCTNVCHG: string,  // 持仓变动比例(%)
  NEWTEXCH: string,  // 新交易所标识
  INDEXCODE: string, // 指数代码
  INDEXNAME: string, // 指数名称
  }[],
  fundboods: {
    ZQDM: string // 债券代码
    ZQMC: string // 债券名称
    ZJZBL: string // 占净值比例(%)
    ISBROKEN: string // 是否违约
  }[],
  fundfofs: any[],        // FOF持仓(通常为空数组)
  ETFCODE: string | null, // ETF基金代码
  ETFSHORTNAME: string | null // ETF简称
}

/**
 * 基金基本信息
 */
export interface FundBasicInfo {
  FCODE: string;                 // 基金代码
  SHORTNAME: string;             // 基金简称
  FTYPE: string;                 // 基金类型
  FEATURE: string;               // 基金特色
  BFUNDTYPE: string;             // 基本基金类型
  FUNDTYPE: string;              // 基金分类
  RZDF: string;                  // 日涨跌幅
  DWJZ: string;                  // 单位净值
  LJJZ: string;                  // 累计净值
  SGZT: string;                  // 申购状态
  SHZT: string;                  // 赎回状态
  SOURCERATE: string;            // 原费率
  RATE: string;                  // 当前费率
  MINSG: string;                 // 最小申购额
  MAXSG: string;                 // 最大申购额
  SUBSCRIBETIME: string;         // 申购时间
  RISKLEVEL: string;             // 风险等级
  ISBUY: string;                 // 是否可买
  BAGTYPE: string;               // 袋类型
  CASHBUY: string;               // 现金购买
  SALETOCASH: string;            // 赎回到账
  STKTOCASH: string;             // 股票转现金
  STKEXCHG: string;              // 股票交易
  FUNDEXCHG: string;             // 基金交易
  BUY: boolean;                  // 可购买
  ISSALES: string;               // 是否在销售
  SALEMARK: string;              // 销售标签
  MINDT: string;                 // 最小定投额
  DTZT: string;                  // 定投状态
  REALSGCODE: string;            // 实际申购代码
  QDTCODE: string;               // 渠道代码
  BACKCODE: string;              // 备份代码
  ESTABDATE: string;             // 成立日期
  INDEXCODE: string;             // 指数代码
  INDEXNAME: string;             // 指数名称
  INDEXTEXCH: string;            // 所属交易所
  NEWINDEXTEXCH: string;         // 新交易所
  RLEVEL_SZ: string;             // 评级
  SHARP1: string;                // 夏普比率1
  SHARP2: string;                // 夏普比率2
  SHARP3: string;                // 夏普比率3
  MAXRETRA1: string;             // 最大回撤
  STDDEV1: string;               // 标准差1
  STDDEV2: string;               // 标准差2
  STDDEV3: string;               // 标准差3
  SSBCFMDATA: string;            // 确认信息
  SSBCFDAY: string;              // 确认日
  CURRENTDAYMARK: string;        // 今日标识
  BUYMARK: string;               // 申购标识
  JJGS: string;                  // 基金公司名称
  JJGSID: string;                // 基金公司ID
  TSRQ: string;                  // 特殊日期
  TTYPENAME: string;             // 类型名称
  TTYPE: string;                 // 类型
  FundSubjectURL: string;        // 基金官网
  FBKINDEXCODE: string;          // 板块指数代码
  FBKINDEXNAME: string;          // 板块指数名称
  FSRQ: string;                  // 规模日期
  ISSBDATE: string;              // 基金成立公告日
  RGBEGIN: string;               // 认购起始日
  ISSEDATE: string;              // 基金成立日
  RGEND: string;                 // 认购终止日
  LISTTEXCH: string;             // 上市交易所
  NEWTEXCH: string;              // 新交易所
  ISLIST: string;                // 是否上市
  ISLISTTRADE: string;           // 是否上市交易
  MINSBSG: string;               // 最小申购额
  MINSBRG: string;               // 最小认购额
  ENDNAV: string;                // 期末净值
  FEGMRQ: string;                // 基金份额规模日期
  ISFNEW: string;                // 是否新基金
  ISAPPOINT: string;             // 是否可预约
  MINRG: string;                 // 最小认购额
  CYCLE: string;                 // 周期
  OPESTART: string;              // 操作开始时间
  OPEEND: string;                // 操作结束时间
  OPEYIELD: string;              // 操作收益
  FIXINCOME: string;             // 固定收益
  APPOINTMENT: string;           // 预约标识
  APPOINTMENTURL: string;        // 预约URL
  ISABNORMAL: string;            // 是否异常
  YZBA: string;                  // 预估到账时间
  FBYZQ: string;                 // 份额变更周期
  KFSGSH: string;                // 开放申购赎回
  LINKZSB: string;               // 直销链接
  LISTTEXCHMARK: string;         // 上市交易所说明
  ISHAREBONUS: boolean;          // 是否红利再投
  PTDT_Y: string;                // 拟任职年
  PTDT_TWY: string;              // 拟任职三年
  PTDT_TRY: string;              // 拟任职五年
  PTDT_FY: string;               // 拟任职十年
  MBDT_Y: string;                // 模拟持有年
  MBDT_TWY: string;              // 模拟持有三年
  MBDT_TRY: string;              // 模拟持有五年
  MBDT_FY: string;               // 模拟持有十年
  YDDT_Y: string;                // 盈利的年
  YDDT_TWY: string;              // 盈利的三年
  YDDT_TRY: string;              // 盈利的五年
  YDDT_FY: string;               // 盈利的十年
  DWDT_Y: string;                // 单位净值年
  DWDT_TWY: string;              // 单位净值三年
  DWDT_TRY: string;              // 单位净值五年
  DWDT_FY: string;               // 单位净值十年
  ISYYDT: string;                // 是否有年化分红
  SYL_Z: string;                 // 收益率
  SYRQ: string;                  // 收益日期
  COMETHOD: string;              // 组合方式
  MCOVERDATE: string;            // 覆盖日期
  MCOVERDETAIL: string;          // 覆盖详情
  COMMENTS: string;              // 基金介绍
  TRKERROR: string;              // 跟踪误差
  ESTDIFF: string;               // 预估偏差
  HRGRT: string;                 // 回报率
  HSGRT: string;                 // 赎回率
  BENCH: string;                 // 基准
  FINSALES: string;              // 是否金融销售
  INVESTMENTIDEAR: string;       // 投资理念
  INVESTMENTIDEARIMG: string;    // 投资理念图片
}

/**
 * 基金阶段涨跌幅
 */
export interface FundPeriodIncrease {
  syl_1y: string         // 近1年涨跌幅(%)
  syl_6y: string         // 近6月涨跌幅(%)
  syl_3y: string         // 近3月涨跌幅(%)
  syl_1y_text: string    // 近1月涨跌幅(%)
}

/**
 * 资产配置项
 */
export interface AssetAllocationItem {
  FSRQ: string           // 日期
  GP: string             // 股票占比(%)
  ZQ: string             // 债券占比(%)
  HB: string             // 现金占比(%)
  JZC: string            // 净资产(单位未知,原数据为"13.3467")
  QT: string             // 其他占比(%)
  JJ: string             // 说明/备注/基金简写等，原数据为"--"
}

/**
 * 行业配置项
 */
export interface SectorAllocationItem {
  HYMC: string           // 行业名称
  ZJZBL: string          // 占净值比例(%)
  FSRQ: string           // 日期
}

/**
 * 获取基金实时估算涨跌
 * @param fundCodes 基金代码列表(逗号分隔)
 */
export async function fetchFundRealtimeInfo(fundCodes: string | string[]): Promise<{
  Datas: FundRealtimeInfo[]
}> {
  const url = `${BASE_URL}/FundMNFInfo`
  const codes = Array.isArray(fundCodes) ? fundCodes.join(',') : fundCodes
  
  const params = {
    pageIndex: '1',
    pageSize: '10',
    Fcodes: codes,
    ...DEVICE_PARAMS,
  }
  
  return get(url, params)
}

/**
 * 获取基金持仓数据
 * @param fundCode 基金代码
 */
export async function fetchFundPosition(fundCode: string): Promise<{
  Datas: FundPosition
}> {
  const url = `${BASE_URL}/FundMNInverstPosition`
  const params = {
    FCODE: fundCode,
    appType: 'ttjj',
    serverVersion: '6.3.8',
    ...DEVICE_PARAMS,
  }
  
  return get(url, params)
}

/**
 * 获取基金基本信息
 * @param fundCode 基金代码
 */
export async function fetchFundBasicInfo(fundCode: string): Promise<{
  Datas: FundBasicInfo
}> {
  const url = `${BASE_URL}/FundMNNBasicInformation`
  const params = {
    FCODE: fundCode,
    ...DEVICE_PARAMS,
  }
  
  return get(url, params)
}

/**
 * 获取基金阶段涨跌幅
 * @param fundCode 基金代码
 */
export async function fetchFundPeriodIncrease(fundCode: string): Promise<{
  Datas: FundPeriodIncrease[]
}> {
  const url = `${BASE_URL}/FundMNPeriodIncrease`
  const params = {
    FCODE: fundCode,
    ...DEVICE_PARAMS,
    version: '6.3.6',
  }
  
  return get(url, params)
}

/**
 * 获取基金资产配置
 * @param fundCode 基金代码
 */
export async function fetchFundAssetAllocation(fundCode: string): Promise<{
  Datas: AssetAllocationItem[]
}> {
  const url = `${BASE_URL}/FundMNAssetAllocationNew`
  const params = {
    FCODE: fundCode,
    ...DEVICE_PARAMS,
  }
  
  return get(url, params)
}

/**
 * 获取基金行业分布
 * @param fundCode 基金代码
 */
export async function fetchFundSectorAllocation(fundCode: string): Promise<{
  Datas: SectorAllocationItem[]
}> {
  const url = `${BASE_URL}/FundMNSectorAllocation`
  const params = {
    FCODE: fundCode,
    ...DEVICE_PARAMS,
  }
  
  return get(url, params)
}

// ==================== 基金搜索功能 ====================

const FUNDCODE_SEARCH_URL = 'http://fund.eastmoney.com/js/fundcode_search.js'
const DEFAULT_PAGE_SIZE = 20

// 缓存基金列表
let cachedFundList: FundCodeSearchRow[] | null = null
let cachedAt = 0
const CACHE_MS = 1000 * 60 * 60 // 1 小时

/**
 * 获取基金代码列表
 */
const fetchFundCodeList = async (): Promise<FundCodeSearchRow[]> => {
  const data = await get<string>(FUNDCODE_SEARCH_URL)
  
  // 格式: var r = [["000001","HXCZHH","华夏成长混合","混合型",...], ...]
  const match = data.match(/var r = (\[[\s\S]*\]);?\s*$/)
  if (!match) {
    throw new Error('Invalid fundcode_search.js format')
  }
  
  const list = JSON.parse(match[1]) as FundCodeSearchRow[]
  return list
}

/**
 * 获取缓存的基金代码列表
 */
const getCachedFundCodeList = async (): Promise<FundCodeSearchRow[]> => {
  if (cachedFundList && Date.now() - cachedAt < CACHE_MS) {
    return cachedFundList
  }
  cachedFundList = await fetchFundCodeList()
  cachedAt = Date.now()
  return cachedFundList
}

/**
 * 标准化关键字
 */
const normalizeKeyword = (s: string): string => s.trim().toLowerCase()

/**
 * 匹配关键字
 */
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

/**
 * 根据基金代码或名称模糊搜索基金
 * @param keyword 搜索关键字(支持代码、名称、简拼、全拼)
 * @param limit 返回数量限制
 */
export async function searchFunds(
  keyword: string,
  limit: number = DEFAULT_PAGE_SIZE,
): Promise<FundSearchItem[]> {
  const k = normalizeKeyword(keyword)
  if (!k) return []

  const list = await getCachedFundCodeList()

  const rows = list.filter((row) => matchKeyword(keyword, row))
  const limited = rows.slice(0, limit)

  return limited.map(([fundCode, , fundName, fundType]) => ({
    fundCode,
    fundName,
    fundType,
  }))
}

