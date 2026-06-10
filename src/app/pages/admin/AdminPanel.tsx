import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck2,
  FlaskConical,
  History,
  LayoutDashboard,
  Link as LinkIcon,
  Newspaper,
  Power,
  PowerOff,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Unlink,
  UserCog,
  Users,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  ApiError,
  createAxis,
  createEvent,
  createNews,
  listAdminEvents,
  listAdminNews,
  listAdminUsers,
  listAxes,
  listModerationQueue,
  updateAdminUserOrcid,
  updateUserRole,
  updateUserStatus,
  type AdminUser,
  type LabEvent,
  type NewsItem,
  type ResearchAxis,
  type Role,
} from "../../lib/api";
import { exportAdminReportPdf } from "../../lib/adminReportPdf";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "primary";
  onConfirm: () => Promise<void>;
};

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export function AdminPanel() {
  const { token, user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [queueCount, setQueueCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [orcidEditUserId, setOrcidEditUserId] = useState<number | null>(null);
  const [orcidDraft, setOrcidDraft] = useState("");
  const [axisErrors, setAxisErrors] = useState<Record<string, string>>({});
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [newsErrors, setNewsErrors] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const [axisForm, setAxisForm] = useState({
    title: "",
    description: "",
    lead_member_name: user?.full_name || "",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "Séminaire",
    start_date: "",
    end_date: "",
    location: "",
    program: "",
    speakers: "",
    lifecycle_status: "upcoming",
    axis_id: "",
    registration_link: "",
  });

  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    category: "Annonce",
    is_published: true,
  });

  const loadAdminData = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [usersData, axesData, eventsData, newsData, queueData] = await Promise.all([
        listAdminUsers(token),
        listAxes(),
        listAdminEvents(token),
        listAdminNews(token),
        listModerationQueue(token),
      ]);

      setUsers(usersData);
      setAxes(axesData);
      setEvents(eventsData);
      setNews(newsData);
      setQueueCount(queueData.length);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible de charger le panel administrateur");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (notice) toast.success(notice);
  }, [notice]);

  const handleRoleChange = async (userId: number, currentRole: Role) => {
    if (!token) return;
    if (userId === user?.id) {
      setNotice("Votre propre rôle ne peut pas être modifié depuis cette page.");
      return;
    }
    const newRole = currentRole === "admin" ? "member" : "admin";
    const target = users.find((account) => account.id === userId);

    setConfirmAction({
      title: "Confirmer le changement de role",
      description: `Vous allez donner le role "${newRole}" au compte ${target?.full_name ?? "selectionne"}. Cette action change ses permissions dans le portail LIAS.`,
      confirmLabel: "Changer le role",
      tone: newRole === "admin" ? "warning" : "primary",
      onConfirm: async () => {
        setError(null);
        setNotice(null);
        try {
          await updateUserRole(token, userId, newRole);
          setNotice("Rôle utilisateur mis à jour.");
          setConfirmAction(null);
          await loadAdminData();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour le rôle");
        }
      },
    });
  };

  const handleStatusChange = (account: AdminUser) => {
    if (!token) return;
    if (account.id === user?.id) {
      setNotice("Votre propre compte ne peut pas être désactivé depuis cette page.");
      return;
    }

    const nextStatus = !account.is_active;
    setConfirmAction({
      title: nextStatus ? "Réactiver le compte" : "Désactiver le compte",
      description: nextStatus
        ? `Le compte de ${account.full_name} pourra de nouveau se connecter au portail LIAS.`
        : `Le compte de ${account.full_name} ne pourra plus se connecter tant qu'il n'est pas réactivé.`,
      confirmLabel: nextStatus ? "Réactiver" : "Désactiver",
      tone: nextStatus ? "primary" : "danger",
      onConfirm: async () => {
        setError(null);
        setNotice(null);
        try {
          await updateUserStatus(token, account.id, nextStatus);
          setNotice(nextStatus ? "Compte utilisateur réactivé." : "Compte utilisateur désactivé.");
          setConfirmAction(null);
          await loadAdminData();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Impossible de modifier le statut du compte");
        }
      },
    });
  };

  const startOrcidEdit = (account: AdminUser) => {
    setOrcidEditUserId(account.id);
    setOrcidDraft(account.orcid_id || "");
    setError(null);
    setNotice(null);
  };

  const handleOrcidSave = async (account: AdminUser) => {
    if (!token) return;
    const normalizedOrcid = orcidDraft.trim().toUpperCase();
    if (!normalizedOrcid) {
      setError("Veuillez saisir un ORCID ou utiliser l'action Délier.");
      return;
    }
    if (!ORCID_REGEX.test(normalizedOrcid)) {
      setError("Format ORCID invalide. Exemple attendu : 0000-0000-0000-0000");
      return;
    }

    setError(null);
    setNotice(null);
    try {
      await updateAdminUserOrcid(token, account.id, normalizedOrcid);
      setNotice("ORCID utilisateur mis à jour.");
      setOrcidEditUserId(null);
      setOrcidDraft("");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de corriger l'ORCID utilisateur");
    }
  };

  const handleOrcidUnlink = async (account: AdminUser) => {
    if (!token || !account.orcid_id) return;
    setConfirmAction({
      title: "Délier l'ORCID",
      description: `Vous allez délier l'ORCID ${account.orcid_id} du compte ${account.full_name}. Le membre pourra ensuite relier le bon identifiant depuis son profil.`,
      confirmLabel: "Délier ORCID",
      tone: "warning",
      onConfirm: async () => {
        setError(null);
        setNotice(null);
        try {
          await updateAdminUserOrcid(token, account.id, null);
          setNotice("ORCID utilisateur délié.");
          setConfirmAction(null);
          setOrcidEditUserId(null);
          setOrcidDraft("");
          await loadAdminData();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Impossible de délier l'ORCID utilisateur");
        }
      },
    });
  };

  const handleAxisSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!axisForm.title.trim()) errs.title = "Le titre est requis.";
    if (!axisForm.description.trim()) errs.description = "La description est requise.";
    if (Object.keys(errs).length) { setAxisErrors(errs); return; }
    setAxisErrors({});
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await createAxis(token, axisForm);
      setAxisForm({ title: "", description: "", lead_member_name: user?.full_name || "" });
      setNotice("Axe de recherche créé avec succès.");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création d'axe impossible");
    }
  };

  const handleEventSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!eventForm.title.trim()) errs.title = "Le titre est requis.";
    if (!eventForm.description.trim()) errs.description = "La description est requise.";
    if (!eventForm.start_date) errs.start_date = "La date de début est requise.";
    if (!eventForm.location.trim()) errs.location = "Le lieu est requis.";
    if (eventForm.end_date && eventForm.end_date < eventForm.start_date) errs.end_date = "La date de fin doit être après la date de début.";
    if (Object.keys(errs).length) { setEventErrors(errs); return; }
    setEventErrors({});
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await createEvent(token, {
        title: eventForm.title, description: eventForm.description, event_type: eventForm.event_type,
        start_date: eventForm.start_date, end_date: eventForm.end_date || null, location: eventForm.location,
        program: eventForm.program || undefined, speakers: eventForm.speakers || undefined,
        lifecycle_status: eventForm.lifecycle_status as "upcoming" | "past",
        axis_id: eventForm.axis_id ? Number(eventForm.axis_id) : undefined,
        registration_link: eventForm.registration_link || undefined, is_public: true,
      });
      setEventForm({ title: "", description: "", event_type: "Séminaire", start_date: "", end_date: "", location: "", program: "", speakers: "", lifecycle_status: "upcoming", axis_id: "", registration_link: "" });
      setNotice("Événement créé et envoyé en modération.");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création d'événement impossible");
    }
  };

  const handleNewsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newsForm.title.trim()) errs.title = "Le titre est requis.";
    if (!newsForm.content.trim()) errs.content = "Le contenu est requis.";
    if (Object.keys(errs).length) { setNewsErrors(errs); return; }
    setNewsErrors({});
    if (!token) return;
    setError(null); setNotice(null);
    try {
      await createNews(token, { title: newsForm.title, content: newsForm.content, category: newsForm.category, is_published: newsForm.is_published });
      setNewsForm({ title: "", content: "", category: "Annonce", is_published: true });
      setNotice("Actualité créée et envoyée en modération.");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création d'actualité impossible");
    }
  };

  const handleAdminReportExport = async () => {
    setError(null);
    setNotice(null);
    setIsExportingPdf(true);
    try {
      await exportAdminReportPdf({
        generatedBy: user?.full_name ?? "Administrateur LIAS",
        users,
        axes,
        events,
        news,
        queueCount,
      });
      setNotice("Rapport PDF administratif généré avec succès.");
    } catch {
      setError("Impossible de générer le rapport PDF pour le moment.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const activeUserCount = users.filter((account) => account.is_active).length;
  const inactiveUserCount = users.length - activeUserCount;
  const adminCount = users.filter((account) => account.role === "admin").length;
  const memberCount = users.length - adminCount;
  const upcomingEventsCount = events.filter((event) => event.lifecycle_status === "upcoming").length;
  const publishedNewsCount = news.filter((item) => item.is_published).length;
  const lastNews = news[0];
  const nextEvent = events
    .filter((event) => event.lifecycle_status === "upcoming")
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = users.filter((account) => {
    const matchesRole = roleFilter === "all" || account.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? account.is_active : !account.is_active);
    const matchesSearch =
      !normalizedUserSearch ||
      account.full_name.toLowerCase().includes(normalizedUserSearch) ||
      account.email.toLowerCase().includes(normalizedUserSearch);
    return matchesRole && matchesStatus && matchesSearch;
  });

  const kpis = [
    {
      label: "Utilisateurs",
      value: users.length,
      detail: `${adminCount} admins · ${memberCount} membres`,
      icon: Users,
      tone: "text-brand-primary bg-brand-primary/10",
    },
    {
      label: "Axes de recherche",
      value: axes.length,
      detail: "Structuration scientifique",
      icon: FlaskConical,
      tone: "text-sky-700 bg-sky-50",
    },
    {
      label: "Événements",
      value: events.length,
      detail: `${upcomingEventsCount} à venir`,
      icon: CalendarDays,
      tone: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Actualités",
      value: news.length,
      detail: `${publishedNewsCount} publiées`,
      icon: Newspaper,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Modération",
      value: queueCount,
      detail: queueCount > 0 ? "Actions requises" : "File à jour",
      icon: ShieldCheck,
      tone: queueCount > 0 ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50",
    },
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
        <div className="grid gap-0 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-secondary">
              <LayoutDashboard size={14} />
              Administration LIAS
            </div>
            <h1 className="text-3xl sm:text-4xl font-sans font-bold text-brand-primary">
              Centre de pilotage
            </h1>
            <p className="mt-3 max-w-2xl text-text-secondary font-serif">
              Supervisez les comptes, la modération et les contenus publics du laboratoire depuis un espace unique.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/admin/moderation"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-secondary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-600 sm:w-auto"
              >
                <FileCheck2 size={16} />
                Traiter la modération
              </Link>
              <Link
                to="/admin/content"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary"
              >
                <PlusCircle size={16} />
                Gestion des contenus
              </Link>
              <button
                type="button"
                onClick={() => void loadAdminData()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 bg-white px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
              <button
                type="button"
                onClick={() => void handleAdminReportExport()}
                disabled={isExportingPdf || isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {isExportingPdf ? "Génération..." : "Exporter rapport PDF"}
              </button>
            </div>
          </div>

          <aside className="border-t border-brand-primary/10 bg-brand-primary p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/65">Connecté en tant que</p>
                <h2 className="mt-1 text-xl font-bold">{user?.full_name ?? "Administrateur"}</h2>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <UserCog size={22} />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-white/60">À valider</p>
                <p className="mt-2 text-3xl font-bold">{queueCount}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-white/60">À venir</p>
                <p className="mt-2 text-3xl font-bold">{upcomingEventsCount}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-brand-primary/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text-secondary">{kpi.label}</p>
                  <div className="mt-2 text-3xl font-bold text-brand-primary">{kpi.value}</div>
                </div>
                <div className={`rounded-lg p-2 ${kpi.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-text-secondary">{kpi.detail}</p>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">Chargement du panel administrateur...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-brand-primary">Actions prioritaires</h2>
                  <p className="mt-1 text-sm text-text-secondary font-serif">
                    Les raccourcis utiles pour garder le portail propre et à jour.
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                  queueCount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {queueCount > 0 ? `${queueCount} en attente` : "Tout est à jour"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link to="/admin/moderation" className="group rounded-xl border border-brand-primary/10 p-4 transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-700"><ShieldCheck size={18} /></div>
                    <ArrowUpRight size={17} className="text-text-secondary transition-colors group-hover:text-brand-secondary" />
                  </div>
                  <h3 className="mt-4 font-bold text-brand-primary">File de modération</h3>
                  <p className="mt-1 text-sm text-text-secondary">{queueCount} soumission(s) à vérifier.</p>
                </Link>
                <Link to="/news" className="group rounded-xl border border-brand-primary/10 p-4 transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Newspaper size={18} /></div>
                    <ArrowUpRight size={17} className="text-text-secondary transition-colors group-hover:text-brand-secondary" />
                  </div>
                  <h3 className="mt-4 font-bold text-brand-primary">Dernière actualité</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{lastNews?.title ?? "Aucune actualité publiée."}</p>
                </Link>
                <Link to="/events" className="group rounded-xl border border-brand-primary/10 p-4 transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><CalendarDays size={18} /></div>
                    <ArrowUpRight size={17} className="text-text-secondary transition-colors group-hover:text-brand-secondary" />
                  </div>
                  <h3 className="mt-4 font-bold text-brand-primary">Prochain événement</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{nextEvent?.title ?? "Aucun événement à venir."}</p>
                </Link>
                <Link to="/admin/content" className="group rounded-xl border border-brand-primary/10 p-4 transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-brand-primary/10 p-2 text-brand-primary"><CheckCircle2 size={18} /></div>
                    <ArrowUpRight size={17} className="text-text-secondary transition-colors group-hover:text-brand-secondary" />
                  </div>
                  <h3 className="mt-4 font-bold text-brand-primary">Qualité des contenus</h3>
                  <p className="mt-1 text-sm text-text-secondary">Contrôler les pages publiques et les ressources.</p>
                </Link>
                <Link to="/admin/audit-logs" className="group rounded-xl border border-brand-primary/10 p-4 transition-colors hover:border-brand-secondary/40 hover:bg-brand-secondary/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700"><History size={18} /></div>
                    <ArrowUpRight size={17} className="text-text-secondary transition-colors group-hover:text-brand-secondary" />
                  </div>
                  <h3 className="mt-4 font-bold text-brand-primary">Historique admin</h3>
                  <p className="mt-1 text-sm text-text-secondary">Consulter les actions sensibles et les decisions prises.</p>
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-brand-primary">État du laboratoire</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-brand-primary">
                    <span>Comptes membres</span>
                    <span>{memberCount}/{users.length || 1}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-brand-secondary" style={{ width: `${users.length ? (memberCount / users.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-brand-primary">
                    <span>Actualités publiées</span>
                    <span>{publishedNewsCount}/{news.length || 1}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${news.length ? (publishedNewsCount / news.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="rounded-xl bg-brand-tertiary p-4">
                  <p className="text-sm font-bold text-brand-primary">Conseil admin</p>
                  <p className="mt-1 text-sm text-text-secondary font-serif">
                    Traitez la modération avant d'ajouter de nouveaux contenus pour éviter les doublons visibles côté public.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white border border-brand-primary/10 rounded-2xl p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-primary">Gestion des utilisateurs</h2>
                <p className="mt-1 text-sm text-text-secondary font-serif">
                  Contrôlez les accès administrateur sans modifier votre propre compte.
                </p>
              </div>
              <div className="flex gap-2 text-xs font-bold">
                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-brand-primary">{adminCount} admins</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{memberCount} membres</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{activeUserCount} actifs</span>
                {inactiveUserCount > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{inactiveUserCount} inactifs</span>
                )}
              </div>
            </div>
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Rechercher par nom ou email"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-brand-primary outline-none transition-colors focus:border-brand-secondary"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  {[
                    ["all", "Tous"],
                    ["admin", "Admins"],
                    ["member", "Membres"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRoleFilter(value as "all" | Role)}
                      className={`rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
                        roleFilter === value
                          ? "bg-white text-brand-secondary shadow-sm"
                          : "text-text-secondary hover:text-brand-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  {[
                    ["all", "Tous"],
                    ["active", "Actifs"],
                    ["inactive", "Inactifs"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value as "all" | "active" | "inactive")}
                      className={`rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
                        statusFilter === value
                          ? "bg-white text-brand-secondary shadow-sm"
                          : "text-text-secondary hover:text-brand-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="max-h-[560px] overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
              {filteredUsers.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors hover:bg-brand-tertiary/40 ${
                    account.is_active ? "" : "bg-gray-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-sm font-bold text-brand-primary">
                      {account.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-brand-primary">{account.full_name}</div>
                      <div className="text-sm text-text-secondary">{account.email}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {account.orcid_id ? (
                          <>
                            <span className="rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-700">
                              ORCID {account.orcid_id}
                            </span>
                            {account.orcid_name_locked && (
                              <span className="rounded-full bg-brand-primary/10 px-2 py-1 font-bold text-brand-primary">
                                Nom verrouillé
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-700">
                            ORCID non lié
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    {orcidEditUserId === account.id && (
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <input
                          value={orcidDraft}
                          onChange={(event) => setOrcidDraft(event.target.value.toUpperCase())}
                          placeholder="0000-0000-0000-0000"
                          className="min-w-[210px] rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none transition-colors focus:border-brand-secondary"
                        />
                        <button
                          type="button"
                          onClick={() => void handleOrcidSave(account)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-primary/90"
                        >
                          <Save size={13} />
                          Sauver ORCID
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOrcidEditUserId(null);
                            setOrcidDraft("");
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className={`text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-full ${account.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {account.is_active ? "Actif" : "Inactif"}
                    </span>
                    <span className={`text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-full ${account.role === "admin" ? "bg-brand-primary/10 text-brand-primary" : "bg-gray-100 text-gray-600"}`}>{account.role}</span>
                    {account.id === user?.id && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">Compte actuel</span>
                    )}
                    <button
                      type="button"
                      onClick={() => startOrcidEdit(account)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors"
                    >
                      <LinkIcon size={14} />
                      Corriger ORCID
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOrcidUnlink(account)}
                      disabled={!account.orcid_id}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                    >
                      <Unlink size={14} />
                      Délier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange(account.id, account.role)}
                      disabled={account.id === user?.id}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-primary/20 text-brand-primary font-bold text-sm hover:bg-brand-primary/5 transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                    >
                      → {account.role === "admin" ? "Membre" : "Admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(account)}
                      disabled={account.id === user?.id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent ${
                        account.is_active
                          ? "border-red-200 text-red-700 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {account.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                      {account.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                  </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-text-secondary">
                  Aucun utilisateur ne correspond à ces filtres.
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-brand-primary">Production rapide</h2>
              <p className="mt-1 text-sm text-text-secondary font-serif">
                Créez les contenus les plus fréquents sans quitter le panel.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Axe */}
            <form onSubmit={handleAxisSubmit} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-brand-primary">Créer un axe de recherche</h3>
              <div>
                <input value={axisForm.title} onChange={e => setAxisForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre *" className={`w-full border rounded-lg px-3 py-2 text-sm ${axisErrors.title ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {axisErrors.title && <p className="text-xs text-red-600 mt-1">{axisErrors.title}</p>}
              </div>
              <div>
                <textarea value={axisForm.description} onChange={e => setAxisForm(p => ({ ...p, description: e.target.value }))} placeholder="Description *" className={`w-full border rounded-lg px-3 py-2 text-sm min-h-24 ${axisErrors.description ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {axisErrors.description && <p className="text-xs text-red-600 mt-1">{axisErrors.description}</p>}
              </div>
              <input value={axisForm.lead_member_name} onChange={e => setAxisForm(p => ({ ...p, lead_member_name: e.target.value }))} placeholder="Responsable (optionnel)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="w-full bg-brand-primary text-white font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors">
                <Save size={16} /> Enregistrer l'axe
              </button>
            </form>

            {/* Événement */}
            <form onSubmit={handleEventSubmit} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-brand-primary">Créer un événement</h3>
              <div>
                <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre *" className={`w-full border rounded-lg px-3 py-2 text-sm ${eventErrors.title ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {eventErrors.title && <p className="text-xs text-red-600 mt-1">{eventErrors.title}</p>}
              </div>
              <div>
                <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Description *" className={`w-full border rounded-lg px-3 py-2 text-sm min-h-20 ${eventErrors.description ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {eventErrors.description && <p className="text-xs text-red-600 mt-1">{eventErrors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Date début *</label>
                  <input type="date" value={eventForm.start_date} onChange={e => setEventForm(p => ({ ...p, start_date: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm ${eventErrors.start_date ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                  {eventErrors.start_date && <p className="text-xs text-red-600 mt-1">{eventErrors.start_date}</p>}
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Date fin</label>
                  <input type="date" value={eventForm.end_date} onChange={e => setEventForm(p => ({ ...p, end_date: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm ${eventErrors.end_date ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                  {eventErrors.end_date && <p className="text-xs text-red-600 mt-1">{eventErrors.end_date}</p>}
                </div>
              </div>
              <div>
                <input value={eventForm.location} onChange={e => setEventForm(p => ({ ...p, location: e.target.value }))} placeholder="Lieu *" className={`w-full border rounded-lg px-3 py-2 text-sm ${eventErrors.location ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {eventErrors.location && <p className="text-xs text-red-600 mt-1">{eventErrors.location}</p>}
              </div>
              <select value={eventForm.axis_id} onChange={e => setEventForm(p => ({ ...p, axis_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Axe associé (optionnel)</option>
                {axes.map(axis => <option key={axis.id} value={axis.id}>{axis.title}</option>)}
              </select>
              <input value={eventForm.registration_link} onChange={e => setEventForm(p => ({ ...p, registration_link: e.target.value }))} placeholder="Lien d'inscription (optionnel)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="w-full bg-brand-primary text-white font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors">
                <Save size={16} /> Enregistrer l'événement
              </button>
            </form>

            {/* Actualité */}
            <form onSubmit={handleNewsSubmit} className="bg-white border border-brand-primary/10 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-brand-primary">Créer une actualité</h3>
              <div>
                <input value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre *" className={`w-full border rounded-lg px-3 py-2 text-sm ${newsErrors.title ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {newsErrors.title && <p className="text-xs text-red-600 mt-1">{newsErrors.title}</p>}
              </div>
              <div>
                <textarea value={newsForm.content} onChange={e => setNewsForm(p => ({ ...p, content: e.target.value }))} placeholder="Contenu *" className={`w-full border rounded-lg px-3 py-2 text-sm min-h-28 ${newsErrors.content ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
                {newsErrors.content && <p className="text-xs text-red-600 mt-1">{newsErrors.content}</p>}
              </div>
              <input value={newsForm.category} onChange={e => setNewsForm(p => ({ ...p, category: e.target.value }))} placeholder="Catégorie" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <label className="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={newsForm.is_published} onChange={e => setNewsForm(p => ({ ...p, is_published: e.target.checked }))} className="rounded" />
                Publier immédiatement
              </label>
              <button type="submit" className="w-full bg-brand-primary text-white font-bold rounded-lg px-4 py-2 inline-flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors">
                <Save size={16} /> Enregistrer l'actualité
              </button>
            </form>
          </div>
          </section>
        </>
      )}
    </div>
  );
}
