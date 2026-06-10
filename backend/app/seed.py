import os
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .core.security import get_password_hash
from .real_lias_members import sync_real_lias_members


DEFAULT_PASSWORD = os.getenv("LIAS_SEED_PASSWORD", "lias2024demo")


def seed_public_news(db: Session, admin_id: int) -> None:
    news_items = [
        {
            "title": "Lancement de la nouvelle plateforme scientifique LIAS",
            "content": "La plateforme institutionnelle et scientifique du LIAS est opérationnelle.",
            "category": "Annonce",
        },
        {
            "title": "ICISCT 2026 : appel à communication",
            "content": (
                "Le LIAS annonce l'International Conference on Innovative Smart City "
                "Technologies, dédiée aux technologies pour les villes intelligentes, "
                "à l'IA, l'IoT, la cybersécurité et la transformation numérique."
            ),
            "category": "Appel à communication",
        },
        {
            "title": "ICAIS 2025 : intelligence artificielle et systèmes",
            "content": (
                "Le laboratoire organise l'International Conference on Artificial "
                "Intelligence and Systems, un rendez-vous scientifique consacré aux "
                "avancées de l'intelligence artificielle et des systèmes intelligents."
            ),
            "category": "Conférence",
        },
        {
            "title": "Bilan scientifique 2021-2024",
            "content": (
                "Le LIAS consolide un bilan de plus de 230 publications indexées, "
                "28 thèses soutenues, 42 thèses en cours et 8 projets de recherche."
            ),
            "category": "Recherche",
        },
    ]

    existing_titles = set(
        db.scalars(
            select(models.NewsItem.title).where(
                models.NewsItem.title.in_([item["title"] for item in news_items])
            )
        ).all()
    )
    for item in news_items:
        if item["title"] in existing_titles:
            continue
        db.add(
            models.NewsItem(
                **item,
                is_published=True,
                published_at=datetime.utcnow(),
                validation_status=models.ValidationStatus.VALIDATED,
                author_id=admin_id,
            )
        )


def seed_database(db: Session) -> None:
    has_users = db.scalar(select(models.User.id).limit(1))
    if has_users:
        admin_id = db.scalar(
            select(models.User.id).where(models.User.role == models.UserRole.ADMIN).limit(1)
        )
        if admin_id:
            seed_public_news(db, admin_id)
        sync_real_lias_members(db, commit=False)
        db.commit()
        return

    axis_data = [
        models.ResearchAxis(
            title="Données et Modèles",
            description="Ingénierie des données, IA, ontologies et modèles intelligents.",
            lead_member_name="Dr. Elena Rostova",
        ),
        models.ResearchAxis(
            title="Automatique et Systèmes",
            description="Contrôle, modélisation et diagnostic des systèmes dynamiques.",
            lead_member_name="Pr. Thomas Dubois",
        ),
        models.ResearchAxis(
            title="Ingénierie des Systèmes",
            description="Systèmes embarqués, cybersécurité et architectures distribuées.",
            lead_member_name="Dr. Sophie Martin",
        ),
    ]
    db.add_all(axis_data)
    db.flush()

    admin = models.User(
        email="admin@lias.fsb.ac.ma",
        full_name="Dr. Admin LIAS",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.ADMIN,
    )
    member = models.User(
        email="chercheur@lias.fsb.ac.ma",
        full_name="Dr. Chercheur LIAS",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
        orcid_sub="0000-0002-1825-0097",
        orcid_name_locked=True,
    )
    member2 = models.User(
        email="doctorant@lias.fsb.ac.ma",
        full_name="Amina El Idrissi",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
    )
    member3 = models.User(
        email="samir.benali@lias.fsb.ac.ma",
        full_name="Samir Benali",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
        orcid_sub="0000-0001-5109-3700",
        orcid_name_locked=True,
    )
    member4 = models.User(
        email="leila.tazi@lias.fsb.ac.ma",
        full_name="Leila Tazi",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
        orcid_sub="0000-0002-1694-233X",
        orcid_name_locked=True,
    )
    member5 = models.User(
        email="yassine.ouahbi@lias.fsb.ac.ma",
        full_name="Yassine Ouahbi",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
    )
    member6 = models.User(
        email="sara.naciri@lias.fsb.ac.ma",
        full_name="Sara Naciri",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
    )
    member7 = models.User(
        email="nabil.akrout@lias.fsb.ac.ma",
        full_name="Nabil Akrout",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
    )
    member8 = models.User(
        email="houda.elbazi@lias.fsb.ac.ma",
        full_name="Houda El Bazi",
        hashed_password=get_password_hash(DEFAULT_PASSWORD),
        role=models.UserRole.MEMBER,
    )
    db.add_all(
        [
            admin,
            member,
            member2,
            member3,
            member4,
            member5,
            member6,
            member7,
            member8,
        ]
    )
    db.flush()

    profiles = [
        models.MemberProfile(
            user_id=admin.id,
            grade="Responsable Scientifique",
            specialty="Pilotage des activités de recherche",
            team="Direction",
            biography="Responsable de la coordination scientifique du laboratoire.",
            interests="Gouvernance scientifique, valorisation, qualité",
            laboratory="LIAS",
            research_axis_id=axis_data[1].id,
        ),
        models.MemberProfile(
            user_id=member.id,
            grade="Enseignant-Chercheur",
            specialty="Apprentissage automatique",
            team="Equipe IA",
            biography="Travaille sur l'IA appliquée aux systèmes industriels.",
            interests="Deep learning, séries temporelles, IoT",
            laboratory="LIAS",
            research_axis_id=axis_data[0].id,
            orcid_id="0000-0002-1825-0097",
        ),
        models.MemberProfile(
            user_id=member2.id,
            grade="Doctorante",
            specialty="Cybersécurité embarquée",
            team="Equipe systèmes",
            biography="Thèse sur la sécurité des dispositifs contraints.",
            interests="PUF, IoT sécurisé, hardware trust",
            laboratory="LIAS",
            research_axis_id=axis_data[2].id,
        ),
        models.MemberProfile(
            user_id=member3.id,
            grade="Maître de conférences",
            specialty="Systèmes multi-agents",
            team="Equipe IA",
            biography="Conçoit des architectures intelligentes pour l'aide à la décision.",
            interests="agents, optimisation, IA explicable",
            laboratory="LIAS",
            research_axis_id=axis_data[0].id,
            orcid_id="0000-0001-5109-3700",
        ),
        models.MemberProfile(
            user_id=member4.id,
            grade="Enseignante-Chercheure",
            specialty="Contrôle avancé",
            team="Equipe Automatique",
            biography="Travaille sur les stratégies robustes pour les systèmes non linéaires.",
            interests="commande robuste, diagnostic, systèmes dynamiques",
            laboratory="LIAS",
            research_axis_id=axis_data[1].id,
            orcid_id="0000-0002-1694-233X",
        ),
        models.MemberProfile(
            user_id=member5.id,
            grade="Doctorant",
            specialty="Systèmes embarqués temps réel",
            team="Equipe systèmes",
            biography="Développe des plateformes embarquées sécurisées pour applications critiques.",
            interests="rtos, edge computing, fiabilité",
            laboratory="LIAS",
            research_axis_id=axis_data[2].id,
        ),
        models.MemberProfile(
            user_id=member6.id,
            grade="Ingénieure de recherche",
            specialty="Ingénierie des données",
            team="Plateforme data",
            biography="Responsable des pipelines de données et de la qualité expérimentale.",
            interests="etl, data governance, visualisation",
            laboratory="LIAS",
            research_axis_id=axis_data[0].id,
        ),
        models.MemberProfile(
            user_id=member7.id,
            grade="Post-doctorant",
            specialty="Systèmes énergétiques intelligents",
            team="Equipe Automatique",
            biography="Contribue à l'optimisation énergétique pilotée par modèles.",
            interests="smart grid, jumeaux numériques, optimisation",
            laboratory="LIAS",
            research_axis_id=axis_data[1].id,
        ),
        models.MemberProfile(
            user_id=member8.id,
            grade="Doctorante",
            specialty="Sécurité matérielle",
            team="Equipe systèmes",
            biography="Étudie la résilience matérielle face aux attaques physiques.",
            interests="hardware trust, attaques fautes, puf",
            laboratory="LIAS",
            research_axis_id=axis_data[2].id,
        ),
    ]
    db.add_all(profiles)

    project = models.Project(
        title="ANR DeepSensor",
        summary="Projet sur l'optimisation énergétique et l'IA pour capteurs intelligents.",
        lead_member_name="Dr. Chercheur LIAS",
        partners="Université Hassan II; Partenaire Industriel X",
        start_date=date(2024, 1, 1),
        end_date=date(2026, 12, 31),
        funding="ANR",
        status="active",
        validation_status=models.ValidationStatus.VALIDATED,
        axis_id=axis_data[0].id,
        created_by=member.id,
    )
    db.add(project)
    db.flush()

    publications = [
        models.Publication(
            title="Deep Learning Approaches for Time Series Forecasting in Industrial IoT",
            authors="Dr. Chercheur LIAS, Amina El Idrissi",
            publication_type="Journal Article",
            year=2024,
            venue="IEEE Transactions on Industrial Informatics",
            abstract="Proposition d'une architecture de deep learning pour la prévision multivariée.",
            keywords="deep learning, iot, forecasting",
            doi="10.1109/TII.2024.1234567",
            external_link="https://doi.org/10.1109/TII.2024.1234567",
            source="manual",
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[0].id,
            project_id=project.id,
            owner_id=member.id,
        ),
        models.Publication(
            title="Hardware Security Primitives for Resource-Constrained Devices",
            authors="Amina El Idrissi",
            publication_type="Conference Paper",
            year=2025,
            venue="Embedded Security Conference",
            abstract="Etude des primitives de sécurité matérielle pour IoT.",
            keywords="hardware security, puf",
            source="manual",
            validation_status=models.ValidationStatus.PENDING,
            axis_id=axis_data[2].id,
            owner_id=member2.id,
        ),
    ]
    db.add_all(publications)

    communications = [
        models.Communication(
            title="Ontology-driven Data Integration for Smart Campuses",
            authors="Dr. Chercheur LIAS",
            event_name="Conférence Nationale IA",
            communication_type="Communication nationale",
            location="Casablanca",
            country="Maroc",
            event_date=date(2025, 3, 14),
            abstract="Intégration sémantique des données hétérogènes.",
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[0].id,
            owner_id=member.id,
        ),
        models.Communication(
            title="Secure Embedded Design Patterns",
            authors="Amina El Idrissi",
            event_name="IoT Security Workshop",
            communication_type="Poster",
            location="Rabat",
            country="Maroc",
            event_date=date(2025, 11, 3),
            abstract="Patterns de conception pour embarqué sécurisé.",
            presentation_status=models.CommunicationPresentationStatus.ACCEPTED,
            validation_status=models.ValidationStatus.PENDING,
            axis_id=axis_data[2].id,
            owner_id=member2.id,
        ),
    ]
    db.add_all(communications)

    events = [
        models.LabEvent(
            title="Journée Scientifique LIAS 2026",
            description="Rencontre annuelle des équipes et partenaires.",
            event_type="Journée scientifique",
            start_date=date(2026, 6, 12),
            end_date=date(2026, 6, 12),
            location="FS Ben M'Sik",
            program="Sessions plénières, posters, table ronde",
            speakers="Intervenants LIAS et invités",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[1].id,
            created_by=admin.id,
        ),
        models.LabEvent(
            title="Workshop Embedded Trust",
            description="Workshop spécialisé en sécurité embarquée.",
            event_type="Workshop",
            start_date=date(2025, 10, 4),
            end_date=date(2025, 10, 5),
            location="Casablanca",
            lifecycle_status=models.EventLifecycleStatus.PAST,
            validation_status=models.ValidationStatus.PENDING,
            axis_id=axis_data[2].id,
            created_by=member2.id,
        ),
        models.LabEvent(
            title="Séminaire IA Générative et Santé",
            description="Session thématique sur les usages responsables de l'IA générative en santé.",
            event_type="Séminaire",
            start_date=date(2026, 5, 21),
            end_date=date(2026, 5, 21),
            location="Amphi A - FS Ben M'Sik",
            program="Talks, démonstrations, panel éthique",
            speakers="Pr. Leila Tazi, invités CHU Casablanca",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[0].id,
            registration_link="https://lias.fsb.ac.ma/events/ia-sante",
            created_by=admin.id,
        ),
        models.LabEvent(
            title="Colloque International Systèmes Intelligents 2026",
            description="Événement international sur les systèmes intelligents, contrôle et données.",
            event_type="Colloque",
            start_date=date(2026, 9, 24),
            end_date=date(2026, 9, 26),
            location="Casablanca",
            program="Keynotes, sessions parallèles, posters doctorants",
            speakers="Conférenciers internationaux et équipes LIAS",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[1].id,
            registration_link="https://lias.fsb.ac.ma/events/cisi-2026",
            created_by=admin.id,
        ),
        models.LabEvent(
            title="Journée Doctorants LIAS",
            description="Journée interne de suivi des travaux doctoraux et mentorat scientifique.",
            event_type="Journée scientifique",
            start_date=date(2026, 4, 30),
            end_date=date(2026, 4, 30),
            location="Salle des conférences LIAS",
            program="Pitchs thèse, retours méthodologiques, networking",
            speakers="Encadrants et doctorants LIAS",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[2].id,
            created_by=admin.id,
        ),
        models.LabEvent(
            title="Conférence Cybersécurité Embarquée 2025",
            description="Retour d'expérience sur la sécurité des systèmes IoT contraints.",
            event_type="Conférence",
            start_date=date(2025, 5, 16),
            end_date=date(2025, 5, 16),
            location="Rabat",
            program="Sessions techniques et cas industriels",
            speakers="Dr. Amina El Idrissi, experts industriels",
            lifecycle_status=models.EventLifecycleStatus.PAST,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[2].id,
            created_by=admin.id,
        ),
        models.LabEvent(
            title="Hackathon Data for Energy",
            description="Compétition de prototypage autour des données et de l'efficacité énergétique.",
            event_type="Workshop",
            start_date=date(2026, 7, 10),
            end_date=date(2026, 7, 11),
            location="Innovation Lab Casablanca",
            program="Challenge 24h, coaching, pitch final",
            speakers="Mentors LIAS et partenaires industriels",
            lifecycle_status=models.EventLifecycleStatus.UPCOMING,
            validation_status=models.ValidationStatus.VALIDATED,
            axis_id=axis_data[0].id,
            created_by=admin.id,
        ),
    ]
    db.add_all(events)

    seed_public_news(db, admin.id)

    # Flush to assign IDs before referencing seeded entities in validation records.
    db.flush()

    validations = [
        models.ValidationRecord(
            content_type="publication",
            content_id=publications[0].id,
            decision=models.ValidationStatus.VALIDATED,
            comment="Contenu conforme",
            submitted_by=member.id,
            reviewed_by=admin.id,
        ),
        models.ValidationRecord(
            content_type="publication",
            content_id=publications[1].id,
            decision=models.ValidationStatus.PENDING,
            submitted_by=member2.id,
            reviewed_by=None,
        ),
    ]
    db.add_all(validations)

    sync_real_lias_members(db, commit=False)

    db.commit()
