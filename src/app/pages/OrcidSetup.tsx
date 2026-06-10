import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { ApiError, completeOrcidSetup } from "../lib/api";
import { Lock, Mail, User, BookOpen } from "lucide-react";

export function OrcidSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const orcidId = searchParams.get("orcid_id") ?? "";
  const orcidName = decodeURIComponent(searchParams.get("name") ?? "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!orcidId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-bold">Paramètres ORCID manquants. <a href="/login" className="underline">Retour</a></p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    try {
      const response = await completeOrcidSetup({ orcid_id: orcidId, orcid_name: orcidName, email, password });
      loginWithToken(response.access_token, response.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-brand-tertiary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" className="w-10 h-10" />
        </div>
        <h2 className="text-center text-3xl font-sans font-bold text-brand-primary">
          Finaliser votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary font-serif">
          Votre identité ORCID a été vérifiée. Créez votre mot de passe pour accéder à LIAS.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10 border border-brand-primary/10">

          {/* Données ORCID verrouillées */}
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-xs font-bold text-green-700 mb-2 uppercase tracking-wider">Données importées depuis ORCID</p>
            <div className="flex items-center gap-3">
              <User size={16} className="text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-900">{orcidName || "Nom non disponible"}</p>
                <p className="text-xs text-green-600">ORCID : {orcidId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-green-700">
              <BookOpen size={13} />
              Vos publications ORCID seront importées automatiquement
            </div>
            <p className="mt-2 text-xs text-green-600 italic">
              🔒 Ces informations sont verrouillées et ne peuvent pas être modifiées.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Adresse email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-brand-secondary focus:border-brand-secondary bg-gray-50/50"
                />
              </div>
              <p className="text-xs text-text-secondary mt-1 font-serif">
                ORCID ne partage pas votre email. Saisissez-le manuellement.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-brand-secondary focus:border-brand-secondary bg-gray-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-brand-secondary focus:border-brand-secondary bg-gray-50/50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-all disabled:opacity-70"
            >
              {isLoading ? "Création du compte..." : "Créer mon compte LIAS"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-text-secondary font-serif">
            Déjà un compte ?{" "}
            <a href="/login" className="text-brand-secondary hover:text-brand-primary font-medium">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
