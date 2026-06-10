import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { getCurrentUser } from "../lib/api";

export function OrcidCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("Connexion ORCID en cours...");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      setIsError(true);
      const messages: Record<string, string> = {
        network_error: "Impossible de contacter ORCID. Vérifiez votre connexion.",
        orcid_error: "ORCID a refusé l'autorisation.",
        no_orcid_id: "Aucun identifiant ORCID reçu.",
        not_configured: "La connexion ORCID n'est pas encore configurée sur ce serveur. Veuillez enregistrer votre application sur orcid.org/developer-tools et renseigner LIAS_ORCID_CLIENT_ID dans backend/.env",
      };
      setMessage(messages[error] ?? "Erreur de connexion ORCID.");
      return;
    }

    if (!token) {
      setIsError(true);
      setMessage("Réponse ORCID invalide.");
      return;
    }

    const finishLogin = async () => {
      try {
        const user = await getCurrentUser(token);
        loginWithToken(token, user);
        navigate("/dashboard", { replace: true });
      } catch {
        setIsError(true);
        setMessage("Erreur lors de la récupération du profil.");
      }
    };

    void finishLogin();
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-tertiary">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {!isError ? (
          <>
            <div className="w-12 h-12 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-brand-primary font-sans font-bold">{message}</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-700 font-bold mb-4">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}
