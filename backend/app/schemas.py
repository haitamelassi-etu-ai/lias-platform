from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field
from pydantic.config import ConfigDict

from .models import (
    CommunicationPresentationStatus,
    EventLifecycleStatus,
    UserRole,
    ValidationStatus,
)


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.MEMBER


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ResearchAxisBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=2)
    lead_member_name: str | None = Field(default=None, max_length=255)


class ResearchAxisCreate(ResearchAxisBase):
    pass


class ResearchAxisUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=2)
    lead_member_name: str | None = Field(default=None, max_length=255)


class ResearchAxisRead(ResearchAxisBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class MemberProfileUpdate(BaseModel):
    photo_url: str | None = Field(default=None, max_length=500)
    grade: str | None = Field(default=None, max_length=150)
    specialty: str | None = Field(default=None, max_length=255)
    team: str | None = Field(default=None, max_length=255)
    biography: str | None = None
    interests: str | None = None
    external_links: str | None = None
    orcid_id: str | None = Field(default=None, max_length=32)
    laboratory: str | None = Field(default=None, max_length=128)
    research_axis_id: int | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=255)


class MemberProfileRead(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    full_name: str
    role: UserRole
    photo_url: str | None
    grade: str | None
    specialty: str | None
    team: str | None
    biography: str | None
    interests: str | None
    external_links: str | None
    orcid_id: str | None
    laboratory: str
    research_axis_id: int | None
    research_axis_title: str | None
    updated_at: datetime


class PublicationBase(BaseModel):
    title: str = Field(min_length=2, max_length=500)
    authors: str = Field(min_length=2)
    publication_type: str = Field(min_length=2, max_length=120)
    year: int = Field(ge=1900, le=2100)
    venue: str | None = Field(default=None, max_length=255)
    abstract: str | None = None
    keywords: str | None = None
    doi: str | None = Field(default=None, max_length=255)
    external_link: str | None = Field(default=None, max_length=500)
    pdf_url: str | None = Field(default=None, max_length=500)
    axis_id: int | None = None
    project_id: int | None = None


class PublicationCreate(PublicationBase):
    pass


class PublicationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=500)
    authors: str | None = Field(default=None, min_length=2)
    publication_type: str | None = Field(default=None, min_length=2, max_length=120)
    year: int | None = Field(default=None, ge=1900, le=2100)
    venue: str | None = Field(default=None, max_length=255)
    abstract: str | None = None
    keywords: str | None = None
    doi: str | None = Field(default=None, max_length=255)
    external_link: str | None = Field(default=None, max_length=500)
    pdf_url: str | None = Field(default=None, max_length=500)
    axis_id: int | None = None
    project_id: int | None = None


class PublicationRead(PublicationBase):
    id: int
    source: str
    validation_status: ValidationStatus
    owner_id: int
    owner_name: str
    axis_title: str | None
    created_at: datetime
    updated_at: datetime


class CommunicationBase(BaseModel):
    title: str = Field(min_length=2, max_length=500)
    authors: str = Field(min_length=2)
    event_name: str = Field(min_length=2, max_length=255)
    communication_type: str = Field(min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=120)
    event_date: date | None = None
    abstract: str | None = None
    presentation_status: CommunicationPresentationStatus = (
        CommunicationPresentationStatus.SUBMITTED
    )
    document_url: str | None = Field(default=None, max_length=500)
    axis_id: int | None = None


class CommunicationCreate(CommunicationBase):
    pass


class CommunicationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=500)
    authors: str | None = Field(default=None, min_length=2)
    event_name: str | None = Field(default=None, min_length=2, max_length=255)
    communication_type: str | None = Field(default=None, min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=120)
    event_date: date | None = None
    abstract: str | None = None
    presentation_status: CommunicationPresentationStatus | None = None
    document_url: str | None = Field(default=None, max_length=500)
    axis_id: int | None = None


class CommunicationRead(CommunicationBase):
    id: int
    validation_status: ValidationStatus
    owner_id: int
    owner_name: str
    axis_title: str | None
    created_at: datetime


class ProjectBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    summary: str = Field(min_length=2)
    lead_member_name: str | None = Field(default=None, max_length=255)
    partners: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    funding: str | None = Field(default=None, max_length=255)
    status: str = Field(default="active", max_length=80)
    is_public: bool = True
    axis_id: int | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    summary: str | None = Field(default=None, min_length=2)
    lead_member_name: str | None = Field(default=None, max_length=255)
    partners: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    funding: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=80)
    is_public: bool | None = None
    axis_id: int | None = None


class ProjectRead(ProjectBase):
    id: int
    validation_status: ValidationStatus
    created_by: int
    owner_name: str
    axis_title: str | None
    created_at: datetime


class LabEventBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=2)
    event_type: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date | None = None
    location: str = Field(min_length=2, max_length=255)
    program: str | None = None
    speakers: str | None = None
    visual_url: str | None = Field(default=None, max_length=500)
    lifecycle_status: EventLifecycleStatus = EventLifecycleStatus.UPCOMING
    registration_link: str | None = Field(default=None, max_length=500)
    is_public: bool = True
    axis_id: int | None = None


class LabEventCreate(LabEventBase):
    pass


class LabEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=2)
    event_type: str | None = Field(default=None, min_length=2, max_length=100)
    start_date: date | None = None
    end_date: date | None = None
    location: str | None = Field(default=None, min_length=2, max_length=255)
    program: str | None = None
    speakers: str | None = None
    visual_url: str | None = Field(default=None, max_length=500)
    lifecycle_status: EventLifecycleStatus | None = None
    registration_link: str | None = Field(default=None, max_length=500)
    is_public: bool | None = None
    axis_id: int | None = None


class LabEventRead(LabEventBase):
    id: int
    validation_status: ValidationStatus
    created_by: int
    owner_name: str
    axis_title: str | None
    created_at: datetime


class NewsItemBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    content: str = Field(min_length=2)
    category: str | None = Field(default=None, max_length=120)
    image_url: str | None = Field(default=None, max_length=500)
    is_published: bool = False


class NewsItemCreate(NewsItemBase):
    pass


class NewsItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    content: str | None = Field(default=None, min_length=2)
    category: str | None = Field(default=None, max_length=120)
    image_url: str | None = Field(default=None, max_length=500)
    is_published: bool | None = None


class NewsItemRead(NewsItemBase):
    id: int
    validation_status: ValidationStatus
    author_id: int
    author_name: str
    published_at: datetime | None
    created_at: datetime


class ModerationDecisionRequest(BaseModel):
    decision: ValidationStatus
    comment: str | None = None


class ModerationQueueItem(BaseModel):
    content_type: str
    item_id: int
    title: str
    author_name: str
    created_at: datetime
    status: ValidationStatus


class DashboardStat(BaseModel):
    label: str
    value: int
    trend: str


class MemberChartPoint(BaseModel):
    year: str
    count: int


class AdminChartPoint(BaseModel):
    month: str
    validations: int
    submissions: int


class ActivityItem(BaseModel):
    id: int
    action: str
    title: str
    date: str
    status: str
    user: str | None = None


class MemberDashboardResponse(BaseModel):
    stats: list[DashboardStat]
    publication_trend: list[MemberChartPoint]
    recent_activities: list[ActivityItem]


class AdminDashboardResponse(BaseModel):
    stats: list[DashboardStat]
    submission_trend: list[AdminChartPoint]
    recent_activities: list[ActivityItem]


class OrcidLinkRequest(BaseModel):
    orcid_id: str = Field(min_length=15, max_length=32)


class OrcidWorkPreview(BaseModel):
    title: str
    publication_type: str
    year: int | None
    venue: str | None
    doi: str | None


class OrcidProfilePreview(BaseModel):
    orcid_id: str
    full_name: str | None
    biography: str | None
    works: list[OrcidWorkPreview]


class OrcidImportResponse(BaseModel):
    imported: int
    skipped: int
    message: str
