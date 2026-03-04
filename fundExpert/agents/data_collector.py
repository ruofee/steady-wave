"""
Agent: 数据采集专家
负责获取基金和市场数据
"""
from crewai import Agent, LLM


def create_data_collector_agent(llm: LLM, tools: list) -> Agent:
    """
    创建数据采集专家 Agent
    
    此 Agent 负责：
    1. 获取持仓基金的实时数据（净值、涨跌幅等）
    2. 获取大盘指数数据
    3. 整理和汇总数据
    """
    return Agent(
        role="金融数据采集专家",
        goal="准确快速地获取基金和市场数据，为投资分析提供可靠的数据支持",
        backstory="""
        你是一位经验丰富的金融数据分析师，专注于基金市场和大盘指数数据的采集与整理。
        你精通使用各种数据工具（如 AkShare）获取实时金融数据。
        你的工作是确保所有数据准确无误，并以结构化的方式呈现给投资分析团队。
        你注重数据的时效性和准确性，能够快速响应数据查询请求。
        """,
        verbose=True,
        allow_delegation=False,
        tools=tools,
        llm=llm
    )
