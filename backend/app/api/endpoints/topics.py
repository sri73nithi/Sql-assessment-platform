from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.models import Topic, User
from app.schemas.schemas import TopicResponse, TopicCreate, TopicUpdate
from app.api.deps import get_current_admin, get_current_user

router = APIRouter()


@router.get("", response_model=List[TopicResponse])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    stmt = select(Topic).where(Topic.is_active == True).order_by(Topic.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
async def create_topic(
    payload: TopicCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Topic).where(Topic.name == payload.name)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Topic with this name already exists.")

    topic = Topic(name=payload.name, description=payload.description, is_active=payload.is_active)
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=status.HTTP_200_OK)
async def delete_topic(
    topic_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(Topic).where(Topic.id == topic_id)
    res = await db.execute(stmt)
    topic = res.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")

    await db.delete(topic)
    await db.commit()
    return {"detail": "Topic deleted successfully."}

