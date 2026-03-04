"""
调试脚本：查看 AkShare 返回的实际数据结构
"""
import akshare as ak
import pandas as pd

pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)

print("=" * 60)
print("测试 AkShare 数据结构")
print("=" * 60)

# 测试1：基金净值
print("\n1. 测试基金净值接口")
print("-" * 60)
try:
    df = ak.fund_open_fund_info_em(symbol="110022", indicator="单位净值走势")
    print(f"返回数据形状: {df.shape}")
    print(f"\n列名: {df.columns.tolist()}")
    print(f"\n最后一行数据:")
    print(df.tail(1))
except Exception as e:
    print(f"错误: {e}")

# 测试2：大盘指数
print("\n\n2. 测试大盘指数接口")
print("-" * 60)
try:
    df = ak.stock_zh_index_spot_em()
    print(f"返回数据形状: {df.shape}")
    print(f"\n列名: {df.columns.tolist()}")
    print(f"\n上证指数数据:")
    sh_data = df[df['代码'] == '000001']
    if not sh_data.empty:
        print(sh_data)
    else:
        print("未找到上证指数，显示前5行：")
        print(df.head())
except Exception as e:
    print(f"错误: {e}")
