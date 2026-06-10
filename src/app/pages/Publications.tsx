import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Search,
  Tag,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ApiError,
  listAxes,
  listPublications,
  type Publication,
  type ResearchAxis,
} from "../lib/api";

const PUBLICATIONS_PER_PAGE = 6;

export function Publications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get("search") ?? "";
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [filterYear, setFilterYear] = useState("all");
  const [filterAxis, setFilterAxis] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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
          axis_id: filterAxis !== "all" ? Number(filterAxis) : undefined,
          publication_type: filterType !== "all" ? filterType : undefined,
          source: filterSource !== "all" ? filterSource : undefined,
        });
        setPublications(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger les publications");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPublications();
  }, [searchTerm, filterYear, filterAxis, filterType, filterSource]);

  useEffect(() => {
    const fetchAxes = async () => {
      try {
        setAxes(await listAxes());
      } catch {
        setAxes([]);
      }
    };

    void fetchAxes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterAxis, filterType, filterSource]);

  useEffect(() => {
    if (querySearch !== searchTerm) {
      setSearchTerm(querySearch);
    }
  }, [querySearch]);

  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);

    const nextParams = new URLSearchParams(searchParams);
    const trimmedSearch = value.trim();

    if (trimmedSearch) {
      nextParams.set("search", trimmedSearch);
    } else {
      nextParams.delete("search");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  };

  const yearOptions = useMemo(() => {
    return Array.from(new Set(publications.map((pub) => pub.year))).sort((a, b) => b - a);
  }, [publications]);

  const typeOptions = useMemo(() => {
    const values = publications.map((pub) => pub.publication_type);
    if (filterType !== "all") values.push(filterType);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [publications, filterType]);

  const resetFilters = () => {
    updateSearchTerm("");
    setFilterYear("all");
    setFilterAxis("all");
    setFilterType("all");
    setFilterSource("all");
  };

  const totalPages = Math.max(1, Math.ceil(publications.length / PUBLICATIONS_PER_PAGE));
  const pageStart = (currentPage - 1) * PUBLICATIONS_PER_PAGE;
  const paginatedPublications = publications.slice(pageStart, pageStart + PUBLICATIONS_PER_PAGE);
  const visibleStart = publications.length === 0 ? 0 : pageStart + 1;
  const visibleEnd = Math.min(pageStart + PUBLICATIONS_PER_PAGE, publications.length);

  const typeColor = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes("journal")) return "bg-blue-100 text-blue-700";
    if (normalizedType.includes("conference") || normalizedType.includes("paper")) {
      return "bg-emerald-100 text-emerald-700";
    }
    if (normalizedType.includes("poster")) return "bg-orange-100 text-orange-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-sans font-bold text-brand-primary mb-3">
          Publications Scientifiques
        </h1>
        <p className="text-base md:text-lg text-text-secondary font-serif max-w-3xl">
          Consultez les articles, communications et ouvrages issus de nos recherches. Base de données validée et mise à jour régulièrement.
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-brand-primary/5 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, résumé..."
            value={searchTerm}
            onChange={(event) => updateSearchTerm(event.target.value)}
            className="block w-full pl-10 pr-4 py-3 sm:text-sm border-gray-300 rounded-lg focus:ring-brand-secondary focus:border-brand-secondary border bg-gray-50/50"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={filterYear}
            onChange={(event) => setFilterYear(event.target.value)}
            className="block w-full py-3 pl-4 pr-10 border-gray-300 rounded-lg focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm border bg-white text-text-secondary font-bold"
          >
            <option value="all">Toutes les années</option>
            {yearOptions.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select
            value={filterAxis}
            onChange={(event) => setFilterAxis(event.target.value)}
            className="block w-full py-3 pl-4 pr-10 border-gray-300 rounded-lg focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm border bg-white text-text-secondary font-bold"
          >
            <option value="all">Tous les axes</option>
            {axes.map((axis) => (
              <option key={axis.id} value={axis.id.toString()}>
                {axis.title}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="block w-full py-3 pl-4 pr-10 border-gray-300 rounded-lg focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm border bg-white text-text-secondary font-bold"
          >
            <option value="all">Tous les types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(event) => setFilterSource(event.target.value)}
            className="block w-full py-3 pl-4 pr-10 border-gray-300 rounded-lg focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm border bg-white text-text-secondary font-bold"
          >
            <option value="all">Toutes les sources</option>
            <option value="orcid">ORCID</option>
            <option value="manual">Manuelle</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-brand-primary/10 px-4 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/5"
          >
            Reinitialiser
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-14 text-center text-text-secondary font-serif">
          Chargement des publications...
        </div>
      ) : (
        <div className="space-y-4">
          {publications.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-text-secondary">
              <span className="font-medium">
                {visibleStart}-{visibleEnd} sur {publications.length} publication(s)
              </span>
              <span className="font-serif">
                Page {currentPage} / {totalPages}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedPublications.map((pub, index) => {
              const doiUrl = pub.external_link || (pub.doi ? `https://doi.org/${pub.doi}` : null);

              return (
                <motion.article
                  key={pub.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-brand-primary/5 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${typeColor(pub.publication_type)}`}>
                      {pub.publication_type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-secondary font-bold">
                      <Calendar size={13} /> {pub.year}
                    </span>
                    {pub.axis_title && (
                      <span className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                        <Tag size={13} /> {pub.axis_title}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-sans font-bold text-brand-primary leading-snug line-clamp-2">
                      {pub.title}
                    </h2>

                    <div className="flex items-start gap-2 text-brand-secondary font-serif text-sm">
                      <User size={14} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{pub.authors}</span>
                    </div>

                    {pub.abstract && (
                      <p className="text-text-secondary font-serif text-sm leading-relaxed line-clamp-2">
                        {pub.abstract}
                      </p>
                    )}

                    {pub.venue && (
                      <div className="text-xs font-medium text-text-secondary bg-gray-50 px-3 py-2 rounded-lg italic line-clamp-1">
                        {pub.venue}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {doiUrl && (
                      <a
                        href={doiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-brand-primary hover:bg-gray-50 hover:border-brand-primary/30 transition-colors font-bold text-xs"
                      >
                        <ExternalLink size={14} />
                        DOI
                      </a>
                    )}
                    <Link
                      to={`/publications/${pub.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-primary/10 text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-colors font-bold text-xs"
                    >
                      <ExternalLink size={14} />
                      Details
                    </Link>
                    {pub.pdf_url && (
                      <a
                        href={pub.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors font-bold text-xs shadow-sm"
                      >
                        <Download size={14} />
                        PDF
                      </a>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2" aria-label="Pagination des publications">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/10 bg-white px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>

              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 w-9 rounded-lg text-sm font-bold transition-colors ${
                      currentPage === page
                        ? "bg-brand-primary text-white"
                        : "border border-brand-primary/10 bg-white text-brand-primary hover:border-brand-secondary/40 hover:text-brand-secondary"
                    }`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/10 bg-white px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </nav>
          )}

          {publications.length === 0 && (
            <div className="py-16 text-center text-text-secondary font-serif text-base bg-white rounded-xl border border-brand-primary/5">
              Aucune publication trouvée pour ces critères.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
