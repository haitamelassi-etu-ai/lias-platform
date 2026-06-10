import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  Edit3,
  FileCheck2,
  FlaskConical,
  FolderKanban,
  Images,
  Loader2,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  ApiError,
  createGalleryItem,
  createNews,
  deleteAxis,
  deleteEvent,
  deleteGalleryItem,
  deleteNews,
  deleteProject,
  listAdminEvents,
  listAdminGalleryItems,
  listAdminNews,
  listAdminProjects,
  listAxes,
  listModerationQueue,
  updateAxis,
  updateEvent,
  updateGalleryItem,
  updateNews,
  updateProject,
  type GalleryItem,
  type LabEvent,
  type NewsItem,
  type Project,
  type ResearchAxis,
  type ValidationStatus,
} from "../../lib/api";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "primary";
  onConfirm: () => Promise<void>;
};

type Section = "news" | "events" | "axes" | "projects" | "gallery";
type EditableItem =
  | { kind: "news"; item: NewsItem }
  | { kind: "events"; item: LabEvent }
  | { kind: "axes"; item: ResearchAxis }
  | { kind: "projects"; item: Project }
  | { kind: "gallery"; item: GalleryItem };

type EditForm = Record<string, string | boolean>;

const sections: Array<{ key: Section; label: string; icon: typeof Newspaper }> = [
  { key: "news", label: "Actualités", icon: Newspaper },
  { key: "events", label: "Événements", icon: CalendarDays },
  { key: "axes", label: "Axes", icon: FlaskConical },
  { key: "projects", label: "Projets", icon: FolderKanban },
  { key: "gallery", label: "Galerie", icon: Images },
];

const emptyGalleryForm: EditForm = {
  title: "",
  image_url: "",
  caption: "",
  category: "",
  is_published: true,
};

const emptyNewsForm: EditForm = {
  title: "",
  content: "",
  category: "",
  is_published: false,
};

const statusLabels: Record<ValidationStatus, string> = {
  pending: "En attente",
  validated: "Validé",
  rejected: "Rejeté",
  needs_correction: "Correction",
};

function statusClass(status?: ValidationStatus) {
  if (status === "validated") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "needs_correction") return "bg-blue-100 text-blue-700";
  if (status === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-gray-100 text-gray-600";
}

function textValue(form: EditForm, key: string) {
  const value = form[key];
  return typeof value === "string" ? value : "";
}

export function ContentManagement() {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("news");
  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [queueCount, setQueueCount] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditableItem | null>(null);
  const [creatingKind, setCreatingKind] = useState<"gallery" | "news" | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});

  const isCreating = creatingKind !== null;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const loadContent = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [axesData, eventsData, newsData, projectsData, galleryData, queueData] = await Promise.all([
        listAxes(),
        listAdminEvents(token),
        listAdminNews(token),
        listAdminProjects(token),
        listAdminGalleryItems(token),
        listModerationQueue(token),
      ]);
      setAxes(axesData);
      setEvents(eventsData);
      setNews(newsData);
      setProjects(projectsData);
      setGallery(galleryData);
      setQueueCount(queueData.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger les contenus.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (notice) toast.success(notice);
  }, [notice]);

  const counts = {
    news: news.length,
    events: events.length,
    axes: axes.length,
    projects: projects.length,
    gallery: gallery.length,
  };

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const items: EditableItem[] =
      activeSection === "news"
        ? news.map((item) => ({ kind: "news", item }))
        : activeSection === "events"
          ? events.map((item) => ({ kind: "events", item }))
          : activeSection === "axes"
            ? axes.map((item) => ({ kind: "axes", item }))
            : activeSection === "projects"
              ? projects.map((item) => ({ kind: "projects", item }))
              : gallery.map((item) => ({ kind: "gallery", item }));

    return items.filter(({ item }) => {
      if (!normalized) return true;
      const haystack = JSON.stringify(item).toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activeSection, axes, events, news, projects, gallery, search]);

  const startCreateGallery = () => {
    setEditing(null);
    setCreatingKind("gallery");
    setNotice(null);
    setError(null);
    setEditForm({ ...emptyGalleryForm });
  };

  const startCreateNews = () => {
    setEditing(null);
    setCreatingKind("news");
    setNotice(null);
    setError(null);
    setEditForm({ ...emptyNewsForm });
  };

  const startEdit = (target: EditableItem) => {
    setEditing(target);
    setCreatingKind(null);
    setNotice(null);
    setError(null);

    if (target.kind === "news") {
      setEditForm({
        title: target.item.title,
        content: target.item.content,
        category: target.item.category ?? "",
        is_published: target.item.is_published,
      });
    } else if (target.kind === "events") {
      setEditForm({
        title: target.item.title,
        description: target.item.description,
        event_type: target.item.event_type,
        start_date: target.item.start_date,
        end_date: target.item.end_date ?? "",
        location: target.item.location,
        lifecycle_status: target.item.lifecycle_status,
        registration_link: target.item.registration_link ?? "",
        axis_id: target.item.axis_id ? String(target.item.axis_id) : "",
        is_public: target.item.is_public,
      });
    } else if (target.kind === "axes") {
      setEditForm({
        title: target.item.title,
        description: target.item.description,
        lead_member_name: target.item.lead_member_name ?? "",
      });
    } else if (target.kind === "gallery") {
      setEditForm({
        title: target.item.title,
        image_url: target.item.image_url,
        caption: target.item.caption ?? "",
        category: target.item.category ?? "",
        is_published: target.item.is_published,
      });
    } else {
      setEditForm({
        title: target.item.title,
        summary: target.item.summary,
        lead_member_name: target.item.lead_member_name ?? "",
        partners: target.item.partners ?? "",
        funding: target.item.funding ?? "",
        status: target.item.status,
        start_date: target.item.start_date ?? "",
        end_date: target.item.end_date ?? "",
        axis_id: target.item.axis_id ? String(target.item.axis_id) : "",
        is_public: target.item.is_public,
      });
    }
  };

  const setField = (key: string, value: string | boolean) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    if (creatingKind) {
      const title = textValue(editForm, "title").trim();
      if (!title) {
        setError("Le titre est requis.");
        return;
      }

      if (creatingKind === "gallery") {
        const imageUrl = textValue(editForm, "image_url").trim();
        if (!imageUrl) {
          setError("L'URL de l'image est requise.");
          return;
        }

        setIsSaving(true);
        setError(null);
        setNotice(null);
        try {
          await createGalleryItem(token, {
            title,
            image_url: imageUrl,
            caption: textValue(editForm, "caption") || null,
            category: textValue(editForm, "category") || null,
            is_published: Boolean(editForm.is_published),
          });
          setNotice("Élément de galerie créé.");
          setCreatingKind(null);
          setEditForm({});
          await loadContent();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Création impossible.");
        } finally {
          setIsSaving(false);
        }
        return;
      }

      if (creatingKind === "news") {
        const content = textValue(editForm, "content").trim();
        if (!content) {
          setError("Le contenu est requis.");
          return;
        }

        setIsSaving(true);
        setError(null);
        setNotice(null);
        try {
          await createNews(token, {
            title,
            content,
            category: textValue(editForm, "category") || undefined,
            is_published: Boolean(editForm.is_published),
          });
          setNotice("Actualité créée.");
          setCreatingKind(null);
          setEditForm({});
          await loadContent();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Création impossible.");
        } finally {
          setIsSaving(false);
        }
        return;
      }
    }

    if (!editing) return;
    if (!textValue(editForm, "title").trim()) {
      setError("Le titre est requis.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (editing.kind === "news") {
        await updateNews(token, editing.item.id, {
          title: textValue(editForm, "title"),
          content: textValue(editForm, "content"),
          category: textValue(editForm, "category") || null,
          is_published: Boolean(editForm.is_published),
        });
      } else if (editing.kind === "events") {
        await updateEvent(token, editing.item.id, {
          title: textValue(editForm, "title"),
          description: textValue(editForm, "description"),
          event_type: textValue(editForm, "event_type"),
          start_date: textValue(editForm, "start_date"),
          end_date: textValue(editForm, "end_date") || null,
          location: textValue(editForm, "location"),
          lifecycle_status: textValue(editForm, "lifecycle_status") as "upcoming" | "past",
          registration_link: textValue(editForm, "registration_link") || null,
          axis_id: textValue(editForm, "axis_id") ? Number(textValue(editForm, "axis_id")) : null,
          is_public: Boolean(editForm.is_public),
        });
      } else if (editing.kind === "axes") {
        await updateAxis(token, editing.item.id, {
          title: textValue(editForm, "title"),
          description: textValue(editForm, "description"),
          lead_member_name: textValue(editForm, "lead_member_name") || null,
        });
      } else if (editing.kind === "gallery") {
        await updateGalleryItem(token, editing.item.id, {
          title: textValue(editForm, "title"),
          image_url: textValue(editForm, "image_url"),
          caption: textValue(editForm, "caption") || null,
          category: textValue(editForm, "category") || null,
          is_published: Boolean(editForm.is_published),
        });
      } else {
        await updateProject(token, editing.item.id, {
          title: textValue(editForm, "title"),
          summary: textValue(editForm, "summary"),
          lead_member_name: textValue(editForm, "lead_member_name") || null,
          partners: textValue(editForm, "partners") || null,
          funding: textValue(editForm, "funding") || null,
          status: textValue(editForm, "status") || "active",
          start_date: textValue(editForm, "start_date") || null,
          end_date: textValue(editForm, "end_date") || null,
          axis_id: textValue(editForm, "axis_id") ? Number(textValue(editForm, "axis_id")) : null,
          is_public: Boolean(editForm.is_public),
        });
      }

      setNotice("Contenu mis à jour.");
      setEditing(null);
      setEditForm({});
      await loadContent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La mise à jour a échoué.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (target: EditableItem) => {
    if (!token) return;
    setConfirmAction({
      title: "Confirmer la suppression",
      description: `Vous allez supprimer "${target.item.title}". Cette action retire le contenu du back-office et peut affecter les pages publiques du portail.`,
      confirmLabel: "Supprimer",
      tone: "danger",
      onConfirm: async () => {
        setError(null);
        setNotice(null);

        try {
          if (target.kind === "news") await deleteNews(token, target.item.id);
          if (target.kind === "events") await deleteEvent(token, target.item.id);
          if (target.kind === "axes") await deleteAxis(token, target.item.id);
          if (target.kind === "projects") await deleteProject(token, target.item.id);
          if (target.kind === "gallery") await deleteGalleryItem(token, target.item.id);
          setNotice("Contenu supprimé.");
          setConfirmAction(null);
          if (editing?.kind === target.kind && editing.item.id === target.item.id) {
            setEditing(null);
            setEditForm({});
          }
          await loadContent();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Suppression impossible.");
        }
      },
    });
  };

  const describeItem = (target: EditableItem) => {
    if (target.kind === "news") {
      return {
        subtitle: target.item.category ?? "Actualité",
        body: target.item.content,
        status: target.item.is_published ? "Publié" : "Brouillon",
        statusClassName: target.item.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
        meta: statusLabels[target.item.validation_status],
      };
    }
    if (target.kind === "events") {
      return {
        subtitle: `${target.item.event_type} · ${target.item.location}`,
        body: target.item.description,
        status: target.item.lifecycle_status === "upcoming" ? "À venir" : "Passé",
        statusClassName: target.item.lifecycle_status === "upcoming" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600",
        meta: statusLabels[target.item.validation_status],
      };
    }
    if (target.kind === "axes") {
      return {
        subtitle: target.item.lead_member_name ?? "Responsable à définir",
        body: target.item.description,
        status: "Axe",
        statusClassName: "bg-sky-100 text-sky-700",
        meta: "Référentiel",
      };
    }
    if (target.kind === "gallery") {
      return {
        subtitle: target.item.category ?? "Média LIAS",
        body: target.item.caption ?? target.item.image_url,
        status: target.item.is_published ? "Publié" : "Brouillon",
        statusClassName: target.item.is_published
          ? "bg-emerald-100 text-emerald-700"
          : "bg-gray-100 text-gray-600",
        meta: target.item.author_name,
      };
    }
    return {
      subtitle: target.item.lead_member_name ?? "Responsable à définir",
      body: target.item.summary,
      status: target.item.status,
      statusClassName: statusClass(target.item.validation_status),
      meta: statusLabels[target.item.validation_status],
    };
  };

  const renderEditor = () => {
    if (!editing && !isCreating) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <Edit3 size={28} className="mx-auto mb-3 text-brand-secondary" />
          <h2 className="text-lg font-bold text-brand-primary">Sélectionnez un contenu</h2>
          <p className="mt-2 text-sm text-text-secondary font-serif">
            Choisissez un élément à gauche pour modifier ses informations publiques.
          </p>
        </div>
      );
    }

    const editorKind: EditableItem["kind"] | null = creatingKind
      ? creatingKind
      : editing
        ? editing.kind
        : null;
    const editorTitle = creatingKind === "gallery"
      ? "Nouvel élément de galerie"
      : creatingKind === "news"
        ? "Nouvelle actualité"
        : editing?.item.title ?? "";
    const editorLabel = isCreating ? "Création" : "Édition";

    return (
      <form onSubmit={saveEdit} className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-secondary">{editorLabel}</p>
            <h2 className="mt-1 text-xl font-bold text-brand-primary">{editorTitle}</h2>
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => deleteItem(editing)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50"
              title="Supprimer"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <input value={textValue(editForm, "title")} onChange={(event) => setField("title", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Titre *" />

          {editorKind === "news" && (
            <>
              <input value={textValue(editForm, "category")} onChange={(event) => setField("category", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Catégorie" />
              <textarea value={textValue(editForm, "content")} onChange={(event) => setField("content", event.target.value)} className="min-h-40 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Contenu" />
              <label className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                <input type="checkbox" checked={Boolean(editForm.is_published)} onChange={(event) => setField("is_published", event.target.checked)} />
                Publié sur le site
              </label>
            </>
          )}

          {editorKind === "events" && (
            <>
              <textarea value={textValue(editForm, "description")} onChange={(event) => setField("description", event.target.value)} className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Description" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={textValue(editForm, "event_type")} onChange={(event) => setField("event_type", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Type" />
                <input value={textValue(editForm, "location")} onChange={(event) => setField("location", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Lieu" />
                <input type="date" value={textValue(editForm, "start_date")} onChange={(event) => setField("start_date", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input type="date" value={textValue(editForm, "end_date")} onChange={(event) => setField("end_date", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <select value={textValue(editForm, "lifecycle_status")} onChange={(event) => setField("lifecycle_status", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="upcoming">À venir</option>
                <option value="past">Passé</option>
              </select>
              <select value={textValue(editForm, "axis_id")} onChange={(event) => setField("axis_id", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Axe associé</option>
                {axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.title}</option>)}
              </select>
              <input value={textValue(editForm, "registration_link")} onChange={(event) => setField("registration_link", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Lien d'inscription" />
              <label className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                <input type="checkbox" checked={Boolean(editForm.is_public)} onChange={(event) => setField("is_public", event.target.checked)} />
                Visible publiquement
              </label>
            </>
          )}

          {editorKind === "axes" && (
            <>
              <textarea value={textValue(editForm, "description")} onChange={(event) => setField("description", event.target.value)} className="min-h-36 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Description" />
              <input value={textValue(editForm, "lead_member_name")} onChange={(event) => setField("lead_member_name", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Responsable" />
            </>
          )}

          {editorKind === "projects" && (
            <>
              <textarea value={textValue(editForm, "summary")} onChange={(event) => setField("summary", event.target.value)} className="min-h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Résumé" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={textValue(editForm, "lead_member_name")} onChange={(event) => setField("lead_member_name", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Responsable" />
                <input value={textValue(editForm, "status")} onChange={(event) => setField("status", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Statut" />
                <input type="date" value={textValue(editForm, "start_date")} onChange={(event) => setField("start_date", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input type="date" value={textValue(editForm, "end_date")} onChange={(event) => setField("end_date", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <input value={textValue(editForm, "partners")} onChange={(event) => setField("partners", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Partenaires" />
              <input value={textValue(editForm, "funding")} onChange={(event) => setField("funding", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Financement" />
              <select value={textValue(editForm, "axis_id")} onChange={(event) => setField("axis_id", event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Axe associé</option>
                {axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.title}</option>)}
              </select>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                <input type="checkbox" checked={Boolean(editForm.is_public)} onChange={(event) => setField("is_public", event.target.checked)} />
                Visible publiquement
              </label>
            </>
          )}

          {editorKind === "gallery" && (
            <>
              <input
                value={textValue(editForm, "image_url")}
                onChange={(event) => setField("image_url", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="URL de l'image *"
              />
              {textValue(editForm, "image_url") && (
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={textValue(editForm, "image_url")}
                    alt="Aperçu"
                    className="h-40 w-full object-cover"
                    onError={(event) => {
                      (event.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <input
                value={textValue(editForm, "category")}
                onChange={(event) => setField("category", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Catégorie (ex. Conférence, IoT, Doctorat)"
              />
              <textarea
                value={textValue(editForm, "caption")}
                onChange={(event) => setField("caption", event.target.value)}
                className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Légende (optionnelle)"
              />
              <label className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary">
                <input
                  type="checkbox"
                  checked={Boolean(editForm.is_published)}
                  onChange={(event) => setField("is_published", event.target.checked)}
                />
                Publié sur la galerie publique
              </label>
            </>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={isSaving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-secondary disabled:opacity-60">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isCreating ? "Créer" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setCreatingKind(null);
              setEditForm({});
            }}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:text-brand-primary"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 py-6">
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

      <section className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-secondary">
              <FileCheck2 size={14} />
              Back-office contenu
            </div>
            <h1 className="text-3xl font-bold text-brand-primary">Gestion des contenus</h1>
            <p className="mt-2 max-w-2xl text-text-secondary font-serif">
              Modifiez, publiez et nettoyez les contenus visibles du portail LIAS depuis une seule interface.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/admin/moderation" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-secondary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-600">
              <FileCheck2 size={16} />
              Modération ({queueCount})
            </Link>
            <button type="button" onClick={() => void loadContent()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/15 px-4 py-2.5 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary">
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => { setActiveSection(section.key); setEditing(null); setCreatingKind(null); setEditForm({}); }}
              className={`rounded-xl border p-4 text-left shadow-sm transition-colors ${
                activeSection === section.key
                  ? "border-brand-secondary bg-brand-secondary/10"
                  : "border-brand-primary/10 bg-white hover:border-brand-secondary/40"
              }`}
            >
              <Icon size={18} className={activeSection === section.key ? "text-brand-secondary" : "text-text-secondary"} />
              <p className="mt-3 text-sm font-bold text-text-secondary">{section.label}</p>
              <p className="mt-1 text-2xl font-bold text-brand-primary">{counts[section.key]}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-brand-primary/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-brand-primary">
                {sections.find((section) => section.key === activeSection)?.label}
              </h2>
              <p className="text-sm text-text-secondary">{rows.length} élément(s)</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block sm:w-72">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-secondary"
                  placeholder="Rechercher"
                />
              </label>
              {activeSection === "gallery" && (
                <button
                  type="button"
                  onClick={startCreateGallery}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              )}
              {activeSection === "news" && (
                <button
                  type="button"
                  onClick={startCreateNews}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-secondary"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-text-secondary">Chargement des contenus...</div>
          ) : (
            <div className="space-y-3">
              {rows.map((target) => {
                const description = describeItem(target);
                const isSelected = editing?.kind === target.kind && editing.item.id === target.item.id;
                return (
                  <div key={`${target.kind}-${target.item.id}`} className={`rounded-xl border p-4 transition-colors ${isSelected ? "border-brand-secondary bg-brand-secondary/5" : "border-gray-100 hover:border-brand-secondary/30"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <button type="button" onClick={() => startEdit(target)} className="min-w-0 flex-1 text-left">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wider ${description.statusClassName}`}>{description.status}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{description.meta}</span>
                        </div>
                        <h3 className="line-clamp-1 font-bold text-brand-primary">{target.item.title}</h3>
                        <p className="mt-1 text-sm font-medium text-text-secondary">{description.subtitle}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-text-secondary font-serif">{description.body}</p>
                      </button>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(target)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-primary/15 text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary" title="Modifier">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" onClick={() => deleteItem(target)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-text-secondary">
                  Aucun contenu trouvé.
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {renderEditor()}
        </aside>
      </div>
    </div>
  );
}
