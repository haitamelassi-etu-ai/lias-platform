import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Building,
  FileText,
  Link as LinkIcon,
  Save,
  Check,
  Download,
} from "lucide-react";
import {
  ApiError,
  importOrcidPublications,
  linkOrcid,
  listAxes,
  updateMyProfile,
  getMyProfile,
  type MemberProfile,
  type ResearchAxis,
} from "../lib/api";

export function Profile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [axes, setAxes] = useState<ResearchAxis[]>([]);

  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("chercheur");
  const [researchAxisId, setResearchAxisId] = useState<number | null>(null);
  const [biography, setBiography] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [externalLinks, setExternalLinks] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

  useEffect(() => {
    const loadProfile = async () => {
      if (!token || !user) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [profileData, axesData] = await Promise.all([
          getMyProfile(token),
          listAxes(),
        ]);

        setProfile(profileData);
        setAxes(axesData);

        setFullName(profileData.full_name);
        setGrade(profileData.grade || "chercheur");
        setResearchAxisId(profileData.research_axis_id);
        setBiography(profileData.biography || "");
        setOrcidId(profileData.orcid_id || "");
        setExternalLinks(profileData.external_links || "");
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger le profil");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [token, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const updated = await updateMyProfile(token, {
        full_name: fullName,
        grade,
        biography,
        orcid_id: orcidId || null,
        external_links: externalLinks || null,
        research_axis_id: researchAxisId,
      });
      setProfile(updated);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible de sauvegarder le profil");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkOrcid = async () => {
    if (!token) return;
    const id = orcidId.trim();
    if (!id) {
      setError("Veuillez renseigner un identifiant ORCID");
      return;
    }
    if (!ORCID_REGEX.test(id)) {
      setError("Format ORCID invalide. Le format attendu est : 0000-0000-0000-0000");
      return;
    }

    setError(null);
    setNotice(null);
    setIsLinking(true);

    try {
      const updated = await linkOrcid(token, id);
      setProfile(updated);
      setOrcidId(updated.orcid_id || "");
      setNotice("Compte ORCID lié avec succès. Vous pouvez maintenant importer vos publications.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Échec de la liaison ORCID. Vérifiez votre connexion et réessayez.");
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleImportOrcid = async () => {
    if (!token) return;
    const id = orcidId.trim() || profile?.orcid_id || "";
    if (!id) {
      setError("Aucun ORCID lié. Veuillez d'abord lier votre compte ORCID.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsImporting(true);

    try {
      const result = await importOrcidPublications(token, id || undefined);
      setNotice(`Import terminé : ${result.imported} publication(s) importée(s), ${result.skipped} ignorée(s).`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible d'importer depuis ORCID. Vérifiez votre connexion.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="py-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-sans font-bold text-brand-primary">
          Mon Profil Scientifique
        </h1>
        <p className="text-text-secondary font-serif mt-1">
          Gérez vos informations publiques et vos liaisons académiques.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium">
          {notice}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-text-secondary font-serif">Chargement du profil...</div>
      ) : (

      <div className="bg-white rounded-2xl shadow-sm border border-brand-primary/5 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-8">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
              <div className="w-full h-full bg-brand-tertiary rounded-xl flex items-center justify-center overflow-hidden">
                <User size={40} className="text-brand-primary/20" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                  Nom Complet
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                  Email Institutionnel
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || user?.email || ""}
                    className="block w-full pl-10 sm:text-sm border-gray-200 rounded-xl bg-gray-100 text-gray-500 py-3 border cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                  Statut
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Building size={18} />
                  </div>
                  <select
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                  >
                    <option value="chercheur">Chercheur / Enseignant-Chercheur</option>
                    <option value="doc">Doctorant</option>
                    <option value="postdoc">Post-Doctorant</option>
                    <option value="inge">Ingénieur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                  Axe de Recherche Principal
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FileText size={18} />
                  </div>
                  <select
                    value={researchAxisId?.toString() || ""}
                    onChange={(event) =>
                      setResearchAxisId(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                  >
                    <option value="">Selectionnez un axe</option>
                    {axes.map((axis) => (
                      <option key={axis.id} value={axis.id.toString()}>{axis.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Biographie Scientifique (FR)
              </label>
              <textarea
                rows={4}
                value={biography}
                onChange={(event) => setBiography(event.target.value)}
                className="block w-full sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 px-4 border bg-gray-50/50 font-serif"
                placeholder="Présentez brièvement vos thématiques de recherche..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Identifiants Externes
              </label>
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 text-sm font-bold text-gray-600">ORCID</span>
                  <input
                    type="text"
                    value={orcidId}
                    onChange={(event) => setOrcidId(event.target.value)}
                    placeholder="0000-0000-0000-0000"
                    className="flex-1 min-w-[160px] sm:text-sm border-gray-300 rounded-lg py-2 px-3 border bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleLinkOrcid}
                    disabled={isLinking || !orcidId.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LinkIcon size={13} />
                    {isLinking ? "Liaison..." : "Lier"}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportOrcid}
                    disabled={isImporting || (!orcidId.trim() && !profile?.orcid_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-primary/5 text-brand-primary rounded-lg text-xs font-bold border border-brand-primary/20 hover:bg-brand-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={13} />
                    {isImporting ? "Import..." : "Importer"}
                  </button>
                </div>
                {profile?.orcid_id && (
                  <p className="text-xs text-green-600 font-medium pl-[88px]">
                    ✓ ORCID lié : {profile.orcid_id}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <span className="w-24 text-sm font-bold text-gray-600">Liens</span>
                  <input
                    type="text"
                    value={externalLinks}
                    onChange={(event) => setExternalLinks(event.target.value)}
                    placeholder="Google Scholar, HAL, LinkedIn..."
                    className="flex-1 sm:text-sm border-gray-300 rounded-lg py-2 px-3 border bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  if (!profile) return;
                  setFullName(profile.full_name);
                  setGrade(profile.grade || "chercheur");
                  setResearchAxisId(profile.research_axis_id);
                  setBiography(profile.biography || "");
                  setOrcidId(profile.orcid_id || "");
                  setExternalLinks(profile.external_links || "");
                  setError(null);
                  setNotice(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary rounded-xl text-sm font-bold text-white hover:bg-brand-primary/90 transition-colors shadow-md disabled:opacity-70"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">Enregistrement...</span>
                ) : isSaved ? (
                  <span className="flex items-center gap-2"><Check size={18} /> Sauvegardé</span>
                ) : (
                  <span className="flex items-center gap-2"><Save size={18} /> Enregistrer</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
