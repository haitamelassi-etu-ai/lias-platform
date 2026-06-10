import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { BookOpen, ExternalLink, Mail, Search, UserRound } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ApiError, listMembers, type MemberProfile } from "../lib/api";

export function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listMembers();
        setMembers(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger les membres");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      const roleLabel = (member.grade || member.role).toLowerCase();
      const axisLabel = (member.research_axis_title || "").toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : member.full_name.toLowerCase().includes(normalizedSearch) ||
            axisLabel.includes(normalizedSearch) ||
            roleLabel.includes(normalizedSearch);

      const matchesRole =
        filterRole === "all" ? true : roleLabel.includes(filterRole.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [members, searchTerm, filterRole]);

  const canShowEmail = (email: string) => !email.endsWith("@annuaire.lias.ma");

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-brand-primary mb-4">
          Annuaire des Membres
        </h1>
        <p className="text-xl text-text-secondary font-serif max-w-3xl">
          Découvrez les chercheurs, enseignants-chercheurs, doctorants et ingénieurs qui font l'excellence du LIAS au quotidien.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 mb-10">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, expertise ou axe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary border bg-gray-50/50"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['all', 'directeur', 'professeur', 'doctorant', 'ingénieur'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-colors border ${
                  filterRole === role
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-text-secondary border-gray-200 hover:border-brand-primary/30'
                }`}
              >
                {role === 'all' ? 'Tous les profils' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredMembers.length > 0 && (
          <p className="text-xs text-text-secondary mt-3 font-serif">
            {filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""} trouvé{filteredMembers.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">
          Chargement des membres...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-brand-primary/5 h-full"
            >
              <div className="relative aspect-square overflow-hidden bg-brand-tertiary">
                <ImageWithFallback
                  src={
                    member.photo_url ||
                    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(member.full_name)}`
                  }
                  alt={member.full_name}
                  className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
                  <h3 className="font-sans text-2xl font-bold text-white mb-1 group-hover:text-brand-secondary transition-colors">
                    {member.full_name}
                  </h3>
                  <p className="font-sans text-brand-tertiary/90 text-sm font-medium">
                    {member.grade || member.role}
                  </p>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                {member.research_axis_title && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/5 text-brand-primary text-xs font-bold uppercase tracking-wider w-max mb-4">
                    {member.research_axis_title}
                  </div>
                )}

                {member.interests && (
                  <p className="text-text-secondary font-serif text-sm line-clamp-2 mb-4">
                    {member.interests}
                  </p>
                )}

                <div className="mb-4 rounded-lg border border-brand-primary/10 bg-brand-primary/[0.03] px-3 py-2 text-xs font-bold text-brand-primary">
                  {member.publication_count} publication{member.publication_count > 1 ? "s" : ""} valide{member.publication_count > 1 ? "s" : ""}
                </div>

                <div className="mt-auto pt-4 flex flex-wrap items-center gap-2 border-t border-brand-primary/5">
                  <Link
                    to={`/publications?search=${encodeURIComponent(member.full_name)}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-primary/90"
                    title={`Voir les publications de ${member.full_name}`}
                  >
                    <BookOpen size={15} />
                    Publications
                  </Link>

                  <Link
                    to={`/members/${member.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/10 px-3 py-2 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-primary/5"
                    title={`Voir le profil de ${member.full_name}`}
                  >
                    <UserRound size={15} />
                    Profil
                  </Link>

                  {canShowEmail(member.email) && (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-text-secondary hover:text-brand-secondary transition-colors"
                      title={`Contacter ${member.full_name}`}
                    >
                      <Mail size={15} />
                      Contact
                    </a>
                  )}

                  {member.orcid_id ? (
                    <a
                      href={`https://orcid.org/${member.orcid_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
                      title="Profil ORCID"
                    >
                      <ExternalLink size={13} />
                      ORCID
                    </a>
                  ) : (
                    <span className="ml-auto rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500">
                      ORCID non publie
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="col-span-full py-20 text-center text-text-secondary font-serif">
              Aucun membre trouvé correspondant à vos critères de recherche.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
