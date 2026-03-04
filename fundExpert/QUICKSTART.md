# 快速启动指南

## 第一步：安装依赖

```bash
cd fundExpert

# 使用 uv 安装依赖
uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv langchain-openai
```

## 第二步：配置文件

1. 复制配置文件模板：

```bash
cp config.yaml.example config.yaml
```

2. 编辑 `config.yaml`，填入你的通义千问 API Key：

```yaml
llm:
  model: "qwen-max"
  api_key: "sk-xxxxxxxxxx"  # 替换为你的实际 API Key
  api_base: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  temperature: 0.7
  max_tokens: 4000
```

### 获取通义千问 API Key

1. 访问：https://dashscope.aliyun.com/
2. 登录/注册阿里云账号
3. 进入控制台，创建 API Key
4. 复制 API Key 到 config.yaml

## 第三步：启动服务

```bash
# 使用 uv 运行
uv run python main.py

# 或者直接运行
python main.py
```

服务将在 `http://localhost:8001` 启动。

## 第四步：测试服务

### 方法1：使用浏览器

访问 API 文档：http://localhost:8001/docs

在文档页面可以直接测试接口。

### 方法2：使用 curl

```bash
# 健康检查
curl http://localhost:8001/api/v1/health

# 分析投资组合
curl -X POST http://localhost:8001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### 方法3：使用测试脚本

```bash
# 先安装 requests
uv add requests

# 运行测试脚本
uv run python test_service.py
```

## 常见问题

### 1. 找不到模块错误

确保你在 `fundExpert` 目录下运行命令，并且已经安装所有依赖。

### 2. API Key 错误

检查 `config.yaml` 中的 API Key 是否正确。

### 3. 网络连接错误

- 确保可以访问通义千问 API
- 确保可以访问 AkShare 数据源（可能需要代理）

### 4. 数据获取失败

AkShare 数据源可能有延迟或维护，请稍后重试。

## 项目结构

```
fundExpert/
├── agents/              # AI Agents
├── api/                 # API 接口
├── tools/               # 工具集
├── main.py              # 主入口
├── crew_service.py      # CrewAI 服务
├── config.yaml          # 配置文件（需创建）
└── test_service.py      # 测试脚本
```

## 下一步

- 阅读完整文档：`README.md`
- 了解全天候策略配置
- 根据实际需求调整策略参数
- 集成到你的前端应用

## 注意事项

⚠️ **重要**：
- `config.yaml` 包含敏感信息，不要提交到 Git
- 调用 API 会产生费用，请控制使用频率
- 数据仅供参考，投资需谨慎
