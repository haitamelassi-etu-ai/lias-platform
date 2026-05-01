import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, User2 } from "lucide-react";
import { ApiError, listAxes, type ResearchAxis } from "../lib/api";

export function Axes() {
  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAxes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listAxes();
        setAxes(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger les axes de recherche");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAxes();
  }, []);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-primary mb-4">
          Axes de Recherche
        </h1>
        <p className="text-xl text-text-secondary font-serif max-w-3xl">
          Structuration scientifique du laboratoire LIAS par domaine d'expertise et activites associees.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">Chargement des axes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {axes.map((axis, index) => (
            <motion.article
              key={axis.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-brand-primary/5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-primary/5 text-brand-primary flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h2 className="text-xl font-bold text-brand-primary font-sans">{axis.title}</h2>
              </div>

              <p className="text-text-secondary font-serif leading-relaxed mb-6">{axis.description}</p>

              <div className="inline-flex items-center gap-2 text-sm font-medium text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full">
                <User2 size={14} />
                {axis.lead_member_name || "Responsable non renseigne"}
              </div>
            </motion.article>
          ))}

          {axes.length === 0 && (
            <div className="col-span-full py-20 text-center text-text-secondary font-serif">
              Aucun axe n'est disponible pour le moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
