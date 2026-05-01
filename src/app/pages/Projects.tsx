import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, HandCoins, Users, Tag } from "lucide-react";
import { ApiError, listProjects, type Project } from "../lib/api";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const statusLabel: Record<string, { label: string; color: string }> = {
  active: { label: "Actif", color: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Terminé", color: "bg-slate-100 text-slate-700" },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listProjects();
        setProjects(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger les projets");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-primary mb-4">
          Projets de Recherche
        </h1>
        <p className="text-xl text-text-secondary font-serif max-w-3xl">
          Vision consolidée des projets du laboratoire, de leurs partenaires et des axes scientifiques reliés.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">Chargement des projets...</div>
      ) : (
        <div className="space-y-6">
          {projects.map((project, index) => {
            const status = statusLabel[project.status] ?? { label: project.status, color: "bg-brand-primary/10 text-brand-primary" };
            return (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-brand-primary/5"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-primary font-sans mb-2">{project.title}</h2>
                    <p className="text-text-secondary font-serif leading-relaxed">{project.summary}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-max shrink-0 ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-brand-tertiary rounded-xl p-4">
                    <div className="flex items-center gap-2 text-brand-primary font-bold mb-1">
                      <Users size={16} /> Responsable
                    </div>
                    <p className="text-text-secondary">
                      {project.lead_member_name || project.owner_name || "Non renseigné"}
                    </p>
                  </div>
                  <div className="bg-brand-tertiary rounded-xl p-4">
                    <div className="flex items-center gap-2 text-brand-primary font-bold mb-1">
                      <CalendarDays size={16} /> Période
                    </div>
                    <p className="text-text-secondary">
                      {project.start_date ? formatDate(project.start_date) : "—"}
                      {" → "}
                      {project.end_date ? formatDate(project.end_date) : "En cours"}
                    </p>
                  </div>
                  <div className="bg-brand-tertiary rounded-xl p-4">
                    <div className="flex items-center gap-2 text-brand-primary font-bold mb-1">
                      <HandCoins size={16} /> Financement
                    </div>
                    <p className="text-text-secondary">{project.funding || "Non renseigné"}</p>
                  </div>
                </div>

                {project.axis_title && (
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary font-medium bg-brand-primary/5 px-3 py-1 rounded-full">
                    <Tag size={14} />
                    {project.axis_title}
                  </div>
                )}
              </motion.article>
            );
          })}

          {projects.length === 0 && (
            <div className="py-20 text-center text-text-secondary font-serif">
              Aucun projet public disponible actuellement.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
