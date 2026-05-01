from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, require_admin

router = APIRouter(prefix="/members", tags=["members"])


def _serialize_profile(profile: models.MemberProfile) -> schemas.MemberProfileRead:
    user = profile.user
    return schemas.MemberProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        photo_url=profile.photo_url,
        grade=profile.grade,
        specialty=profile.specialty,
        team=profile.team,
        biography=profile.biography,
        interests=profile.interests,
        external_links=profile.external_links,
        orcid_id=profile.orcid_id,
        laboratory=profile.laboratory,
        research_axis_id=profile.research_axis_id,
        research_axis_title=profile.research_axis.title if profile.research_axis else None,
        updated_at=profile.updated_at,
    )


@router.get("", response_model=list[schemas.MemberProfileRead])
def list_members(
    search: str | None = None,
    axis_id: int | None = None,
    role: models.UserRole | None = None,
    db: Session = Depends(get_db),
) -> list[schemas.MemberProfileRead]:
    query = (
        select(models.MemberProfile)
        .join(models.MemberProfile.user)
        .options(
            joinedload(models.MemberProfile.user),
            joinedload(models.MemberProfile.research_axis),
        )
        .order_by(models.User.full_name)
    )

    if axis_id is not None:
        query = query.where(models.MemberProfile.research_axis_id == axis_id)

    if role is not None:
        query = query.where(models.User.role == role)

    if search:
        normalized = f"%{search.strip()}%"
        query = query.where(
            (models.User.full_name.ilike(normalized))
            | (models.MemberProfile.specialty.ilike(normalized))
            | (models.MemberProfile.team.ilike(normalized))
        )

    profiles = db.scalars(query).all()
    return [_serialize_profile(profile) for profile in profiles]


@router.get("/{profile_id}", response_model=schemas.MemberProfileRead)
def get_member(profile_id: int, db: Session = Depends(get_db)) -> schemas.MemberProfileRead:
    profile = db.scalar(
        select(models.MemberProfile)
        .where(models.MemberProfile.id == profile_id)
        .options(
            joinedload(models.MemberProfile.user),
            joinedload(models.MemberProfile.research_axis),
        )
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Member not found")

    return _serialize_profile(profile)


@router.get("/me/profile", response_model=schemas.MemberProfileRead)
def get_my_profile(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> schemas.MemberProfileRead:
    profile = db.scalar(
        select(models.MemberProfile)
        .where(models.MemberProfile.user_id == current_user.id)
        .options(
            joinedload(models.MemberProfile.user),
            joinedload(models.MemberProfile.research_axis),
        )
    )

    if profile is None:
        profile = models.MemberProfile(user_id=current_user.id, laboratory="LIAS")
        db.add(profile)
        db.commit()
        profile = db.scalar(
            select(models.MemberProfile)
            .where(models.MemberProfile.user_id == current_user.id)
            .options(
                joinedload(models.MemberProfile.user),
                joinedload(models.MemberProfile.research_axis),
            )
        )

    return _serialize_profile(profile)


@router.put("/me/profile", response_model=schemas.MemberProfileRead)
def update_my_profile(
    payload: schemas.MemberProfileUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> schemas.MemberProfileRead:
    profile = db.scalar(
        select(models.MemberProfile)
        .where(models.MemberProfile.user_id == current_user.id)
        .options(
            joinedload(models.MemberProfile.user),
            joinedload(models.MemberProfile.research_axis),
        )
    )
    if profile is None:
        profile = models.MemberProfile(user_id=current_user.id, laboratory="LIAS")
        db.add(profile)
        db.flush()

    updates = payload.model_dump(exclude_unset=True)
    full_name = updates.pop("full_name", None)

    if full_name:
        current_user.full_name = full_name

    for field, value in updates.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    profile = db.scalar(
        select(models.MemberProfile)
        .where(models.MemberProfile.id == profile.id)
        .options(
            joinedload(models.MemberProfile.user),
            joinedload(models.MemberProfile.research_axis),
        )
    )

    return _serialize_profile(profile)


@router.get("/admin/users", response_model=list[schemas.UserPublic])
def list_users_admin(
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[schemas.UserPublic]:
    users = db.scalars(select(models.User).order_by(models.User.full_name)).all()
    return [schemas.UserPublic.model_validate(user) for user in users]


@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserPublic)
def change_user_role(
    user_id: int,
    role: models.UserRole,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.UserPublic:
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    db.refresh(user)
    return schemas.UserPublic.model_validate(user)
