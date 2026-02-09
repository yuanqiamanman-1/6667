"""
魔搭创空间入口文件
启动 FastAPI 后端应用在 0.0.0.0:7860
"""
import uvicorn

if __name__ == "__main__":
    # 启动 FastAPI 应用
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=7860,
        reload=False  # 生产环境不使用热重载
    )
