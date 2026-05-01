# RAPPORT DE SPRINT — SEMAINE 3
## Plateforme Web — Projet de Fin d'Études
### Filière : Développement Informatique | Année universitaire : 2025 – 2026

---

## INFORMATIONS GÉNÉRALES

| Champ                     | Détail                                          |
|---------------------------|-------------------------------------------------|
| **Projet**                | Plateforme Web Institutionnelle et Scientifique |
| **Méthodologie**          | Agile Scrum                                     |
| **Sprint**                | Sprint 3 — Semaine 3                            |
| **Période**               | Semaine 3 (Sprint de 7 jours)                   |
| **Équipe**                | Haytam El Assi · Aya Chadli · Majda Echabi      |
| **Encadrant académique**  | Mme. Oumaima EL Yazyd                           |
| **Encadrant professionnel** | M. Ait Daoud                                  |
| **Statut du sprint**      | ✅ Complété                                      |

---

## RÉPARTITION DES RÔLES

| Membre         | Rôle principal                              | Responsabilités sprint 3                                           |
|----------------|---------------------------------------------|--------------------------------------------------------------------|
| **Haytam El Assi** | Backend · Base de données · API         | Développement des endpoints Publications, Communications, ORCID, moteur de recherche |
| **Aya Chadli**     | Frontend (Next.js)                      | Interfaces membre : dashboard, module Publications, module Communications |
| **Majda Echabi**   | Frontend (Next.js) · Intégration        | Profil membre, liaison aux productions, affichage public, intégration ORCID côté client |

---

## 1. RÉSUMÉ EXÉCUTIF

Le Sprint 3 marque une étape clé dans le cycle de développement du projet : la mise en place de l'**espace membre opérationnel** avec la gestion complète des publications et des communications scientifiques, l'intégration du moteur de recherche, ainsi que l'amorce de l'intégration de l'identifiant chercheur **ORCID**. À l'issue de ce sprint, la plateforme dispose d'une **version bêta fonctionnelle** couvrant les besoins fondamentaux des utilisateurs membres.

---

## 2. OBJECTIFS DU SPRINT

### 2.1 Objectifs principaux

Les objectifs définis en début de sprint lors de la réunion de planification (*Sprint Planning*) étaient les suivants :

| # | Objectif                                                              | Priorité  |
|---|-----------------------------------------------------------------------|-----------|
| 1 | Mettre en place le tableau de bord membre                             | Haute     |
| 2 | Développer le module Publications (CRUD complet)                      | Haute     |
| 3 | Développer le module Communications (CRUD complet)                    | Haute     |
| 4 | Mettre en place le moteur de recherche et les filtres simples         | Moyenne   |
| 5 | Relier le profil membre à ses productions scientifiques               | Moyenne   |
| 6 | Commencer l'intégration ORCID (liaison compte + récupération données) | Moyenne   |
| 7 | Afficher publiquement les contenus validés                            | Haute     |

### 2.2 Critères d'acceptation (*Definition of Done*)

Un objectif est considéré comme accompli si :
- Le code est intégré dans la branche principale du dépôt ;
- La fonctionnalité est testée manuellement (flux complet) ;
- L'interface utilisateur est responsive et cohérente avec la charte graphique ;
- Les données sont correctement persistées en base de données.

---

## 3. USER STORIES TRAITÉES

### US-07 — Tableau de bord membre
> *En tant que membre connecté, je veux accéder à un tableau de bord synthétique pour visualiser mes statistiques de production et le statut de mes soumissions.*

- **Tâches réalisées :**
  - Conception et implémentation de la page Dashboard membre
  - Affichage des KPI : nombre de projets, publications, communications, soumissions en attente
  - Intégration d'un fil d'activité récente avec statuts colorés
  - Connexion à l'API `/api/v1/dashboard/member`

---

### US-08 — Module Publications (CRUD)
> *En tant que membre, je veux pouvoir soumettre, consulter et gérer mes publications scientifiques depuis mon espace personnel.*

- **Tâches réalisées :**
  - Endpoint REST : `GET /publications`, `POST /publications`, `PUT /publications/{id}`, `DELETE /publications/{id}`
  - Formulaire de soumission avec validation côté client et côté serveur
  - Affichage de la liste des publications avec filtres (année, type, axe de recherche)
  - Statut de validation visible : En attente / Validé / Rejeté / Correction demandée
  - Export CSV des publications

---

### US-09 — Module Communications (CRUD)
> *En tant que membre, je veux pouvoir déclarer mes communications orales, posters et séminaires.*

- **Tâches réalisées :**
  - Endpoint REST complet pour les communications
  - Formulaire multi-champs : titre, événement, type, date, lieu, pays, résumé, axe
  - Intégration dans le panel membre avec retour visuel immédiat
  - Validation backend via Pydantic

---

### US-10 — Moteur de recherche et filtres
> *En tant qu'utilisateur, je veux rechercher et filtrer les publications et membres pour accéder rapidement à l'information pertinente.*

- **Tâches réalisées :**
  - Recherche textuelle sur les publications (titre, auteurs, résumé)
  - Filtre par année, type de publication
  - Recherche membres par nom, grade, axe de recherche
  - Filtres par rôle (chercheur, doctorant, ingénieur...)
  - Affichage du nombre de résultats trouvés

---

### US-11 — Profil membre lié aux productions
> *En tant que membre, je veux que mon profil public affiche automatiquement mes publications et communications validées.*

- **Tâches réalisées :**
  - Liaison base de données entre `User`, `MemberProfile`, `Publication`, `Communication`
  - Affichage dynamique des productions validées sur la page profil
  - Statuts traduits en français dans l'interface

---

### US-12 — Intégration ORCID (phase initiale)
> *En tant que chercheur, je veux lier mon identifiant ORCID à mon profil pour importer automatiquement mes publications.*

- **Tâches réalisées :**
  - Endpoint `POST /orcid/link` : liaison de l'identifiant ORCID au profil
  - Endpoint `POST /orcid/import` : récupération des travaux depuis l'API publique ORCID
  - Parsing du format JSON ORCID et conversion en publications locales
  - Gestion des doublons (skip si DOI déjà présent)
  - Interface de liaison dans la page Profil avec boutons "Lier ORCID" et "Import ORCID"

---

### US-13 — Affichage public des contenus validés
> *En tant que visiteur, je veux consulter les publications, projets et événements validés sans avoir à me connecter.*

- **Tâches réalisées :**
  - Filtrage automatique côté API : seuls les contenus `validation_status = "validated"` sont exposés aux visiteurs
  - Pages publiques : Publications, Projets, Événements, Membres
  - Design responsive avec cartes informationnelles

---

## 4. RÉALISATIONS TECHNIQUES

### 4.1 Architecture générale

```
┌──────────────────────────────────────────────┐
│              Frontend (Next.js / React)       │
│   Dashboard · Publications · Communications   │
│   Profil · Recherche · Pages publiques        │
└──────────────────┬───────────────────────────┘
                   │ REST API / JSON
                   ▼
┌──────────────────────────────────────────────┐
│              Backend (FastAPI)                │
│   /auth  /members  /publications              │
│   /communications  /orcid  /dashboard         │
│   /moderation  /exports                       │
└──────────────────┬───────────────────────────┘
                   │ SQLAlchemy ORM
                   ▼
┌──────────────────────────────────────────────┐
│           Base de données (SQLite)            │
│   User · MemberProfile · Publication          │
│   Communication · Project · ValidationRecord  │
└──────────────────────────────────────────────┘
                   │
                   ▼
        API Externe : ORCID Public API
```

### 4.2 Environnement de développement

| Composant         | Technologie               | Version     |
|-------------------|---------------------------|-------------|
| Frontend          | React + Vite + TypeScript | 18.x / 6.x  |
| Framework UI      | Tailwind CSS v4 + Radix UI| 4.x         |
| Backend           | FastAPI + Uvicorn         | 0.115.5     |
| ORM               | SQLAlchemy                | 2.0.49      |
| Base de données   | SQLite                    | —           |
| Authentification  | JWT (python-jose)         | 3.3.0       |
| Hachage           | PBKDF2-SHA256             | —           |
| Intégration API   | ORCID Public API          | v3.0        |
| Gestionnaire dep. | pip / npm                 | —           |

### 4.3 Endpoints API développés ce sprint

| Méthode | Endpoint                          | Description                         |
|---------|-----------------------------------|-------------------------------------|
| GET     | `/api/v1/publications`            | Liste des publications (filtrable)  |
| POST    | `/api/v1/publications`            | Soumettre une publication           |
| PUT     | `/api/v1/publications/{id}`       | Modifier une publication            |
| DELETE  | `/api/v1/publications/{id}`       | Supprimer une publication           |
| GET     | `/api/v1/communications`          | Liste des communications            |
| POST    | `/api/v1/communications`          | Soumettre une communication         |
| GET     | `/api/v1/dashboard/member`        | Statistiques membre                 |
| POST    | `/api/v1/orcid/link`              | Lier un identifiant ORCID           |
| POST    | `/api/v1/orcid/import`            | Importer depuis ORCID               |
| GET     | `/api/v1/exports/publications`    | Export CSV des publications         |

### 4.4 Modèles de données ajoutés / modifiés

```python
# Publication
class Publication(Base):
    id, title, authors, publication_type, year
    venue, abstract, keywords, doi, external_link
    pdf_url, source, validation_status
    axis_id, project_id, owner_id
    created_at, updated_at

# Communication
class Communication(Base):
    id, title, authors, event_name
    communication_type, location, country
    event_date, abstract, presentation_status
    validation_status, axis_id, owner_id
    created_at
```

---

## 5. LIVRABLES PRODUITS

| Livrable                                           | Statut      |
|----------------------------------------------------|-------------|
| Espace membre opérationnel                         | ✅ Livré     |
| Gestion des publications (CRUD + validation)       | ✅ Livré     |
| Gestion des communications (CRUD + validation)     | ✅ Livré     |
| Tableau de bord membre avec statistiques           | ✅ Livré     |
| Moteur de recherche et filtres                     | ✅ Livré     |
| Intégration ORCID basique (liaison + import)       | ✅ Livré     |
| Affichage public des contenus validés              | ✅ Livré     |
| Export CSV des publications                        | ✅ Livré     |
| Captures d'écran des modules développés            | ✅ Disponibles |
| Chapitre "Réalisation" du rapport rédigé           | ✅ En grande partie |
| Version bêta de la plateforme                      | ✅ Déployée localement |

---

## 6. DIFFICULTÉS RENCONTRÉES ET SOLUTIONS APPORTÉES

### 6.1 Incompatibilité SQLAlchemy / Python 3.14

**Problème :** Le projet utilisait SQLAlchemy 2.0.36, incompatible avec Python 3.14 (erreur `TypeError: descriptor '__getitem__' requires a 'typing.Union' object`).

**Impact :** Le serveur backend refusait de démarrer.

**Solution :** Mise à jour de SQLAlchemy vers la version **2.0.49** (première version supportant Python 3.14) et mise à jour du fichier `requirements.txt` en conséquence.

---

### 6.2 Gestion des doublons lors de l'import ORCID

**Problème :** L'import des publications ORCID créait des doublons si l'utilisateur relançait l'import plusieurs fois.

**Impact :** Pollution de la base de données, confusion pour l'utilisateur.

**Solution :** Implémentation d'une vérification par DOI avant insertion. Si le DOI existe déjà, l'entrée est ignorée (`skipped`) et un compteur est retourné à l'utilisateur.

---

### 6.3 Sécurité CORS trop permissive

**Problème :** La configuration initiale utilisait `allow_methods=["*"]` et `allow_headers=["*"]`, exposant l'API à des requêtes non autorisées.

**Solution :** Restriction aux méthodes nécessaires : `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]` et aux headers : `["Authorization", "Content-Type", "Accept"]`.

---

### 6.4 Validation formulaires côté client absente

**Problème :** Les formulaires de soumission ne donnaient aucun retour visuel en cas de champ invalide ou manquant.

**Solution :** Ajout d'une validation inline avec messages d'erreur colorés sous chaque champ concerné, sans dépendance externe (validation JavaScript natif).

---

### 6.5 Dates affichées en format ISO brut

**Problème :** Les dates s'affichaient sous la forme `2024-01-15` au lieu de `15 janvier 2024`.

**Solution :** Utilisation de `Date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })` de manière cohérente dans tous les composants.

---

## 7. RÉTROSPECTIVE DU SPRINT

### 7.1 Ce qui a bien fonctionné ✅

- **Collaboration efficace** : bonne répartition backend/frontend, peu de conflits d'intégration.
- **Cohérence de l'architecture** : les conventions d'API définies au Sprint 1 ont tenu, rendant l'intégration frontend fluide.
- **Couverture fonctionnelle** : tous les objectifs prioritaires ont été atteints.
- **Qualité du code** : typage TypeScript strict maintenu côté frontend, Pydantic côté backend.

### 7.2 Points d'amélioration 🔧

- **Tests insuffisants** : les tests manuels sont la principale méthode de validation — des tests automatisés (pytest, Vitest) devraient être introduits.
- **Gestion du temps** : l'intégration ORCID a pris plus de temps que prévu en raison du parsing du format JSON ORCID.
- **Documentation API** : la documentation Swagger est générée automatiquement mais les descriptions des endpoints gagneraient à être enrichies.

### 7.3 Actions correctives pour le Sprint 4

| Action                                        | Responsable       |
|-----------------------------------------------|-------------------|
| Écrire des tests unitaires pour les endpoints | Haytam El Assi    |
| Améliorer la documentation Swagger            | Haytam El Assi    |
| Optimiser les performances des requêtes       | Toute l'équipe    |
| Finaliser le chapitre "Réalisation" du rapport| Aya Chadli        |

---

## 8. MÉTRIQUES DU SPRINT

| Métrique                         | Valeur          |
|----------------------------------|-----------------|
| User Stories planifiées          | 7               |
| User Stories complétées          | 7               |
| Taux de complétion               | **100 %**       |
| Endpoints API développés         | 10              |
| Composants frontend créés        | 8               |
| Bugs identifiés                  | 5               |
| Bugs résolus                     | 5               |
| Taux de résolution des bugs      | **100 %**       |

---

## 9. APERÇU DU SPRINT 4

Les objectifs prévisionnels pour la semaine 4 sont :

| # | Objectif                                                            | Priorité |
|---|---------------------------------------------------------------------|----------|
| 1 | Développer le module Projets (CRUD membre)                          | Haute    |
| 2 | Mettre en place l'espace administrateur (modération, statistiques)  | Haute    |
| 3 | Finaliser l'intégration ORCID (synchronisation enrichie)            | Moyenne  |
| 4 | Ajouter la pagination sur les listes                                | Moyenne  |
| 5 | Préparer les captures d'écran finales pour le rapport               | Haute    |
| 6 | Rédiger le chapitre "Tests et validation" du rapport                | Haute    |

---

## 10. ANNEXES

### Annexe A — Captures d'écran représentatives

*(À insérer dans la version finale du rapport : 3 captures Postman uniquement)*

1. **POST** `/api/v1/publications` — création d'une publication
2. **GET** `/api/v1/dashboard/member` — récupération du tableau de bord membre ou d'une liste de données
3. **POST** `/api/v1/orcid/import` — intégration ORCID et import des travaux

### Annexe B — Vérification API / backend

Les tests de validation peuvent être exécutés avec le backend local, puis observés directement dans la sortie du terminal :

- Vérification d'import du projet backend :

```powershell
& 'C:\Users\hp\Downloads\Create this for me\.venv-1\Scripts\python.exe' -c "from app.main import app; print('APP_IMPORT_OK')"
```

Résultat observé : `APP_IMPORT_OK`

- Démarrage de l'API FastAPI avec Uvicorn :

```powershell
& 'C:\Users\hp\Downloads\Create this for me\.venv-1\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Résultat observé :

```text
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
```

- Test de disponibilité de l'API :

```powershell
Invoke-RestMethod 'http://127.0.0.1:8001/health' | ConvertTo-Json -Compress
```

Résultat observé : `{"status":"ok"}`

- Test des routes via Postman sur les 3 cas ci-dessus.

### Annexe C — Bilan de la base de données

Pour la version finale du document Word, ajouter des captures d'écran PostgreSQL prises via pgAdmin ou DBeaver afin de montrer la persistance réelle des données de test.

Captures à insérer :

1. **Table `Publication`** avec plusieurs lignes de test visibles, incluant au moins un titre, une année, un DOI et un statut de validation.
2. **Table `Communication`** avec des données de test remplies, afin de prouver l'enregistrement des communications scientifiques.
3. **Table `MemberProfile` ou `User`** affichant le champ `orcid_id` renseigné pour un membre, afin de démontrer la liaison ORCID.

### Annexe D — Extraits de code significatifs

**Endpoint import ORCID (backend) :**
```python
@router.post("/orcid/import")
def import_orcid_publications(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    # Récupération des travaux depuis l'API ORCID publique
    # Vérification des doublons par DOI
    # Import des nouveaux travaux en base
    # Retour : { "imported": N, "skipped": M }
```

**Validation formulaire (frontend) :**
```typescript
const validatePublication = () => {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Le titre est requis.";
  if (!form.authors.trim()) errors.authors = "Les auteurs sont requis.";
  const yr = Number(form.year);
  if (isNaN(yr) || yr < 2000 || yr > 2100) errors.year = "Année invalide.";
  return errors;
};
```

---

## SIGNATURES

| Rôle                        | Nom                  | Validation |
|-----------------------------|----------------------|------------|
| Équipe de développement     | Haytam El Assi       | ✅         |
|                             | Aya Chadli           | ✅         |
|                             | Majda Echabi         | ✅         |
| Encadrant académique        | Mme. Oumaima EL Yazyd | ☐         |
| Encadrant professionnel     | M. Ait Daoud          | ☐         |

---

*Document généré dans le cadre du suivi Agile Scrum — Sprint 3 — Projet de fin d'études 2025–2026*
*Filière : Développement Informatique*
