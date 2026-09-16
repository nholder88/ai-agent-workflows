"""FastAPI application entry point."""
import uvicorn
from src.app import create_app

if __name__ == "__main__":
    app = create_app()
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
