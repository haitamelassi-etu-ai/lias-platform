import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Link } from "react-router";
import { motion } from "motion/react";
import { Lock, ArrowRight, ShieldCheck, AtSign } from "lucide-react";
import { ApiError } from "../lib/api";

export function Login() {
  const { user, login } = useAuth();
  const [role, setRole] = useState<"member" | "admin">("member");
  const [identifier, setIdentifier] = useState("chercheur@lias.fsb.ac.ma");
  const [password, setPassword] = useState("lias2024demo");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRolePreset = (selectedRole: "member" | "admin") => {
    setRole(selectedRole);
    setIdentifier(
      selectedRole === "admin"
        ? "admin@lias.fsb.ac.ma"
        : "chercheur@lias.fsb.ac.ma",
    );
    setPassword("lias2024demo");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Connexion impossible pour le moment");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-brand-tertiary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center text-white mb-6 shadow-xl">
            <ShieldCheck size={32} className="text-brand-secondary" />
          </div>
        </motion.div>
        <h2 className="mt-2 text-center text-3xl font-sans font-bold text-brand-primary tracking-tight">
          Portail Authentifié
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary font-serif">
          Accès réservé aux membres et administrateurs du LIAS
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-2xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10 border border-brand-primary/10">
          <form className="space-y-6" onSubmit={(e) => void handleLogin(e)}>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-brand-primary font-sans">
                Sélectionnez un profil de test
              </label>
              <div className="mt-2 flex gap-4">
                <button
                  type="button"
                  onClick={() => handleRolePreset("member")}
                  className={`flex-1 py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                    role === "member"
                      ? "bg-brand-secondary/10 border-brand-secondary text-brand-secondary ring-2 ring-brand-secondary/20"
                      : "border-gray-200 text-text-secondary hover:border-brand-primary/30"
                  }`}
                >
                  Chercheur
                </button>
                <button
                  type="button"
                  onClick={() => handleRolePreset("admin")}
                  className={`flex-1 py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                    role === "admin"
                      ? "bg-brand-primary border-brand-primary text-white ring-2 ring-brand-primary/20"
                      : "border-gray-200 text-text-secondary hover:border-brand-primary/30"
                  }`}
                >
                  Administrateur
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-brand-primary font-sans">
                Email ou ORCID ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <AtSign size={18} />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  placeholder="email@lias.ac.ma  ou  0000-0000-0000-0000"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-primary font-sans">
                Mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-secondary focus:ring-brand-secondary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary font-serif">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-brand-secondary hover:text-brand-primary transition-colors font-sans">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-70"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Connexion Sécurisée <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-text-secondary font-serif">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="font-medium text-brand-secondary hover:text-brand-primary transition-colors"
            >
              Créer un compte
            </Link>
          </div>

          <div className="mt-3 text-center text-xs text-text-secondary font-serif italic">
            Comptes de démonstration : chercheur@lias.fsb.ac.ma et admin@lias.fsb.ac.ma (mot de passe : lias2024demo).
          </div>
        </div>
      </motion.div>
    </div>
  );
}
