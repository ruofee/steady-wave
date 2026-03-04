# 依赖安装指南

## 📦 所需依赖清单

### 核心依赖

```bash
# 一条命令安装所有依赖
cd fundExpert
uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv langchain-openai
```

### 可选依赖（用于测试）

```bash
# 如果需要运行测试脚本
uv add requests
```

## 📋 依赖说明

| 依赖包 | 版本要求 | 用途 | 必需性 |
|--------|---------|------|--------|
| `crewai` | ≥0.1.0 | CrewAI 框架核心 | ✅ 必需 |
| `crewai-tools` | ≥0.1.0 | CrewAI 工具库 | ✅ 必需 |
| `akshare` | ≥1.12.0 | 获取金融数据 | ✅ 必需 |
| `fastapi` | ≥0.104.0 | Web 框架 | ✅ 必需 |
| `uvicorn[standard]` | ≥0.24.0 | ASGI 服务器 | ✅ 必需 |
| `pydantic` | ≥2.5.0 | 数据验证 | ✅ 必需 |
| `pyyaml` | ≥6.0.1 | YAML 配置解析 | ✅ 必需 |
| `python-dotenv` | ≥1.0.0 | 环境变量管理 | ⚪ 可选 |
| `langchain-openai` | ≥0.0.2 | OpenAI 兼容接口 | ✅ 必需 |
| `requests` | latest | HTTP 请求（测试用） | ⚪ 可选 |

## 🚀 快速安装

### 方法1：使用 uv（推荐）

```bash
# 1. 进入项目目录
cd fundExpert

# 2. 安装所有依赖
uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv langchain-openai

# 3. （可选）安装测试依赖
uv add requests
```

### 方法2：使用 pip（如果不用 uv）

```bash
# 1. 创建虚拟环境
python -m venv .venv

# 2. 激活虚拟环境
# macOS/Linux:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

# 3. 安装依赖
pip install crewai crewai-tools akshare fastapi "uvicorn[standard]" pydantic pyyaml python-dotenv langchain-openai

# 4. （可选）安装测试依赖
pip install requests
```

## 🔍 验证安装

安装完成后，验证依赖是否安装成功：

```bash
# 方法1：使用 uv
uv run python -c "import crewai; import akshare; import fastapi; print('✅ 依赖安装成功')"

# 方法2：直接运行
python -c "import crewai; import akshare; import fastapi; print('✅ 依赖安装成功')"
```

## 📌 依赖版本锁定

项目已配置 `pyproject.toml`，uv 会自动管理版本锁定。

查看当前安装的依赖：

```bash
uv pip list
```

## ⚠️ 常见问题

### 问题1：安装 akshare 失败

**原因**：可能需要编译某些依赖

**解决方案**：
```bash
# macOS
xcode-select --install

# Linux (Ubuntu/Debian)
sudo apt-get install python3-dev build-essential

# Linux (CentOS/RHEL)
sudo yum install python3-devel gcc
```

### 问题2：crewai 安装很慢

**原因**：crewai 有较多依赖

**解决方案**：
```bash
# 使用国内镜像（如果在中国）
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题3：uvicorn[standard] 安装失败

**解决方案**：
```bash
# 单独安装
uv add uvicorn
uv add "uvicorn[standard]"

# 或者只安装基础版
uv add uvicorn
```

### 问题4：版本冲突

**解决方案**：
```bash
# 清理并重新安装
rm -rf .venv
uv venv
uv add crewai crewai-tools akshare fastapi uvicorn pydantic pyyaml python-dotenv langchain-openai
```

## 🔄 更新依赖

### 更新单个依赖

```bash
uv add --upgrade crewai
```

### 更新所有依赖

```bash
uv pip install --upgrade-all
```

## 📝 依赖详细说明

### CrewAI (crewai + crewai-tools)
- **用途**：多 Agent 协作框架
- **功能**：Agent 定义、Task 编排、工具集成
- **官网**：https://github.com/joaomdmoura/crewAI

### AkShare (akshare)
- **用途**：金融数据获取
- **功能**：获取基金净值、大盘指数等数据
- **官网**：https://github.com/akfamily/akshare
- **注意**：部分数据源可能需要网络代理

### FastAPI (fastapi + uvicorn)
- **用途**：构建高性能 Web API
- **功能**：路由、请求验证、自动文档
- **官网**：https://fastapi.tiangolo.com/

### Pydantic (pydantic)
- **用途**：数据验证和序列化
- **功能**：类型检查、模型定义
- **官网**：https://docs.pydantic.dev/

### LangChain OpenAI (langchain-openai)
- **用途**：LLM 接口
- **功能**：与通义千问 API 交互
- **注意**：需要配置 API Key

## 💡 生产环境建议

### 1. 固定版本
生产环境建议锁定具体版本：

```toml
dependencies = [
    "crewai==0.1.0",
    "akshare==1.12.0",
    # ...
]
```

### 2. 使用虚拟环境
始终使用虚拟环境，避免污染全局环境。

### 3. 定期更新
定期检查依赖更新，但在测试环境充分测试后再应用到生产环境。

### 4. 安全扫描
使用工具检查已知漏洞：

```bash
pip install safety
safety check
```

## 📞 获取帮助

如果遇到其他问题：

1. 查看 [QUICKSTART.md](QUICKSTART.md)
2. 查看 [README.md](README.md)
3. 检查 Python 版本（需要 ≥3.9）
4. 确保网络连接正常
