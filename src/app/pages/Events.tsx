import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, MapPin, Mic2, ExternalLink } from "lucide-react";
import { ApiError, listEvents, type LabEvent } from "../lib/api";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Events() {
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listEvents();
        setEvents(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger les événements");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchEvents();
  }, []);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-primary mb-4">
          Événements Scientifiques
        </h1>
        <p className="text-xl text-text-secondary font-serif max-w-3xl">
          Séminaires, journées scientifiques, workshops et colloques du laboratoire LIAS.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">Chargement des événements...</div>
      ) : (
        <div className="space-y-6">
          {events.map((event, index) => (
            <motion.article
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-brand-primary/5"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-brand-primary font-sans mb-2">{event.title}</h2>
                  <p className="text-text-secondary font-serif leading-relaxed">{event.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-max shrink-0 ${
                  event.lifecycle_status === "upcoming"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {event.lifecycle_status === "upcoming" ? "À venir" : "Passé"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-brand-tertiary rounded-xl p-4">
                  <div className="flex items-center gap-2 text-brand-primary font-bold mb-1">
                    <CalendarClock size={16} /> Date
                  </div>
                  <p className="text-text-secondary">
                    {formatDate(event.start_date)}
                    {event.end_date && event.end_date !== event.start_date
                      ? ` — ${formatDate(event.end_date)}`
                      : ""}
                  </p>
                </div>
                <div className="bg-brand-tertiary rounded-xl p-4">
                  <div className="flex items-center gap-2 text-brand-primary font-bold mb-1">
                    <MapPin size={16} /> Lieu
                  </div>
                  <p className="text-text-secondary">{event.location || "À définir"}</p>
                </div>
                <div className="bg-brand-tertiary rounded-xl p-4">
                  <div className="flex items-center gap-2 text-brand-primary font-bold mb-1">
                    <Mic2 size={16} /> Intervenants
                  </div>
                  <p className="text-text-secondary">{event.speakers || "À définir"}</p>
                </div>
              </div>

              {event.registration_link && event.lifecycle_status === "upcoming" && (
                <div className="mt-4 flex">
                  <a
                    href={event.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-secondary text-white rounded-lg text-sm font-bold hover:bg-brand-secondary/90 transition-colors"
                  >
                    <ExternalLink size={16} />
                    S'inscrire à cet événement
                  </a>
                </div>
              )}
            </motion.article>
          ))}

          {events.length === 0 && (
            <div className="py-20 text-center text-text-secondary font-serif">
              Aucun événement public disponible actuellement.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
