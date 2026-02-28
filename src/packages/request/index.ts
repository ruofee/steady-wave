interface ResponseData<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface RequestConfig extends RequestInit {
  params?: Record<string, any>
}

const baseURL = '/api'

const handleResponse = async <T = any>(response: Response): Promise<ResponseData<T>> => {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `请求失败: ${response.status}`)
  }

  if (!data.success) {
    throw new Error(data.message || '请求失败')
  }

  return data
}

const buildURL = (url: string, params?: Record<string, any>): string => {
  const fullURL = `http://localhost:3000${baseURL}${url}`
  
  if (!params) {
    return fullURL
  }

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${fullURL}?${queryString}` : fullURL
}

export const request = async <T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<ResponseData<T>> => {
  const { params, ...init } = config

  const finalURL = buildURL(url, params)

  const defaultConfig: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    ...init,
  }

  try {
    const response = await fetch(finalURL, defaultConfig)
    return handleResponse<T>(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : '网络错误'
    throw new Error(message)
  }
}

export const get = <T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>(url, { ...config, method: 'GET' })
}

export const post = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export const put = <T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>(url, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export const del = <T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> => {
  return request<T>(url, { ...config, method: 'DELETE' })
}

export default {
  request,
  get,
  post,
  put,
  delete: del,
}

