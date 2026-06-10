import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { ApiError, requestPasswordReset } from "../lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setResetUrl(null);
    setIsLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
      setResetUrl(response.reset_url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Demande impossible pour le moment");
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
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-center font-serif text-sm text-text-secondary">
          Entrez votre email institutionnel pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="border border-brand-primary/10 bg-white px-4 py-8 shadow-2xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            <div>
              <label htmlFor="email" className="block font-sans text-sm font-medium text-brand-primary">
                Email
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nom.prenom@lias.ma"
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
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                {message}
              </div>
            )}

            {resetUrl && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-bold">Lien de test local :</p>
                <Link to={new URL(resetUrl).pathname + new URL(resetUrl).search} className="break-all underline">
                  {resetUrl}
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-xl border border-transparent bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-primary/90 disabled:opacity-70"
            >
              {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
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
