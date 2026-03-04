"""
API 路由：对外提供的接口
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from crew_service import FundAnalysisService
import yaml


router = APIRouter()

# 加载配置
with open('config.yaml', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

# 初始化服务
analysis_service = FundAnalysisService(config)


class HoldingInput(BaseModel):
    """持仓输入模型"""
    fund_code: str
    amount: float
    ratio: float
    asset_type: str  # stock, long_bond, mid_bond, commodity, gold
    

class HoldingWithAction(BaseModel):
    """持仓输出模型（包含操作建议）"""
    fund_code: str
    amount: float
    ratio: float
    asset_type: str
    action: int  # 0=持平, 1=加仓, -1=减仓
    suggested_ratio: float  # 建议比例
    action_reason: str  # 操作原因
    

class AnalysisRequest(BaseModel):
    """分析请求模型"""
    holdings: List[HoldingInput]
    

class AnalysisResponse(BaseModel):
    """分析响应模型"""
    status: str
    timestamp: str
    has_risk_warning: bool  # 是否存在风险提示
    holdings: List[HoldingWithAction]  # 持仓列表（包含操作建议）
    report: str  # 分析报告


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_portfolio(request: AnalysisRequest):
    """
    分析投资组合接口
    
    请求示例：
    ```json
    {
        "holdings": [
            {
                "fund_code": "110022",
                "amount": 30000,
                "ratio": 0.30,
                "asset_type": "stock"
            },
            {
                "fund_code": "000088",
                "amount": 40000,
                "ratio": 0.40,
                "asset_type": "long_bond"
            },
            {
                "fund_code": "000057",
                "amount": 15000,
                "ratio": 0.15,
                "asset_type": "mid_bond"
            },
            {
                "fund_code": "160216",
                "amount": 7500,
                "ratio": 0.075,
                "asset_type": "commodity"
            },
            {
                "fund_code": "518880",
                "amount": 7500,
                "ratio": 0.075,
                "asset_type": "gold"
            }
        ]
    }
    ```
    
    Returns:
        分析结果
    """
    try:
        # 转换为字典列表
        holdings = [h.dict() for h in request.holdings]
        
        # 执行分析
        result = analysis_service.analyze_portfolio(holdings)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "service": "fund-analysis-service",
        "version": "1.0.0"
    }
