# Steady Wave - 全天候策略投资管理平台

一个基于 Vue 3 + TypeScript 的现代化投资管理平台，结合 CrewAI 智能分析服务，帮助投资者实践全天候投资策略（All Weather Strategy）。

## 📁 项目结构

```
steady-wave/
├── src/              # 前端源码（Vue 3 + TypeScript）
├── server/           # 后端服务（Node.js）
└── fundExpert/       # AI 分析服务（Python + CrewAI）
```

## 🎯 功能特性

### 前端（Vue 3 + TypeScript + Vite）

- 现代化的投资组合管理界面
- 实时数据展示
- 响应式设计

### AI 分析服务（fundExpert）

- 🤖 **多 Agent 协作**：数据采集 + 策略分析
- 📊 **实时数据**：基于 AkShare 获取基金和大盘数据
- 💼 **全天候策略**：基于 Ray Dalio 的投资策略
- 🎯 **智能建议**：自动生成调仓建议
- 🔌 **RESTful API**：易于集成

## 🚀 快速开始

### 前端服务

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

### AI 分析服务

详见 [fundExpert/README.md](fundExpert/README.md)

```bash
cd fundExpert

# 安装依赖（使用 uv）
uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv langchain-openai

# 配置服务
cp config.yaml.example config.yaml
# 编辑 config.yaml 填入通义千问 API Key

# 启动服务
uv run python main.py
```

服务将在 `http://localhost:8001` 启动。

## 📚 文档

### 主文档
- [README.md](README.md) - 本文档

### AI 分析服务文档
- [fundExpert/README.md](fundExpert/README.md) - 完整项目文档
- [fundExpert/QUICKSTART.md](fundExpert/QUICKSTART.md) - 快速启动指南
- [fundExpert/DEPENDENCIES.md](fundExpert/DEPENDENCIES.md) - 依赖安装指南
- [fundExpert/PROJECT_STRUCTURE.md](fundExpert/PROJECT_STRUCTURE.md) - 项目结构说明

### 示例代码
- [fundExpert/example_client.py](fundExpert/example_client.py) - Python 客户端示例
- [fundExpert/example_client.ts](fundExpert/example_client.ts) - TypeScript/JavaScript 客户端示例
- [fundExpert/test_service.py](fundExpert/test_service.py) - 测试脚本

## 🔧 技术栈

### 前端
- **框架**：Vue 3
- **语言**：TypeScript
- **构建工具**：Vite
- **包管理器**：pnpm

### AI 分析服务
- **AI 框架**：CrewAI
- **LLM**：通义千问（Qwen）
- **数据源**：AkShare
- **Web 框架**：FastAPI
- **包管理器**：uv

## 🎨 全天候策略

全天候策略（All Weather Strategy）由桥水基金创始人 Ray Dalio 提出，核心理念是通过资产配置平衡不同经济环境下的风险。

### 标准配比
- 股票：30%
- 长期国债：40%
- 中期国债：15%
- 商品：7.5%
- 黄金：7.5%

## 📞 API 接口

### 健康检查
```bash
GET http://localhost:8001/api/v1/health
```

### 分析投资组合
```bash
POST http://localhost:8001/api/v1/analyze
Content-Type: application/json

{
  "holdings": [
    {
      "fund_code": "110022",
      "amount": 30000,
      "ratio": 0.30,
      "asset_type": "stock"
    }
  ]
}
```

详细 API 文档：http://localhost:8001/docs

## ⚠️ 注意事项

1. **配置文件安全**：`fundExpert/config.yaml` 包含 API Key，不要提交到 Git
2. **数据准确性**：数据仅供参考，投资需谨慎
3. **API 费用**：调用通义千问 API 会产生费用
4. **网络要求**：需要能够访问通义千问 API 和数据源

## 📄 License

MIT
