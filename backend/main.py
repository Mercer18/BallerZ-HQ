"""
BallerZ HQ Backend API
FastAPI service for football predictions, AI chat, and data pipelines
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os

from app.api import predictions, chat, data
from app.scheduler import start_scheduled_jobs

app = FastAPI(
    title="BallerZ HQ API",
    description="Football predictions and AI assistant backend",
    version="0.1.0"
)

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ballerz-hq.vercel.app",  # Vercel preview URL
        "https://ballerzai.com",  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(data.router, prefix="/api/data", tags=["data"])

@app.get("/")
async def root():
    return {
        "service": "BallerZ HQ API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Start scheduled jobs on startup
@app.on_event("startup")
async def startup_event():
    start_scheduled_jobs()
