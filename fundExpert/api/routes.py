"""
API 路由：对外提供的接口
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from crew_service import FundAnalysisService
from datetime import datetime, date
import yaml
import json
import os
import glob
import threading


router = APIRouter()

with open('config.yaml', 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

analysis_service = FundAnalysisService(config)

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
MAX_REPORTS = 10

os.makedirs(REPORTS_DIR, exist_ok=True)

# 当前任务状态：key 为日期字符串, value 为 "in_progress" | "success" | "failed"
_task_status: dict[str, str] = {}
_task_lock = threading.Lock()


class HoldingInput(BaseModel):
    fund_code: str
    amount: float
    ratio: float
    asset_type: str


class HoldingWithAction(BaseModel):
    fund_code: str
    amount: float
    ratio: float
    asset_type: str
    action: int
    suggested_ratio: float
    action_reason: str


class AnalysisRequest(BaseModel):
    holdings: List[HoldingInput]


class RebalanceSuggestion(BaseModel):
    name: str
    suggestion: str
    reason: str


class AnalysisResponse(BaseModel):
    status: str
    timestamp: str
    has_risk_warning: bool
    risk_details: List[str]
    has_rebalance_suggestion: bool
    rebalance_suggestions: List[RebalanceSuggestion]
    holdings: List[HoldingWithAction]
    report: str


class TaskStatusResponse(BaseModel):
    status: str  # in_progress | success | no_task | failed
    data: Optional[AnalysisResponse] = None
    message: Optional[str] = None


def _get_report_path(date_str: str) -> str:
    return os.path.join(REPORTS_DIR, f'report_{date_str}.json')


def _cleanup_old_reports():
    """保留最新的 MAX_REPORTS 个报告文件，删除最旧的"""
    files = sorted(glob.glob(os.path.join(REPORTS_DIR, 'report_*.json')))
    while len(files) > MAX_REPORTS:
        oldest = files.pop(0)
        try:
            os.remove(oldest)
        except OSError:
            pass


def _run_analysis(holdings_data: list, date_str: str):
    """后台执行分析任务"""
    with _task_lock:
        _task_status[date_str] = 'in_progress'

    try:
        result = analysis_service.analyze_portfolio(holdings_data)
        report_path = _get_report_path(date_str)
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        _cleanup_old_reports()
        with _task_lock:
            _task_status[date_str] = 'success'
    except Exception as e:
        with _task_lock:
            _task_status[date_str] = f'failed:{str(e)}'


@router.post("/analyze")
async def analyze_portfolio(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    异步分析投资组合接口

    调用后立即返回，分析任务在后台执行。
    通过 GET /report 轮询获取结果。
    """
    today_str = date.today().isoformat()

    with _task_lock:
        current_status = _task_status.get(today_str)

    if current_status == 'in_progress':
        return {
            "status": "accepted",
            "message": "分析任务已在执行中，请通过 GET /report 轮询结果"
        }

    holdings_data = [h.dict() for h in request.holdings]
    background_tasks.add_task(_run_analysis, holdings_data, today_str)

    return {
        "status": "accepted",
        "message": "分析任务已提交，请通过 GET /report 轮询结果"
    }


@router.get("/report", response_model=TaskStatusResponse)
async def get_report():
    """
    获取当天分析报告

    返回状态：
    - in_progress: 分析进行中
    - success: 分析完成，data 中包含结果
    - no_task: 今天没有提交过分析任务
    - failed: 分析失败
    """
    today_str = date.today().isoformat()

    with _task_lock:
        current_status = _task_status.get(today_str)

    if current_status is None:
        report_path = _get_report_path(today_str)
        if os.path.exists(report_path):
            with open(report_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return TaskStatusResponse(status='success', data=AnalysisResponse(**data))
        return TaskStatusResponse(status='no_task', message='今天还没有提交过分析任务')

    if current_status == 'in_progress':
        return TaskStatusResponse(status='in_progress', message='分析任务执行中，请稍后再试')

    if current_status == 'success':
        report_path = _get_report_path(today_str)
        if os.path.exists(report_path):
            with open(report_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return TaskStatusResponse(status='success', data=AnalysisResponse(**data))
        return TaskStatusResponse(status='failed', message='报告文件丢失')

    if current_status.startswith('failed:'):
        error_msg = current_status.split(':', 1)[1]
        return TaskStatusResponse(status='failed', message=f'分析失败: {error_msg}')

    return TaskStatusResponse(status='no_task')


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "fund-analysis-service",
        "version": "1.1.0"
    }
