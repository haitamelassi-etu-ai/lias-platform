import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Building,
  Check,
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  ApiError,
  getMyProfile,
  importOrcidPublications,
  linkOrcid,
  listAxes,
  lookupOrcid,
  updateMyProfile,
  type MemberProfile,
  type OrcidPreview,
  type ResearchAxis,
} from "../lib/api";

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item}>
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-11 animate-pulse rounded-xl bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="mt-6 h-28 animate-pulse rounded-xl bg-gray-100" />
        </div>
        <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
          <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusLine({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`rounded-full px-2 py-1 text-xs font-bold ${done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
        {done ? "OK" : "À faire"}
      </span>
    </div>
  );
}

export function Profile() {
  const { user, token, refreshUser } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [axes, setAxes] = useState<ResearchAxis[]>([]);

  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("chercheur");
  const [researchAxisId, setResearchAxisId] = useState<number | null>(null);
  const [biography, setBiography] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [externalLinks, setExternalLinks] = useState("");

  const [orcidPreview, setOrcidPreview] = useState<OrcidPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPreviewingOrcid, setIsPreviewingOrcid] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const normalizedOrcidInput = orcidId.trim().toUpperCase();
  const linkedOrcid = (profile?.orcid_id || "").trim().toUpperCase();
  const isOrcidLinked = Boolean(linkedOrcid);
  const isNameLocked = Boolean(user?.orcid_name_locked);
  const hasValidOrcidInput = ORCID_REGEX.test(normalizedOrcidInput);
  const publicProfileScore = [
    Boolean(fullName.trim()),
    Boolean(grade),
    Boolean(researchAxisId),
    Boolean(biography.trim()),
    Boolean(externalLinks.trim()),
    isOrcidLinked,
  ].filter(Boolean).length;

  const loadProfile = async () => {
    if (!token || !user) return;

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
      setError(err instanceof ApiError ? err.message : "Impossible de charger le profil");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (notice) toast.success(notice);
  }, [notice]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const updated = await updateMyProfile(token, {
        full_name: fullName,
        grade,
        biography,
        external_links: externalLinks || null,
        research_axis_id: researchAxisId,
      });
      setProfile(updated);
      setIsSaved(true);
      setNotice("Profil scientifique sauvegardé.");
      window.setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de sauvegarder le profil");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewOrcid = async () => {
    if (isOrcidLinked) {
      setError("Un ORCID est déjà lié à ce profil. Il ne peut pas être remplacé.");
      return;
    }
    if (!normalizedOrcidInput) {
      setError("Veuillez renseigner un identifiant ORCID.");
      return;
    }
    if (!hasValidOrcidInput) {
      setError("Format ORCID invalide. Exemple attendu : 0000-0000-0000-0000");
      return;
    }

    setError(null);
    setNotice(null);
    setIsPreviewingOrcid(true);
    try {
      const preview = await lookupOrcid(normalizedOrcidInput);
      setOrcidPreview(preview);
      setNotice("Profil ORCID trouvé. Vérifiez les informations avant liaison.");
    } catch (err) {
      setOrcidPreview(null);
      setError(err instanceof ApiError ? err.message : "Impossible de verifier cet ORCID.");
    } finally {
      setIsPreviewingOrcid(false);
    }
  };

  const handleLinkOrcid = async () => {
    if (!token) return;
    if (isOrcidLinked) {
      setError("Un ORCID est déjà lié à ce profil. Il ne peut pas être remplacé.");
      return;
    }
    if (!normalizedOrcidInput) {
      setError("Veuillez renseigner un identifiant ORCID.");
      return;
    }
    if (!hasValidOrcidInput) {
      setError("Format ORCID invalide. Exemple attendu : 0000-0000-0000-0000");
      return;
    }

    setError(null);
    setNotice(null);
    setIsLinking(true);

    try {
      const updated = await linkOrcid(token, normalizedOrcidInput);
      setProfile(updated);
      setOrcidId(updated.orcid_id || "");
      setOrcidPreview(null);
      await refreshUser();
      setNotice("Compte ORCID lié avec succès. Vous pouvez maintenant importer vos publications.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de la liaison ORCID. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleImportOrcid = async () => {
    if (!token) return;
    if (!isOrcidLinked) {
      setError("Aucun ORCID lié. Veuillez d'abord lier votre compte ORCID.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsImporting(true);

    try {
      const result = await importOrcidPublications(token);
      setNotice(`Import terminé : ${result.imported} publication(s) importée(s), ${result.skipped} ignorée(s).`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'importer depuis ORCID. Vérifiez votre connexion.");
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    if (!profile) return;
    setFullName(profile.full_name);
    setGrade(profile.grade || "chercheur");
    setResearchAxisId(profile.research_axis_id);
    setBiography(profile.biography || "");
    setOrcidId(profile.orcid_id || "");
    setExternalLinks(profile.external_links || "");
    setOrcidPreview(null);
    setError(null);
    setNotice(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl py-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-secondary">
            <ShieldCheck size={14} />
            Identité chercheur
          </div>
          <h1 className="text-3xl font-sans font-bold text-brand-primary">
            Mon profil scientifique
          </h1>
          <p className="mt-1 max-w-2xl text-text-secondary font-serif">
            Gère les informations publiques du chercheur, l'axe principal et la liaison ORCID officielle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-brand-primary/15 bg-white px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.42fr]">
          <section className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm">
            <div className="bg-brand-primary p-6 text-white sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <User size={34} />
                </div>
                <div>
                  <p className="text-sm text-white/65">Profil public LIAS</p>
                  <h2 className="mt-1 text-2xl font-bold">{fullName || "Membre LIAS"}</h2>
                  <p className="mt-1 text-sm text-white/70">
                    {profile?.email || user?.email} {profile?.research_axis_title ? `- ${profile.research_axis_title}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8 p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-brand-primary">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      disabled={isNameLocked}
                      className={`block w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition-colors ${
                        isNameLocked
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                          : "border-gray-300 bg-gray-50/50 focus:border-brand-secondary"
                      }`}
                    />
                  </div>
                  {isNameLocked && (
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      Nom verrouillé car il provient du compte ORCID lié.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-brand-primary">
                    Email institutionnel
                  </label>
                  <div className="relative">
                    <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      disabled
                      value={profile?.email || user?.email || ""}
                      className="block w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 py-3 pl-10 pr-3 text-sm text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-brand-primary">
                    Statut
                  </label>
                  <div className="relative">
                    <Building size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={grade}
                      onChange={(event) => setGrade(event.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-gray-50/50 py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brand-secondary"
                    >
                      <option value="chercheur">Chercheur / Enseignant-Chercheur</option>
                      <option value="doc">Doctorant</option>
                      <option value="postdoc">Post-Doctorant</option>
                      <option value="inge">Ingénieur</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-brand-primary">
                    Axe de recherche principal
                  </label>
                  <div className="relative">
                    <FileText size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={researchAxisId?.toString() || ""}
                      onChange={(event) => setResearchAxisId(event.target.value ? Number(event.target.value) : null)}
                      className="block w-full rounded-xl border border-gray-300 bg-gray-50/50 py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:border-brand-secondary"
                    >
                      <option value="">Sélectionnez un axe</option>
                      {axes.map((axis) => (
                        <option key={axis.id} value={axis.id.toString()}>{axis.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-brand-primary">
                  Biographie scientifique
                </label>
                <textarea
                  rows={5}
                  value={biography}
                  onChange={(event) => setBiography(event.target.value)}
                  className="block w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-secondary font-serif"
                  placeholder="Présentez brièvement vos thématiques de recherche, méthodes et domaines d'application."
                />
              </div>

              <div className="rounded-2xl border border-brand-primary/10 bg-brand-tertiary/40 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                      <ShieldCheck size={20} />
                      Liaison ORCID
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary font-serif">
                      L'ORCID identifie officiellement le chercheur. Une fois lié, il est verrouillé pour éviter les erreurs d'identité.
                    </p>
                  </div>
                  {isOrcidLinked && (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <Check size={13} />
                      Vérifié
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                  <input
                    type="text"
                    value={orcidId}
                    onChange={(event) => {
                      setOrcidId(event.target.value);
                      setOrcidPreview(null);
                    }}
                    disabled={isOrcidLinked}
                    placeholder="0000-0000-0000-0000"
                    className={`min-w-0 rounded-xl border px-3 py-2.5 font-mono text-sm outline-none transition-colors ${
                      isOrcidLinked
                        ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-gray-300 bg-white focus:border-brand-secondary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => void handlePreviewOrcid()}
                    disabled={isOrcidLinked || isPreviewingOrcid || !normalizedOrcidInput}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-primary/15 bg-white px-3 py-2 text-xs font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ExternalLink size={13} />
                    {isPreviewingOrcid ? "Vérification..." : "Vérifier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLinkOrcid()}
                    disabled={isOrcidLinked || isLinking || !normalizedOrcidInput}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LinkIcon size={13} />
                    {isLinking ? "Liaison..." : "Lier"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleImportOrcid()}
                    disabled={isImporting || !isOrcidLinked}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-3 py-2 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download size={13} />
                    {isImporting ? "Import..." : "Importer"}
                  </button>
                </div>

                {isOrcidLinked && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-bold">ORCID lié : {linkedOrcid}</p>
                    <p className="mt-1 font-serif">
                      Pour corriger cet identifiant, l'utilisateur doit passer par l'administration afin de garder une trace fiable.
                    </p>
                    <a
                      href={`https://orcid.org/${linkedOrcid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 underline"
                    >
                      Voir le profil ORCID
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {orcidPreview && !isOrcidLinked && (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <p className="font-bold">{orcidPreview.full_name || "Nom ORCID non renseigné"}</p>
                    <p className="mt-1 text-xs font-mono">{orcidPreview.orcid_id}</p>
                    <p className="mt-2 font-serif">
                      {orcidPreview.works.length} publication(s) détectée(s) dans ORCID. Cliquez sur "Lier" si ce profil est correct.
                    </p>
                  </div>
                )}

                {!isOrcidLinked && (
                  <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="font-serif">
                      Vérifiez l'identifiant avant liaison. Après validation, il sera verrouillé sur ce compte.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-brand-primary">
                  Liens externes
                </label>
                <input
                  type="text"
                  value={externalLinks}
                  onChange={(event) => setExternalLinks(event.target.value)}
                  placeholder="Google Scholar, HAL, LinkedIn..."
                  className="block w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-secondary"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 px-6 py-2 text-sm font-bold text-text-secondary transition-colors hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-primary/90 disabled:opacity-70"
                >
                  {isSaving ? (
                    "Enregistrement..."
                  ) : isSaved ? (
                    <>
                      <Check size={18} /> Sauvegardé
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-brand-primary">Qualité du profil</h2>
              <p className="mt-1 text-sm text-text-secondary font-serif">
                Les éléments complets améliorent la fiche publique du membre.
              </p>
              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold text-text-secondary">Complétion</span>
                  <span className="text-2xl font-bold text-brand-primary">{publicProfileScore}/6</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand-secondary transition-all" style={{ width: `${Math.round((publicProfileScore / 6) * 100)}%` }} />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <StatusLine done={Boolean(fullName.trim())} label="Nom public" />
                <StatusLine done={Boolean(grade)} label="Statut" />
                <StatusLine done={Boolean(researchAxisId)} label="Axe principal" />
                <StatusLine done={Boolean(biography.trim())} label="Biographie" />
                <StatusLine done={Boolean(externalLinks.trim())} label="Liens externes" />
                <StatusLine done={isOrcidLinked} label="ORCID lie" />
              </div>
            </section>

            <section className="rounded-2xl border border-brand-primary/10 bg-brand-primary p-6 text-white shadow-sm">
              <h2 className="text-lg font-bold">Règle ORCID</h2>
              <p className="mt-2 text-sm text-white/75 font-serif">
                La modification directe de l'ORCID est bloquée après liaison. Cette règle protège l'identité scientifique et évite les imports attribués au mauvais chercheur.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
