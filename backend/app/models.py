from datetime import date, datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .core.database import Base


class UserRole(str, Enum):
    MEMBER = "member"
    ADMIN = "admin"


class ValidationStatus(str, Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    REJECTED = "rejected"
    NEEDS_CORRECTION = "needs_correction"


class ChangeRequestType(str, Enum):
    EDIT = "edit"
    DELETE = "delete"


class ChangeRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CommunicationPresentationStatus(str, Enum):
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    PRESENTED = "presented"


class EventLifecycleStatus(str, Enum):
    UPCOMING = "upcoming"
    PAST = "past"


def enum_values(enum_cls: type[Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole), nullable=False, default=UserRole.MEMBER
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    orcid_sub: Mapped[str] = mapped_column(
        String(32), nullable=True, unique=True, index=True
    )
    orcid_name_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped["MemberProfile"] = relationship(
        "MemberProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    publications: Mapped[list["Publication"]] = relationship(
        "Publication", back_populates="owner"
    )
    communications: Mapped[list["Communication"]] = relationship(
        "Communication", back_populates="owner"
    )
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="owner")
    events: Mapped[list["LabEvent"]] = relationship("LabEvent", back_populates="owner")
    news_items: Mapped[list["NewsItem"]] = relationship(
        "NewsItem", back_populates="author"
    )
    gallery_items: Mapped[list["GalleryItem"]] = relationship(
        "GalleryItem", back_populates="author", cascade="all, delete-orphan"
    )
    validations_submitted: Mapped[list["ValidationRecord"]] = relationship(
        "ValidationRecord",
        foreign_keys="ValidationRecord.submitted_by",
        back_populates="submitted_by_user",
    )
    validations_reviewed: Mapped[list["ValidationRecord"]] = relationship(
        "ValidationRecord",
        foreign_keys="ValidationRecord.reviewed_by",
        back_populates="reviewed_by_user",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog", back_populates="actor"
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    used_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="password_reset_tokens")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    actor_email: Mapped[str] = mapped_column(String(255))
    actor_name: Mapped[str] = mapped_column(String(255))
    actor_role: Mapped[str] = mapped_column(String(50))
    action: Mapped[str] = mapped_column(String(120), index=True)
    entity_type: Mapped[str] = mapped_column(String(100), index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    entity_title: Mapped[str] = mapped_column(String(500), nullable=True)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    actor: Mapped["User"] = relationship("User", back_populates="audit_logs")


class ResearchAxis(Base):
    __tablename__ = "research_axes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    lead_member_name: Mapped[str] = mapped_column(String(255), nullable=True)

    profiles: Mapped[list["MemberProfile"]] = relationship(
        "MemberProfile", back_populates="research_axis"
    )
    publications: Mapped[list["Publication"]] = relationship(
        "Publication", back_populates="axis"
    )
    communications: Mapped[list["Communication"]] = relationship(
        "Communication", back_populates="axis"
    )
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="axis")
    events: Mapped[list["LabEvent"]] = relationship("LabEvent", back_populates="axis")


class MemberProfile(Base):
    __tablename__ = "member_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    grade: Mapped[str] = mapped_column(String(150), nullable=True)
    specialty: Mapped[str] = mapped_column(String(255), nullable=True)
    team: Mapped[str] = mapped_column(String(255), nullable=True)
    biography: Mapped[str] = mapped_column(Text, nullable=True)
    interests: Mapped[str] = mapped_column(Text, nullable=True)
    external_links: Mapped[str] = mapped_column(Text, nullable=True)
    orcid_id: Mapped[str] = mapped_column(String(32), nullable=True, index=True)
    laboratory: Mapped[str] = mapped_column(String(128), default="LIAS")
    research_axis_id: Mapped[int] = mapped_column(
        ForeignKey("research_axes.id"), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")
    research_axis: Mapped["ResearchAxis"] = relationship(
        "ResearchAxis", back_populates="profiles"
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    summary: Mapped[str] = mapped_column(Text)
    lead_member_name: Mapped[str] = mapped_column(String(255), nullable=True)
    partners: Mapped[str] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    funding: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(80), default="active")
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        SAEnum(ValidationStatus), default=ValidationStatus.PENDING
    )
    axis_id: Mapped[int] = mapped_column(
        ForeignKey("research_axes.id"), nullable=True
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    axis: Mapped["ResearchAxis"] = relationship("ResearchAxis", back_populates="projects")
    owner: Mapped["User"] = relationship("User", back_populates="projects")
    publications: Mapped[list["Publication"]] = relationship(
        "Publication", back_populates="project"
    )


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    authors: Mapped[str] = mapped_column(Text)
    publication_type: Mapped[str] = mapped_column(String(120))
    year: Mapped[int] = mapped_column(Integer, index=True)
    venue: Mapped[str] = mapped_column(String(255), nullable=True)
    abstract: Mapped[str] = mapped_column(Text, nullable=True)
    keywords: Mapped[str] = mapped_column(Text, nullable=True)
    doi: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    external_link: Mapped[str] = mapped_column(String(500), nullable=True)
    pdf_url: Mapped[str] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="manual")
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        SAEnum(ValidationStatus), default=ValidationStatus.PENDING, index=True
    )
    axis_id: Mapped[int] = mapped_column(
        ForeignKey("research_axes.id"), nullable=True
    )
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"), nullable=True
    )
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    axis: Mapped["ResearchAxis"] = relationship(
        "ResearchAxis", back_populates="publications"
    )
    project: Mapped["Project"] = relationship("Project", back_populates="publications")
    owner: Mapped["User"] = relationship("User", back_populates="publications")
    change_requests: Mapped[list["PublicationChangeRequest"]] = relationship(
        "PublicationChangeRequest", back_populates="publication", cascade="all, delete-orphan"
    )


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    authors: Mapped[str] = mapped_column(Text)
    event_name: Mapped[str] = mapped_column(String(255))
    communication_type: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    country: Mapped[str] = mapped_column(String(120), nullable=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=True)
    abstract: Mapped[str] = mapped_column(Text, nullable=True)
    presentation_status: Mapped[CommunicationPresentationStatus] = mapped_column(
        SAEnum(CommunicationPresentationStatus),
        default=CommunicationPresentationStatus.SUBMITTED,
    )
    validation_status: Mapped[ValidationStatus] = mapped_column(
        SAEnum(ValidationStatus), default=ValidationStatus.PENDING, index=True
    )
    document_url: Mapped[str] = mapped_column(String(500), nullable=True)
    axis_id: Mapped[int] = mapped_column(
        ForeignKey("research_axes.id"), nullable=True
    )
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    axis: Mapped["ResearchAxis"] = relationship(
        "ResearchAxis", back_populates="communications"
    )
    owner: Mapped["User"] = relationship("User", back_populates="communications")


class LabEvent(Base):
    __tablename__ = "lab_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    location: Mapped[str] = mapped_column(String(255))
    program: Mapped[str] = mapped_column(Text, nullable=True)
    speakers: Mapped[str] = mapped_column(Text, nullable=True)
    visual_url: Mapped[str] = mapped_column(String(500), nullable=True)
    lifecycle_status: Mapped[EventLifecycleStatus] = mapped_column(
        SAEnum(EventLifecycleStatus), default=EventLifecycleStatus.UPCOMING
    )
    registration_link: Mapped[str] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        SAEnum(ValidationStatus), default=ValidationStatus.PENDING
    )
    axis_id: Mapped[int] = mapped_column(
        ForeignKey("research_axes.id"), nullable=True
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    axis: Mapped["ResearchAxis"] = relationship("ResearchAxis", back_populates="events")
    owner: Mapped["User"] = relationship("User", back_populates="events")


class NewsItem(Base):
    __tablename__ = "news_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(120), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    validation_status: Mapped[ValidationStatus] = mapped_column(
        SAEnum(ValidationStatus), default=ValidationStatus.PENDING, index=True
    )
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    author: Mapped["User"] = relationship("User", back_populates="news_items")


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    caption: Mapped[str] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(1000))
    category: Mapped[str] = mapped_column(String(120), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    author: Mapped["User"] = relationship("User", back_populates="gallery_items")


class ValidationRecord(Base):
    __tablename__ = "validation_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content_type: Mapped[str] = mapped_column(String(100), index=True)
    content_id: Mapped[int] = mapped_column(Integer, index=True)
    decision: Mapped[ValidationStatus] = mapped_column(
        SAEnum(ValidationStatus), default=ValidationStatus.PENDING
    )
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    submitted_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reviewed_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    submitted_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[submitted_by],
        back_populates="validations_submitted",
    )
    reviewed_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[reviewed_by],
        back_populates="validations_reviewed",
    )


class PublicationChangeRequest(Base):
    __tablename__ = "publication_change_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    publication_id: Mapped[int] = mapped_column(ForeignKey("publications.id"), index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    request_type: Mapped[ChangeRequestType] = mapped_column(
        SAEnum(ChangeRequestType, values_callable=enum_values)
    )
    new_data: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[ChangeRequestStatus] = mapped_column(
        SAEnum(ChangeRequestStatus, values_callable=enum_values),
        default=ChangeRequestStatus.PENDING,
        index=True,
    )
    admin_comment: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    publication: Mapped["Publication"] = relationship("Publication", back_populates="change_requests")
    owner: Mapped["User"] = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80), default="info")
    content_type: Mapped[str] = mapped_column(String(100), nullable=True)
    content_id: Mapped[int] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
