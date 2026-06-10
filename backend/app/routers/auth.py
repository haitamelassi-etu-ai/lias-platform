import re
import hashlib
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from urllib.parse import quote, urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.audit import write_audit_log
from ..core.config import settings
from ..core.database import get_db
from ..core.deps import get_current_active_user
from ..core.security import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_lias_token(user: models.User) -> str:
    return create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _send_password_reset_email(email: str, reset_url: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        return

    message = EmailMessage()
    message["Subject"] = "Réinitialisation du mot de passe LIAS"
    message["From"] = settings.smtp_from_email
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                "Bonjour,",
                "",
                "Une demande de réinitialisation de mot de passe a été effectuée pour votre compte LIAS.",
                "Cliquez sur le lien suivant pour définir un nouveau mot de passe :",
                reset_url,
                "",
                f"Ce lien expire dans {settings.password_reset_expire_minutes} minutes.",
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
                "",
                "Plateforme LIAS",
            ]
        )
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


@router.post("/register", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)) -> schemas.UserPublic:
    existing = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.orcid_id:
        existing_orcid = db.scalar(select(models.User).where(models.User.orcid_sub == payload.orcid_id))
        if existing_orcid:
            raise HTTPException(status_code=400, detail="Ce compte ORCID est déjà lié à un utilisateur")

    user = models.User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=models.UserRole.MEMBER,
        orcid_sub=payload.orcid_id or None,
        orcid_name_locked=bool(payload.orcid_id),
    )
    db.add(user)
    db.flush()

    profile = models.MemberProfile(
        user_id=user.id,
        laboratory="LIAS",
        orcid_id=payload.orcid_id or None,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    return schemas.UserPublic.model_validate(user)


_ORCID_RE = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$")


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    identifier = payload.identifier.strip()
    if _ORCID_RE.match(identifier):
        user = db.scalar(select(models.User).where(models.User.orcid_sub == identifier))
    else:
        user = db.scalar(select(models.User).where(models.User.email == identifier.lower()))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is disabled")

    access_token = _build_lias_token(user)

    return schemas.TokenResponse(
        access_token=access_token,
        user=schemas.UserPublic.model_validate(user),
    )


@router.post("/password-reset/request", response_model=schemas.PasswordResetResponse)
def request_password_reset(
    payload: schemas.PasswordResetRequest,
    db: Session = Depends(get_db),
) -> schemas.PasswordResetResponse:
    generic_message = (
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
    )
    user = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    reset_url: str | None = None

    if user and user.is_active:
        now = datetime.utcnow()
        token = secrets.token_urlsafe(40)
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"

        for existing in db.scalars(
            select(models.PasswordResetToken).where(
                models.PasswordResetToken.user_id == user.id,
                models.PasswordResetToken.used_at.is_(None),
            )
        ):
            existing.used_at = now

        db.add(
            models.PasswordResetToken(
                user_id=user.id,
                token_hash=_hash_reset_token(token),
                expires_at=now + timedelta(minutes=settings.password_reset_expire_minutes),
            )
        )
        db.commit()
        _send_password_reset_email(user.email, reset_url)

    return schemas.PasswordResetResponse(
        message=generic_message,
        reset_url=reset_url if settings.env != "production" else None,
    )


@router.post("/password-reset/confirm")
def confirm_password_reset(
    payload: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    now = datetime.utcnow()
    token_hash = _hash_reset_token(payload.token)
    reset_token = db.scalar(
        select(models.PasswordResetToken).where(
            models.PasswordResetToken.token_hash == token_hash
        )
    )

    if (
        reset_token is None
        or reset_token.used_at is not None
        or reset_token.expires_at < now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de réinitialisation invalide ou expiré",
        )

    user = db.get(models.User, reset_token.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Compte introuvable ou désactivé",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    reset_token.used_at = now
    db.commit()

    return {"message": "Mot de passe mis à jour avec succès"}


@router.post("/change-password")
def change_password(
    payload: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe actuel est incorrect",
        )

    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit être différent du mot de passe actuel",
        )

    now = datetime.utcnow()
    current_user.hashed_password = get_password_hash(payload.new_password)
    for reset_token in db.scalars(
        select(models.PasswordResetToken).where(
            models.PasswordResetToken.user_id == current_user.id,
            models.PasswordResetToken.used_at.is_(None),
        )
    ):
        reset_token.used_at = now

    write_audit_log(
        db,
        current_user,
        action="user.password_changed",
        entity_type="user",
        entity_id=current_user.id,
        entity_title=current_user.full_name,
        details={"email": current_user.email},
    )
    db.commit()

    return {"message": "Mot de passe modifié avec succès"}


@router.get("/me", response_model=schemas.UserPublic)
def me(
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.UserPublic:
    return schemas.UserPublic.model_validate(current_user)


@router.get("/orcid/authorize")
def orcid_authorize() -> RedirectResponse:
    if (
        not settings.orcid_client_id
        or settings.orcid_client_id == "your-orcid-client-id-here"
        or not settings.orcid_client_secret
    ):
        return RedirectResponse(url=f"{settings.frontend_url}/orcid-callback?error=not_configured")

    callback_url = f"{settings.frontend_url.rstrip('/')}/orcid-callback"
    params = urlencode({
        "client_id": settings.orcid_client_id,
        "response_type": "code",
        "scope": "/authenticate",
        "redirect_uri": callback_url,
    })
    return RedirectResponse(url=f"{settings.orcid_base_url}/oauth/authorize?{params}")


@router.get("/orcid/callback")
def orcid_callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    if not settings.orcid_client_id or not settings.orcid_client_secret:
        return RedirectResponse(url=f"{settings.frontend_url}/orcid-callback?error=not_configured")

    callback_url = f"{settings.frontend_url.rstrip('/')}/orcid-callback"

    try:
        with httpx.Client(timeout=15.0) as client:
            token_response = client.post(
                f"{settings.orcid_base_url}/oauth/token",
                data={
                    "client_id": settings.orcid_client_id,
                    "client_secret": settings.orcid_client_secret,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": callback_url,
                },
                headers={"Accept": "application/json"},
            )
    except httpx.RequestError as exc:
        return RedirectResponse(url=f"{settings.frontend_url}/orcid-callback?error=network_error")

    if token_response.status_code != 200:
        return RedirectResponse(url=f"{settings.frontend_url}/orcid-callback?error=orcid_error")

    orcid_data = token_response.json()
    orcid_id: str = orcid_data.get("orcid", "")
    orcid_name: str = orcid_data.get("name", "")

    if not orcid_id:
        return RedirectResponse(url=f"{settings.frontend_url}/orcid-callback?error=no_orcid_id")

    # Existing user → log in directly
    user = db.scalar(select(models.User).where(models.User.orcid_sub == orcid_id))
    if user:
        lias_token = _build_lias_token(user)
        return RedirectResponse(url=f"{settings.frontend_url}/orcid-callback?token={lias_token}")

    # New user → redirect to setup page (no account created yet)
    safe_name = quote(orcid_name)
    return RedirectResponse(
        url=f"{settings.frontend_url}/orcid-setup?orcid_id={orcid_id}&name={safe_name}"
    )


@router.post("/orcid/complete-setup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def orcid_complete_setup(
    payload: schemas.OrcidCompleteSetupRequest,
    db: Session = Depends(get_db),
) -> schemas.TokenResponse:
    existing_orcid = db.scalar(select(models.User).where(models.User.orcid_sub == payload.orcid_id))
    if existing_orcid:
        raise HTTPException(status_code=400, detail="Ce compte ORCID est déjà lié à un utilisateur")

    existing_email = db.scalar(select(models.User).where(models.User.email == payload.email.lower()))
    if existing_email:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")

    user = models.User(
        email=payload.email.lower(),
        full_name=payload.orcid_name,
        hashed_password=get_password_hash(payload.password),
        role=models.UserRole.MEMBER,
        orcid_sub=payload.orcid_id,
        orcid_name_locked=True,
    )
    db.add(user)
    db.flush()

    profile = models.MemberProfile(
        user_id=user.id,
        laboratory="LIAS",
        orcid_id=payload.orcid_id,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    # Auto-import ORCID publications
    from .orcid import _fetch_orcid_profile
    from datetime import datetime as dt
    try:
        orcid_profile = _fetch_orcid_profile(payload.orcid_id)
        for work in orcid_profile.works[:50]:
            year = work.year or dt.utcnow().year
            pub = models.Publication(
                title=work.title,
                authors=user.full_name,
                publication_type=work.publication_type,
                year=year,
                venue=work.venue,
                doi=work.doi,
                external_link=f"https://doi.org/{work.doi}" if work.doi else None,
                source="orcid",
                validation_status=models.ValidationStatus.PENDING,
                owner_id=user.id,
            )
            db.add(pub)
        db.commit()
    except Exception:
        pass  # Import failed silently — user can retry later

    lias_token = _build_lias_token(user)
    return schemas.TokenResponse(
        access_token=lias_token,
        user=schemas.UserPublic.model_validate(user),
    )
