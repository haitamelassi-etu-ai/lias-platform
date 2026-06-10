import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.audit import write_audit_log
from ..core.database import get_db
from ..core.deps import get_current_active_user, require_admin

router = APIRouter(prefix="/members", tags=["members"])
ORCID_RE = re.compile(r"^\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$")


def _member_content_map() -> dict[str, tuple[type, str]]:
    return {
        "publication": (models.Publication, "owner_id"),
        "communication": (models.Communication, "owner_id"),
        "project": (models.Project, "created_by"),
    }


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
        publication_count=getattr(profile, "publication_count", 0),
        updated_at=profile.updated_at,
    )


def _serialize_admin_user(user: models.User, profile: models.MemberProfile | None = None) -> schemas.AdminUserRead:
    return schemas.AdminUserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        orcid_name_locked=user.orcid_name_locked,
        orcid_id=(profile.orcid_id if profile else None) or user.orcid_sub,
    )


def _timeline_title(content_type: str, content_id: int, db: Session) -> str | None:
    content = _member_content_map().get(content_type)
    if content is None:
        return None
    model, _ = content
    item = db.get(model, content_id)
    return getattr(item, "title", None) if item else None


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
        .where(models.User.is_active.is_(True))
        .order_by(models.User.full_name)
    )

    if axis_id is not None:
        query = query.where(models.MemberProfile.research_axis_id == axis_id)

    if role is not None:
        query = query.where(models.User.role == role)
    else:
        query = query.where(models.User.role == models.UserRole.MEMBER)

    if search:
        normalized = f"%{search.strip()}%"
        query = query.where(
            (models.User.full_name.ilike(normalized))
            | (models.MemberProfile.specialty.ilike(normalized))
            | (models.MemberProfile.team.ilike(normalized))
        )

    profiles = db.scalars(query).all()
    if profiles:
        counts = dict(
            db.execute(
                select(models.Publication.owner_id, func.count(models.Publication.id))
                .where(
                    models.Publication.owner_id.in_([profile.user_id for profile in profiles]),
                    models.Publication.validation_status == models.ValidationStatus.VALIDATED,
                    models.Publication.is_archived.is_(False),
                )
                .group_by(models.Publication.owner_id)
            ).all()
        )
        for profile in profiles:
            profile.publication_count = counts.get(profile.user_id, 0)

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

    profile.publication_count = db.scalar(
        select(func.count(models.Publication.id)).where(
            models.Publication.owner_id == profile.user_id,
            models.Publication.validation_status == models.ValidationStatus.VALIDATED,
            models.Publication.is_archived.is_(False),
        )
    ) or 0

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
    if "orcid_id" in updates:
        raise HTTPException(
            status_code=400,
            detail="Utilisez le bouton de liaison ORCID pour associer un identifiant au compte.",
        )

    if full_name:
        if current_user.orcid_name_locked:
            raise HTTPException(
                status_code=400,
                detail="Le nom est verrouillé car il provient de votre compte ORCID",
            )
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


@router.get("/me/notifications", response_model=list[schemas.MemberNotificationRead])
def my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.MemberNotificationRead]:
    query = (
        select(models.Notification)
        .where(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(20)
    )
    if unread_only:
        query = query.where(models.Notification.is_read.is_(False))
    return [
        schemas.MemberNotificationRead(
            id=item.id,
            title=item.title,
            message=item.message,
            category=item.category,
            content_type=item.content_type,
            content_id=item.content_id,
            is_read=item.is_read,
            created_at=item.created_at,
        )
        for item in db.scalars(query).all()
    ]


@router.post("/me/notifications/{notification_id}/read", response_model=schemas.MemberNotificationRead)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.MemberNotificationRead:
    notification = db.get(models.Notification, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return schemas.MemberNotificationRead(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        category=notification.category,
        content_type=notification.content_type,
        content_id=notification.content_id,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


@router.post("/me/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> dict[str, int]:
    notifications = db.scalars(
        select(models.Notification).where(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read.is_(False),
        )
    ).all()
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return {"updated": len(notifications)}


@router.get("/me/validation-timeline", response_model=list[schemas.ValidationTimelineItem])
def my_validation_timeline(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.ValidationTimelineItem]:
    timeline: list[schemas.ValidationTimelineItem] = []

    for content_type, (model, owner_field) in _member_content_map().items():
        items = db.scalars(
            select(model)
            .where(getattr(model, owner_field) == current_user.id)
            .order_by(model.created_at.desc())
            .limit(20)
        ).all()
        for item in items:
            timeline.append(
                schemas.ValidationTimelineItem(
                    id=f"{content_type}-{item.id}-submitted",
                    content_type=content_type,
                    content_id=item.id,
                    title=item.title,
                    event="Soumission envoyée",
                    status=models.ValidationStatus.PENDING,
                    comment=None,
                    actor_name=current_user.full_name,
                    created_at=item.created_at,
                )
            )

    records = db.scalars(
        select(models.ValidationRecord)
        .where(models.ValidationRecord.submitted_by == current_user.id)
        .order_by(models.ValidationRecord.created_at.desc())
        .limit(60)
    ).all()
    for record in records:
        title = _timeline_title(record.content_type, record.content_id, db)
        if not title:
            continue
        reviewer = db.get(models.User, record.reviewed_by) if record.reviewed_by else None
        event_label = {
            models.ValidationStatus.VALIDATED: "Validé par l'administration",
            models.ValidationStatus.REJECTED: "Rejeté par l'administration",
            models.ValidationStatus.NEEDS_CORRECTION: "Correction demandée",
            models.ValidationStatus.PENDING: "Remis en attente",
        }[record.decision]
        timeline.append(
            schemas.ValidationTimelineItem(
                id=f"validation-{record.id}",
                content_type=record.content_type,
                content_id=record.content_id,
                title=title,
                event=event_label,
                status=record.decision,
                comment=record.comment,
                actor_name=reviewer.full_name if reviewer else None,
                created_at=record.created_at,
            )
        )

    timeline.sort(key=lambda item: item.created_at, reverse=True)
    return timeline[:30]


@router.get("/admin/users", response_model=list[schemas.AdminUserRead])
def list_users_admin(
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[schemas.AdminUserRead]:
    users = db.scalars(
        select(models.User)
        .where(models.User.is_active.is_(True))
        .order_by(models.User.full_name)
    ).all()
    profiles = db.scalars(
        select(models.MemberProfile).where(
            models.MemberProfile.user_id.in_([user.id for user in users])
        )
    ).all() if users else []
    profile_by_user_id = {profile.user_id: profile for profile in profiles}
    return [_serialize_admin_user(user, profile_by_user_id.get(user.id)) for user in users]


@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserPublic)
def change_user_role(
    user_id: int,
    role: models.UserRole,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.UserPublic:
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    previous_role = user.role
    user.role = role
    write_audit_log(
        db,
        current_admin,
        action="user.role_changed",
        entity_type="user",
        entity_id=user.id,
        entity_title=user.full_name,
        details={
            "email": user.email,
            "previous_role": previous_role.value,
            "new_role": role.value,
        },
    )
    db.commit()
    db.refresh(user)
    return schemas.UserPublic.model_validate(user)


@router.patch("/admin/users/{user_id}/orcid", response_model=schemas.AdminUserRead)
def update_user_orcid_admin(
    user_id: int,
    payload: schemas.AdminUserOrcidUpdate,
    current_admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.AdminUserRead:
    user = db.get(models.User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    profile = db.scalar(
        select(models.MemberProfile).where(models.MemberProfile.user_id == user.id)
    )
    if profile is None:
        profile = models.MemberProfile(user_id=user.id, laboratory="LIAS")
        db.add(profile)
        db.flush()

    previous_orcid = profile.orcid_id or user.orcid_sub
    new_orcid = payload.orcid_id.strip().upper() if payload.orcid_id else None

    if new_orcid:
        if not ORCID_RE.match(new_orcid):
            raise HTTPException(
                status_code=400,
                detail="Format ORCID invalide. Exemple attendu : 0000-0000-0000-0000",
            )
        existing_user = db.scalar(
            select(models.User).where(
                models.User.orcid_sub == new_orcid,
                models.User.id != user.id,
            )
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Cet ORCID est deja lie a un autre utilisateur")

        existing_profile = db.scalar(
            select(models.MemberProfile).where(
                models.MemberProfile.orcid_id == new_orcid,
                models.MemberProfile.user_id != user.id,
            )
        )
        if existing_profile:
            raise HTTPException(status_code=400, detail="Cet ORCID est deja utilise par un autre profil")

    profile.orcid_id = new_orcid
    user.orcid_sub = new_orcid
    user.orcid_name_locked = bool(new_orcid)

    write_audit_log(
        db,
        current_admin,
        action="user.orcid_updated" if new_orcid else "user.orcid_unlinked",
        entity_type="user",
        entity_id=user.id,
        entity_title=user.full_name,
        details={
            "email": user.email,
            "previous_orcid": previous_orcid,
            "new_orcid": new_orcid,
        },
    )
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return _serialize_admin_user(user, profile)
