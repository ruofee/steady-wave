"""
测试脚本：测试基金分析服务
"""
import requests
import json


def test_health():
    """测试健康检查接口"""
    print("测试健康检查接口...")
    response = requests.get("http://localhost:8001/api/v1/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print()


def test_analyze():
    """测试分析接口"""
    print("测试投资组合分析接口...")
    
    # 示例持仓数据
    holdings = {
        "holdings": [
            {
                "fund_code": "110022",  # 易方达消费行业股票（股票型）
                "amount": 30000,
                "ratio": 0.30,
                "asset_type": "stock"
            },
            {
                "fund_code": "000088",  # 嘉实中证金边中期国债ETF联接C（债券型）
                "amount": 40000,
                "ratio": 0.40,
                "asset_type": "long_bond"
            },
            {
                "fund_code": "000057",  # 中银消费主题混合（混合型）
                "amount": 15000,
                "ratio": 0.15,
                "asset_type": "mid_bond"
            },
            {
                "fund_code": "160216",  # 国泰商品（商品型）
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
    }
    
    response = requests.post(
        "http://localhost:8001/api/v1/analyze",
        json=holdings,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print()


if __name__ == "__main__":
    try:
        print("=" * 60)
        print("基金分析服务测试")
        print("=" * 60)
        print()
        
        test_health()
        
        # 注意：实际调用分析接口会消耗 API 配额，请谨慎使用
        # test_analyze()
        
        print("提示：实际调用分析接口前，请确保已配置好 config.yaml")
        print("      并且取消注释 test_analyze() 调用")
        
    except requests.exceptions.ConnectionError:
        print("错误：无法连接到服务，请确保服务已启动")
    except Exception as e:
        print(f"错误：{str(e)}")
