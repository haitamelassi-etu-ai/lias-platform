import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, Filter, RefreshCw, ShieldCheck } from "lucide-react";
import { listAuditLogs, type AuditLog } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

const actionLabels: Record<string, string> = {
  "moderation.validated": "Validation contenu",
  "moderation.rejected": "Rejet contenu",
  "moderation.needs_correction": "Correction demandee",
  "publication_change_request.approved": "Demande approuvee",
  "publication_change_request.rejected": "Demande rejetee",
  "user.role_changed": "Role modifie",
  "research_axis.created": "Axe cree",
  "research_axis.updated": "Axe modifie",
  "research_axis.deleted": "Axe supprime",
};

const entityLabels: Record<string, string> = {
  publication: "Publication",
  communication: "Communication",
  project: "Projet",
  event: "Evenement",
  news: "Actualite",
  publication_change_request: "Demande publication",
  user: "Utilisateur",
  research_axis: "Axe de recherche",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function parseDetails(details: string | null) {
  if (!details) {
    return null;
  }

  try {
    return JSON.parse(details) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function AuditLogs() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actionOptions = useMemo(
    () => Object.entries(actionLabels).map(([value, label]) => ({ value, label })),
    [],
  );
  const entityOptions = useMemo(
    () => Object.entries(entityLabels).map(([value, label]) => ({ value, label })),
    [],
  );

  const loadLogs = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await listAuditLogs(token, {
        action: action || undefined,
        entity_type: entityType || undefined,
        limit: 150,
      });
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger l'historique");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [token]);

  const filteredCountLabel = logs.length === 1 ? "1 action tracee" : `${logs.length} actions tracees`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
              <ShieldCheck size={14} />
              Gouvernance
            </div>
            <h1 className="text-3xl font-bold">Historique administrateur</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Suivi des actions sensibles realisees dans l'espace admin : moderation,
              demandes de modification, changements de roles et axes de recherche.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 transition-colors hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <Filter size={16} />
              Filtres
            </div>
            <p className="mt-1 text-sm text-slate-500">{filteredCountLabel}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[560px]">
            <label className="text-sm font-bold text-slate-700">
              Action
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-cyan-500"
              >
                <option value="">Toutes les actions</option>
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Entite
              <select
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-cyan-500"
              >
                <option value="">Toutes les entites</option>
                {entityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadLogs()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          Appliquer les filtres
        </button>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            <ClipboardList size={16} />
            Journal des actions
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">
            Chargement de l'historique...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">
            Aucune action ne correspond aux filtres.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Administrateur</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entite</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const details = parseDetails(log.details);
                  return (
                    <tr key={log.id} className="align-top hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{log.actor_name}</p>
                        <p className="text-xs text-slate-500">{log.actor_email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                          {actionLabels[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {entityLabels[log.entity_type] ?? log.entity_type}
                          {log.entity_id ? ` #${log.entity_id}` : ""}
                        </p>
                        {log.entity_title && (
                          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                            {log.entity_title}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {details ? (
                          <div className="max-w-sm space-y-1 text-xs text-slate-600">
                            {Object.entries(details).slice(0, 4).map(([key, value]) => (
                              <p key={key}>
                                <span className="font-bold text-slate-800">{key}</span>
                                {": "}
                                {String(value ?? "-")}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Aucun detail</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
