from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from .database import get_db
from .security import decode_access_token, oauth2_scheme, oauth2_scheme_optional


INVALID_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        raise INVALID_CREDENTIALS_ERROR

    user = db.get(models.User, user_id)
    if user is None:
        raise INVALID_CREDENTIALS_ERROR

    return user


def get_optional_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> models.User | None:
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (ValueError, TypeError):
        return None

    return db.get(models.User, user_id)


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_admin(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges are required for this operation",
        )
    return current_user
