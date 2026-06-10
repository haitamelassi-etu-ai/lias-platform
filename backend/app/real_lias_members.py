import os
import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .core.security import get_password_hash
from .routers.orcid import _fetch_orcid_profile


DEFAULT_PASSWORD = os.getenv("LIAS_SEED_PASSWORD", "lias2024demo")
LIAS_PROFILE_URL = "https://lias.ma/#equipe"


REAL_LIAS_TEAMS = {
    "ISDIAC": {
        "description": "Equipe LIAS orientee IA, cloud, NLP, science des donnees et systemes decisionnels.",
        "lead_member_name": "Nawal Sael",
    },
    "SIMA": {
        "description": "Equipe LIAS orientee systemes intelligents et modelisation avancee.",
        "lead_member_name": "Mohammed Ait Daoud",
    },
    "SDTIC": {
        "description": "Equipe LIAS orientee technologies intelligentes, IoT et cybersecurite.",
        "lead_member_name": "Sara Ouahabi",
    },
    "ILIAS": {
        "description": "Equipe LIAS orientee ingenierie logicielle, architectures de donnees et informatique.",
        "lead_member_name": "Abdelaziz Ettaoufik",
    },
}


REAL_LIAS_MEMBERS = [
    {
        "full_name": "Faouzia Benabbou",
        "grade": "Pr. - Directrice du laboratoire",
        "team": "ISDIAC",
        "interests": "IA, Cloud, NLP",
        "orcid_id": "0000-0003-4967-1051",
    },
    {
        "full_name": "Abdessamad Belangour",
        "grade": "Pr. - Directeur adjoint",
        "team": "ILIAS",
        "interests": "Ingenierie logicielle, architectures de donnees",
        "orcid_id": "0000-0002-9580-8760",
    },
    {
        "full_name": "Nawal Sael",
        "grade": "Pr. - Cheffe d'equipe ISDIAC",
        "team": "ISDIAC",
        "interests": "Sciences de donnee",
        "orcid_id": "0000-0002-8134-3886",
    },
    {
        "full_name": "Mohammed AIT DAOUD",
        "grade": "Pr. - Chef d'equipe SIMA",
        "team": "SIMA",
        "interests": "Systemes intelligents et modelisation avancee",
        "orcid_id": "0000-0002-8627-4429",
    },
    {
        "full_name": "Sara Ouahabi",
        "grade": "Pr. - Cheffe d'equipe SDTIC",
        "team": "SDTIC",
        "interests": "Technologie intelligente",
        "orcid_id": "0000-0001-6478-7218",
    },
    {
        "full_name": "Abdelaziz Ettaoufik",
        "grade": "Pr. - Chef d'equipe ILIAS",
        "team": "ILIAS",
        "interests": "Cloud computing, big data, IoT, blockchain, IA",
        "orcid_id": "0000-0002-3079-082X",
    },
    {
        "full_name": "Amal Zaouch",
        "grade": "Membre",
        "team": "ISDIAC",
        "interests": "Cloud Computing",
        "orcid_id": "0009-0005-6214-1209",
    },
    {
        "full_name": "Fouzia Elazzaby",
        "grade": "Membre",
        "team": "ISDIAC",
        "interests": "Traitement de signal et d'images",
        "orcid_id": "0000-0003-3262-446X",
    },
    {
        "full_name": "Khadija Achtaich",
        "grade": "Membre",
        "team": "SIMA",
        "interests": "Technologies Cognitives",
        "orcid_id": "0000-0001-7883-7714",
    },
    {
        "full_name": "Mostafa Hanoune",
        "grade": "Membre",
        "team": "SIMA",
        "interests": "Systemes Intelligents",
        "orcid_id": "0000-0001-5047-187X",
    },
    {
        "full_name": "Nabil AHARRANE",
        "grade": "Membre",
        "team": "SIMA",
        "interests": "Intelligence Artificielle",
        "orcid_id": "0000-0002-0676-4365",
    },
    {
        "full_name": "Sanaa El filali",
        "grade": "Membre",
        "team": "SDTIC",
        "interests": "Technologie intelligente",
        "orcid_id": "0000-0002-4076-9581",
    },
    {
        "full_name": "Rachida AIT ABDELOUAHID",
        "grade": "Membre",
        "team": "SDTIC",
        "interests": "Architecture IOT",
        "orcid_id": "0000-0002-9582-7988",
    },
    {
        "full_name": "Naceur Achtaich",
        "grade": "Membre",
        "team": "SDTIC",
        "interests": "Mathematiques Appliques",
        "orcid_id": "0000-0001-8640-8338",
    },
    {
        "full_name": "Youssef Sekhara",
        "grade": "Membre",
        "team": "ILIAS",
        "interests": "Informatique",
        "orcid_id": "0000-0002-4425-2854",
    },
    {
        "full_name": "Driss Bouggar",
        "grade": "Membre",
        "team": "ILIAS",
        "interests": "Modelisation Mathematique",
        "orcid_id": "0000-0002-7908-2437",
    },
]


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", ".", ascii_value.lower()).strip(".")
    return slug or "membre"


def _technical_email(full_name: str) -> str:
    return f"{_slugify(full_name)}@annuaire.lias.ma"


def sync_real_lias_members(db: Session, *, commit: bool = True) -> None:
    team_axes: dict[str, models.ResearchAxis] = {}
    for title, payload in REAL_LIAS_TEAMS.items():
        axis = db.scalar(select(models.ResearchAxis).where(models.ResearchAxis.title == title))
        if axis is None:
            axis = models.ResearchAxis(title=title, **payload)
            db.add(axis)
            db.flush()
        else:
            axis.description = payload["description"]
            axis.lead_member_name = payload["lead_member_name"]
        team_axes[title] = axis

    target_emails = {_technical_email(member["full_name"]) for member in REAL_LIAS_MEMBERS}

    old_profiles = db.scalars(
        select(models.MemberProfile)
        .join(models.MemberProfile.user)
        .where(
            models.User.role == models.UserRole.MEMBER,
            models.User.email.notin_(target_emails),
        )
    ).all()
    for profile in old_profiles:
        db.delete(profile)

    old_users = db.scalars(
        select(models.User).where(
            models.User.role == models.UserRole.MEMBER,
            models.User.email.notin_(target_emails),
        )
    ).all()
    for user in old_users:
        user.is_active = False
        user.orcid_sub = None
        user.orcid_name_locked = False

    db.flush()

    for member in REAL_LIAS_MEMBERS:
        email = _technical_email(member["full_name"])
        user = db.scalar(select(models.User).where(models.User.email == email))
        if user is None:
            user = models.User(
                email=email,
                full_name=member["full_name"],
                hashed_password=get_password_hash(DEFAULT_PASSWORD),
                role=models.UserRole.MEMBER,
            )
            db.add(user)
            db.flush()

        user.full_name = member["full_name"]
        user.role = models.UserRole.MEMBER
        user.is_active = True
        user.orcid_sub = member.get("orcid_id")
        user.orcid_name_locked = bool(member.get("orcid_id"))

        profile = db.scalar(
            select(models.MemberProfile).where(models.MemberProfile.user_id == user.id)
        )
        if profile is None:
            profile = models.MemberProfile(user_id=user.id, laboratory="LIAS")
            db.add(profile)

        team = member["team"]
        profile.grade = member["grade"]
        profile.specialty = member["interests"]
        profile.team = team
        profile.biography = (
            f"Membre du Laboratoire d'Intelligence Artificielle et Systemes (LIAS), "
            f"equipe {team}."
        )
        profile.interests = member["interests"]
        profile.external_links = LIAS_PROFILE_URL
        profile.orcid_id = member.get("orcid_id")
        profile.laboratory = "LIAS"
        profile.research_axis_id = team_axes[team].id

    if commit:
        db.commit()


def sync_real_lias_publications(
    db: Session,
    *,
    max_per_member: int = 8,
    commit: bool = True,
) -> tuple[int, int]:
    imported = 0
    skipped = 0

    users = db.scalars(
        select(models.User)
        .join(models.User.profile)
        .where(
            models.User.role == models.UserRole.MEMBER,
            models.User.is_active.is_(True),
            models.MemberProfile.orcid_id.is_not(None),
        )
    ).all()

    for user in users:
        profile = user.profile
        if profile is None or not profile.orcid_id:
            skipped += 1
            continue

        try:
            orcid_profile = _fetch_orcid_profile(profile.orcid_id)
        except Exception:
            skipped += 1
            continue

        for work in orcid_profile.works[:max_per_member]:
            year = work.year or 2026
            normalized_doi = (work.doi or "").strip().lower()
            normalized_title = work.title.strip().lower()

            existing = None
            if normalized_doi:
                existing = db.scalar(
                    select(models.Publication).where(
                        models.Publication.doi.ilike(normalized_doi)
                    )
                )
            if existing is None:
                existing = db.scalar(
                    select(models.Publication).where(
                        models.Publication.title.ilike(normalized_title),
                        models.Publication.year == year,
                    )
                )

            if existing is not None:
                if user.full_name.lower() not in (existing.authors or "").lower():
                    existing.authors = f"{existing.authors}; {user.full_name}"
                skipped += 1
                continue

            db.add(
                models.Publication(
                    title=work.title,
                    authors=user.full_name,
                    publication_type=work.publication_type,
                    year=year,
                    venue=work.venue,
                    doi=work.doi,
                    external_link=f"https://doi.org/{work.doi}" if work.doi else None,
                    source="orcid",
                    is_archived=False,
                    validation_status=models.ValidationStatus.VALIDATED,
                    axis_id=profile.research_axis_id,
                    owner_id=user.id,
                )
            )
            imported += 1

    if commit:
        db.commit()

    return imported, skipped


if __name__ == "__main__":
    from .core.database import SessionLocal

    with SessionLocal() as session:
        sync_real_lias_members(session)
        imported_count, skipped_count = sync_real_lias_publications(session)
        print(f"{len(REAL_LIAS_MEMBERS)} membres LIAS synchronises.")
        print(f"{imported_count} publications ORCID importees, {skipped_count} ignorees.")
