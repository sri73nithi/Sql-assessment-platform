from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.models import User
from app.schemas.schemas import UserResponse, UserCreate, UserResetPassword
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def list_students(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Lists all student accounts in the platform."""
    stmt = select(User).where(User.role == "student")
    res = await db.execute(stmt)
    students = res.scalars().all()
    return students

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Registers a new student using an official email."""
    # Check if email is already in use
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    existing_user = res.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email is already registered."
        )

    # Create new student user
    student = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role="student",
        is_active=True
    )
    
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student

@router.delete("/{student_id}", status_code=status.HTTP_200_OK)
async def delete_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Permanently deletes a student account."""
    stmt = select(User).where(User.id == student_id, User.role == "student")
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found or user is not a student."
        )

    await db.delete(student)
    await db.commit()
    return {"detail": "Student successfully deleted"}

@router.put("/{student_id}/disable", response_model=UserResponse)
async def disable_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Disables a student account (revokes access without deletion)."""
    stmt = select(User).where(User.id == student_id, User.role == "student")
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )

    student.is_active = False
    await db.commit()
    await db.refresh(student)
    return student

@router.put("/{student_id}/enable", response_model=UserResponse)
async def enable_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Re-enables a disabled student account."""
    stmt = select(User).where(User.id == student_id, User.role == "student")
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )

    student.is_active = True
    await db.commit()
    await db.refresh(student)
    return student

@router.put("/{student_id}/reset-password")
async def reset_student_password(
    student_id: str,
    payload: UserResetPassword,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin only: Resets a student's password."""
    stmt = select(User).where(User.id == student_id, User.role == "student")
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )

    student.password_hash = get_password_hash(payload.new_password)
    await db.commit()
    return {"detail": "Password successfully reset"}
