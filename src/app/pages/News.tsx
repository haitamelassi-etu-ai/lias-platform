import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, Megaphone } from "lucide-react";
import { ApiError, listNews, type NewsItem } from "../lib/api";

const fallbackNewsItems = [
  {
    key: "icisct-2026",
    title: "Conférence ICISCT 2026",
    date: "2026",
    category: "Conférence internationale",
    content:
      "Le LIAS organise la première édition de l’International Conference on Innovative Smart City Technologies, accueillie par la Faculté des Sciences Ben M’Sik à Casablanca.",
  },
  {
    key: "icais-2025",
    title: "Conférence ICAIS 2025",
    date: "2025",
    category: "Actualité scientifique",
    content:
      "Le laboratoire organise l’International Conference on Artificial Intelligence and Systems, un rendez-vous dédié à l’innovation et à la recherche en intelligence artificielle.",
  },
  {
    key: "bilan-2021-2024",
    title: "Bilan scientifique 2021-2024",
    date: "2024",
    category: "Recherche",
    content:
      "Le LIAS consolide un bilan de plus de 230 publications indexées, 28 thèses soutenues et 42 thèses en cours sur la période 2021-2024.",
  },
];

function formatDate(item: NewsItem): string {
  const value = item.published_at ?? item.created_at;
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function News() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listNews();
        setNewsItems(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger les actualités");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchNews();
  }, []);

  const displayedNews =
    newsItems.length > 0
      ? newsItems.map((item) => ({
          key: String(item.id),
          title: item.title,
          category: item.category ?? "Actualité",
          date: formatDate(item),
          content: item.content,
        }))
      : fallbackNewsItems;

  return (
    <div>
      <div className="mb-12 max-w-4xl">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-brand-secondary">
          Actualités
        </span>
        <h1 className="mt-3 text-4xl md:text-5xl font-sans font-bold text-brand-primary">
          Vie scientifique du LIAS
        </h1>
        <p className="mt-5 text-xl text-text-secondary font-serif leading-relaxed">
          Retrouvez les annonces, événements scientifiques et informations institutionnelles
          du laboratoire.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-medium">
          Les actualités dynamiques sont indisponibles pour le moment. Affichage des annonces principales.
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">Chargement des actualités...</div>
      ) : (
        <div className="space-y-5">
          {displayedNews.map((item, index) => (
            <motion.article
              key={item.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-white border border-brand-primary/10 rounded-2xl p-6 md:p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-secondary">
                    <Megaphone size={16} /> {item.category}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-brand-primary">{item.title}</h2>
                  <p className="mt-3 text-text-secondary font-serif leading-7">{item.content}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-tertiary px-4 py-2 text-sm font-bold text-brand-primary w-max">
                  <CalendarDays size={16} /> {item.date}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
