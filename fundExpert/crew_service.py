"""
CrewAI 服务：协调 Agents 完成分析任务
"""
from typing import Dict, List
from crewai import Crew, Task, LLM
from agents import create_data_collector_agent, create_strategy_analyst_agent
from tools import (
    fetch_multiple_funds_tool,
    fetch_market_index_tool,
    calculate_portfolio_tool
)
import json


class FundAnalysisService:
    """基金分析服务"""
    
    def __init__(self, config: Dict):
        """
        初始化服务
        
        Args:
            config: 配置字典
        """
        self.config = config
        
        # 初始化 LLM（使用通义千问）
        self.llm = LLM(
            model=config['llm']['model'],
            api_key=config['llm']['api_key'],
            base_url=config['llm']['api_base'],
            temperature=config['llm']['temperature'],
            max_tokens=config['llm']['max_tokens']
        )
        
        # 创建 tools
        self.data_tools = [
            fetch_multiple_funds_tool,
            fetch_market_index_tool,
            calculate_portfolio_tool
        ]
        
        # 创建 agents
        self.data_collector = create_data_collector_agent(self.llm, self.data_tools)
        self.strategy_analyst = create_strategy_analyst_agent(self.llm)
    
    def analyze_portfolio(self, holdings: List[Dict]) -> Dict:
        """
        分析投资组合
        
        Args:
            holdings: 持仓列表
                     格式：[{"fund_code": "000001", "amount": 10000, "ratio": 0.3, "asset_type": "stock"}, ...]
                     
        Returns:
            分析结果的字典
        """
        # 提取基金代码
        fund_codes = [h['fund_code'] for h in holdings]
        fund_codes_str = ','.join(fund_codes)
        
        # 任务1：数据采集
        data_collection_task = Task(
            description=f"""
            请完成以下数据采集任务：
            
            1. 获取以下基金的最新数据：{fund_codes_str}
               需要获取的信息包括：基金名称、当前净值、日涨跌幅、基金类型
            
            2. 获取上证指数（sh000001）的当日行情数据
               需要获取的信息包括：当前点位、涨跌幅、成交量、成交额
            
            3. 计算投资组合的整体表现
               持仓信息：{json.dumps(holdings, ensure_ascii=False)}
            
            请将所有数据整理成结构化的格式返回。
            """,
            agent=self.data_collector,
            expected_output="包含基金数据、指数数据和组合统计的完整 JSON 数据"
        )
        
        # 任务2：策略分析
        strategy_analysis_task = Task(
            description=f"""
            基于数据采集团队提供的数据，请进行全天候策略分析：
            
            当前持仓配置：
            {json.dumps(holdings, ensure_ascii=False, indent=2)}
            
            全天候策略标准配比：
            {json.dumps(self.config['all_weather_strategy']['standard_allocation'], ensure_ascii=False, indent=2)}
            
            请完成以下分析：
            
            1. 配比分析
               - 对比当前持仓与全天候策略标准配比的差异
               - 识别是否存在配比异常（偏差超过 {self.config['all_weather_strategy']['deviation_threshold'] * 100}%）
               - 评估当前配置的风险暴露情况
            
            2. 市场环境分析
               - 根据大盘指数的表现，判断当前市场所处阶段
               - 分析各类资产在当前市场环境下的表现
            
            3. 调仓建议
               - 如果配比异常，给出具体的调整建议（哪些基金需要加仓/减仓，建议比例是多少）
               - 根据今日涨跌情况，判断是否需要进行再平衡
               - 如果今日整体涨幅超过 {self.config['all_weather_strategy']['daily_change_threshold']['strong_rise'] * 100}%，考虑适当减仓
               - 如果今日整体跌幅超过 {abs(self.config['all_weather_strategy']['daily_change_threshold']['strong_fall']) * 100}%，考虑适当加仓
            
            4. 风险提示
               - 指出当前投资组合的主要风险点
               - 提供风险控制建议
            
            请以清晰、专业的语言给出分析结论和操作建议。
            """,
            agent=self.strategy_analyst,
            expected_output="完整的全天候策略分析报告，包括配比分析、调仓建议和风险提示",
            context=[data_collection_task]
        )
        
        # 创建 Crew 并执行
        crew = Crew(
            agents=[self.data_collector, self.strategy_analyst],
            tasks=[data_collection_task, strategy_analysis_task],
            verbose=True
        )
        
        # 执行分析
        result = crew.kickoff()
        
        # 返回结构化结果
        return self._format_result(result, holdings)
    
    def _format_result(self, raw_result, holdings: List[Dict]) -> Dict:
        """
        格式化分析结果为固定的 JSON 格式
        
        Args:
            raw_result: CrewAI 返回的原始结果
            holdings: 持仓列表
            
        Returns:
            格式化后的结果字典
        """
        # 将 CrewAI 的结果转换为字符串
        result_str = str(raw_result)
        
        # 增强持仓数据，添加操作建议
        enhanced_holdings = self._enhance_holdings_with_actions(result_str, holdings)
        
        # 构建返回格式
        formatted_result = {
            "status": "success",
            "timestamp": self._get_current_timestamp(),
            "has_risk_warning": self._check_has_risk_warning(result_str),
            "holdings": enhanced_holdings,
            "report": result_str
        }
        
        return formatted_result
    
    def _check_has_risk_warning(self, text: str) -> bool:
        """
        检查是否存在风险提示
        
        Args:
            text: 分析报告文本
            
        Returns:
            是否存在风险提示
        """
        risk_keywords = ['风险', '警告', '注意', '谨慎', '危险', '亏损']
        return any(keyword in text for keyword in risk_keywords)
    
    def _enhance_holdings_with_actions(self, text: str, holdings: List[Dict]) -> List[Dict]:
        """
        增强持仓数据，添加操作建议
        
        Args:
            text: 分析报告文本
            holdings: 原始持仓列表
            
        Returns:
            增强后的持仓列表
        """
        enhanced = []
        
        for holding in holdings:
            fund_code = holding['fund_code']
            enhanced_holding = holding.copy()
            
            # 提取该基金的操作建议
            action_info = self._extract_fund_action(text, fund_code, holding['ratio'])
            enhanced_holding.update(action_info)
            
            enhanced.append(enhanced_holding)
        
        return enhanced
    
    def _extract_fund_action(self, text: str, fund_code: str, current_ratio: float) -> Dict:
        """
        提取单个基金的操作建议
        
        Args:
            text: 分析报告文本
            fund_code: 基金代码
            current_ratio: 当前比例
            
        Returns:
            操作建议字典
        """
        # 默认值
        action = 0  # 0=持平, 1=加仓, -1=减仓
        suggested_ratio = current_ratio
        reason = "维持当前配置"
        
        # 在文本中搜索该基金相关的建议
        lines = text.split('\n')
        fund_mentioned = False
        
        for i, line in enumerate(lines):
            if fund_code in line or '基金' in line:
                fund_mentioned = True
                # 检查附近的文本
                context = '\n'.join(lines[max(0, i-2):min(len(lines), i+3)])
                
                # 判断操作类型
                if '减仓' in context or '卖出' in context or '降至' in context:
                    action = -1
                    reason = "建议减仓"
                    # 尝试提取目标比例
                    suggested_ratio = self._extract_ratio_from_text(context, current_ratio, is_reduce=True)
                elif '加仓' in context or '买入' in context or '增持' in context:
                    action = 1
                    reason = "建议加仓"
                    suggested_ratio = self._extract_ratio_from_text(context, current_ratio, is_reduce=False)
                
                break
        
        # 如果没有提到该基金，根据整体建议判断
        if not fund_mentioned:
            if '减仓' in text or '降低仓位' in text:
                action = -1
                reason = "根据整体策略建议减仓"
                suggested_ratio = max(0, current_ratio * 0.3)  # 减至30%
            elif '加仓' in text or '增加配置' in text:
                action = 1
                reason = "根据整体策略建议加仓"
                # 保持现有比例或略微增加
        
        return {
            "action": action,
            "suggested_ratio": round(suggested_ratio, 4),
            "action_reason": reason
        }
    
    def _extract_ratio_from_text(self, text: str, current_ratio: float, is_reduce: bool) -> float:
        """
        从文本中提取目标比例
        
        Args:
            text: 文本内容
            current_ratio: 当前比例
            is_reduce: 是否为减仓
            
        Returns:
            目标比例
        """
        import re
        
        # 查找百分比模式
        patterns = [
            r'(\d+(?:\.\d+)?)\s*%',
            r'(\d+(?:\.\d+)?)\s*percent',
            r'至\s*(\d+(?:\.\d+)?)\s*%'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    # 取第一个匹配的数值
                    ratio = float(matches[0]) / 100
                    if 0 <= ratio <= 1:
                        return ratio
                except:
                    pass
        
        # 如果没有找到具体比例，使用默认逻辑
        if is_reduce:
            # 减仓：减至当前的30%
            return max(0, current_ratio * 0.3)
        else:
            # 加仓：增加20%
            return min(1.0, current_ratio * 1.2)
    
    def _get_current_timestamp(self) -> str:
        """获取当前时间戳"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

