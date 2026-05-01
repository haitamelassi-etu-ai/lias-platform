import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Send, FolderKanban, BookOpen, Mic2, Clock3, CheckCircle2 } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  ApiError,
  createCommunication,
  createProject,
  createPublication,
  listAxes,
  listMyCommunications,
  listMyProjects,
  listMyPublications,
  type Communication,
  type Project,
  type Publication,
  type ResearchAxis,
} from "../../lib/api";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  validated:        { label: "Validé",              cls: "bg-emerald-100 text-emerald-700" },
  rejected:         { label: "Rejeté",              cls: "bg-rose-100 text-rose-700" },
  needs_correction: { label: "Correction demandée", cls: "bg-amber-100 text-amber-700" },
  pending:          { label: "En attente",           cls: "bg-slate-100 text-slate-700" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: "bg-slate-100 text-slate-700" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${s.cls}`}>
      {s.label}
    </span>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1">{msg}</p>;
}

const inputCls = (err?: string) =>
  `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary ${
    err ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

export function MemberPanel() {
  const { token, user } = useAuth();

  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({ title: "", summary: "", start_date: "", end_date: "", funding: "", axis_id: "" });
  const [projectErrors, setProjectErrors] = useState<Record<string, string>>({});

  const [publicationForm, setPublicationForm] = useState({
    title: "", authors: user?.full_name || "", publication_type: "Journal Article",
    year: String(new Date().getFullYear()), venue: "", doi: "", abstract: "", axis_id: "",
  });
  const [publicationErrors, setPublicationErrors] = useState<Record<string, string>>({});

  const [communicationForm, setCommunicationForm] = useState({
    title: "", authors: user?.full_name || "", event_name: "",
    communication_type: "Communication nationale", event_date: "",
    location: "", country: "Maroc", abstract: "", axis_id: "",
  });
  const [communicationErrors, setCommunicationErrors] = useState<Record<string, string>>({});

  const pendingCount = useMemo(() => {
    return [
      ...projects.filter(i => i.validation_status === "pending"),
      ...publications.filter(i => i.validation_status === "pending"),
      ...communications.filter(i => i.validation_status === "pending"),
    ].length;
  }, [projects, publications, communications]);

  const loadWorkspace = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [axesData, projectsData, publicationsData, communicationsData] = await Promise.all([
        listAxes(),
        listMyProjects(token),
        listMyPublications(token),
        listMyCommunications(token),
      ]);
      setAxes(axesData);
      setProjects(projectsData);
      setPublications(publicationsData);
      setCommunications(communicationsData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger l'espace membre");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadWorkspace(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Project ──────────────────────────────────────────────────────────────
  const validateProject = () => {
    const e: Record<string, string> = {};
    if (!projectForm.title.trim()) e.title = "Le titre est requis.";
    if (!projectForm.summary.trim()) e.summary = "Le résumé est requis.";
    if (projectForm.start_date && projectForm.end_date && projectForm.end_date < projectForm.start_date)
      e.end_date = "La date de fin doit être postérieure à la date de début.";
    return e;
  };

  const handleProjectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateProject();
    if (Object.keys(errs).length) { setProjectErrors(errs); return; }
    setProjectErrors({});
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await createProject(token, {
        title: projectForm.title, summary: projectForm.summary,
        lead_member_name: user?.full_name, funding: projectForm.funding || undefined,
        start_date: projectForm.start_date || undefined, end_date: projectForm.end_date || undefined,
        axis_id: projectForm.axis_id ? Number(projectForm.axis_id) : undefined, is_public: true,
      });
      setProjectForm({ title: "", summary: "", start_date: "", end_date: "", funding: "", axis_id: "" });
      setNotice("Projet soumis avec succès. Il sera traité par l'administration.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de soumission du projet");
    }
  };

  // ── Publication ───────────────────────────────────────────────────────────
  const validatePublication = () => {
    const e: Record<string, string> = {};
    if (!publicationForm.title.trim()) e.title = "Le titre est requis.";
    if (!publicationForm.authors.trim()) e.authors = "Les auteurs sont requis.";
    const yr = Number(publicationForm.year);
    if (!publicationForm.year || isNaN(yr) || yr < 2000 || yr > 2100) e.year = "Année invalide (2000–2100).";
    return e;
  };

  const handlePublicationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validatePublication();
    if (Object.keys(errs).length) { setPublicationErrors(errs); return; }
    setPublicationErrors({});
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await createPublication(token, {
        title: publicationForm.title, authors: publicationForm.authors,
        publication_type: publicationForm.publication_type, year: Number(publicationForm.year),
        venue: publicationForm.venue || undefined, doi: publicationForm.doi || undefined,
        abstract: publicationForm.abstract || undefined,
        axis_id: publicationForm.axis_id ? Number(publicationForm.axis_id) : undefined,
      });
      setPublicationForm({ title: "", authors: user?.full_name || "", publication_type: "Journal Article", year: String(new Date().getFullYear()), venue: "", doi: "", abstract: "", axis_id: "" });
      setNotice("Publication soumise avec succès.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de soumission de la publication");
    }
  };

  // ── Communication ─────────────────────────────────────────────────────────
  const validateCommunication = () => {
    const e: Record<string, string> = {};
    if (!communicationForm.title.trim()) e.title = "Le titre est requis.";
    if (!communicationForm.event_name.trim()) e.event_name = "Le nom de l'événement est requis.";
    return e;
  };

  const handleCommunicationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateCommunication();
    if (Object.keys(errs).length) { setCommunicationErrors(errs); return; }
    setCommunicationErrors({});
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await createCommunication(token, {
        title: communicationForm.title, authors: communicationForm.authors,
        event_name: communicationForm.event_name, communication_type: communicationForm.communication_type,
        event_date: communicationForm.event_date || undefined, location: communicationForm.location || undefined,
        country: communicationForm.country || undefined, abstract: communicationForm.abstract || undefined,
        axis_id: communicationForm.axis_id ? Number(communicationForm.axis_id) : undefined,
      });
      setCommunicationForm({ title: "", authors: user?.full_name || "", event_name: "", communication_type: "Communication nationale", event_date: "", location: "", country: "Maroc", abstract: "", axis_id: "" });
      setNotice("Communication soumise avec succès.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de soumission de la communication");
    }
  };

  const allSubmissions = [
    ...projects.map(i => ({ id: `project-${i.id}`, type: "Projet", title: i.title, created_at: i.created_at, status: i.validation_status })),
    ...publications.map(i => ({ id: `pub-${i.id}`, type: "Publication", title: i.title, created_at: i.created_at, status: i.validation_status })),
    ...communications.map(i => ({ id: `comm-${i.id}`, type: "Communication", title: i.title, created_at: i.created_at, status: i.validation_status })),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 12);

  return (
    <div className="py-6 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-bold text-brand-primary">Panel Membre Professionnel</h1>
        <p className="text-text-secondary font-serif mt-1">
          Soumettez vos projets, publications et communications, puis suivez leur validation.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-medium">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium">{notice}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <FolderKanban size={16} />, label: "Projets", value: projects.length, cls: "text-brand-primary" },
          { icon: <BookOpen size={16} />, label: "Publications", value: publications.length, cls: "text-brand-primary" },
          { icon: <Mic2 size={16} />, label: "Communications", value: communications.length, cls: "text-brand-primary" },
          { icon: <Clock3 size={16} />, label: "En attente", value: pendingCount, cls: "text-amber-700" },
        ].map(({ icon, label, value, cls }) => (
          <div key={label} className="bg-white border border-brand-primary/10 rounded-xl p-4">
            <div className={`flex items-center gap-2 font-bold mb-2 ${cls}`}>{icon} {label}</div>
            <div className={`text-3xl font-bold ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">Chargement de votre espace membre...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projet */}
            <form onSubmit={handleProjectSubmit} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-brand-primary">Soumettre un projet</h2>
              <div>
                <input value={projectForm.title} onChange={e => setProjectForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre du projet *" className={inputCls(projectErrors.title)} />
                <FieldError msg={projectErrors.title} />
              </div>
              <div>
                <textarea value={projectForm.summary} onChange={e => setProjectForm(p => ({ ...p, summary: e.target.value }))} placeholder="Résumé *" className={`${inputCls(projectErrors.summary)} min-h-24`} />
                <FieldError msg={projectErrors.summary} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Date début</label>
                  <input type="date" value={projectForm.start_date} onChange={e => setProjectForm(p => ({ ...p, start_date: e.target.value }))} className={inputCls()} />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Date fin</label>
                  <input type="date" value={projectForm.end_date} onChange={e => setProjectForm(p => ({ ...p, end_date: e.target.value }))} className={inputCls(projectErrors.end_date)} />
                  <FieldError msg={projectErrors.end_date} />
                </div>
              </div>
              <input value={projectForm.funding} onChange={e => setProjectForm(p => ({ ...p, funding: e.target.value }))} placeholder="Financement (optionnel)" className={inputCls()} />
              <select value={projectForm.axis_id} onChange={e => setProjectForm(p => ({ ...p, axis_id: e.target.value }))} className={inputCls()}>
                <option value="">Axe de recherche (optionnel)</option>
                {axes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
              <button type="submit" className="w-full bg-brand-primary text-white font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors">
                <Send size={16} /> Envoyer projet
              </button>
            </form>

            {/* Publication */}
            <form onSubmit={handlePublicationSubmit} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-brand-primary">Soumettre une publication</h2>
              <div>
                <input value={publicationForm.title} onChange={e => setPublicationForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre *" className={inputCls(publicationErrors.title)} />
                <FieldError msg={publicationErrors.title} />
              </div>
              <div>
                <input value={publicationForm.authors} onChange={e => setPublicationForm(p => ({ ...p, authors: e.target.value }))} placeholder="Auteurs *" className={inputCls(publicationErrors.authors)} />
                <FieldError msg={publicationErrors.authors} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={publicationForm.publication_type} onChange={e => setPublicationForm(p => ({ ...p, publication_type: e.target.value }))} className={inputCls()}>
                  <option>Journal Article</option>
                  <option>Conference Paper</option>
                  <option>Book Chapter</option>
                  <option>Poster</option>
                </select>
                <div>
                  <input type="number" min={2000} max={2100} value={publicationForm.year} onChange={e => setPublicationForm(p => ({ ...p, year: e.target.value }))} placeholder="Année *" className={inputCls(publicationErrors.year)} />
                  <FieldError msg={publicationErrors.year} />
                </div>
              </div>
              <input value={publicationForm.venue} onChange={e => setPublicationForm(p => ({ ...p, venue: e.target.value }))} placeholder="Revue / Conférence" className={inputCls()} />
              <input value={publicationForm.doi} onChange={e => setPublicationForm(p => ({ ...p, doi: e.target.value }))} placeholder="DOI (optionnel)" className={inputCls()} />
              <select value={publicationForm.axis_id} onChange={e => setPublicationForm(p => ({ ...p, axis_id: e.target.value }))} className={inputCls()}>
                <option value="">Axe de recherche (optionnel)</option>
                {axes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
              <button type="submit" className="w-full bg-brand-primary text-white font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors">
                <Send size={16} /> Envoyer publication
              </button>
            </form>

            {/* Communication */}
            <form onSubmit={handleCommunicationSubmit} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-brand-primary">Soumettre une communication</h2>
              <div>
                <input value={communicationForm.title} onChange={e => setCommunicationForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre *" className={inputCls(communicationErrors.title)} />
                <FieldError msg={communicationErrors.title} />
              </div>
              <div>
                <input value={communicationForm.event_name} onChange={e => setCommunicationForm(p => ({ ...p, event_name: e.target.value }))} placeholder="Nom de l'événement *" className={inputCls(communicationErrors.event_name)} />
                <FieldError msg={communicationErrors.event_name} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={communicationForm.communication_type} onChange={e => setCommunicationForm(p => ({ ...p, communication_type: e.target.value }))} className={inputCls()}>
                  <option>Communication nationale</option>
                  <option>Communication internationale</option>
                  <option>Poster</option>
                  <option>Séminaire</option>
                </select>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Date événement</label>
                  <input type="date" value={communicationForm.event_date} onChange={e => setCommunicationForm(p => ({ ...p, event_date: e.target.value }))} className={inputCls()} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={communicationForm.location} onChange={e => setCommunicationForm(p => ({ ...p, location: e.target.value }))} placeholder="Lieu" className={inputCls()} />
                <input value={communicationForm.country} onChange={e => setCommunicationForm(p => ({ ...p, country: e.target.value }))} placeholder="Pays" className={inputCls()} />
              </div>
              <select value={communicationForm.axis_id} onChange={e => setCommunicationForm(p => ({ ...p, axis_id: e.target.value }))} className={inputCls()}>
                <option value="">Axe de recherche (optionnel)</option>
                {axes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
              <button type="submit" className="w-full bg-brand-primary text-white font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors">
                <Send size={16} /> Envoyer communication
              </button>
            </form>
          </div>

          <div className="bg-white border border-brand-primary/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-brand-primary mb-4">Mes soumissions récentes</h2>
            <div className="space-y-3">
              {allSubmissions.map(item => (
                <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-text-secondary font-bold">{item.type}</div>
                    <div className="font-bold text-brand-primary">{item.title}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
            {allSubmissions.length === 0 && (
              <div className="text-center text-text-secondary font-serif py-10">Aucune soumission pour le moment.</div>
            )}
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <CheckCircle2 size={16} />
              Les soumissions sont automatiquement envoyées en modération.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
