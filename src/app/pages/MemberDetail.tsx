import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FlaskConical,
  Mail,
  Tag,
  UserRound,
} from "lucide-react";
import {
  ApiError,
  getMember,
  listPublications,
  type MemberProfile,
  type Publication,
} from "../lib/api";

export function MemberDetail() {
  const { memberId } = useParams();
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMember = async () => {
      const id = Number(memberId);
      if (!Number.isFinite(id)) {
        setError("Membre introuvable");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const profile = await getMember(id);
        setMember(profile);
        setPublications(await listPublications({ owner_id: profile.user_id }));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger le membre");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMember();
  }, [memberId]);

  const canShowEmail = member?.email ? !member.email.endsWith("@annuaire.lias.ma") : false;

  return (
    <div className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Link
        to="/members"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition-colors hover:text-brand-secondary"
      >
        <ArrowLeft size={16} />
        Retour aux membres
      </Link>

      {isLoading ? (
        <div className="rounded-xl border border-brand-primary/5 bg-white py-16 text-center font-serif text-text-secondary">
          Chargement du profil membre...
        </div>
      ) : error || !member ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {error || "Membre introuvable"}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="h-max rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-primary/5 text-brand-primary">
              <UserRound size={34} />
            </div>

            <h1 className="text-3xl font-bold leading-tight text-brand-primary">{member.full_name}</h1>
            <p className="mt-2 font-serif text-text-secondary">{member.grade || "Membre LIAS"}</p>

            <div className="mt-6 space-y-3 text-sm">
              {member.team && (
                <div className="rounded-xl border border-brand-primary/10 bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Equipe</p>
                  <p className="mt-1 font-bold text-brand-primary">{member.team}</p>
                </div>
              )}
              {member.research_axis_title && (
                <div className="rounded-xl border border-brand-primary/10 bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Axe</p>
                  <p className="mt-1 font-bold text-brand-primary">{member.research_axis_title}</p>
                </div>
              )}
              <div className="rounded-xl border border-brand-primary/10 bg-gray-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Publications validees</p>
                <p className="mt-1 font-bold text-brand-primary">{member.publication_count}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {member.orcid_id && (
                <a
                  href={`https://orcid.org/${member.orcid_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 transition-colors hover:bg-green-100"
                >
                  <ExternalLink size={16} />
                  Profil ORCID
                </a>
              )}
              <Link
                to={`/publications?search=${encodeURIComponent(member.full_name)}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
              >
                <BookOpen size={16} />
                Toutes ses publications
              </Link>
              {canShowEmail && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/10 px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/5"
                >
                  <Mail size={16} />
                  Contact
                </a>
              )}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-primary">
                <FlaskConical size={18} />
                Profil scientifique
              </h2>
              <p className="font-serif leading-relaxed text-text-secondary">
                {member.biography || "Biographie non renseignee."}
              </p>
              {member.interests && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-primary/[0.03] p-3 text-sm text-text-secondary">
                  <Tag size={16} className="mt-0.5 shrink-0 text-brand-primary" />
                  <span>{member.interests}</span>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                  <BookOpen size={18} />
                  Publications
                </h2>
                <span className="text-sm font-medium text-text-secondary">
                  {publications.length} resultat{publications.length > 1 ? "s" : ""}
                </span>
              </div>

              {publications.length === 0 ? (
                <p className="font-serif text-text-secondary">Aucune publication validee trouvee.</p>
              ) : (
                <div className="space-y-3">
                  {publications.map((publication) => (
                    <Link
                      key={publication.id}
                      to={`/publications/${publication.id}`}
                      className="block rounded-xl border border-brand-primary/10 p-4 transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-text-secondary">
                        <span>{publication.year}</span>
                        <span>{publication.publication_type}</span>
                        {publication.axis_title && <span>{publication.axis_title}</span>}
                      </div>
                      <h3 className="font-bold leading-snug text-brand-primary">{publication.title}</h3>
                      <p className="mt-1 line-clamp-1 font-serif text-sm text-text-secondary">
                        {publication.venue || publication.authors}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
