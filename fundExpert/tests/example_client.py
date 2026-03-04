"""
示例：如何在 Python 中调用基金分析服务
"""
import requests
from typing import List, Dict


class FundAnalysisClient:
    """基金分析服务客户端"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        """
        初始化客户端
        
        Args:
            base_url: 服务地址
        """
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
    
    def health_check(self) -> Dict:
        """
        健康检查
        
        Returns:
            健康状态
        """
        response = requests.get(f"{self.api_base}/health")
        response.raise_for_status()
        return response.json()
    
    def analyze_portfolio(self, holdings: List[Dict]) -> Dict:
        """
        分析投资组合
        
        Args:
            holdings: 持仓列表
            
        Returns:
            分析结果
            
        Example:
            holdings = [
                {
                    "fund_code": "110022",
                    "amount": 30000,
                    "ratio": 0.30,
                    "asset_type": "stock"
                }
            ]
        """
        payload = {"holdings": holdings}
        response = requests.post(
            f"{self.api_base}/analyze",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()


# 使用示例
if __name__ == "__main__":
    # 创建客户端
    client = FundAnalysisClient()
    
    # 检查服务状态
    print("检查服务状态...")
    health = client.health_check()
    print(f"服务状态: {health['status']}")
    print()
    
    # 准备持仓数据
    holdings = [
        {
            "fund_code": "110022",  # 易方达消费行业
            "amount": 30000,
            "ratio": 0.30,
            "asset_type": "stock"
        },
        {
            "fund_code": "000088",  # 嘉实中证金边
            "amount": 40000,
            "ratio": 0.40,
            "asset_type": "long_bond"
        },
        {
            "fund_code": "000057",  # 中银消费主题
            "amount": 15000,
            "ratio": 0.15,
            "asset_type": "mid_bond"
        },
        {
            "fund_code": "160216",  # 国泰商品
            "amount": 7500,
            "ratio": 0.075,
            "asset_type": "commodity"
        },
        {
            "fund_code": "518880",  # 黄金ETF
            "amount": 7500,
            "ratio": 0.075,
            "asset_type": "gold"
        }
    ]
    
    # 分析投资组合
    print("分析投资组合...")
    print("持仓数据:", holdings)
    print()
    
    try:
        result = client.analyze_portfolio(holdings)
        
        print("分析结果:")
        print(f"状态: {result['status']}")
        print(f"时间: {result['timestamp']}")
        print()
        
        analysis = result['analysis']
        print("分析摘要:", analysis['summary'])
        print()
        
        print("建议:")
        for rec in analysis['recommendations']:
            print(f"  - {rec}")
        print()
        
        if analysis['risk_warnings']:
            print("风险提示:")
            for warning in analysis['risk_warnings']:
                print(f"  ⚠️  {warning}")
        
        print()
        print("完整报告:")
        print(analysis['raw_output'])
        
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {str(e)}")
    except Exception as e:
        print(f"错误: {str(e)}")
