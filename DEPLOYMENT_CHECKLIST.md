# Checklist de mise en production LIAS

Cette checklist sert a preparer la plateforme LIAS avant une utilisation officielle par l'administration.

## 1. Environnement serveur

- Installer Python 3.11+.
- Installer Node.js 18+ uniquement si le build frontend est fait sur le serveur.
- Installer PostgreSQL.
- Creer une base `lias_db`.
- Creer un utilisateur PostgreSQL dedie avec un mot de passe fort.
- Activer HTTPS via le serveur web ou le proxy inverse.

## 2. Variables d'environnement

Backend :

- Copier `backend/.env.production.example` vers `backend/.env`.
- Mettre `LIAS_ENV=production`.
- Generer un vrai `LIAS_SECRET_KEY`.
- Mettre `LIAS_DOCS_ENABLED=false`.
- Mettre `LIAS_AUTO_CREATE_TABLES=false`.
- Mettre `LIAS_AUTO_SEED=false`.
- Configurer `LIAS_DATABASE_URL` avec les vrais acces PostgreSQL.
- Configurer `LIAS_CORS_ORIGINS` avec le domaine officiel.
- Configurer `LIAS_FRONTEND_URL` avec le domaine officiel.

Frontend :

- Copier `.env.production.example` vers `.env.production`.
- Configurer `VITE_API_BASE_URL` vers l'API officielle.

## 3. Base de donnees

- Executer les migrations Alembic :

```powershell
cd backend
alembic upgrade head
```

- Verifier dans pgAdmin :
  - `users`
  - `member_profiles`
  - `research_axes`
  - `publications`
  - `publication_change_requests`
  - `validation_records`

## 4. Donnees officielles

- Supprimer ou desactiver les comptes de demonstration.
- Creer les vrais comptes administrateurs.
- Verifier les membres LIAS actifs.
- Verifier les axes de recherche.
- Verifier les publications importees ou saisies.
- Verifier les projets, evenements, actualites et galerie.

## 5. Securite

- Changer tous les mots de passe initiaux.
- Ne pas publier le fichier `backend/.env`.
- Garder Swagger ferme en production avec `LIAS_DOCS_ENABLED=false`.
- Configurer SMTP pour la fonctionnalite "mot de passe oublie".
- Limiter l'acces PostgreSQL au serveur applicatif.
- Mettre en place une sauvegarde PostgreSQL quotidienne.
- Garder une copie separee des sauvegardes.

## 6. ORCID

- Creer une application ORCID officielle.
- Declarer l'URL de callback production.
- Renseigner `LIAS_ORCID_CLIENT_ID`.
- Renseigner `LIAS_ORCID_CLIENT_SECRET`.
- Tester la liaison ORCID avec un compte membre.
- Tester l'import de publications.

## 7. Tests d'acceptation

- Ouvrir la page d'accueil.
- Consulter les membres.
- Consulter les publications publiques.
- Se connecter comme membre.
- Modifier le profil membre.
- Soumettre une publication.
- Se connecter comme administrateur.
- Valider ou rejeter une publication.
- Exporter un rapport PDF depuis l'administration.
- Verifier le formulaire contact.
- Tester desktop et mobile.

## 8. URLs attendues

- Frontend : `https://lias.fsbm.ac.ma`
- Backend API : `https://api.lias.fsbm.ac.ma`
- API REST : `https://api.lias.fsbm.ac.ma/api/v1`
- Swagger : desactive en production

## 9. Commandes utiles

Backend local :

```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend local :

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Build frontend :

```powershell
npm run build
```

Migration PostgreSQL :

```powershell
cd backend
alembic upgrade head
```
