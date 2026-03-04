# 项目结构总览

## 📁 目录结构

```
fundExpert/
├── agents/                          # AI Agents 模块
│   ├── __init__.py                  # 模块初始化
│   ├── data_collector.py            # 数据采集专家 Agent
│   └── strategy_analyst.py          # 全天候策略分析专家 Agent
│
├── api/                             # API 接口模块
│   ├── __init__.py                  # 模块初始化
│   └── routes.py                    # FastAPI 路由定义
│
├── tools/                           # CrewAI 工具模块
│   ├── __init__.py                  # 模块初始化
│   ├── data_fetcher.py              # 数据获取工具（AkShare）
│   └── fund_tools.py                # CrewAI 工具封装
│
├── .env.example                     # 环境变量示例
├── .python-version                  # Python 版本（uv 生成）
├── config.yaml.example              # 配置文件示例
├── crew_service.py                  # CrewAI 服务编排
├── example_client.py                # API 调用示例（Python）
├── main.py                          # FastAPI 应用入口
├── pyproject.toml                   # 项目依赖配置
├── QUICKSTART.md                    # 快速启动指南
├── README.md                        # 项目文档
└── test_service.py                  # 测试脚本
```

## 🎯 核心模块说明

### 1. Agents（AI 代理）

#### data_collector.py
- **角色**：金融数据采集专家
- **职责**：
  - 获取基金实时数据
  - 获取大盘指数数据
  - 整理汇总数据
- **工具**：fetch_single_fund_tool, fetch_market_index_tool, 等

#### strategy_analyst.py
- **角色**：资深全天候策略投资专家
- **职责**：
  - 分析持仓配比是否符合全天候策略
  - 评估市场环境
  - 提供调仓建议
  - 风险提示
- **特点**：20年华尔街经验，深度理解全天候策略

### 2. Tools（工具集）

#### data_fetcher.py
- `get_fund_info()` - 获取单个基金信息
- `get_market_index()` - 获取市场指数
- `get_multiple_funds_info()` - 批量获取基金信息
- `calculate_portfolio_stats()` - 计算组合统计

#### fund_tools.py
- `@tool` 装饰器封装，供 CrewAI 使用
- 所有工具函数的 CrewAI 版本

### 3. API（接口层）

#### routes.py
- `POST /api/v1/analyze` - 分析投资组合
- `GET /api/v1/health` - 健康检查

### 4. 核心服务

#### crew_service.py
- `FundAnalysisService` 类
- 协调多个 Agents 完成分析任务
- 格式化输出结果

#### main.py
- FastAPI 应用入口
- 配置 CORS
- 启动 HTTP 服务

## 📦 依赖清单

```toml
dependencies = [
    "crewai>=0.1.0",              # CrewAI 框架
    "crewai-tools>=0.1.0",        # CrewAI 工具库
    "akshare>=1.12.0",            # 金融数据获取
    "fastapi>=0.104.0",           # Web 框架
    "uvicorn[standard]>=0.24.0",  # ASGI 服务器
    "pydantic>=2.5.0",            # 数据验证
    "pyyaml>=6.0.1",              # YAML 配置
    "python-dotenv>=1.0.0",       # 环境变量
    "langchain-openai>=0.0.2"     # OpenAI 兼容接口
]
```

## 🔧 配置文件

### config.yaml
```yaml
llm:                          # LLM 配置
  model: "qwen-max"
  api_key: "your-key"
  api_base: "https://..."
  temperature: 0.7
  max_tokens: 4000

server:                       # 服务配置
  host: "0.0.0.0"
  port: 8001

all_weather_strategy:         # 策略配置
  standard_allocation:        # 标准配比
    stock: 0.30
    long_bond: 0.40
    mid_bond: 0.15
    commodity: 0.075
    gold: 0.075
  deviation_threshold: 0.05   # 偏差阈值
  daily_change_threshold:     # 涨跌阈值
    strong_rise: 0.02
    moderate_rise: 0.01
    moderate_fall: -0.01
    strong_fall: -0.02
```

## 🚀 使用流程

1. **安装依赖**
   ```bash
   uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv langchain-openai
   ```

2. **配置服务**
   ```bash
   cp config.yaml.example config.yaml
   # 编辑 config.yaml 填入 API Key
   ```

3. **启动服务**
   ```bash
   uv run python main.py
   ```

4. **调用接口**
   - 访问文档：http://localhost:8001/docs
   - 健康检查：http://localhost:8001/api/v1/health
   - 分析接口：POST http://localhost:8001/api/v1/analyze

## 📋 请求示例

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
    }
  ]
}
```

## 📊 响应示例

```json
{
  "status": "success",
  "timestamp": "2026-03-04 23:30:00",
  "holdings": [...],
  "analysis": {
    "raw_output": "完整分析报告",
    "summary": "分析摘要",
    "allocation_analysis": {
      "description": "配比分析",
      "has_deviation": false
    },
    "recommendations": ["维持当前配置"],
    "risk_warnings": []
  }
}
```

## 🔐 安全注意事项

✅ **已配置**：
- `config.yaml` 已加入 `.gitignore`
- `.env` 已加入 `.gitignore`
- 提供了 `.example` 示例文件

⚠️ **注意**：
- 不要将 API Key 提交到 Git
- 生产环境建议使用环境变量
- 定期轮换 API Key

## 📚 相关文档

- `README.md` - 完整项目文档
- `QUICKSTART.md` - 快速启动指南
- `example_client.py` - Python 客户端示例
- `test_service.py` - 测试脚本

## 🎨 全天候策略

### 标准配比
- 股票：30%
- 长期国债：40%
- 中期国债：15%
- 商品：7.5%
- 黄金：7.5%

### 核心理念
通过资产配置平衡不同经济环境（增长上升/下降、通胀上升/下降）下的风险。

## 📞 技术支持

如有问题，请查阅：
1. FastAPI 文档：http://localhost:8001/docs
2. 项目 README.md
3. QUICKSTART.md
