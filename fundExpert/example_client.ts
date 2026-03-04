/**
 * 基金分析服务客户端（TypeScript/JavaScript）
 * 用于前端调用后端分析服务
 */

interface Holding {
  fund_code: string;
  amount: number;
  ratio: number;
  asset_type: 'stock' | 'long_bond' | 'mid_bond' | 'commodity' | 'gold';
}

interface AnalysisRequest {
  holdings: Holding[];
}

interface AnalysisResponse {
  status: string;
  timestamp: string;
  holdings: Holding[];
  analysis: {
    raw_output: string;
    summary: string;
    allocation_analysis: {
      description: string;
      has_deviation: boolean;
    };
    recommendations: string[];
    risk_warnings: string[];
  };
}

interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

class FundAnalysisClient {
  private baseUrl: string;
  private apiBase: string;

  constructor(baseUrl: string = 'http://localhost:8001') {
    this.baseUrl = baseUrl;
    this.apiBase = `${baseUrl}/api/v1`;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.apiBase}/health`);
    if (!response.ok) {
      throw new Error(`健康检查失败: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * 分析投资组合
   */
  async analyzePortfolio(holdings: Holding[]): Promise<AnalysisResponse> {
    const response = await fetch(`${this.apiBase}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ holdings }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `分析失败: ${response.statusText}`);
    }

    return response.json();
  }
}

// ===== 使用示例 =====

// 示例1：基础使用
async function example1() {
  const client = new FundAnalysisClient();

  // 健康检查
  const health = await client.healthCheck();
  console.log('服务状态:', health.status);

  // 准备持仓数据
  const holdings: Holding[] = [
    {
      fund_code: '110022',
      amount: 30000,
      ratio: 0.3,
      asset_type: 'stock',
    },
    {
      fund_code: '000088',
      amount: 40000,
      ratio: 0.4,
      asset_type: 'long_bond',
    },
    {
      fund_code: '000057',
      amount: 15000,
      ratio: 0.15,
      asset_type: 'mid_bond',
    },
    {
      fund_code: '160216',
      amount: 7500,
      ratio: 0.075,
      asset_type: 'commodity',
    },
    {
      fund_code: '518880',
      amount: 7500,
      ratio: 0.075,
      asset_type: 'gold',
    },
  ];

  // 分析
  const result = await client.analyzePortfolio(holdings);
  console.log('分析结果:', result);
  console.log('建议:', result.analysis.recommendations);
}

// 示例2：在 Vue 3 中使用
// import { ref } from 'vue';
//
// export function useFundAnalysis() {
//   const client = new FundAnalysisClient();
//   const loading = ref(false);
//   const result = ref<AnalysisResponse | null>(null);
//   const error = ref<string | null>(null);
//
//   const analyze = async (holdings: Holding[]) => {
//     loading.value = true;
//     error.value = null;
//     try {
//       result.value = await client.analyzePortfolio(holdings);
//     } catch (e: any) {
//       error.value = e.message;
//     } finally {
//       loading.value = false;
//     }
//   };
//
//   return {
//     loading,
//     result,
//     error,
//     analyze,
//   };
// }

// 示例3：在 React 中使用
// import { useState } from 'react';
//
// export function useFundAnalysis() {
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<AnalysisResponse | null>(null);
//   const [error, setError] = useState<string | null>(null);
//
//   const client = new FundAnalysisClient();
//
//   const analyze = async (holdings: Holding[]) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await client.analyzePortfolio(holdings);
//       setResult(data);
//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return {
//     loading,
//     result,
//     error,
//     analyze,
//   };
// }

// 示例4：错误处理
async function example4() {
  const client = new FundAnalysisClient();

  try {
    const holdings: Holding[] = [
      {
        fund_code: '110022',
        amount: 30000,
        ratio: 0.3,
        asset_type: 'stock',
      },
    ];

    const result = await client.analyzePortfolio(holdings);
    console.log('分析成功:', result);
  } catch (error: any) {
    console.error('分析失败:', error.message);
    // 可以根据错误类型做不同处理
    if (error.message.includes('网络')) {
      console.log('请检查网络连接');
    } else if (error.message.includes('服务')) {
      console.log('服务暂时不可用，请稍后重试');
    }
  }
}

// 示例5：在 Axios 环境中使用
// import axios from 'axios';
//
// class FundAnalysisClientAxios {
//   private apiBase: string;
//
//   constructor(baseUrl: string = 'http://localhost:8001') {
//     this.apiBase = `${baseUrl}/api/v1`;
//   }
//
//   async analyzePortfolio(holdings: Holding[]): Promise<AnalysisResponse> {
//     const response = await axios.post(`${this.apiBase}/analyze`, {
//       holdings,
//     });
//     return response.data;
//   }
// }

// 导出
export { FundAnalysisClient, type Holding, type AnalysisResponse, type HealthResponse };
