# Configuration PostgreSQL - LIAS

Ce projet est compatible PostgreSQL via SQLAlchemy, psycopg2 et Alembic.

## Etat local verifie

- Service PostgreSQL detecte: `postgresql-x64-17`
- Port local: `5432`
- Base de donnees preparee: `lias_db`
- Utilisateur applicatif prepare: `lias_user`
- URL applicative:

```env
LIAS_DATABASE_URL=postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db
```

## Installation des dependances

Depuis `backend`:

```powershell
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Creation manuelle de la base

Si la base n'existe pas encore, se connecter en administrateur PostgreSQL puis creer:

```sql
CREATE USER lias_user WITH PASSWORD 'lias_password';
CREATE DATABASE lias_db OWNER lias_user;
GRANT ALL PRIVILEGES ON DATABASE lias_db TO lias_user;
GRANT ALL ON SCHEMA public TO lias_user;
ALTER SCHEMA public OWNER TO lias_user;
```

## Activer PostgreSQL

Dans `backend/.env`, utiliser:

```env
LIAS_DATABASE_URL=postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db
```

Pour revenir temporairement a SQLite:

```env
LIAS_DATABASE_URL=sqlite:///./lias.db
```

## Appliquer les migrations

Depuis `backend`:

```powershell
$env:LIAS_DATABASE_URL="postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db"
..\.venv\Scripts\alembic.exe upgrade head
```

## Initialiser les donnees LIAS

Le backend appelle `seed_database()` au demarrage. Le seed ajoute les donnees publiques de base et synchronise les vrais membres LIAS actifs.

Pour lancer manuellement:

```powershell
$env:LIAS_DATABASE_URL="postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db"
..\.venv\Scripts\python.exe -c "from app.core.database import SessionLocal; from app.seed import seed_database; db=SessionLocal(); seed_database(db); db.close()"
```

Pour importer les publications ORCID publiques des membres LIAS:

```powershell
$env:LIAS_DATABASE_URL="postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db"
..\.venv\Scripts\python.exe -m app.real_lias_members
```

## Lancer le backend avec PostgreSQL

```powershell
$env:LIAS_DATABASE_URL="postgresql://lias_user:lias_password@127.0.0.1:5432/lias_db"
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verification:

- Health: `http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/docs`
