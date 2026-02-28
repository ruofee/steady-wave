import Decimal from 'decimal.js'

// 配置精度
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

/**
 * 加法
 */
export const add = (...args: (number | string)[]): number => {
  if (args.length === 0) return 0
  return args.reduce<Decimal>((sum, num) => sum.add(num), new Decimal(0)).toNumber()
}

/**
 * 减法
 */
export const subtract = (a: number | string, b: number | string): number => {
  return new Decimal(a).sub(b).toNumber()
}

/**
 * 乘法
 */
export const multiply = (...args: (number | string)[]): number => {
  if (args.length === 0) return 1
  return args.reduce<Decimal>((product, num) => product.mul(num), new Decimal(1)).toNumber()
}

/**
 * 除法
 */
export const divide = (a: number | string, b: number | string): number => {
  if (new Decimal(b).isZero()) {
    return 0
  }
  return new Decimal(a).div(b).toNumber()
}

/**
 * 保留小数位
 */
export const toFixed = (num: number | string, decimals: number): number => {
  return new Decimal(num).toDecimalPlaces(decimals).toNumber()
}

/**
 * 比较大小
 * @returns 1: a > b, 0: a = b, -1: a < b
 */
export const compare = (a: number | string, b: number | string): number => {
  return new Decimal(a).comparedTo(b)
}

/**
 * 是否为零
 */
export const isZero = (num: number | string): boolean => {
  return new Decimal(num).isZero()
}

/**
 * 取绝对值
 */
export const abs = (num: number | string): number => {
  return new Decimal(num).abs().toNumber()
}
