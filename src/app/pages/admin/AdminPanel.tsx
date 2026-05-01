import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Users, FlaskConical, CalendarDays, Newspaper, Save } from "lucide-react";

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
  updateUserRole,
  type LabEvent,
  type NewsItem,
  type ResearchAxis,
  type Role,
  type User,
} from "../../lib/api";

export function AdminPanel() {
  const { token, user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [axes, setAxes] = useState<ResearchAxis[]>([]);
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [queueCount, setQueueCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [axisErrors, setAxisErrors] = useState<Record<string, string>>({});
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [newsErrors, setNewsErrors] = useState<Record<string, string>>({});

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

  const handleRoleChange = async (userId: number, currentRole: Role) => {
    if (!token) return;
    const newRole = currentRole === "admin" ? "member" : "admin";
    const confirmed = window.confirm(
      `Confirmer le changement de rôle vers "${newRole}" pour cet utilisateur ?`
    );
    if (!confirmed) return;
    setError(null);
    setNotice(null);
    try {
      await updateUserRole(token, userId, newRole);
      setNotice("Rôle utilisateur mis à jour.");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de mettre à jour le rôle");
    }
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

  return (
    <div className="py-6 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-bold text-brand-primary">Panel Administrateur Professionnel</h1>
        <p className="text-text-secondary font-serif mt-1">
          Pilotez les comptes, les contenus scientifiques et la gouvernance du laboratoire.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-brand-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold mb-2"><Users size={16} /> Utilisateurs</div>
          <div className="text-3xl font-bold text-brand-primary">{users.length}</div>
        </div>
        <div className="bg-white border border-brand-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold mb-2"><FlaskConical size={16} /> Axes</div>
          <div className="text-3xl font-bold text-brand-primary">{axes.length}</div>
        </div>
        <div className="bg-white border border-brand-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold mb-2"><CalendarDays size={16} /> Événements</div>
          <div className="text-3xl font-bold text-brand-primary">{events.length}</div>
        </div>
        <div className="bg-white border border-brand-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold mb-2"><Newspaper size={16} /> Actualités</div>
          <div className="text-3xl font-bold text-brand-primary">{news.length}</div>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-bold mb-2"><ShieldCheck size={16} /> Moderation</div>
          <div className="text-3xl font-bold text-amber-700">{queueCount}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">Chargement du panel administrateur...</div>
      ) : (
        <>
          <div className="bg-white border border-brand-primary/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-brand-primary mb-4">Gestion des utilisateurs</h2>
            <div className="space-y-3">
              {users.map((account) => (
                <div key={account.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-brand-primary">{account.full_name}</div>
                    <div className="text-sm text-text-secondary">{account.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-full ${account.role === "admin" ? "bg-brand-primary/10 text-brand-primary" : "bg-gray-100 text-gray-600"}`}>{account.role}</span>
                    <button
                      onClick={() => handleRoleChange(account.id, account.role)}
                      className="px-3 py-2 rounded-lg border border-brand-primary/20 text-brand-primary font-bold text-sm hover:bg-brand-primary/5 transition-colors"
                    >
                      → {account.role === "admin" ? "Membre" : "Admin"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
        </>
      )}
    </div>
  );
}
