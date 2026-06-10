# Plateforme Scientifique LIAS

Plateforme web institutionnelle et scientifique du laboratoire LIAS — Faculté des Sciences Ben M'Sik, Université Hassan II de Casablanca.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Navigateur                           │
│            React 18 + TypeScript + Tailwind CSS             │
│         (Vite · Radix UI · React Router · Recharts)         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST  (JWT Bearer Token)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Backend                              │
│              FastAPI + SQLAlchemy + Pydantic                │
│         Authentification JWT · Contrôle d'accès RBAC        │
│              /api/v1/auth  /members  /publications          │
│              /communications  /projects  /events  /news     │
│              /moderation  /dashboard  /exports  /orcid      │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
  ┌───────────────┐           ┌──────────────────┐
  │  SQLite (DB)  │           │   API ORCID      │
  │   lias.db     │           │ (pub. externales)│
  └───────────────┘           └──────────────────┘
```

## Fonctionnalités

| Espace | Fonctionnalité |
|--------|---------------|
| **Public** | Accueil · Axes de recherche · Membres · Publications · Projets · Événements · Actualités |
| **Membre** | Profil scientifique · Soumission de publications/communications/projets · Import ORCID · Dashboard |
| **Administrateur** | File de modération · Validation/rejet/correction · Gestion des utilisateurs · Dashboard statistiques · Export CSV |

## Prérequis

- **Python** >= 3.11
- **Node.js** >= 18

## Installation et démarrage

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Copier le fichier d'environnement et l'adapter :

```bash
cp .env.example .env
```

Démarrer le serveur :

```bash
uvicorn app.main:app --reload --port 8000
```

- API : http://localhost:8000
- Documentation Swagger : http://localhost:8000/docs

### 2. Frontend

```bash
# Depuis la racine du projet
cp .env.example .env
npm install
npm run dev
```

- Application : http://localhost:5173

## Variables d'environnement

**Frontend** (`.env`) :

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Backend** (`backend/.env`) :

```env
LIAS_SECRET_KEY=change-this-secret-key-in-production
LIAS_ACCESS_TOKEN_EXPIRE_MINUTES=60
LIAS_DATABASE_URL=postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db
# SQLite local possible pour demo rapide :
# LIAS_DATABASE_URL=sqlite:///./lias.db
LIAS_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LIAS_SEED_PASSWORD=lias2024demo

# Guide PostgreSQL detaille : backend/POSTGRESQL_SETUP.md
```

> La clé `LIAS_SECRET_KEY` doit être changée avant tout déploiement en production.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@lias.fsb.ac.ma | lias2024demo |
| Chercheur | chercheur@lias.fsb.ac.ma | lias2024demo |
| Doctorante | doctorant@lias.fsb.ac.ma | lias2024demo |
| Membre | samir.benali@lias.fsb.ac.ma | lias2024demo |
| Membre | leila.tazi@lias.fsb.ac.ma | lias2024demo |

> Mot de passe configurable via la variable `LIAS_SEED_PASSWORD` dans `backend/.env`.

## Mise en production

Avant une utilisation officielle par l'administration, utiliser les fichiers de production :

- `backend/.env.production.example` pour configurer l'API FastAPI.
- `.env.production.example` pour configurer le frontend Vite.
- `DEPLOYMENT_CHECKLIST.md` pour la checklist de deploiement.

Points obligatoires :

- `LIAS_ENV=production`
- `LIAS_SECRET_KEY` fort et unique
- PostgreSQL obligatoire
- `LIAS_DOCS_ENABLED=false` pour fermer Swagger en production
- `LIAS_AUTO_CREATE_TABLES=false`
- `LIAS_AUTO_SEED=false`
- SMTP configure pour envoyer les emails de mot de passe oublie
- migrations Alembic executees avec `alembic upgrade head`

## Intégration ORCID

- Liaison du profil membre via identifiant ORCID
- Lecture des données publiques depuis l'API ORCID
- Import des travaux ORCID vers la base locale

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS v4 · Radix UI · React Router v7 |
| Backend | FastAPI · SQLAlchemy 2 · Pydantic · python-jose |
| Base de données | SQLite (MVP) |
| Sécurité | JWT · PBKDF2-SHA256 · RBAC (admin / member) |
| Intégrations | API publique ORCID · Export CSV |

## Notes

- La base de données SQLite est initialisée automatiquement au démarrage avec des données de démonstration.
- Les contenus soumis par les membres sont en statut `pending` jusqu'à validation par un administrateur.
