import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, X, AlertTriangle, Clock, MessageSquare, Edit3, Trash2, ArrowRight } from "lucide-react";
import {
  ApiError,
  decideChangeRequest,
  listModerationChangeRequests,
  listModerationQueue,
  moderateItem,
  type ModerationQueueItem,
  type PublicationChangeRequest,
} from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

type Tab = "pending" | "change_requests";
type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "primary";
  onConfirm: () => Promise<void>;
};

export function Moderation() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

  const [changeRequests, setChangeRequests] = useState<PublicationChangeRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const reload = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [q, cr] = await Promise.all([
        listModerationQueue(token),
        listModerationChangeRequests(token),
      ]);
      setQueue(q);
      setChangeRequests(cr);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger la modération");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void reload(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (notice) toast.success(notice);
  }, [notice]);

  const selectedQueueItem =
    queue.find((item) => `${item.content_type}-${item.item_id}` === selectedItemKey) ?? null;
  const selectedRequest =
    changeRequests.find((r) => r.id === selectedRequestId) ?? null;

  const performDecision = async (decision: "validated" | "rejected" | "needs_correction") => {
    if (!token || !selectedQueueItem) return;
    setError(null); setNotice(null);
    try {
      await moderateItem(token, selectedQueueItem.content_type, selectedQueueItem.item_id, decision, comment || undefined);
      setSelectedItemKey(null);
      setComment("");
      const labels = { validated: "Contenu approuvé et publié.", rejected: "Contenu rejeté.", needs_correction: "Correction demandée au membre." };
      setNotice(labels[decision]);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La décision n'a pas pu être appliquée");
    }
  };

  const handleDecision = async (decision: "validated" | "rejected" | "needs_correction") => {
    if (!selectedQueueItem) return;
    if (decision === "validated") {
      await performDecision(decision);
      return;
    }

    setConfirmAction({
      title: decision === "rejected" ? "Confirmer le rejet" : "Confirmer la demande de correction",
      description:
        decision === "rejected"
          ? `Vous allez rejeter "${selectedQueueItem.title}". Le contenu restera invisible cote public.`
          : `Vous allez demander une correction pour "${selectedQueueItem.title}". Le membre recevra votre commentaire si vous en avez saisi un.`,
      confirmLabel: decision === "rejected" ? "Rejeter" : "Demander correction",
      tone: decision === "rejected" ? "danger" : "warning",
      onConfirm: async () => {
        await performDecision(decision);
        setConfirmAction(null);
      },
    });
  };

  const performChangeRequestDecision = async (decision: "approved" | "rejected") => {
    if (!token || !selectedRequest) return;
    setError(null); setNotice(null);
    try {
      await decideChangeRequest(token, selectedRequest.id, decision, comment || undefined);
      setSelectedRequestId(null);
      setComment("");
      const verb = selectedRequest.request_type === "delete" ? "suppression" : "modification";
      setNotice(decision === "approved" ? `Demande de ${verb} approuvée et appliquée.` : `Demande de ${verb} rejetée.`);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La décision n'a pas pu être appliquée");
    }
  };

  const handleChangeRequestDecision = async (decision: "approved" | "rejected") => {
    if (!selectedRequest) return;
    const isDelete = selectedRequest.request_type === "delete";
    const needsConfirmation = decision === "rejected" || (decision === "approved" && isDelete);

    if (!needsConfirmation) {
      await performChangeRequestDecision(decision);
      return;
    }

    setConfirmAction({
      title:
        decision === "approved"
          ? "Confirmer la suppression"
          : "Confirmer le rejet de la demande",
      description:
        decision === "approved"
          ? `Vous allez approuver la suppression de "${selectedRequest.publication_title}". La publication sera archivee et retiree de l'affichage public.`
          : `Vous allez rejeter la demande concernant "${selectedRequest.publication_title}". Le membre recevra votre commentaire si vous en avez saisi un.`,
      confirmLabel: decision === "approved" ? "Approuver suppression" : "Rejeter",
      tone: decision === "approved" ? "danger" : "warning",
      onConfirm: async () => {
        await performChangeRequestDecision(decision);
        setConfirmAction(null);
      },
    });
  };

  const formatContentType = (type: ModerationQueueItem["content_type"]) => {
    const map = { publication: "Publication", communication: "Communication", project: "Projet", event: "Événement", news: "Actualité" } as const;
    return map[type] ?? type;
  };

  const parseNewData = (json: string | null) => {
    if (!json) return null;
    try { return JSON.parse(json) as Record<string, unknown>; } catch { return null; }
  };

  return (
    <div className="py-6 max-w-5xl mx-auto w-full">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-sans font-bold text-brand-primary flex items-center gap-3">
            File de Modération
          </h1>
          <p className="text-text-secondary font-serif mt-1">
            Validez les soumissions et traitez les demandes de modification/suppression.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("pending"); setSelectedItemKey(null); setSelectedRequestId(null); setComment(""); }}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${
            activeTab === "pending"
              ? "border-brand-secondary text-brand-secondary"
              : "border-transparent text-text-secondary hover:text-brand-primary"
          }`}
        >
          Soumissions
          {queue.length > 0 && (
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{queue.length}</span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("change_requests"); setSelectedItemKey(null); setSelectedRequestId(null); setComment(""); }}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${
            activeTab === "change_requests"
              ? "border-brand-secondary text-brand-secondary"
              : "border-transparent text-text-secondary hover:text-brand-primary"
          }`}
        >
          Demandes Modif/Suppr.
          {changeRequests.length > 0 && (
            <span className="ml-2 bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full">{changeRequests.length}</span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">Chargement de la modération...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-primary/5 overflow-hidden flex flex-col md:flex-row">
          {/* ════════ LIST ════════ */}
          <div className="w-full md:w-1/2 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-brand-primary text-sm uppercase tracking-wider">
                {activeTab === "pending" ? "Soumissions" : "Demandes en attente"}
              </h2>
            </div>
            <div className="overflow-y-auto max-h-[600px] divide-y divide-gray-100">

              {/* Submissions queue */}
              {activeTab === "pending" && queue.map((item) => (
                <div
                  key={`${item.content_type}-${item.item_id}`}
                  onClick={() => { setSelectedItemKey(`${item.content_type}-${item.item_id}`); setComment(""); }}
                  className={`p-5 cursor-pointer transition-colors border-l-4 ${
                    selectedItemKey === `${item.content_type}-${item.item_id}`
                      ? "bg-brand-secondary/5 border-brand-secondary"
                      : "hover:bg-gray-50 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-text-secondary bg-gray-100 px-2 py-1 rounded-sm uppercase tracking-wider">
                      {formatContentType(item.content_type)}
                    </span>
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-brand-primary text-base mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary font-serif">{item.author_name}</p>
                </div>
              ))}
              {activeTab === "pending" && queue.length === 0 && (
                <div className="p-8 text-center text-text-secondary font-serif">
                  <Check size={32} className="mx-auto text-emerald-400 mb-3" />
                  Aucune soumission en attente.
                </div>
              )}

              {/* Change requests */}
              {activeTab === "change_requests" && changeRequests.map((req) => {
                const isDelete = req.request_type === "delete";
                return (
                  <div
                    key={req.id}
                    onClick={() => { setSelectedRequestId(req.id); setComment(""); }}
                    className={`p-5 cursor-pointer transition-colors border-l-4 ${
                      selectedRequestId === req.id
                        ? "bg-brand-secondary/5 border-brand-secondary"
                        : "hover:bg-gray-50 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider inline-flex items-center gap-1 ${
                        isDelete ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {isDelete ? <Trash2 size={12} /> : <Edit3 size={12} />}
                        {isDelete ? "Suppression" : "Modification"}
                      </span>
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(req.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-sans font-bold text-brand-primary text-base mb-1 line-clamp-2">{req.publication_title}</h3>
                    <p className="text-sm text-text-secondary font-serif">Demandé par {req.owner_name}</p>
                  </div>
                );
              })}
              {activeTab === "change_requests" && changeRequests.length === 0 && (
                <div className="p-8 text-center text-text-secondary font-serif">
                  <Check size={32} className="mx-auto text-emerald-400 mb-3" />
                  Aucune demande en attente.
                </div>
              )}
            </div>
          </div>

          {/* ════════ DETAIL ════════ */}
          <div className="w-full md:w-1/2 bg-gray-50/30">

            {/* Submission detail */}
            {activeTab === "pending" && selectedQueueItem && (
              <motion.div key={selectedItemKey} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-brand-primary font-sans">Validation Requise</h2>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mt-0.5">
                      Soumis par {selectedQueueItem.author_name}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <h3 className="text-xl font-bold text-brand-primary font-sans mb-4">{selectedQueueItem.title}</h3>
                  <div className="space-y-3 text-sm font-serif">
                    <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                      <span className="text-text-secondary">Type</span>
                      <span className="col-span-2 font-medium text-brand-primary">{formatContentType(selectedQueueItem.content_type)}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-gray-100 pb-2">
                      <span className="text-text-secondary">Soumis le</span>
                      <span className="col-span-2 font-medium text-brand-primary">
                        {new Date(selectedQueueItem.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-brand-primary mb-2">
                    Commentaire pour le membre <span className="text-text-secondary font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                    placeholder="Expliquez votre décision..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
                  />
                </div>
                <div className="mt-auto space-y-3">
                  <div className="flex gap-3">
                    <button onClick={() => void handleDecision("validated")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm">
                      <Check size={18} /> Approuver
                    </button>
                    <button onClick={() => void handleDecision("rejected")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm">
                      <X size={18} /> Rejeter
                    </button>
                  </div>
                  <button onClick={() => void handleDecision("needs_correction")} className="w-full flex items-center justify-center gap-2 py-3 border border-brand-primary/20 text-brand-primary rounded-xl font-bold hover:bg-brand-primary/5 transition-colors bg-white">
                    <MessageSquare size={18} /> Demander une correction
                  </button>
                </div>
              </motion.div>
            )}

            {/* Change request detail */}
            {activeTab === "change_requests" && selectedRequest && (() => {
              const isDelete = selectedRequest.request_type === "delete";
              const newData = isDelete ? null : parseNewData(selectedRequest.new_data);
              return (
                <motion.div key={selectedRequest.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-8 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDelete ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                      {isDelete ? <Trash2 size={20} /> : <Edit3 size={20} />}
                    </div>
                    <div>
                      <h2 className="font-bold text-brand-primary font-sans">
                        {isDelete ? "Demande de suppression" : "Demande de modification"}
                      </h2>
                      <p className="text-xs text-text-secondary uppercase tracking-wider font-bold mt-0.5">
                        Par {selectedRequest.owner_name} · {new Date(selectedRequest.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Publication ciblée</p>
                    <h3 className="text-lg font-bold text-brand-primary font-sans">{selectedRequest.publication_title}</h3>
                  </div>

                  {isDelete ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-sm text-rose-800 font-serif">
                      ⚠ L'approbation marquera cette publication comme <strong>archivée</strong> (soft delete) :
                      elle sera retirée de la liste publique mais reste conservée en base.
                    </div>
                  ) : newData ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Modifications proposées</p>
                      <div className="space-y-2 text-sm">
                        {Object.entries(newData)
                          .filter(([, v]) => v !== null && v !== undefined && v !== "")
                          .map(([k, v]) => (
                            <div key={k} className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2 last:border-0">
                              <span className="text-text-secondary font-mono text-xs uppercase">{k}</span>
                              <span className="col-span-2 font-medium text-brand-primary break-words">
                                <ArrowRight size={12} className="inline text-blue-500 mr-1" />
                                {String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800 font-serif">
                      Aucune donnée de modification fournie.
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-brand-primary mb-2">
                      Commentaire <span className="text-text-secondary font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                      placeholder="Justification de votre décision..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
                    />
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button onClick={() => void handleChangeRequestDecision("approved")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-white rounded-xl font-bold transition-colors shadow-sm ${
                      isDelete ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
                    }`}>
                      <Check size={18} /> Approuver {isDelete ? "la suppression" : "la modification"}
                    </button>
                    <button onClick={() => void handleChangeRequestDecision("rejected")} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 text-text-secondary rounded-xl font-bold hover:bg-gray-300 transition-colors">
                      <X size={18} /> Rejeter
                    </button>
                  </div>
                </motion.div>
              );
            })()}

            {/* Empty states */}
            {activeTab === "pending" && !selectedQueueItem && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-64">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Check size={32} className="text-gray-300" />
                </div>
                <p className="font-serif text-text-secondary">
                  Sélectionnez une soumission<br />pour examiner les détails.
                </p>
              </div>
            )}
            {activeTab === "change_requests" && !selectedRequest && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-64">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Edit3 size={32} className="text-gray-300" />
                </div>
                <p className="font-serif text-text-secondary">
                  Sélectionnez une demande<br />pour la traiter.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
