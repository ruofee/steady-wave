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
import re


class FundAnalysisService:
    """基金分析服务"""
    
    def __init__(self, config: Dict):
        self.config = config
        
        self.llm = LLM(
            model=config['llm']['model'],
            api_key=config['llm']['api_key'],
            base_url=config['llm']['api_base'],
            temperature=config['llm']['temperature'],
            max_tokens=config['llm']['max_tokens']
        )
        
        self.data_tools = [
            fetch_multiple_funds_tool,
            fetch_market_index_tool,
            calculate_portfolio_tool
        ]
        
        self.data_collector = create_data_collector_agent(self.llm, self.data_tools)
        self.strategy_analyst = create_strategy_analyst_agent(self.llm)
    
    def analyze_portfolio(self, holdings: List[Dict]) -> Dict:
        fund_codes = [h['fund_code'] for h in holdings]
        fund_codes_str = ','.join(fund_codes)
        
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
        
        strategy_analysis_task = Task(
            description=f"""
            基于数据采集团队提供的数据，请进行全天候策略分析：
            
            当前持仓配置：
            {json.dumps(holdings, ensure_ascii=False, indent=2)}
            
            全天候策略标准配比：
            {json.dumps(self.config['all_weather_strategy']['standard_allocation'], ensure_ascii=False, indent=2)}
            
            请完成以下分析，并严格按照以下格式输出（使用 Markdown）：
            
            ## 一、配比分析
            对比当前持仓与全天候策略标准配比的差异，识别配比异常（偏差超过 {self.config['all_weather_strategy']['deviation_threshold'] * 100}%），评估风险暴露。

            ## 二、市场环境分析
            根据大盘指数表现判断市场阶段，分析各类资产表现。

            ## 三、风险分析
            ### 具体风险
            请逐一列出当前投资组合面临的具体风险，每个风险用 `- ` 开头，格式：
            - **风险名称**：风险描述
            
            ### 风险等级
            综合评估当前风险等级（低/中/高）。

            ## 四、调仓建议
            ### 是否建议调仓
            明确回答"是"或"否"。
            
            ### 具体调仓操作
            如建议调仓，请逐一列出操作，每个操作用 `- ` 开头，格式：
            - **基金代码 基金名称**：加仓/减仓/持平，当前比例 X% → 建议比例 Y%，原因说明：具体原因
            
            如不建议调仓，说明原因。

            ## 五、总结与建议
            给出简洁的操作总结。

            注意：
            - 如果今日整体涨幅超过 {self.config['all_weather_strategy']['daily_change_threshold']['strong_rise'] * 100}%，考虑适当减仓
            - 如果今日整体跌幅超过 {abs(self.config['all_weather_strategy']['daily_change_threshold']['strong_fall']) * 100}%，考虑适当加仓
            """,
            agent=self.strategy_analyst,
            expected_output="按格式输出的全天候策略分析报告",
            context=[data_collection_task]
        )
        
        crew = Crew(
            agents=[self.data_collector, self.strategy_analyst],
            tasks=[data_collection_task, strategy_analysis_task],
            verbose=True
        )
        
        result = crew.kickoff()
        return self._format_result(result, holdings)
    
    def _format_result(self, raw_result, holdings: List[Dict]) -> Dict:
        result_str = str(raw_result)
        rebalance_suggestions = self._extract_rebalance_suggestions(result_str)
        # 用 rebalance_suggestions 作为主数据源来增强 holdings
        enhanced_holdings = self._enhance_holdings_with_actions(result_str, holdings, rebalance_suggestions)
        risk_details = self._extract_risk_details(result_str)
        has_rebalance = self._check_has_rebalance(result_str, rebalance_suggestions)
        
        return {
            "status": "success",
            "timestamp": self._get_current_timestamp(),
            "has_risk_warning": self._check_has_risk_warning(result_str),
            "risk_details": risk_details,
            "has_rebalance_suggestion": has_rebalance,
            "rebalance_suggestions": rebalance_suggestions,
            "holdings": enhanced_holdings,
            "report": result_str
        }
    
    def _check_has_risk_warning(self, text: str) -> bool:
        risk_keywords = ['风险', '警告', '注意', '谨慎', '危险', '亏损']
        return any(keyword in text for keyword in risk_keywords)
    
    def _extract_risk_details(self, text: str) -> List[str]:
        """从报告中提取具体风险列表"""
        risks = []
        
        in_risk_section = False
        for line in text.split('\n'):
            stripped = line.strip()
            if '具体风险' in stripped or '风险分析' in stripped or '风险提示' in stripped:
                in_risk_section = True
                continue
            if in_risk_section:
                if stripped.startswith('#'):
                    if '风险' not in stripped:
                        in_risk_section = False
                    continue
                if stripped.startswith('- ') or stripped.startswith('* '):
                    risk_text = stripped[2:].strip()
                    risk_text = re.sub(r'\*\*(.*?)\*\*[：:]?\s*', r'\1：', risk_text)
                    if risk_text:
                        risks.append(risk_text)
                elif stripped.startswith(('1.', '2.', '3.', '4.', '5.')):
                    risk_text = re.sub(r'^\d+\.\s*', '', stripped)
                    risk_text = re.sub(r'\*\*(.*?)\*\*[：:]?\s*', r'\1：', risk_text)
                    if risk_text:
                        risks.append(risk_text)
        
        if not risks:
            for line in text.split('\n'):
                stripped = line.strip()
                if ('风险' in stripped) and (stripped.startswith('- ') or stripped.startswith('* ')):
                    risk_text = stripped[2:].strip()
                    risk_text = re.sub(r'\*\*(.*?)\*\*[：:]?\s*', r'\1：', risk_text)
                    if risk_text and len(risk_text) > 4:
                        risks.append(risk_text)
        
        return risks
    
    def _check_has_rebalance(self, text: str, suggestions: List[Dict]) -> bool:
        if suggestions:
            return True
        
        rebalance_section = False
        for line in text.split('\n'):
            stripped = line.strip()
            if '是否建议调仓' in stripped or '是否调仓' in stripped:
                rebalance_section = True
                continue
            if rebalance_section:
                if '是' in stripped and '否' not in stripped:
                    return True
                if '不' in stripped or '否' in stripped or '无需' in stripped:
                    return False
                if stripped.startswith('#'):
                    break
        
        rebalance_keywords = ['建议调仓', '建议加仓', '建议减仓', '需要调整', '建议调整']
        return any(kw in text for kw in rebalance_keywords)
    
    def _extract_rebalance_suggestions(self, text: str) -> List[Dict]:
        """
        从报告中提取结构化调仓建议
        返回: [{ "name": str, "suggestion": str, "reason": str }]
        """
        raw_lines = []
        
        in_rebalance_section = False
        for line in text.split('\n'):
            stripped = line.strip()
            if '具体调仓' in stripped or '调仓操作' in stripped:
                in_rebalance_section = True
                continue
            if in_rebalance_section:
                if stripped.startswith('#'):
                    if '调仓' not in stripped and '建议' not in stripped:
                        in_rebalance_section = False
                    continue
                if stripped.startswith('- ') or stripped.startswith('* '):
                    raw = stripped[2:].strip()
                    raw = re.sub(r'\*\*(.*?)\*\*', r'\1', raw)
                    if raw:
                        raw_lines.append(raw)
                elif stripped.startswith(('1.', '2.', '3.', '4.', '5.')):
                    raw = re.sub(r'^\d+\.\s*', '', stripped)
                    raw = re.sub(r'\*\*(.*?)\*\*', r'\1', raw)
                    if raw:
                        raw_lines.append(raw)
        
        suggestions = []
        for raw in raw_lines:
            parsed = self._parse_rebalance_line(raw)
            if parsed:
                suggestions.append(parsed)
        
        return suggestions
    
    def _parse_rebalance_line(self, line: str) -> Dict:
        """
        解析单行调仓建议文本为结构化数据。
        
        输入格式示例:
        "001406 东方红策略精选混合 C：减仓，当前比例 100% → 建议比例 30%，原因说明：xxx"
        "[待选] 长期国债基金（如：007070 等）：加仓，当前比例 0% → 建议比例 40%，原因说明：xxx"
        """
        # 用第一个冒号分割 name 和后面的内容
        split_patterns = ['：', ':']
        name = line
        rest = ''
        
        for sep in split_patterns:
            idx = line.find(sep)
            if idx > 0:
                name = line[:idx].strip()
                rest = line[idx + 1:].strip()
                break
        
        if not rest:
            return {"name": name, "suggestion": line, "reason": ""}
        
        # 从 rest 中分离 suggestion 和 reason
        # 格式: "减仓，当前比例 100% → 建议比例 30%，原因说明：xxx"
        reason = ''
        suggestion = rest
        
        reason_markers = ['原因说明：', '原因说明:', '原因：', '原因:']
        for marker in reason_markers:
            marker_idx = rest.find(marker)
            if marker_idx >= 0:
                suggestion = rest[:marker_idx].rstrip('，, ')
                reason = rest[marker_idx + len(marker):].strip()
                break
        
        return {
            "name": name,
            "suggestion": suggestion,
            "reason": reason
        }
    
    def _enhance_holdings_with_actions(self, text: str, holdings: List[Dict], rebalance_suggestions: List[Dict]) -> List[Dict]:
        """用 rebalance_suggestions 作为主数据源来增强 holdings"""
        # 先构建基金代码到调仓建议的映射
        suggestion_map: Dict[str, Dict] = {}
        for s in rebalance_suggestions:
            # 从 name 中提取基金代码（6位数字）
            codes = re.findall(r'\b(\d{6})\b', s['name'])
            for code in codes:
                suggestion_map[code] = s
        
        enhanced = []
        for holding in holdings:
            fund_code = holding['fund_code']
            enhanced_holding = holding.copy()
            
            if fund_code in suggestion_map:
                s = suggestion_map[fund_code]
                action_info = self._parse_action_from_suggestion(s, holding['ratio'])
            else:
                action_info = self._extract_fund_action_fallback(text, fund_code, holding['ratio'])
            
            enhanced_holding.update(action_info)
            enhanced.append(enhanced_holding)
        
        return enhanced
    
    def _parse_action_from_suggestion(self, suggestion: Dict, current_ratio: float) -> Dict:
        """从结构化调仓建议中解析 action 信息"""
        s_text = suggestion['suggestion']
        
        action = 0
        suggested_ratio = current_ratio
        reason = suggestion.get('reason', '') or suggestion['suggestion']
        
        if '减仓' in s_text or '卖出' in s_text:
            action = -1
        elif '加仓' in s_text or '买入' in s_text or '增持' in s_text:
            action = 1
        
        # 提取"建议比例 X%"
        ratio_match = re.search(r'建议比例\s*(\d+(?:\.\d+)?)\s*%', s_text)
        if ratio_match:
            suggested_ratio = float(ratio_match.group(1)) / 100
        else:
            ratio_match = re.search(r'→\s*(\d+(?:\.\d+)?)\s*%', s_text)
            if ratio_match:
                suggested_ratio = float(ratio_match.group(1)) / 100
        
        return {
            "action": action,
            "suggested_ratio": round(suggested_ratio, 4),
            "action_reason": reason
        }
    
    def _extract_fund_action_fallback(self, text: str, fund_code: str, current_ratio: float) -> Dict:
        """当 rebalance_suggestions 中没有匹配时的回退逻辑"""
        action = 0
        suggested_ratio = current_ratio
        reason = "维持当前配置"
        
        # 在调仓相关段落中搜索基金代码
        in_rebalance = False
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            if '调仓' in stripped and stripped.startswith('#'):
                in_rebalance = True
                continue
            if in_rebalance and stripped.startswith('#') and '调仓' not in stripped and '建议' not in stripped:
                in_rebalance = False
                continue
            
            if fund_code in line:
                context = '\n'.join(lines[max(0, i - 2):min(len(lines), i + 3)])
                if '减仓' in context or '卖出' in context or '降至' in context:
                    action = -1
                    reason = "建议减仓"
                    suggested_ratio = self._extract_target_ratio(context, current_ratio, is_reduce=True)
                elif '加仓' in context or '买入' in context or '增持' in context:
                    action = 1
                    reason = "建议加仓"
                    suggested_ratio = self._extract_target_ratio(context, current_ratio, is_reduce=False)
                # 优先使用调仓段落的结果
                if in_rebalance and action != 0:
                    break
                if action != 0:
                    break
        
        return {
            "action": action,
            "suggested_ratio": round(suggested_ratio, 4),
            "action_reason": reason
        }
    
    def _extract_target_ratio(self, text: str, current_ratio: float, is_reduce: bool) -> float:
        ratio_match = re.search(r'建议比例\s*(\d+(?:\.\d+)?)\s*%', text)
        if ratio_match:
            return float(ratio_match.group(1)) / 100
        
        ratio_match = re.search(r'→\s*(\d+(?:\.\d+)?)\s*%', text)
        if ratio_match:
            return float(ratio_match.group(1)) / 100
        
        patterns = [r'至\s*(\d+(?:\.\d+)?)\s*%', r'(\d+(?:\.\d+)?)\s*%']
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    ratio = float(matches[-1]) / 100
                    if 0 <= ratio <= 1:
                        return ratio
                except:
                    pass
        
        if is_reduce:
            return max(0, current_ratio * 0.3)
        return min(1.0, current_ratio * 1.2)
    
    def _get_current_timestamp(self) -> str:
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
