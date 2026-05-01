from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.config import settings
from ..core.database import get_db
from ..core.deps import get_current_active_user
from ..core.security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)) -> schemas.UserPublic:
    existing = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=models.UserRole.MEMBER,
    )
    db.add(user)
    db.flush()

    profile = models.MemberProfile(user_id=user.id, laboratory="LIAS")
    db.add(profile)
    db.commit()
    db.refresh(user)

    return schemas.UserPublic.model_validate(user)


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    user = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is disabled")

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        },
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    return schemas.TokenResponse(
        access_token=access_token,
        user=schemas.UserPublic.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserPublic)
def me(
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.UserPublic:
    return schemas.UserPublic.model_validate(current_user)
