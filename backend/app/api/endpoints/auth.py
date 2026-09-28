from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional, List, Any
from app.core.database import get_db

from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.models.models import User, Session
from app.schemas.schemas import Token, UserResponse, UserCreate, ChangePasswordRequest
from app.api.deps import get_current_user, get_authenticated_admin
from pydantic import BaseModel, EmailStr

router = APIRouter()


class LoginJSONRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates a user and issues JWT access and refresh tokens.
    Supports both JSON request body and standard OAuth2 form-data formats.
    """
    content_type = request.headers.get("content-type", "")
    email = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")
    else:
        # OAuth2 password flow form-data parsing
        try:
            form = await request.form()
            email = form.get("username")
            password = form.get("password")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid form data")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required fields."
        )


    # 2. Fetch User
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact the administrator."
        )

    # 3. Create tokens
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.id})

    # 4. Save Session to track active logins
    expires_at = datetime.utcnow() + timedelta(days=7)
    session_obj = Session(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=expires_at
    )
    db.add(session_obj)
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verifies refresh token and issues a fresh short-lived access token."""
    decoded = decode_token(payload.refresh_token)
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = decoded.get("sub")
    
    # Check if session exists and is active/not revoked
    stmt = select(Session).where(
        Session.refresh_token == payload.refresh_token,
        Session.is_revoked == False,
        Session.expires_at > datetime.utcnow()
    )
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()

    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked or expired"
        )

    # Get User details to append roles
    stmt_user = select(User).where(User.id == user_id)
    res_user = await db.execute(stmt_user)
    user = res_user.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this session is inactive or deleted"
        )

    # Reissue tokens
    new_access_token = create_access_token(data={"sub": user.id, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.id})

    # Revoke old session and save the new session
    session_obj.is_revoked = True
    
    expires_at = datetime.utcnow() + timedelta(days=7)
    new_session = Session(
        user_id=user.id,
        refresh_token=new_refresh_token,
        expires_at=expires_at
    )
    db.add(new_session)
    await db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/logout")
async def logout(
    payload: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revokes active refresh tokens, terminating the user session."""
    stmt = select(Session).where(Session.refresh_token == payload.refresh_token)
    res = await db.execute(stmt)
    session_obj = res.scalar_one_or_none()

    if session_obj:
        session_obj.is_revoked = True
        await db.commit()

    return {"detail": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns current active user profile information."""
    return current_user

@router.get("/me/notifications")
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches list of in-app notifications for the authenticated user."""
    from app.models.models import Notification
    stmt = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.put("/me/notifications/{notif_id}/read")
async def read_notification(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Marks a specific notification as read."""
    from app.models.models import Notification
    stmt = select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id)
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"detail": "Notification marked as read"}

@router.put("/me/notifications/read-all")
async def read_all_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Marks all user notifications as read."""
    from app.models.models import Notification
    from sqlalchemy import update
    stmt = update(Notification).where(Notification.user_id == current_user.id).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return {"detail": "All notifications marked as read"}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_admin: User = Depends(get_authenticated_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Changes administrator password after validating the current password and complexity requirements.
    Securely hashes the new password with bcrypt before persisting to database.
    """
    # 1. Verify current password
    if not verify_password(payload.current_password, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect. Please re-enter your current password."
        )

    # 2. Verify confirmation matches
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match."
        )

    # 3. Validate new password strength
    new_pwd = payload.new_password
    if len(new_pwd) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )

    has_letter = any(c.isalpha() for c in new_pwd)
    has_digit = any(c.isdigit() for c in new_pwd)

    if not (has_letter and has_digit):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter and one number."
        )

    # 4. Check that new password is not identical to current password
    if verify_password(new_pwd, current_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password."
        )

    # 5. Securely hash using bcrypt and update database
    hashed = get_password_hash(new_pwd)
    current_admin.password_hash = hashed
    current_admin.updated_at = datetime.utcnow()
    await db.commit()

    return {"detail": "Password successfully updated. Please use your new password for subsequent logins."}


