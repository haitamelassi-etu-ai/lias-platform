import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Link } from "react-router";
import { motion } from "motion/react";
import { Lock, Mail, User, ArrowRight, UserPlus } from "lucide-react";
import { register as apiRegister } from "../lib/api";
import { ApiError } from "../lib/api";

export function Register() {
  const { user, login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      await apiRegister(fullName, email, password);
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Inscription impossible pour le moment. Veuillez réessayer.");
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
            <UserPlus size={32} className="text-brand-secondary" />
          </div>
        </motion.div>
        <h2 className="mt-2 text-center text-3xl font-sans font-bold text-brand-primary tracking-tight">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary font-serif">
          Rejoignez la communauté scientifique du laboratoire LIAS
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-2xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10 border border-brand-primary/10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-brand-primary font-sans">
                Nom complet
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="Dr. Prénom Nom"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-primary font-sans">
                Adresse Email Académique
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="prenom.nom@lias.fsb.ac.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-primary font-sans">
                Confirmer le mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Répéter le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-xl focus:ring-brand-secondary focus:border-brand-secondary py-3 border bg-gray-50/50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
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
                    Créer mon compte <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary font-serif">
            Déjà membre ?{" "}
            <Link
              to="/login"
              className="font-medium text-brand-secondary hover:text-brand-primary transition-colors"
            >
              Se connecter
            </Link>
          </div>

          <div className="mt-4 text-center text-xs text-text-secondary font-serif italic">
            Votre compte sera créé avec le rôle Membre. Un administrateur peut vous accorder des droits supplémentaires.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
