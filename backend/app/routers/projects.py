from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..core.database import get_db
from ..core.deps import get_current_active_user, get_optional_user

router = APIRouter(prefix="/projects", tags=["projects"])


def _serialize(project: models.Project) -> schemas.ProjectRead:
    return schemas.ProjectRead(
        id=project.id,
        title=project.title,
        summary=project.summary,
        lead_member_name=project.lead_member_name,
        partners=project.partners,
        start_date=project.start_date,
        end_date=project.end_date,
        funding=project.funding,
        status=project.status,
        is_public=project.is_public,
        axis_id=project.axis_id,
        validation_status=project.validation_status,
        created_by=project.created_by,
        owner_name=project.owner.full_name,
        axis_title=project.axis.title if project.axis else None,
        created_at=project.created_at,
    )


def _is_admin(user: models.User | None) -> bool:
    return bool(user and user.role == models.UserRole.ADMIN)


@router.get("", response_model=list[schemas.ProjectRead])
def list_projects(
    include_all: bool = False,
    db: Session = Depends(get_db),
    optional_user: models.User | None = Depends(get_optional_user),
) -> list[schemas.ProjectRead]:
    query = (
        select(models.Project)
        .options(joinedload(models.Project.owner), joinedload(models.Project.axis))
        .order_by(models.Project.created_at.desc())
    )

    if not include_all:
        query = query.where(models.Project.is_public.is_(True)).where(
            models.Project.validation_status == models.ValidationStatus.VALIDATED
        )
    elif not _is_admin(optional_user):
        raise HTTPException(status_code=403, detail="Admin role required")

    projects = db.scalars(query).all()
    return [_serialize(project) for project in projects]


@router.get("/me", response_model=list[schemas.ProjectRead])
def my_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> list[schemas.ProjectRead]:
    query = (
        select(models.Project)
        .where(models.Project.created_by == current_user.id)
        .options(joinedload(models.Project.owner), joinedload(models.Project.axis))
        .order_by(models.Project.created_at.desc())
    )
    return [_serialize(project) for project in db.scalars(query).all()]


@router.post("", response_model=schemas.ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.ProjectRead:
    project = models.Project(
        **payload.model_dump(),
        created_by=current_user.id,
        validation_status=models.ValidationStatus.PENDING,
    )
    db.add(project)
    db.commit()

    project = db.scalar(
        select(models.Project)
        .where(models.Project.id == project.id)
        .options(joinedload(models.Project.owner), joinedload(models.Project.axis))
    )
    return _serialize(project)


@router.put("/{project_id}", response_model=schemas.ProjectRead)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.ProjectRead:
    project = db.get(models.Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != models.UserRole.ADMIN and project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    if current_user.role != models.UserRole.ADMIN:
        project.validation_status = models.ValidationStatus.PENDING

    db.commit()

    project = db.scalar(
        select(models.Project)
        .where(models.Project.id == project.id)
        .options(joinedload(models.Project.owner), joinedload(models.Project.axis))
    )
    return _serialize(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> None:
    project = db.get(models.Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != models.UserRole.ADMIN and project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db.delete(project)
    db.commit()
