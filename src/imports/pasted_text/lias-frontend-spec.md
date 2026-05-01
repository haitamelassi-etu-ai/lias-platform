
Optimizing tool selection...

I will extract the key product requirements from your project docs first, then I will give you a ready-to-paste master prompt for Figma/another AI plus a clear checklist of what the frontend should contain.

I extracted the MVP scope and modules from your docs; next I’ll pull the user journeys and detailed requirements so the prompt includes exact screens, roles, and interactions instead of a generic UI brief.

I now have the functional scope; I’m checking your current frontend pages and API helper so I can give you a prompt that matches your real routes and backend endpoints exactly.

I confirmed your current UI already covers core flows (public, member, admin) and I’m now extracting the remaining page-level details (contact, register, profile, search, plus unfinished parts of dashboard/admin) to include everything in one complete generator prompt.

I have enough to draft the deliverable; I’m only checking your profile page fields now so the prompt includes every required form field and member data block.

Read page.tsx

Ce que le frontend doit contenir pour ton projet LIAS (version MVP solide) :

Espace public complet : Accueil institutionnel, Présentation du labo, Axes de recherche, Membres, Projets, Publications validées, Événements, Actualités, Partenaires, Contact.
Authentification : Inscription, Connexion, Mot de passe oublié, Réinitialisation, Changement de mot de passe, redirection selon rôle.
Espace membre : Dashboard KPI, édition profil scientifique complet, liaison ORCID, import publications ORCID, gestion publications, gestion communications, upload/download documents, export CSV/PDF personnel.
Espace administrateur : Dashboard global, file de modération, validation/rejet/correction, gestion contenus (axes/projets/événements/actualités), vue messages contact, export bilan laboratoire.
Recherche multicritère : recherche unifiée sur membres, publications, projets, événements, avec filtres (année, type, axe, statut, auteur, mot-clé) et pagination.
Qualité UX/UI : responsive mobile/tablette/desktop, états loading/empty/error, accessibilité de base (contraste, focus, clavier), SEO de base, cohérence visuelle globale.
Prompt complet prêt à donner à Figma AI ou à une autre IA :

Tu es un Senior Product Designer et Frontend Architect. Conçois le frontend complet d’une plateforme institutionnelle et scientifique appelée LIAS.

Contexte produit : plateforme web pour un laboratoire de recherche avec 3 rôles (visiteur, membre, administrateur). Objectif : valoriser les activités scientifiques, centraliser les productions, gérer la validation éditoriale, et produire des exports fiables.

Stack cible : Next.js 14, TypeScript, App Router, consommation d’une API FastAPI.

Contraintes UX : interface moderne, claire, très lisible, professionnelle, orientée gouvernance scientifique. Responsive mobile et desktop. Accessibilité AA. Navigation simple et cohérente.

Direction artistique : style éditorial scientifique premium, pas de design générique. Éviter les polices par défaut type Inter/Roboto/Arial. Utiliser un duo typographique expressif (exemple Space Grotesk + Source Serif). Palette non violette avec contraste fort, par exemple bleu nuit, cyan minéral, sable clair, accent corail. Ajouter des animations discrètes et utiles : apparition progressive des sections, transitions de page douces, feedback de validation.

Écrans à produire : Home, Présentation, Axes, Membres, Projets, Publications publiques, Événements, Actualités, Partenaires, Contact, Login, Register, Dashboard membre, Profil membre, Gestion publications membre, Gestion communications membre, Documents membre, Dashboard admin, Modération admin, Gestion contenus admin, Recherche globale.

Composants à concevoir : top navigation, sidebar rôles, cards KPI, tableaux avec filtres, badges de statut (pending/validated/rejected/needs_fix), formulaires complets, upload zone, notifications de succès/erreur, pagination, empty states, confirmation modale pour actions critiques.

Règles métier à refléter dans l’UI : un contenu non validé n’est pas public ; un membre modifie seulement ses contenus ; un admin valide/rejette/demande correction ; ORCID enrichit les données locales sans les écraser ; suppression critique confirmée.

API à mapper dans les flux : auth/register, auth/login, auth/me, auth/forgot-password, auth/reset-password, auth/change-password, dashboard/member, dashboard/admin, publications, publications/my, publications/admin, publications/{id}/validate, communications, orcid/link, orcid/import-publications, documents/upload, documents/my, documents/{id}/download, moderation/queue, search, contact, exports/publications.csv, exports/members/{id}/publications.csv, exports/members/{id}/report.pdf, exports/lab/summary.pdf.

Livrables attendus : architecture de navigation complète, design system avec tokens (couleurs, typo, spacing, radius, ombres, états), maquettes haute fidélité pour tous les écrans, prototype cliquable avec 3 parcours (visiteur, membre, admin), spécifications d’interactions et comportements responsive.

Parcours prototype obligatoires : visiteur consulte publications puis envoie un message ; membre se connecte, lie ORCID, importe publications, ajoute un document, exporte son rapport ; admin se connecte, ouvre modération, valide un contenu, consulte les indicateurs et exporte le bilan laboratoire.

Critères de réussite : cohérence visuelle forte, excellent niveau de lisibilité des données scientifiques, workflows rôles sans ambiguïté, expérience fluide sur mobile et desktop, design prêt pour implémentation front.

Si tu veux, je peux aussi te donner une version 100% orientée génération de code (prompt pour Cursor/Claude/GPT) avec arborescence de composants et conventions TypeScript déjà imposées.