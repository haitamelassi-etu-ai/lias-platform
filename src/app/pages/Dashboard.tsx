import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { BookOpen, FileText, CheckCircle, AlertCircle, Clock, Download, Plus, Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  downloadMyPublicationsCsv,
  getAdminDashboard,
  getMemberDashboard,
  type ActivityItem,
  type DashboardStat,
} from "../lib/api";

export function Dashboard() {
  const { user, token } = useAuth();
  const isMember = user?.role === "member";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [memberPubData, setMemberPubData] = useState<{ year: string; count: number }[]>([]);
  const [adminLabData, setAdminLabData] = useState<{ month: string; validations: number; submissions: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token || !user) {
        return;
      }

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
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Impossible de charger le tableau de bord");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [token, user]);

  const kpiWithIcons = useMemo(() => {
    const iconMap = [BookOpen, FileText, Clock, isMember ? CheckCircle : Activity];
    const colorMap = ["text-blue-500", "text-emerald-500", "text-amber-500", "text-purple-500"];
    const bgMap = ["bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-purple-50"];

    return stats.map((kpi, index) => ({
      ...kpi,
      icon: iconMap[index] ?? Activity,
      color: colorMap[index] ?? "text-slate-500",
      bg: bgMap[index] ?? "bg-slate-100",
    }));
  }, [stats, isMember]);

  const handleExport = async () => {
    if (!token) {
      return;
    }
    try {
      await downloadMyPublicationsCsv(token);
    } catch {
      setError("Export CSV impossible pour le moment");
    }
  };

  return (
    <div className="py-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-sans font-bold text-brand-primary">
            Tableau de bord
          </h1>
          <p className="text-text-secondary font-serif mt-1">
            Bienvenue, {user?.full_name}. Voici un resume de vos activites.
          </p>
        </div>
        
        {isMember ? (
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-primary/10 rounded-lg text-sm font-bold text-brand-primary hover:bg-brand-tertiary transition-colors shadow-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-secondary rounded-lg text-sm font-bold text-white hover:bg-brand-primary transition-colors shadow-md">
              <Plus size={16} />
              Nouvelle Publication
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary rounded-lg text-sm font-bold text-white hover:bg-brand-primary/90 transition-colors shadow-md">
              <Download size={16} />
              Bilan Laboratoire (PDF)
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-text-secondary font-serif">
          Chargement du tableau de bord...
        </div>
      ) : (
        <>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiWithIcons.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 hover:border-brand-primary/10 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon size={24} className={kpi.color} />
              </div>
              <span className="text-xs font-bold text-text-secondary bg-brand-tertiary px-2 py-1 rounded-md">
                {kpi.trend}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1 font-sans">{kpi.label}</h3>
              <div className="text-3xl font-bold text-brand-primary font-sans">{kpi.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-brand-primary font-sans">
              {isMember ? "Évolution des publications" : "Activité des soumissions"}
            </h2>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isMember ? (
                <BarChart data={memberPubData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#0891B2" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              ) : (
                <LineChart data={adminLabData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="validations" stroke="#0891B2" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="submissions" stroke="#FF7F50" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-brand-primary/5 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-brand-primary font-sans">
              Activités récentes
            </h2>
            <button className="text-sm text-brand-secondary font-bold hover:text-brand-primary transition-colors">
              Voir tout
            </button>
          </div>
          
          <div className="space-y-6 flex-1">
            {recentActivities.map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                  item.status === 'success' ? 'bg-emerald-500' : 
                  item.status === 'pending' ? 'bg-amber-500' : 'bg-brand-accent'
                }`} />
                <div>
                  <div className="text-sm font-bold text-brand-primary font-sans">
                    {item.action}
                  </div>
                  <div className="text-sm text-text-secondary font-serif mt-1">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {item.user && (
                      <span className="text-xs font-medium text-brand-primary bg-brand-tertiary px-2 py-0.5 rounded-sm">
                        {item.user}
                      </span>
                    )}
                    <span className="text-xs text-text-secondary/70">
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isMember && (
            <div className="mt-6 pt-6 border-t border-brand-primary/5">
              <button className="w-full py-3 bg-brand-primary/5 text-brand-primary font-bold rounded-xl hover:bg-brand-primary/10 transition-colors text-sm flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                Ouvrir la file de moderation
              </button>
            </div>
          )}
        </motion.div>
      </div>
        </>
      )}
    </div>
  );
}
