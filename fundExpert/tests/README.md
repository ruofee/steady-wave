# Tests 目录

这个目录包含所有测试和调试用的脚本。

## 📁 文件说明

### 测试脚本

#### `test_data_fetcher.py`
测试数据获取功能（不依赖 API 和 LLM）

**用途**：
- 测试 AkShare 基金数据获取
- 测试大盘指数数据获取
- 测试批量获取基金信息

**运行方法**：
```bash
cd fundExpert
# 不使用代理运行
unset https_proxy && unset http_proxy && unset all_proxy
uv run python tests/test_data_fetcher.py
```

#### `test_service.py`
测试 FastAPI 服务接口

**用途**：
- 测试健康检查接口
- 测试投资组合分析接口（需要 requests 库）

**运行方法**：
```bash
# 先确保服务已启动
uv run python main.py

# 在另一个终端运行测试
uv add requests  # 如果还没安装
uv run python tests/test_service.py
```

### 调试脚本

#### `debug_akshare.py`
调试 AkShare 数据结构

**用途**：
- 查看 AkShare 返回的实际数据结构
- 检查列名和数据格式
- 排查数据获取问题

**运行方法**：
```bash
cd fundExpert
unset https_proxy && unset http_proxy && unset all_proxy
uv run python tests/debug_akshare.py
```

### 示例代码

#### `example_client.py`
Python 客户端调用示例

**用途**：
- 演示如何在 Python 中调用 API
- 提供客户端封装类
- 展示错误处理

**使用方法**：
```python
from tests.example_client import FundAnalysisClient

client = FundAnalysisClient()
result = client.analyze_portfolio(holdings)
```

## 🚀 快速测试指南

### 1. 测试数据获取（最基础）
```bash
cd fundExpert
unset https_proxy && unset http_proxy && unset all_proxy
uv run python tests/test_data_fetcher.py
```

### 2. 测试完整服务
```bash
# 终端1：启动服务
cd fundExpert
unset https_proxy && unset http_proxy && unset all_proxy
uv run python main.py

# 终端2：运行测试
cd fundExpert
uv add requests  # 首次需要
uv run python tests/test_service.py
```

### 3. 调试 AkShare
```bash
cd fundExpert
unset https_proxy && unset http_proxy && unset all_proxy
uv run python tests/debug_akshare.py
```

## ⚠️ 注意事项

1. **代理问题**：AkShare 访问东方财富网可能会受代理影响，建议测试时关闭代理
2. **网络延迟**：某些测试需要访问外部 API，可能需要等待
3. **API Key**：测试完整 AI 分析功能需要配置真实的通义千问 API Key

## 📊 测试覆盖

- ✅ 数据获取功能
- ✅ API 接口
- ✅ 错误处理
- ⚪ AI Agent 逻辑（需要 API Key）
- ⚪ 性能测试（待添加）

## 🔧 添加新测试

如果需要添加新的测试脚本，请：

1. 在 `tests/` 目录下创建新文件
2. 文件名以 `test_` 或 `debug_` 开头
3. 更新本 README 文档
