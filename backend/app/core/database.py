from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
from app.core.config import settings

# Create async database engine for application database
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    # In some environments (like serverless/testing) we might want to disable pooling
    poolclass=NullPool if "sqlite" in settings.DATABASE_URL else None
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession
)

Base = declarative_base()

# DB dependency for route injection
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
