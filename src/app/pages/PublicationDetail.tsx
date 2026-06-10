import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Tag,
  User,
} from "lucide-react";
import { ApiError, getPublication, type Publication } from "../lib/api";

function formatType(type: string) {
  return type
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PublicationDetail() {
  const { publicationId } = useParams();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublication = async () => {
      const id = Number(publicationId);
      if (!Number.isFinite(id)) {
        setError("Publication introuvable");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        setPublication(await getPublication(id));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger la publication");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPublication();
  }, [publicationId]);

  const doiUrl =
    publication?.external_link || (publication?.doi ? `https://doi.org/${publication.doi}` : null);

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link
        to="/publications"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition-colors hover:text-brand-secondary"
      >
        <ArrowLeft size={16} />
        Retour aux publications
      </Link>

      {isLoading ? (
        <div className="rounded-xl border border-brand-primary/5 bg-white py-16 text-center font-serif text-text-secondary">
          Chargement de la publication...
        </div>
      ) : error || !publication ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {error || "Publication introuvable"}
        </div>
      ) : (
        <article className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm">
          <div className="border-b border-brand-primary/10 bg-brand-primary px-6 py-8 text-white md:px-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase">
                {formatType(publication.publication_type)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                <Calendar size={13} />
                {publication.year}
              </span>
              {publication.axis_title && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  <Tag size={13} />
                  {publication.axis_title}
                </span>
              )}
            </div>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight md:text-4xl">
              {publication.title}
            </h1>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-[1fr_280px] md:p-8">
            <div className="space-y-6">
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-primary">
                  <User size={16} />
                  Auteurs
                </h2>
                <p className="font-serif text-lg text-text-secondary">{publication.authors}</p>
              </section>

              {publication.abstract && (
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-primary">
                    <FileText size={16} />
                    Resume
                  </h2>
                  <p className="font-serif leading-relaxed text-text-secondary">
                    {publication.abstract}
                  </p>
                </section>
              )}

              {publication.keywords && (
                <section>
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-primary">
                    Mots cles
                  </h2>
                  <p className="font-serif text-text-secondary">{publication.keywords}</p>
                </section>
              )}
            </div>

            <aside className="space-y-4 rounded-xl border border-brand-primary/10 bg-gray-50 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Source</p>
                <p className="mt-1 text-sm font-bold text-brand-primary">
                  {publication.source === "orcid" ? "ORCID" : "Saisie manuelle"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Revue / conference</p>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  {publication.venue || "Non renseigne"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">DOI</p>
                <p className="mt-1 break-words text-sm font-medium text-text-secondary">
                  {publication.doi || "Non renseigne"}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {doiUrl && (
                  <a
                    href={doiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
                  >
                    <ExternalLink size={16} />
                    Ouvrir le DOI
                  </a>
                )}
                {publication.pdf_url && (
                  <a
                    href={publication.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/5"
                  >
                    <Download size={16} />
                    Telecharger PDF
                  </a>
                )}
              </div>
            </aside>
          </div>
        </article>
      )}
    </div>
  );
}
