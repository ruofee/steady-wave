# Fund Expert - 基于 CrewAI 的全天候策略基金分析服务

## 项目简介

这是一个基于 CrewAI 框架构建的智能基金分析服务，专注于全天候投资策略（All Weather Strategy）的应用。服务通过多个 AI Agent 协作，自动获取基金数据、分析投资组合配比，并提供专业的调仓建议。

## 功能特性

- 🤖 **多 Agent 协作**：数据采集专家 + 全天候策略分析专家
- 📊 **实时数据获取**：基于 AkShare 获取基金净值和大盘指数数据
- 💼 **全天候策略分析**：基于 Ray Dalio 的全天候投资策略进行配比分析
- 🎯 **智能建议**：根据市场情况提供加仓/减仓/调仓建议
- 🔌 **RESTful API**：提供标准的 HTTP 接口，易于集成

## 技术栈

- **AI 框架**：CrewAI
- **LLM**：通义千问（Qwen）
- **数据源**：AkShare
- **Web 框架**：FastAPI
- **包管理**：uv

## 项目结构

```
fundExpert/
├── agents/                 # AI Agents
│   ├── __init__.py
│   ├── data_collector.py   # 数据采集专家
│   └── strategy_analyst.py # 全天候策略分析专家
├── api/                    # API 接口
│   ├── __init__.py
│   └── routes.py           # 路由定义
├── tools/                  # CrewAI 工具
│   ├── __init__.py
│   ├── data_fetcher.py     # 数据获取工具
│   └── fund_tools.py       # CrewAI 工具封装
├── tests/                  # 测试和调试脚本
│   ├── __init__.py
│   ├── README.md           # 测试文档
│   ├── test_data_fetcher.py    # 数据获取测试
│   ├── test_service.py         # 服务接口测试
│   ├── debug_akshare.py        # AkShare 调试
│   └── example_client.py       # Python 客户端示例
├── main.py                 # 应用入口
├── crew_service.py         # CrewAI 服务编排
├── config.yaml             # 配置文件（需要创建）
├── config.yaml.example     # 配置文件示例
├── .env.example            # 环境变量示例
├── pyproject.toml          # 项目依赖
└── README.md               # 项目文档
```

## 安装步骤

### 1. 安装依赖

使用 uv 安装所需依赖：

```bash
cd fundExpert
uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv
```

### 2. 配置文件

复制配置文件模板并填入你的配置：

```bash
cp config.yaml.example config.yaml
```

编辑 `config.yaml`，填入你的通义千问 API Key：

```yaml
llm:
  model: "qwen-max"
  api_key: "your-qwen-api-key-here"  # 替换为你的 API Key
  api_base: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  temperature: 0.7
  max_tokens: 4000
```

## 使用方法

### 启动服务

```bash
cd fundExpert
uv run python main.py
```

服务将在 `http://localhost:8001` 启动。

### API 接口

#### 1. 健康检查

```bash
GET /api/v1/health
```

#### 2. 分析投资组合

```bash
POST /api/v1/analyze
Content-Type: application/json

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

### 响应格式

```json
{
  "status": "success",
  "timestamp": "2026-03-04 23:30:00",
  "holdings": [...],
  "analysis": {
    "raw_output": "完整的分析报告",
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

## 全天候策略说明

全天候策略（All Weather Strategy）由桥水基金创始人 Ray Dalio 提出，核心理念是通过资产配置平衡不同经济环境下的风险。

### 标准配比

- **股票**：30%
- **长期国债**：40%
- **中期国债**：15%
- **商品**：7.5%
- **黄金**：7.5%

### 调仓规则

- 配比偏差超过 5% 时建议调整
- 单日涨幅超过 2% 考虑减仓
- 单日跌幅超过 2% 考虑加仓

## AI Agents 说明

### 1. 数据采集专家（Data Collector Agent）

**职责**：
- 获取基金实时净值和涨跌幅
- 获取大盘指数数据
- 计算投资组合统计信息

**工具**：
- `fetch_single_fund_tool`：获取单个基金信息
- `fetch_market_index_tool`：获取市场指数
- `fetch_multiple_funds_tool`：批量获取基金信息
- `calculate_portfolio_tool`：计算组合统计

### 2. 全天候策略分析专家（Strategy Analyst Agent）

**职责**：
- 对比当前配比与标准配比
- 评估市场环境
- 提供调仓建议
- 识别风险点

**特点**：
- 具有 20 年华尔街经验的设定
- 深度理解全天候策略理念
- 数据驱动、逻辑严谨
- 注重长期稳健收益

## 开发说明

### 添加新的 Agent

在 `agents/` 目录下创建新的 Agent 文件，参考现有 Agent 的结构。

### 添加新的工具

在 `tools/` 目录下添加工具函数，并使用 `@tool` 装饰器注册。

### 修改策略参数

编辑 `config.yaml` 中的 `all_weather_strategy` 配置。

## 注意事项

1. **配置文件安全**：`config.yaml` 包含 API Key，不要提交到 Git
2. **数据准确性**：AkShare 数据可能有延迟，请注意时效性
3. **模型费用**：调用通义千问 API 会产生费用，请控制使用频率
4. **网络要求**：需要能够访问通义千问 API 和 AkShare 数据源

## License

MIT
