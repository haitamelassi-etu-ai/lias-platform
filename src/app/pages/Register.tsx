import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, Link } from "react-router";
import { motion } from "motion/react";
import { Lock, Mail, User, ArrowRight, UserPlus, Search, CheckCircle2, X } from "lucide-react";
import { register as apiRegister, lookupOrcid, ApiError } from "../lib/api";

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

export function Register() {
  const { user, login } = useAuth();

  // ORCID lookup
  const [orcidInput, setOrcidInput] = useState("");
  const [orcidVerified, setOrcidVerified] = useState<{ id: string; name: string } | null>(null);
  const [isLooking, setIsLooking] = useState(false);
  const [orcidError, setOrcidError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleOrcidLookup = async () => {
    const id = orcidInput.trim();
    if (!id) { setOrcidError("Entrez un ORCID ID"); return; }
    if (!ORCID_REGEX.test(id)) { setOrcidError("Format invalide. Exemple : 0000-0000-0000-0000"); return; }

    setOrcidError(null);
    setIsLooking(true);
    try {
      const preview = await lookupOrcid(id);
      const name = preview.full_name ?? "";
      if (!name) { setOrcidError("Nom introuvable sur ce profil ORCID"); return; }
      setOrcidVerified({ id, name });
      setFullName(name);
    } catch (err) {
      setOrcidError(err instanceof ApiError ? err.message : "Profil ORCID introuvable");
    } finally {
      setIsLooking(false);
    }
  };

  const clearOrcid = () => {
    setOrcidVerified(null);
    setOrcidInput("");
    setOrcidError(null);
    setFullName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }

    setIsLoading(true);
    try {
      await apiRegister(fullName, email, password, orcidVerified?.id);
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-brand-tertiary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center mb-6 shadow-xl">
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

          {/* ── ORCID lookup section ── */}
          <div className="mb-6 p-4 rounded-xl border border-brand-secondary/20 bg-brand-secondary/5">
            <p className="text-sm font-bold text-brand-primary mb-3 flex items-center gap-2">
              <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" className="w-4 h-4" />
              Importer depuis ORCID (optionnel)
            </p>

            {!orcidVerified ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orcidInput}
                    onChange={(e) => setOrcidInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleOrcidLookup()}
                    placeholder="0000-0000-0000-0000"
                    className="flex-1 font-mono text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-secondary focus:border-brand-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => void handleOrcidLookup()}
                    disabled={isLooking}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-secondary text-white rounded-lg text-sm font-bold hover:bg-brand-secondary/90 transition-colors disabled:opacity-60"
                  >
                    <Search size={15} />
                    {isLooking ? "..." : "Rechercher"}
                  </button>
                </div>
                {orcidError && <p className="text-xs text-red-600 mt-2">{orcidError}</p>}
                <p className="text-xs text-text-secondary mt-2 font-serif">
                  Votre nom sera importé automatiquement depuis votre profil ORCID.
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">{orcidVerified.name}</p>
                    <p className="text-xs text-green-600 font-mono">{orcidVerified.id}</p>
                  </div>
                </div>
                <button type="button" onClick={clearOrcid} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Nom complet {orcidVerified && <span className="text-green-600 text-xs">🔒 importé depuis ORCID</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Dr. Prénom Nom"
                  value={fullName}
                  onChange={(e) => !orcidVerified && setFullName(e.target.value)}
                  disabled={!!orcidVerified}
                  className={`block w-full pl-10 py-3 border rounded-xl text-sm ${
                    orcidVerified
                      ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "border-gray-300 bg-gray-50/50 focus:ring-brand-secondary focus:border-brand-secondary"
                  }`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Adresse Email Académique
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="prenom.nom@lias.fsb.ac.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50/50 focus:ring-brand-secondary focus:border-brand-secondary"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50/50 focus:ring-brand-secondary focus:border-brand-secondary"
                />
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-brand-primary font-sans mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Répéter le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50/50 focus:ring-brand-secondary focus:border-brand-secondary"
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
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 transition-all disabled:opacity-70 shadow-sm"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  {orcidVerified ? "Créer mon compte LIAS + lier ORCID" : "Créer mon compte"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary font-serif">
            Déjà membre ?{" "}
            <Link to="/login" className="font-medium text-brand-secondary hover:text-brand-primary transition-colors">
              Se connecter
            </Link>
          </div>
          <div className="mt-3 text-center text-xs text-text-secondary font-serif italic">
            Votre compte sera créé avec le rôle Membre.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
