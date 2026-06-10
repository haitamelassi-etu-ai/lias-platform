import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  ApiError,
  downloadMyPublicationsCsv,
  getAdminDashboard,
  getMemberDashboard,
  type ActivityItem,
  type DashboardStat,
} from "../lib/api";
import { exportAdminDashboardPdf } from "../lib/adminReportPdf";

function formatActivityAction(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("needs_correction")) return "Correction demandée";
  if (normalized.includes("validated")) return "Contenu validé";
  if (normalized.includes("pending")) return "En attente de modération";
  if (normalized.includes("rejected")) return "Contenu rejeté";
  return action.replaceAll("_", " ");
}

export function Dashboard() {
  const { user, token } = useAuth();
  const isMember = user?.role === "member";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [memberPubData, setMemberPubData] = useState<{ year: string; count: number }[]>([]);
  const [adminLabData, setAdminLabData] = useState<
    { month: string; validations: number; submissions: number }[]
  >([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [isExportingAdminPdf, setIsExportingAdminPdf] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token || !user) return;

      setIsLoading(true);
      setError(null);

      try {
        if (user.role === "admin") {
          const response = await getAdminDashboard(token);
          setStats(response.stats);
          setAdminLabData(response.submission_trend);
          setRecentActivities(response.recent_activities);
        } else {
          const response = await getMemberDashboard(token);
          setStats(response.stats);
          setMemberPubData(response.publication_trend);
          setRecentActivities(response.recent_activities);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Impossible de charger le tableau de bord");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [token, user]);

  const kpiWithIcons = useMemo(() => {
    const iconMap = [BookOpen, FileText, Clock, isMember ? CheckCircle : Activity];
    const colorMap = ["text-blue-500", "text-emerald-500", "text-amber-500", "text-brand-secondary"];
    const bgMap = ["bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-cyan-50"];

    return stats.map((kpi, index) => ({
      ...kpi,
      icon: iconMap[index] ?? Activity,
      color: colorMap[index] ?? "text-slate-500",
      bg: bgMap[index] ?? "bg-slate-100",
    }));
  }, [stats, isMember]);

  const handleExport = async () => {
    if (!token) return;
    try {
      await downloadMyPublicationsCsv(token);
    } catch {
      setError("Export CSV impossible pour le moment");
    }
  };

  const handleAdminPdfExport = async () => {
    if (!user) return;
    setIsExportingAdminPdf(true);
    setError(null);
    try {
      await exportAdminDashboardPdf({
        generatedBy: user.full_name,
        stats,
        submissionTrend: adminLabData,
        recentActivities,
      });
    } catch {
      setError("Export PDF impossible pour le moment");
    } finally {
      setIsExportingAdminPdf(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 py-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-secondary">
              {isMember ? "Espace membre" : "Administration LIAS"}
            </p>
            <h1 className="mt-2 text-3xl font-sans font-bold text-brand-primary">
              Tableau de bord
            </h1>
            <p className="mt-2 max-w-2xl text-text-secondary font-serif">
              Bienvenue, {user?.full_name}. Voici un résumé clair de vos activités et indicateurs.
            </p>
          </div>

          {isMember ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-primary/10 bg-white px-4 py-2 text-sm font-bold text-brand-primary shadow-sm transition-colors hover:bg-brand-tertiary"
              >
                <Download size={16} />
                Export CSV
              </button>
              <Link
                to="/member/panel"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-secondary px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-primary"
              >
                <Plus size={16} />
                Nouvelle publication
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/admin/panel"
                className="inline-flex items-center justify-center rounded-lg border border-brand-primary/15 bg-white px-4 py-2 text-sm font-bold text-brand-primary transition-colors hover:border-brand-secondary/40 hover:text-brand-secondary"
              >
                Centre admin
              </Link>
              <button
                onClick={() => void handleAdminPdfExport()}
                disabled={isExportingAdminPdf || isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {isExportingAdminPdf ? "Génération..." : "Bilan Laboratoire (PDF)"}
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">
          Chargement du tableau de bord...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiWithIcons.map((kpi, index) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-xl border border-brand-primary/10 bg-white p-5 shadow-sm transition-colors hover:border-brand-secondary/30"
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 rounded-xl p-3 ${kpi.bg}`}>
                    <kpi.icon size={22} className={kpi.color} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary font-sans">
                      {kpi.label}
                    </h3>
                    <div className="mt-1 text-3xl font-bold text-brand-primary font-sans">
                      {kpi.value}
                    </div>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-text-secondary">
                      {kpi.trend}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 }}
              className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm lg:col-span-2"
            >
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-brand-primary font-sans">
                  {isMember ? "Évolution des publications" : "Activité des soumissions"}
                </h2>
                {!isMember && (
                  <div className="flex flex-wrap gap-3 text-xs font-bold text-text-secondary">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-secondary" />
                      Validations
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-accent" />
                      Soumissions
                    </span>
                  </div>
                )}
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {isMember ? (
                    <BarChart data={memberPubData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <RechartsTooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="count" fill="#0891B2" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  ) : (
                    <LineChart data={adminLabData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <RechartsTooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Line type="monotone" dataKey="validations" stroke="#0891B2" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="submissions" stroke="#FF7F50" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.36 }}
              className="flex flex-col rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-primary font-sans">
                  Activités récentes
                </h2>
                <Link
                  to={isMember ? "/member/panel" : "/admin/moderation"}
                  className="text-sm font-bold text-brand-secondary transition-colors hover:text-brand-primary"
                >
                  Voir tout
                </Link>
              </div>

              <div className="flex-1 space-y-6">
                {recentActivities.map((item, index) => (
                  <div key={`${item.action}-${item.title}-${index}`} className="flex items-start gap-4">
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        item.status === "success"
                          ? "bg-emerald-500"
                          : item.status === "pending"
                            ? "bg-amber-500"
                            : "bg-brand-accent"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-brand-primary font-sans">
                        {formatActivityAction(item.action)}
                      </div>
                      <div className="mt-1 text-sm text-text-secondary font-serif">
                        {item.title}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.user && (
                          <span className="rounded-sm bg-brand-tertiary px-2 py-0.5 text-xs font-medium text-brand-primary">
                            {item.user}
                          </span>
                        )}
                        <span className="text-xs text-text-secondary/70">{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!isMember && (
                <div className="mt-6 border-t border-brand-primary/5 pt-6">
                  <Link
                    to="/admin/moderation"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary/5 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary/10"
                  >
                    <AlertCircle size={16} />
                    Ouvrir la file de modération
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
