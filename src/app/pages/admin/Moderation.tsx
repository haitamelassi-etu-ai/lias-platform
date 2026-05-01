import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, X, AlertTriangle, Clock, MessageSquare } from "lucide-react";
import {
  ApiError,
  listModerationQueue,
  moderateItem,
  type ModerationQueueItem,
} from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

export function Moderation() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const loadQueue = async () => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await listModerationQueue(token);
        setQueue(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger la file de modération");
      } finally {
        setIsLoading(false);
      }
    };
    void loadQueue();
  }, [token]);

  const selectedQueueItem =
    queue.find(item => `${item.content_type}-${item.item_id}` === selectedItemKey) ?? null;

  const handleDecision = async (decision: "validated" | "rejected" | "needs_correction") => {
    if (!token || !selectedQueueItem) return;
    setError(null);
    setNotice(null);
    try {
      await moderateItem(token, selectedQueueItem.content_type, selectedQueueItem.item_id, decision);
      setQueue(current =>
        current.filter(
          item => !(item.content_type === selectedQueueItem.content_type && item.item_id === selectedQueueItem.item_id)
        )
      );
      setSelectedItemKey(null);
      setComment("");
      const labels: Record<string, string> = {
        validated: "Contenu approuvé et publié.",
        rejected: "Contenu rejeté.",
        needs_correction: "Correction demandée au membre.",
      };
      setNotice(labels[decision]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La décision n'a pas pu être appliquée");
    }
  };

  const formatContentType = (type: ModerationQueueItem["content_type"]) => {
    const map = { publication: "Publication", communication: "Communication", project: "Projet", event: "Événement", news: "Actualité" } as const;
    return map[type] ?? type;
  };

  return (
    <div className="py-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-sans font-bold text-brand-primary flex items-center gap-3">
            File de Modération
            <span className="bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-full">
              {queue.length} en attente
            </span>
          </h1>
          <p className="text-text-secondary font-serif mt-1">
            Validez, rejetez ou demandez des corrections sur les contenus soumis.
          </p>
        </div>

        <div className="flex gap-2 bg-white rounded-lg p-1 border border-brand-primary/10 shadow-sm">
          {["pending", "history"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                activeTab === tab ? "bg-brand-primary/5 text-brand-primary" : "text-text-secondary hover:text-brand-primary"
              }`}
            >
              {tab === "pending" ? "À traiter" : "Historique"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium">{notice}</div>}

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">Chargement de la modération...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-primary/5 overflow-hidden flex flex-col md:flex-row">
          {/* Queue List */}
          <div className="w-full md:w-1/2 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-brand-primary text-sm uppercase tracking-wider">Soumissions</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px] divide-y divide-gray-100">
              {activeTab === "pending" && queue.map(item => (
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
              {activeTab === "history" && (
                <div className="p-8 text-center text-text-secondary font-serif">
                  L'historique complet des modérations est disponible via l'API.
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="w-full md:w-1/2 bg-gray-50/30">
            {selectedQueueItem ? (
              <motion.div
                key={selectedItemKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 h-full flex flex-col"
              >
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
                  <h3 className="text-xl font-bold text-brand-primary font-sans mb-4">
                    {selectedQueueItem.title}
                  </h3>
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
                    <div className="grid grid-cols-3 pb-1">
                      <span className="text-text-secondary">Statut</span>
                      <span className="col-span-2 font-medium text-amber-600 flex items-center gap-1">
                        <Clock size={14} /> En attente de validation
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment field */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-brand-primary mb-2">
                    Commentaire pour le membre <span className="text-text-secondary font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Expliquez votre décision ou demandez des modifications précises..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
                  />
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDecision("validated")}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      <Check size={18} /> Approuver
                    </button>
                    <button
                      onClick={() => handleDecision("rejected")}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <X size={18} /> Rejeter
                    </button>
                  </div>
                  <button
                    onClick={() => handleDecision("needs_correction")}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-brand-primary/20 text-brand-primary rounded-xl font-bold hover:bg-brand-primary/5 transition-colors bg-white"
                  >
                    <MessageSquare size={18} /> Demander une correction
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-64">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Check size={32} className="text-gray-300" />
                </div>
                <p className="font-serif text-text-secondary">
                  Sélectionnez un élément dans la liste<br />pour examiner les détails et modérer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
