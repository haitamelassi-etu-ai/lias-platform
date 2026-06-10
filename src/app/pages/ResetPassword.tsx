import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { ApiError, confirmPasswordReset } from "../lib/api";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Lien de réinitialisation invalide");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      const response = await confirmPasswordReset(token, password);
      setMessage(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réinitialisation impossible");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center bg-brand-tertiary py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-xl">
            <ShieldCheck size={32} className="text-brand-secondary" />
          </div>
        </motion.div>
        <h1 className="mt-2 text-center font-sans text-3xl font-bold tracking-normal text-brand-primary">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 text-center font-serif text-sm text-text-secondary">
          Définissez un mot de passe sécurisé pour récupérer l’accès à votre espace LIAS.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="border border-brand-primary/10 bg-white px-4 py-8 shadow-2xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10">
          {!token && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Ce lien ne contient pas de token valide. Demandez un nouveau lien de réinitialisation.
            </div>
          )}

          <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            <div>
              <label htmlFor="password" className="block font-sans text-sm font-medium text-brand-primary">
                Nouveau mot de passe
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-xl border border-gray-300 bg-gray-50/50 py-3 pl-10 text-sm focus:border-brand-secondary focus:ring-brand-secondary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-sans text-sm font-medium text-brand-primary">
                Confirmation
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="block w-full rounded-xl border border-gray-300 bg-gray-50/50 py-3 pl-10 text-sm focus:border-brand-secondary focus:ring-brand-secondary"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  {message}. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token}
              className="flex w-full justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-primary/90 disabled:opacity-70"
            >
              {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm font-serif text-text-secondary">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-medium text-brand-secondary transition-colors hover:text-brand-primary"
            >
              <ArrowLeft size={16} /> Retour à la connexion
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
