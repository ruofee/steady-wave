"""
CrewAI 工具：基金数据获取工具
"""
from crewai.tools import tool
from typing import Dict, List
from .data_fetcher import (
    get_fund_info,
    get_market_index,
    get_multiple_funds_info,
    calculate_portfolio_stats
)


@tool
def fetch_single_fund_tool(fund_code: str) -> str:
    """获取单个基金的详细信息，包括净值、涨跌幅等
    
    Args:
        fund_code: 基金代码（如：000001）
        
    Returns:
        基金信息的 JSON 字符串
    """
    import json
    result = get_fund_info(fund_code)
    if result:
        return json.dumps(result, ensure_ascii=False, indent=2)
    return json.dumps({"error": f"无法获取基金 {fund_code} 的信息"}, ensure_ascii=False)


@tool
def fetch_market_index_tool(index_code: str = "sh000001") -> str:
    """获取大盘指数信息（默认上证指数）
    
    Args:
        index_code: 指数代码，默认 sh000001（上证指数）
                   其他常用：sz399001（深证成指），sz399006（创业板指）
        
    Returns:
        指数信息的 JSON 字符串
    """
    import json
    result = get_market_index(index_code)
    if result:
        return json.dumps(result, ensure_ascii=False, indent=2)
    return json.dumps({"error": f"无法获取指数 {index_code} 的信息"}, ensure_ascii=False)


@tool
def fetch_multiple_funds_tool(fund_codes_str: str) -> str:
    """批量获取多个基金的信息
    
    Args:
        fund_codes_str: 基金代码字符串，用逗号分隔（如：000001,110022,163402）
        
    Returns:
        基金信息列表的 JSON 字符串
    """
    import json
    fund_codes = [code.strip() for code in fund_codes_str.split(',')]
    results = get_multiple_funds_info(fund_codes)
    return json.dumps(results, ensure_ascii=False, indent=2)


@tool
def calculate_portfolio_tool(holdings_json: str) -> str:
    """计算投资组合的统计数据
    
    Args:
        holdings_json: 持仓信息的 JSON 字符串
                      格式：[{"fund_code": "000001", "amount": 10000, "ratio": 0.3}, ...]
        
    Returns:
        投资组合统计信息的 JSON 字符串
    """
    import json
    holdings = json.loads(holdings_json)
    result = calculate_portfolio_stats(holdings)
    return json.dumps(result, ensure_ascii=False, indent=2)
