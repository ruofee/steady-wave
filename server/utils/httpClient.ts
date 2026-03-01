import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios'

// 创建 axios 实例
export const httpClient: AxiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
  },
})

export interface RequestConfig {
  url: string
  method?: Method
  params?: Record<string, any>
  data?: Record<string, any>
  headers?: Record<string, string>
}

/**
 * 发起 HTTP 请求
 */
export async function request<T = any>(config: RequestConfig): Promise<T> {
  const { url, method = 'GET', params, data, headers } = config

  const axiosConfig: AxiosRequestConfig = {
    method,
    url,
    params: method === 'GET' ? params : undefined,
    data: method === 'POST' ? data : undefined,
    headers,
  }

  const response = await httpClient(axiosConfig)
  return response.data
}

/**
 * GET 请求
 */
export async function get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  return request<T>({ url, method: 'GET', params })
}

/**
 * POST 请求
 */
export async function post<T = any>(url: string, data?: Record<string, any>): Promise<T> {
  return request<T>({ url, method: 'POST', data })
}
