from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, require_admin

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _humanize_datetime(value: datetime) -> str:
    now = datetime.now(UTC).replace(tzinfo=None)
    delta = now - value
    if delta.days >= 1:
        return f"Il y a {delta.days} jour(s)"
    hours = delta.seconds // 3600
    if hours >= 1:
        return f"Il y a {hours} heure(s)"
    minutes = max(1, delta.seconds // 60)
    return f"Il y a {minutes} minute(s)"


def _month_range(reference: datetime, shift: int) -> tuple[datetime, datetime]:
    month = reference.month + shift
    year = reference.year
    while month <= 0:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1

    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)
    return start, end


@router.get("/member", response_model=schemas.MemberDashboardResponse)
def member_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.MemberDashboardResponse:
    publications = db.scalars(
        select(models.Publication).where(models.Publication.owner_id == current_user.id)
    ).all()
    communications = db.scalars(
        select(models.Communication).where(models.Communication.owner_id == current_user.id)
    ).all()

    pending_publications = sum(
        1
        for item in publications
        if item.validation_status == models.ValidationStatus.PENDING
    )
    pending_communications = sum(
        1
        for item in communications
        if item.validation_status == models.ValidationStatus.PENDING
    )

    stats = [
        schemas.DashboardStat(
            label="Mes Publications",
            value=len(publications),
            trend="Mises a jour en continu",
        ),
        schemas.DashboardStat(
            label="Communications",
            value=len(communications),
            trend="Activite scientifique",
        ),
        schemas.DashboardStat(
            label="En attente",
            value=pending_publications + pending_communications,
            trend="Soumissions a moderer",
        ),
        schemas.DashboardStat(
            label="Citations (estim.)",
            value=len(publications) * 12,
            trend="Estimation basee sur les productions",
        ),
    ]

    yearly_counts: dict[int, int] = {}
    for publication in publications:
        yearly_counts[publication.year] = yearly_counts.get(publication.year, 0) + 1

    publication_trend = [
        schemas.MemberChartPoint(year=str(year), count=count)
        for year, count in sorted(yearly_counts.items())
    ]

    activities: list[schemas.ActivityItem] = []
    for publication in sorted(publications, key=lambda item: item.created_at, reverse=True)[:3]:
        status = (
            "success"
            if publication.validation_status == models.ValidationStatus.VALIDATED
            else "warning"
            if publication.validation_status == models.ValidationStatus.NEEDS_CORRECTION
            else "pending"
        )
        activities.append(
            schemas.ActivityItem(
                id=publication.id,
                action="Publication mise a jour",
                title=publication.title,
                date=_humanize_datetime(publication.created_at),
                status=status,
            )
        )

    for communication in sorted(
        communications,
        key=lambda item: item.created_at,
        reverse=True,
    )[:2]:
        status = (
            "success"
            if communication.validation_status == models.ValidationStatus.VALIDATED
            else "warning"
            if communication.validation_status == models.ValidationStatus.NEEDS_CORRECTION
            else "pending"
        )
        activities.append(
            schemas.ActivityItem(
                id=10000 + communication.id,
                action="Communication enregistree",
                title=communication.title,
                date=_humanize_datetime(communication.created_at),
                status=status,
            )
        )

    activities = sorted(activities, key=lambda item: item.id, reverse=True)[:5]

    return schemas.MemberDashboardResponse(
        stats=stats,
        publication_trend=publication_trend,
        recent_activities=activities,
    )


@router.get("/admin", response_model=schemas.AdminDashboardResponse)
def admin_dashboard(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> schemas.AdminDashboardResponse:
    total_members = db.scalar(
        select(func.count(models.User.id)).where(models.User.role == models.UserRole.MEMBER)
    )
    total_publications = db.scalar(select(func.count(models.Publication.id)))
    active_projects = db.scalar(
        select(func.count(models.Project.id)).where(models.Project.status == "active")
    )

    pending_items = 0
    pending_items += db.scalar(
        select(func.count(models.Publication.id)).where(
            models.Publication.validation_status == models.ValidationStatus.PENDING
        )
    )
    pending_items += db.scalar(
        select(func.count(models.Communication.id)).where(
            models.Communication.validation_status == models.ValidationStatus.PENDING
        )
    )
    pending_items += db.scalar(
        select(func.count(models.Project.id)).where(
            models.Project.validation_status == models.ValidationStatus.PENDING
        )
    )
    pending_items += db.scalar(
        select(func.count(models.LabEvent.id)).where(
            models.LabEvent.validation_status == models.ValidationStatus.PENDING
        )
    )
    pending_items += db.scalar(
        select(func.count(models.NewsItem.id)).where(
            models.NewsItem.validation_status == models.ValidationStatus.PENDING
        )
    )

    stats = [
        schemas.DashboardStat(
            label="Total Publications",
            value=total_publications or 0,
            trend="Catalogue global du laboratoire",
        ),
        schemas.DashboardStat(
            label="Membres Actifs",
            value=total_members or 0,
            trend="Comptes chercheurs et doctorants",
        ),
        schemas.DashboardStat(
            label="En attente",
            value=pending_items,
            trend="Elements de moderation",
        ),
        schemas.DashboardStat(
            label="Projets Actifs",
            value=active_projects or 0,
            trend="Portefeuille de projets",
        ),
    ]

    now = datetime.utcnow()
    trend: list[schemas.AdminChartPoint] = []
    month_names = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"]
    for shift in range(-5, 1):
        start, end = _month_range(now, shift)

        submissions = 0
        submissions += db.scalar(
            select(func.count(models.Publication.id)).where(
                models.Publication.created_at >= start,
                models.Publication.created_at < end,
            )
        )
        submissions += db.scalar(
            select(func.count(models.Communication.id)).where(
                models.Communication.created_at >= start,
                models.Communication.created_at < end,
            )
        )
        submissions += db.scalar(
            select(func.count(models.Project.id)).where(
                models.Project.created_at >= start,
                models.Project.created_at < end,
            )
        )
        submissions += db.scalar(
            select(func.count(models.LabEvent.id)).where(
                models.LabEvent.created_at >= start,
                models.LabEvent.created_at < end,
            )
        )

        validations = db.scalar(
            select(func.count(models.ValidationRecord.id)).where(
                models.ValidationRecord.updated_at >= start,
                models.ValidationRecord.updated_at < end,
                models.ValidationRecord.reviewed_by.is_not(None),
            )
        )

        trend.append(
            schemas.AdminChartPoint(
                month=month_names[start.month - 1],
                validations=validations or 0,
                submissions=submissions or 0,
            )
        )

    validation_entries = db.scalars(
        select(models.ValidationRecord)
        .order_by(models.ValidationRecord.updated_at.desc())
        .limit(6)
    ).all()

    recent_activities = [
        schemas.ActivityItem(
            id=entry.id,
            action=f"Moderation {entry.decision.value}",
            title=f"{entry.content_type.capitalize()} #{entry.content_id}",
            date=_humanize_datetime(entry.updated_at),
            status="success"
            if entry.decision == models.ValidationStatus.VALIDATED
            else "warning"
            if entry.decision == models.ValidationStatus.NEEDS_CORRECTION
            else "pending",
            user=(
                db.get(models.User, entry.submitted_by).full_name
                if db.get(models.User, entry.submitted_by)
                else None
            ),
        )
        for entry in validation_entries
    ]

    return schemas.AdminDashboardResponse(
        stats=stats,
        submission_trend=trend,
        recent_activities=recent_activities,
    )
