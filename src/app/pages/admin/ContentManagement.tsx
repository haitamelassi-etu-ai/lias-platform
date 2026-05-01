import { Link } from "react-router";
import { FileCheck2, Megaphone, CalendarRange, FolderKanban } from "lucide-react";

export function ContentManagement() {
  return (
    <div className="py-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-sans font-bold text-brand-primary">
          Gestion des Contenus
        </h1>
        <p className="text-text-secondary font-serif mt-1">
          Point d'entree administrateur pour piloter moderation, actualites, evenements et projets.
        </p>
        <div className="mt-4">
          <Link
            to="/admin/panel"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-secondary transition-colors"
          >
            Ouvrir le panel administrateur professionnel
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/moderation"
          className="bg-white rounded-2xl border border-brand-primary/10 p-6 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mb-4">
            <FileCheck2 size={22} />
          </div>
          <h2 className="text-xl font-bold text-brand-primary mb-2">Moderation</h2>
          <p className="text-text-secondary font-serif text-sm">
            Valider, rejeter ou demander des corrections sur les contenus soumis.
          </p>
        </Link>

        <div className="bg-white rounded-2xl border border-brand-primary/10 p-6">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <Megaphone size={22} />
          </div>
          <h2 className="text-xl font-bold text-brand-primary mb-2">Actualites</h2>
          <p className="text-text-secondary font-serif text-sm">
            Publication des annonces institutionnelles et scientifiques (API disponible).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-primary/10 p-6">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <CalendarRange size={22} />
          </div>
          <h2 className="text-xl font-bold text-brand-primary mb-2">Evenements</h2>
          <p className="text-text-secondary font-serif text-sm">
            Gestion des seminaires, colloques et journees scientifiques via le module Evenements.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-primary/10 p-6">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
            <FolderKanban size={22} />
          </div>
          <h2 className="text-xl font-bold text-brand-primary mb-2">Projets</h2>
          <p className="text-text-secondary font-serif text-sm">
            Suivi des projets de recherche, responsables, financements et statut de validation.
          </p>
        </div>
      </div>
    </div>
  );
}
