import { useEffect, useMemo, useState } from "react";
import { Search, Download, ExternalLink, Calendar, User, Tag } from "lucide-react";
import { motion } from "motion/react";
import { ApiError, listPublications, type Publication } from "../lib/api";

export function Publications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await listPublications({
          search: searchTerm.trim() || undefined,
          year: filterYear !== "all" ? Number(filterYear) : undefined,
        });
        setPublications(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger les publications");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPublications();
  }, [searchTerm, filterYear]);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(publications.map((pub) => pub.year))).sort((a, b) => b - a);
    return years;
  }, [publications]);

  const typeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("journal")) return "bg-blue-100 text-blue-700";
    if (t.includes("conference") || t.includes("paper")) return "bg-emerald-100 text-emerald-700";
    if (t.includes("poster")) return "bg-orange-100 text-orange-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-primary mb-4">
          Publications Scientifiques
        </h1>
        <p className="text-xl text-text-secondary font-serif max-w-3xl">
          Consultez les articles, communications et ouvrages issus de nos recherches. Base de données validée et mise à jour régulièrement.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 mb-10 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, résumé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary border bg-gray-50/50"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="block w-full py-4 pl-4 pr-10 border-gray-300 rounded-xl focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm border bg-white text-text-secondary font-bold"
          >
            <option value="all">Toutes les années</option>
            {yearOptions.map((year) => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">
          Chargement des publications...
        </div>
      ) : (
        <div className="space-y-6">
          {publications.map((pub, i) => {
            const doiUrl = pub.external_link || (pub.doi ? `https://doi.org/${pub.doi}` : null);
            return (
              <motion.article
                key={pub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-brand-primary/5 flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${typeColor(pub.publication_type)}`}>
                        {pub.publication_type}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-text-secondary font-medium">
                        <Calendar size={14} /> {pub.year}
                      </span>
                      {pub.axis_title && (
                        <span className="flex items-center gap-1 text-sm text-text-secondary font-medium">
                          <Tag size={14} /> {pub.axis_title}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-sans font-bold text-brand-primary mb-2 leading-tight">
                      {pub.title}
                    </h2>

                    <div className="flex items-center gap-2 text-brand-secondary font-serif mb-4">
                      <User size={16} />
                      <span>{pub.authors}</span>
                    </div>

                    {pub.abstract && (
                      <p className="text-text-secondary font-serif text-sm leading-relaxed mb-4">
                        {pub.abstract}
                      </p>
                    )}

                    {pub.venue && (
                      <div className="text-sm font-medium text-text-secondary bg-gray-50 px-4 py-2 rounded-lg italic">
                        {pub.venue}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col gap-3 shrink-0">
                    {doiUrl && (
                      <a
                        href={doiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-brand-primary hover:bg-gray-50 hover:border-brand-primary/30 transition-colors font-bold text-sm w-full md:w-auto justify-center"
                      >
                        <ExternalLink size={16} />
                        Voir DOI
                      </a>
                    )}
                    {pub.pdf_url && (
                      <a
                        href={pub.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors font-bold text-sm w-full md:w-auto justify-center shadow-sm"
                      >
                        <Download size={16} />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}

          {publications.length === 0 && (
            <div className="py-20 text-center text-text-secondary font-serif text-lg bg-white rounded-2xl border border-brand-primary/5">
              Aucune publication trouvée pour ces critères.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
