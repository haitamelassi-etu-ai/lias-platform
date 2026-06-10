import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  Inbox,
  Layers3,
  Mic2,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  ApiError,
  createCommunication,
  createProject,
  createPublication,
  importOrcidPublications,
  listAxes,
  listMyCommunications,
  listMyNotifications,
  listMyProjects,
  listMyPublications,
  listMyValidationTimeline,
  markAllNotificationsRead,
  requestEditPublication,
  requestDeletePublication,
  type Communication,
  type MemberNotification,
  type Project,
  type Publication,
  type ResearchAxis,
  type ValidationTimelineItem,
} from "../../lib/api";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "primary";
  onConfirm: () => Promise<void>;
};

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

function MemberPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {[0, 1].map((item) => (
          <section key={item} className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
            <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="rounded-xl border border-gray-100 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <div className="h-5 w-52 animate-pulse rounded bg-gray-200" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-brand-primary/15 bg-brand-tertiary/40 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-secondary shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-bold text-brand-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary font-serif">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-primary/90"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 bg-white px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MemberPanel() {
  const { token, user } = useAuth();

  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [timeline, setTimeline] = useState<ValidationTimelineItem[]>([]);

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

  const [isImporting, setIsImporting] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionTypeFilter, setSubmissionTypeFilter] = useState<"all" | "Projet" | "Publication" | "Communication">("all");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<"all" | string>("all");
  const [submissionMode, setSubmissionMode] = useState<"project" | "publication" | "communication">("publication");
  const [isMarkingNotifications, setIsMarkingNotifications] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const handleOrcidImport = async () => {
    if (!token) return;
    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await importOrcidPublications(token);
      setNotice(`Import ORCID terminé : ${result.imported} publication(s) importée(s), ${result.skipped} déjà existante(s).`);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'import ORCID");
    } finally {
      setIsImporting(false);
    }
  };

  const [editTarget, setEditTarget] = useState<Publication | null>(null);
  const [editForm, setEditForm] = useState({ title: "", authors: "", publication_type: "", year: "", venue: "", doi: "", abstract: "" });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const openEdit = (pub: Publication) => {
    setEditTarget(pub);
    setEditForm({
      title: pub.title,
      authors: pub.authors,
      publication_type: pub.publication_type,
      year: String(pub.year),
      venue: pub.venue || "",
      doi: pub.doi || "",
      abstract: pub.abstract || "",
    });
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editTarget) return;
    setIsEditSubmitting(true);
    setError(null);
    try {
      await requestEditPublication(token, editTarget.id, {
        title: editForm.title,
        authors: editForm.authors,
        publication_type: editForm.publication_type,
        year: Number(editForm.year),
        venue: editForm.venue || undefined,
        doi: editForm.doi || undefined,
        abstract: editForm.abstract || undefined,
      });
      setEditTarget(null);
      setNotice("Demande de modification envoyée. Elle sera traitée par l'administration.");
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de la demande de modification");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteRequest = async (pub: Publication) => {
    if (!token) return;
    setConfirmAction({
      title: "Confirmer la demande de suppression",
      description: `Vous allez demander la suppression de "${pub.title}". La demande sera examinee par un administrateur avant application.`,
      confirmLabel: "Envoyer la demande",
      tone: "danger",
      onConfirm: async () => {
        setIsDeleting(pub.id);
        setError(null);
        try {
          await requestDeletePublication(token, pub.id);
          setNotice(`Demande de suppression envoyée pour "${pub.title}".`);
          setConfirmAction(null);
          await loadWorkspace();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Échec de la demande de suppression");
        } finally {
          setIsDeleting(null);
        }
      },
    });
  };

  const pendingCount = useMemo(() => {
    return [
      ...projects.filter(i => i.validation_status === "pending"),
      ...publications.filter(i => i.validation_status === "pending"),
      ...communications.filter(i => i.validation_status === "pending"),
    ].length;
  }, [projects, publications, communications]);

  const validatedCount = useMemo(() => {
    return [
      ...projects.filter(i => i.validation_status === "validated"),
      ...publications.filter(i => i.validation_status === "validated"),
      ...communications.filter(i => i.validation_status === "validated"),
    ].length;
  }, [projects, publications, communications]);

  const correctionCount = useMemo(() => {
    return [
      ...projects.filter(i => i.validation_status === "needs_correction"),
      ...publications.filter(i => i.validation_status === "needs_correction"),
      ...communications.filter(i => i.validation_status === "needs_correction"),
    ].length;
  }, [projects, publications, communications]);

  const loadWorkspace = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [axesData, projectsData, publicationsData, communicationsData, notificationsData, timelineData] = await Promise.all([
        listAxes(),
        listMyProjects(token),
        listMyPublications(token),
        listMyCommunications(token),
        listMyNotifications(token),
        listMyValidationTimeline(token),
      ]);
      setAxes(axesData);
      setProjects(projectsData);
      setPublications(publicationsData);
      setCommunications(communicationsData);
      setNotifications(notificationsData);
      setTimeline(timelineData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger l'espace membre");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadWorkspace(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (notice) toast.success(notice);
  }, [notice]);

  const handleMarkAllNotificationsRead = async () => {
    if (!token) return;
    setIsMarkingNotifications(true);
    try {
      await markAllNotificationsRead(token);
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de marquer les notifications");
    } finally {
      setIsMarkingNotifications(false);
    }
  };

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
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  const filteredSubmissions = allSubmissions.filter((item) => {
    const normalizedSearch = submissionSearch.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || item.title.toLowerCase().includes(normalizedSearch);
    const matchesType = submissionTypeFilter === "all" || item.type === submissionTypeFilter;
    const matchesStatus = submissionStatusFilter === "all" || item.status === submissionStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }).slice(0, 12);

  const pipelineStats = [
    { key: "pending", label: "En attente", count: allSubmissions.filter((item) => item.status === "pending").length, cls: "bg-amber-100 text-amber-700" },
    { key: "needs_correction", label: "Correction", count: allSubmissions.filter((item) => item.status === "needs_correction").length, cls: "bg-blue-100 text-blue-700" },
    { key: "validated", label: "Validées", count: allSubmissions.filter((item) => item.status === "validated").length, cls: "bg-emerald-100 text-emerald-700" },
    { key: "rejected", label: "Rejetées", count: allSubmissions.filter((item) => item.status === "rejected").length, cls: "bg-rose-100 text-rose-700" },
  ];

  const latestPublication = publications[0];
  const latestProject = projects[0];
  const latestCommunication = communications[0];
  const hasOrcidPublications = publications.some((publication) => publication.source === "orcid");
  const totalSubmissions = allSubmissions.length;
  const hasSubmissionFilters = Boolean(submissionSearch.trim()) || submissionTypeFilter !== "all" || submissionStatusFilter !== "all";
  const validationRate = totalSubmissions ? Math.round((validatedCount / totalSubmissions) * 100) : 0;
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;
  const notificationTone: Record<string, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  const submissionTabs = [
    { key: "publication", label: "Publication", icon: BookOpen, description: "Article, conférence, chapitre ou poster" },
    { key: "project", label: "Projet", icon: FolderKanban, description: "Projet de recherche ou partenariat" },
    { key: "communication", label: "Communication", icon: Mic2, description: "Séminaire, poster ou intervention" },
  ] as const;

  const readinessItems = [
    { label: "Auteur prérempli", done: Boolean(user?.full_name) },
    { label: "Axes de recherche disponibles", done: axes.length > 0 },
    { label: "Portfolio ORCID importé", done: hasOrcidPublications },
    { label: "Suivi des validations actif", done: totalSubmissions > 0 },
  ];

  return (
    <div className="py-6 max-w-7xl mx-auto w-full space-y-8">
      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction.title}
          description={confirmAction.description}
          confirmLabel={confirmAction.confirmLabel}
          tone={confirmAction.tone}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-secondary">
              <Sparkles size={14} />
              Espace chercheur LIAS
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-bold text-brand-primary">
              Panel membre
            </h1>
            <p className="mt-3 max-w-2xl text-text-secondary font-serif">
              Soumettez vos travaux, suivez les validations et gardez une vue claire sur votre activité scientifique.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#soumettre" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-600">
                <Send size={16} />
                Nouvelle soumission
              </a>
              <button
                type="button"
                onClick={() => void handleOrcidImport()}
                disabled={isImporting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#A6CE39]/50 bg-white px-4 py-2.5 text-sm font-bold text-[#2D7F3A] transition-colors hover:bg-[#A6CE39]/10 disabled:opacity-60"
              >
                <Download size={16} />
                {isImporting ? "Import ORCID..." : "Importer ORCID"}
              </button>
              <button
                type="button"
                onClick={() => void loadWorkspace()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
            </div>
          </div>

          <aside className="border-t border-brand-primary/10 bg-brand-primary p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
            <p className="text-sm text-white/65">Connecté en tant que</p>
            <h2 className="mt-1 text-xl font-bold">{user?.full_name ?? "Membre LIAS"}</h2>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-white/60">Validées</p>
                <p className="mt-2 text-3xl font-bold">{validatedCount}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-white/60">À suivre</p>
                <p className="mt-2 text-3xl font-bold">{pendingCount + correctionCount}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { icon: <FolderKanban size={18} />, label: "Projets", value: projects.length, detail: "Recherche", cls: "text-brand-primary", bg: "bg-brand-primary/10" },
          { icon: <BookOpen size={18} />, label: "Publications", value: publications.length, detail: "Articles", cls: "text-sky-700", bg: "bg-sky-50" },
          { icon: <Mic2 size={18} />, label: "Communications", value: communications.length, detail: "Présentations", cls: "text-indigo-700", bg: "bg-indigo-50" },
          { icon: <Clock3 size={18} />, label: "En attente", value: pendingCount, detail: "Modération", cls: "text-amber-700", bg: "bg-amber-50" },
          { icon: <AlertTriangle size={18} />, label: "Corrections", value: correctionCount, detail: "À traiter", cls: "text-rose-700", bg: "bg-rose-50" },
        ].map(({ icon, label, value, detail, cls, bg }) => (
          <div key={label} className="rounded-xl border border-brand-primary/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text-secondary">{label}</p>
                <div className={`mt-2 text-3xl font-bold ${cls}`}>{value}</div>
              </div>
              <div className={`rounded-lg p-2 ${bg} ${cls}`}>{icon}</div>
            </div>
            <p className="mt-3 text-xs font-medium text-text-secondary">{detail}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <MemberPanelSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-brand-primary">
                    <Bell size={20} />
                    Notifications
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary font-serif">
                    Décisions admin et retours importants sur vos demandes.
                  </p>
                </div>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAllNotificationsRead()}
                    disabled={isMarkingNotifications}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/15 px-3 py-2 text-xs font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary disabled:opacity-60"
                  >
                    <CheckCheck size={14} />
                    Tout lu
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border p-4 ${notificationTone[notification.category] ?? notificationTone.info} ${notification.is_read ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{notification.title}</p>
                        <p className="mt-1 text-sm">{notification.message}</p>
                      </div>
                      {!notification.is_read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-secondary" />}
                    </div>
                    <p className="mt-2 text-xs opacity-75">
                      {new Date(notification.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <EmptyState
                    icon={<Bell size={22} />}
                    title="Aucune notification"
                    description="Les décisions de modération et les retours admin apparaîtront ici automatiquement."
                    actionLabel="Actualiser"
                    onAction={() => void loadWorkspace()}
                  />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-brand-primary">Timeline de validation</h2>
              <p className="mt-1 text-sm text-text-secondary font-serif">
                Chaque soumission et chaque décision admin restent traçables.
              </p>
              <div className="mt-5 space-y-4">
                {timeline.slice(0, 6).map((item) => (
                  <div key={item.id} className="relative pl-7">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand-secondary ring-4 ring-brand-secondary/10" />
                    <div className="rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-brand-primary">{item.event}</p>
                          <p className="mt-1 line-clamp-1 text-sm text-text-secondary">{item.title}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.comment && (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          {item.comment}
                        </p>
                      )}
                      <p className="mt-3 text-xs text-text-secondary">
                        {new Date(item.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {item.actor_name ? ` · ${item.actor_name}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <EmptyState
                    icon={<Clock3 size={22} />}
                    title="Aucune trace de validation"
                    description="La timeline se construit dès qu'une publication, un projet ou une communication passe en modération."
                    actionLabel="Soumettre une publication"
                    onAction={() => {
                      setSubmissionMode("publication");
                      document.getElementById("soumettre")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                )}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-brand-primary">Pipeline de validation</h2>
                  <p className="mt-1 text-sm text-text-secondary font-serif">
                    Vue claire sur ce qui attend l'administration et ce qui est déjà validé.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-secondary">
                  {validationRate}% validé
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {pipelineStats.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSubmissionStatusFilter(item.key)}
                    className="rounded-xl border border-gray-100 p-4 text-left transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5"
                  >
                    <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider ${item.cls}`}>{item.label}</span>
                    <p className="mt-4 text-3xl font-bold text-brand-primary">{item.count}</p>
                  </button>
                ))}
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand-secondary transition-all" style={{ width: `${validationRate}%` }} />
              </div>
            </section>

            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-brand-primary">Portfolio scientifique</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-brand-tertiary p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Dernière publication</p>
                  <p className="mt-1 line-clamp-2 font-bold text-brand-primary">{latestPublication?.title ?? "Aucune publication soumise."}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Projet récent</p>
                    <p className="mt-1 line-clamp-2 text-sm font-bold text-brand-primary">{latestProject?.title ?? "Non renseigné"}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Communication récente</p>
                    <p className="mt-1 line-clamp-2 text-sm font-bold text-brand-primary">{latestCommunication?.title ?? "Non renseignée"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {readinessItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {item.done ? "OK" : "À faire"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section id="soumettre">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-primary">Nouvelle soumission</h2>
                <p className="mt-1 text-sm text-text-secondary font-serif">
                  Choisissez le type de contribution et envoyez-la directement en validation.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-secondary">
                <Layers3 size={14} />
                3 formulaires
              </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
              <div className="rounded-2xl border border-brand-primary/10 bg-white p-3 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-3">
                  {submissionTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = submissionMode === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSubmissionMode(tab.key)}
                        className={`rounded-xl p-4 text-left transition-colors ${
                          isActive
                            ? "bg-brand-secondary/10 text-brand-secondary"
                            : "text-text-secondary hover:bg-brand-tertiary hover:text-brand-primary"
                        }`}
                      >
                        <Icon size={18} />
                        <p className="mt-3 text-sm font-bold">{tab.label}</p>
                        <p className="mt-1 text-xs leading-snug">{tab.description}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-xl border border-gray-100 p-4">
            {/* Projet */}
            <form onSubmit={handleProjectSubmit} className={`${submissionMode === "project" ? "block" : "hidden"} space-y-3`}>
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
            <form onSubmit={handlePublicationSubmit} className={`${submissionMode === "publication" ? "block" : "hidden"} space-y-3`}>
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
              <div className="border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => void handleOrcidImport()}
                  disabled={isImporting}
                  className="w-full border-2 border-[#A6CE39] text-[#2D7F3A] font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-[#A6CE39]/10 transition-colors disabled:opacity-60 text-sm"
                >
                  <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" className="w-4 h-4" />
                  <Download size={14} />
                  {isImporting ? "Import en cours..." : "Importer depuis ORCID"}
                </button>
                <p className="text-xs text-text-secondary mt-1.5 text-center font-serif">
                  Importe automatiquement vos travaux depuis votre profil ORCID lié.
                </p>
              </div>
            </form>

            {/* Communication */}
            <form onSubmit={handleCommunicationSubmit} className={`${submissionMode === "communication" ? "block" : "hidden"} space-y-3`}>
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
              </div>

              <aside className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-brand-primary">Avant d'envoyer</h3>
                <div className="mt-4 space-y-3">
                  {[
                    "Titre clair et complet",
                    "Auteurs dans le bon ordre",
                    "Axe de recherche associé si possible",
                    "Résumé ou contexte suffisamment précis",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl bg-brand-tertiary p-3">
                      <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
                      <span className="text-sm font-medium text-text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-800">Validation</p>
                  <p className="mt-1 text-sm text-amber-700 font-serif">
                    Chaque contribution passe en modération avant d'apparaître publiquement sur le portail.
                  </p>
                </div>
              </aside>
            </div>
          </section>

          <div className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-primary">Mes soumissions récentes</h2>
                <p className="mt-1 text-sm text-text-secondary font-serif">
                  Suivez l'état de vos contributions et retrouvez rapidement un dossier.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    value={submissionSearch}
                    onChange={(event) => setSubmissionSearch(event.target.value)}
                    placeholder="Rechercher"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-secondary"
                  />
                </label>
                <select
                  value={submissionTypeFilter}
                  onChange={(event) => setSubmissionTypeFilter(event.target.value as typeof submissionTypeFilter)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text-secondary outline-none focus:border-brand-secondary"
                >
                  <option value="all">Tous les types</option>
                  <option value="Projet">Projets</option>
                  <option value="Publication">Publications</option>
                  <option value="Communication">Communications</option>
                </select>
                <select
                  value={submissionStatusFilter}
                  onChange={(event) => setSubmissionStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text-secondary outline-none focus:border-brand-secondary"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="validated">Validé</option>
                  <option value="needs_correction">Correction</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredSubmissions.map(item => {
                const isPub = item.id.startsWith("pub-");
                const rawPub = isPub ? publications.find(p => `pub-${p.id}` === item.id) : null;
                return (
                  <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-text-secondary font-bold">{item.type}</div>
                      <div className="font-bold text-brand-primary">{item.title}</div>
                      <div className="text-xs text-text-secondary mt-1">
                        {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={item.status} />
                      {isPub && rawPub && !rawPub.is_archived && rawPub.source !== "orcid" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(rawPub)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil size={12} /> Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRequest(rawPub)}
                            disabled={isDeleting === rawPub.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} /> {isDeleting === rawPub.id ? "..." : "Supprimer"}
                          </button>
                        </>
                      )}
                      {isPub && rawPub?.source === "orcid" && !rawPub.is_archived && (
                        <span className="px-2 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-600 border border-green-200">🔒 ORCID</span>
                      )}
                      {isPub && rawPub?.is_archived && (
                        <span className="px-2 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">Archivée</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredSubmissions.length === 0 && (
              hasSubmissionFilters ? (
                <EmptyState
                  icon={<Search size={22} />}
                  title="Aucun résultat"
                  description="Aucune soumission ne correspond à la recherche ou aux filtres sélectionnés."
                  actionLabel="Réinitialiser les filtres"
                  onAction={() => {
                    setSubmissionSearch("");
                    setSubmissionTypeFilter("all");
                    setSubmissionStatusFilter("all");
                  }}
                />
              ) : (
                <EmptyState
                  icon={<Inbox size={22} />}
                  title="Aucune soumission encore"
                  description="Commencez par soumettre une publication, un projet ou une communication. Chaque dossier sera suivi ici."
                  actionLabel="Soumettre une publication"
                  onAction={() => {
                    setSubmissionMode("publication");
                    document.getElementById("soumettre")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  secondaryLabel="Importer ORCID"
                  onSecondary={() => void handleOrcidImport()}
                />
              )
            )}
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              <CheckCircle2 size={16} />
              Les soumissions sont automatiquement envoyées en modération.
            </div>
          </div>

          {/* Edit modal */}
          {editTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-brand-primary text-lg">Demande de modification</h3>
                  <button type="button" onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={(e) => void handleEditSubmit(e)} className="p-6 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-text-secondary">Titre *</label>
                    <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className={inputCls()} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary">Auteurs *</label>
                    <input value={editForm.authors} onChange={e => setEditForm(p => ({ ...p, authors: e.target.value }))} className={inputCls()} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-text-secondary">Type</label>
                      <select value={editForm.publication_type} onChange={e => setEditForm(p => ({ ...p, publication_type: e.target.value }))} className={inputCls()}>
                        <option>Journal Article</option>
                        <option>Conference Paper</option>
                        <option>Book Chapter</option>
                        <option>Poster</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-secondary">Année *</label>
                      <input type="number" min={2000} max={2100} value={editForm.year} onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))} className={inputCls()} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary">Revue / Conférence</label>
                    <input value={editForm.venue} onChange={e => setEditForm(p => ({ ...p, venue: e.target.value }))} placeholder="Optionnel" className={inputCls()} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary">DOI</label>
                    <input value={editForm.doi} onChange={e => setEditForm(p => ({ ...p, doi: e.target.value }))} placeholder="Optionnel" className={inputCls()} />
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    ⚠ Les modifications seront soumises à validation par un administrateur avant d'être appliquées.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEditTarget(null)} className="flex-1 border border-gray-300 rounded-xl py-2 text-sm font-bold text-text-secondary hover:bg-gray-50 transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={isEditSubmitting} className="flex-1 bg-brand-primary text-white rounded-xl py-2 text-sm font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-70">
                      {isEditSubmitting ? "Envoi..." : "Envoyer la demande"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
