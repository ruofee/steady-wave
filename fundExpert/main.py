"""
FastAPI 应用主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router
import yaml
import uvicorn


# 加载配置
try:
    with open('config.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
except FileNotFoundError:
    print("错误：未找到 config.yaml 文件")
    print("请复制 config.yaml.example 为 config.yaml 并填入配置")
    exit(1)


# 创建 FastAPI 应用
app = FastAPI(
    title="基金分析服务",
    description="基于 CrewAI 的全天候策略基金分析服务",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api/v1", tags=["analysis"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "基金分析服务运行中",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


def main():
    """启动服务"""
    host = config['server']['host']
    port = config['server']['port']
    
    print(f"正在启动服务...")
    print(f"服务地址: http://{host}:{port}")
    print(f"API 文档: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )


if __name__ == "__main__":
    main()
