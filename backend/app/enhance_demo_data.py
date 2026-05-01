from __future__ import annotations

from datetime import date

from sqlalchemy import func
from sqlalchemy import select

from . import models
from .core.database import SessionLocal
from .core.security import get_password_hash

DEFAULT_PASSWORD = "password123"


def _get_axis_id_by_title(db, title: str) -> int:
    axis = db.scalar(select(models.ResearchAxis).where(models.ResearchAxis.title == title))
    if axis is None:
        raise ValueError(f"Research axis not found: {title}")
    return axis.id


def _upsert_user(db, email: str, full_name: str, role: models.UserRole) -> models.User:
    user = db.scalar(select(models.User).where(models.User.email == email))
    if user is None:
        user = models.User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(DEFAULT_PASSWORD),
            role=role,
        )
        db.add(user)
        db.flush()
    return user


def _upsert_profile(
    db,
    user_id: int,
    *,
    grade: str,
    specialty: str,
    team: str,
    biography: str,
    interests: str,
    laboratory: str,
    research_axis_id: int,
    orcid_id: str | None = None,
) -> None:
    profile = db.scalar(select(models.MemberProfile).where(models.MemberProfile.user_id == user_id))
    if profile is None:
        profile = models.MemberProfile(user_id=user_id)
        db.add(profile)

    profile.grade = grade
    profile.specialty = specialty
    profile.team = team
    profile.biography = biography
    profile.interests = interests
    profile.laboratory = laboratory
    profile.research_axis_id = research_axis_id
    profile.orcid_id = orcid_id


def _upsert_event(
    db,
    *,
    title: str,
    description: str,
    event_type: str,
    start_date: date,
    end_date: date,
    location: str,
    program: str,
    speakers: str,
    lifecycle_status: models.EventLifecycleStatus,
    axis_id: int,
    created_by: int,
    registration_link: str | None = None,
) -> None:
    event = db.scalar(select(models.LabEvent).where(models.LabEvent.title == title))
    if event is None:
        event = models.LabEvent(
            title=title,
            description=description,
            event_type=event_type,
            start_date=start_date,
            end_date=end_date,
            location=location,
            program=program,
            speakers=speakers,
            lifecycle_status=lifecycle_status,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_id,
            created_by=created_by,
            registration_link=registration_link,
            is_public=True,
        )
        db.add(event)
        return

    event.description = description
    event.event_type = event_type
    event.start_date = start_date
    event.end_date = end_date
    event.location = location
    event.program = program
    event.speakers = speakers
    event.lifecycle_status = lifecycle_status
    event.validation_status = models.ValidationStatus.VALIDATED
    event.axis_id = axis_id
    event.created_by = created_by
    event.registration_link = registration_link
    event.is_public = True


def run() -> None:
    with SessionLocal() as db:
        axis_data_id = _get_axis_id_by_title(db, "Données et Modèles")
        axis_auto_id = _get_axis_id_by_title(db, "Automatique et Systèmes")
        axis_sys_id = _get_axis_id_by_title(db, "Ingénierie des Systèmes")

        admin = _upsert_user(
            db,
            email="admin@lias.fsb.ac.ma",
            full_name="Dr. Admin LIAS",
            role=models.UserRole.ADMIN,
        )

        demo_members = [
            {
                "email": "samir.benali@lias.fsb.ac.ma",
                "full_name": "Samir Benali",
                "grade": "Maître de conférences",
                "specialty": "Systèmes multi-agents",
                "team": "Equipe IA",
                "biography": "Conçoit des architectures intelligentes pour l'aide à la décision.",
                "interests": "agents, optimisation, IA explicable",
                "axis_id": axis_data_id,
                "orcid": "0000-0003-1122-3344",
            },
            {
                "email": "leila.tazi@lias.fsb.ac.ma",
                "full_name": "Leila Tazi",
                "grade": "Enseignante-Chercheure",
                "specialty": "Contrôle avancé",
                "team": "Equipe Automatique",
                "biography": "Travaille sur les stratégies robustes pour les systèmes non linéaires.",
                "interests": "commande robuste, diagnostic, systèmes dynamiques",
                "axis_id": axis_auto_id,
                "orcid": "0000-0002-4455-6677",
            },
            {
                "email": "yassine.ouahbi@lias.fsb.ac.ma",
                "full_name": "Yassine Ouahbi",
                "grade": "Doctorant",
                "specialty": "Systèmes embarqués temps réel",
                "team": "Equipe systèmes",
                "biography": "Développe des plateformes embarquées sécurisées pour applications critiques.",
                "interests": "rtos, edge computing, fiabilité",
                "axis_id": axis_sys_id,
                "orcid": None,
            },
            {
                "email": "sara.naciri@lias.fsb.ac.ma",
                "full_name": "Sara Naciri",
                "grade": "Ingénieure de recherche",
                "specialty": "Ingénierie des données",
                "team": "Plateforme data",
                "biography": "Responsable des pipelines de données et de la qualité expérimentale.",
                "interests": "etl, data governance, visualisation",
                "axis_id": axis_data_id,
                "orcid": None,
            },
            {
                "email": "nabil.akrout@lias.fsb.ac.ma",
                "full_name": "Nabil Akrout",
                "grade": "Post-doctorant",
                "specialty": "Systèmes énergétiques intelligents",
                "team": "Equipe Automatique",
                "biography": "Contribue à l'optimisation énergétique pilotée par modèles.",
                "interests": "smart grid, jumeaux numériques, optimisation",
                "axis_id": axis_auto_id,
                "orcid": None,
            },
            {
                "email": "houda.elbazi@lias.fsb.ac.ma",
                "full_name": "Houda El Bazi",
                "grade": "Doctorante",
                "specialty": "Sécurité matérielle",
                "team": "Equipe systèmes",
                "biography": "Étudie la résilience matérielle face aux attaques physiques.",
                "interests": "hardware trust, attaques fautes, puf",
                "axis_id": axis_sys_id,
                "orcid": None,
            },
        ]

        for member_data in demo_members:
            user = _upsert_user(
                db,
                email=member_data["email"],
                full_name=member_data["full_name"],
                role=models.UserRole.MEMBER,
            )
            _upsert_profile(
                db,
                user.id,
                grade=member_data["grade"],
                specialty=member_data["specialty"],
                team=member_data["team"],
                biography=member_data["biography"],
                interests=member_data["interests"],
                laboratory="LIAS",
                research_axis_id=member_data["axis_id"],
                orcid_id=member_data["orcid"],
            )

        _upsert_event(
            db,
            title="Séminaire IA Générative et Santé",
            description="Session thématique sur les usages responsables de l'IA générative en santé.",
            event_type="Séminaire",
            start_date=date(2026, 5, 21),
            end_date=date(2026, 5, 21),
            location="Amphi A - FS Ben M'Sik",
            program="Talks, démonstrations, panel éthique",
            speakers="Pr. Leila Tazi, invités CHU Casablanca",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            axis_id=axis_data_id,
            created_by=admin.id,
            registration_link="https://lias.fsb.ac.ma/events/ia-sante",
        )
        _upsert_event(
            db,
            title="Colloque International Systèmes Intelligents 2026",
            description="Événement international sur les systèmes intelligents, contrôle et données.",
            event_type="Colloque",
            start_date=date(2026, 9, 24),
            end_date=date(2026, 9, 26),
            location="Casablanca",
            program="Keynotes, sessions parallèles, posters doctorants",
            speakers="Conférenciers internationaux et équipes LIAS",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            axis_id=axis_auto_id,
            created_by=admin.id,
            registration_link="https://lias.fsb.ac.ma/events/cisi-2026",
        )
        _upsert_event(
            db,
            title="Journée Doctorants LIAS",
            description="Journée interne de suivi des travaux doctoraux et mentorat scientifique.",
            event_type="Journée scientifique",
            start_date=date(2026, 4, 30),
            end_date=date(2026, 4, 30),
            location="Salle des conférences LIAS",
            program="Pitchs thèse, retours méthodologiques, networking",
            speakers="Encadrants et doctorants LIAS",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            axis_id=axis_sys_id,
            created_by=admin.id,
        )
        _upsert_event(
            db,
            title="Conférence Cybersécurité Embarquée 2025",
            description="Retour d'expérience sur la sécurité des systèmes IoT contraints.",
            event_type="Conférence",
            start_date=date(2025, 5, 16),
            end_date=date(2025, 5, 16),
            location="Rabat",
            program="Sessions techniques et cas industriels",
            speakers="Dr. Amina El Idrissi, experts industriels",
            lifecycle_status=models.EventLifecycleStatus.PAST,
            axis_id=axis_sys_id,
            created_by=admin.id,
        )
        _upsert_event(
            db,
            title="Hackathon Data for Energy",
            description="Compétition de prototypage autour des données et de l'efficacité énergétique.",
            event_type="Workshop",
            start_date=date(2026, 7, 10),
            end_date=date(2026, 7, 11),
            location="Innovation Lab Casablanca",
            program="Challenge 24h, coaching, pitch final",
            speakers="Mentors LIAS et partenaires industriels",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            axis_id=axis_data_id,
            created_by=admin.id,
        )

        db.commit()

        member_count = db.scalar(
            select(func.count(models.User.id)).where(
                models.User.role == models.UserRole.MEMBER
            )
        )
        event_count = db.scalar(
            select(func.count(models.LabEvent.id)).where(
                models.LabEvent.validation_status == models.ValidationStatus.VALIDATED
            )
        )
        print(f"Demo enhancement applied. Members={member_count}, validated_events={event_count}")


if __name__ == "__main__":
    run()
