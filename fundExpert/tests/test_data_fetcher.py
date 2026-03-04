"""
测试数据获取功能
直接测试 AkShare 的数据获取，不依赖 API 和 LLM
"""
import sys
sys.path.insert(0, '/Users/ruofee/Workspace/steady-wave/fundExpert')

from tools.data_fetcher import (
    get_fund_info,
    get_market_index,
    get_multiple_funds_info
)
import json


def test_single_fund():
    """测试获取单个基金信息"""
    print("=" * 60)
    print("测试1：获取单个基金信息")
    print("=" * 60)
    
    fund_code = "110022"  # 易方达消费行业
    print(f"\n正在获取基金 {fund_code} 的信息...")
    
    try:
        result = get_fund_info(fund_code)
        if result:
            print("\n✅ 成功获取基金信息：")
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print("\n❌ 获取失败：返回结果为空")
    except Exception as e:
        print(f"\n❌ 获取失败：{str(e)}")
    
    print("\n")


def test_market_index():
    """测试获取大盘指数"""
    print("=" * 60)
    print("测试2：获取大盘指数信息")
    print("=" * 60)
    
    index_code = "sh000001"  # 上证指数
    print(f"\n正在获取指数 {index_code} 的信息...")
    
    try:
        result = get_market_index(index_code)
        if result:
            print("\n✅ 成功获取指数信息：")
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print("\n❌ 获取失败：返回结果为空")
    except Exception as e:
        print(f"\n❌ 获取失败：{str(e)}")
    
    print("\n")


def test_multiple_funds():
    """测试批量获取基金信息"""
    print("=" * 60)
    print("测试3：批量获取多个基金信息")
    print("=" * 60)
    
    fund_codes = ["110022", "000088", "518880"]
    print(f"\n正在获取基金 {', '.join(fund_codes)} 的信息...")
    
    try:
        results = get_multiple_funds_info(fund_codes)
        if results:
            print(f"\n✅ 成功获取 {len(results)} 个基金信息：")
            for result in results:
                print(f"  - {result['fund_name']} ({result['fund_code']}): "
                      f"净值 {result['net_value']}, 日涨跌 {result['daily_change']}%")
        else:
            print("\n❌ 获取失败：返回结果为空")
    except Exception as e:
        print(f"\n❌ 获取失败：{str(e)}")
    
    print("\n")


def main():
    """运行所有测试"""
    print("\n" + "🚀 开始测试数据获取功能".center(60, "="))
    print()
    
    # 测试1：单个基金
    test_single_fund()
    
    # 测试2：大盘指数
    test_market_index()
    
    # 测试3：批量基金
    test_multiple_funds()
    
    print("=" * 60)
    print("✅ 所有测试完成")
    print("=" * 60)


if __name__ == "__main__":
    main()
