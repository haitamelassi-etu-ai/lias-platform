import os
import warnings
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    def __init__(self) -> None:
        self.app_name = os.getenv("LIAS_APP_NAME", "LIAS Scientific Platform API")
        self.api_prefix = "/api/v1"
        self.env = os.getenv("LIAS_ENV", "development").lower()
        self.secret_key = os.getenv("LIAS_SECRET_KEY", "dev-secret-key-change-me")
        weak_secret_keys = {
            "dev-secret-key-change-me",
            "change-this-secret-key-in-production",
            "replace-with-a-strong-random-secret",
        }
        if self.secret_key in weak_secret_keys:
            if self.env == "production":
                raise RuntimeError(
                    "LIAS_SECRET_KEY must be set to a strong value in production. "
                    "Refusing to start with a default placeholder key."
                )
            warnings.warn(
                "LIAS_SECRET_KEY is using a default placeholder value. "
                "Set a strong secret key in backend/.env before any deployment.",
                stacklevel=1,
            )
        self.algorithm = "HS256"
        self.access_token_expire_minutes = int(
            os.getenv("LIAS_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )
        self.password_reset_expire_minutes = int(
            os.getenv("LIAS_PASSWORD_RESET_EXPIRE_MINUTES", "30")
        )
        self.database_url = os.getenv("LIAS_DATABASE_URL", "sqlite:///./lias.db")
        self.docs_enabled = self._bool_env(
            "LIAS_DOCS_ENABLED", default=self.env != "production"
        )
        self.auto_create_tables = self._bool_env(
            "LIAS_AUTO_CREATE_TABLES", default=self.env != "production"
        )
        self.auto_seed = self._bool_env("LIAS_AUTO_SEED", default=self.env != "production")
        if self.env == "production":
            if self.database_url.startswith("sqlite"):
                raise RuntimeError(
                    "SQLite is not allowed in production. Set LIAS_DATABASE_URL to PostgreSQL."
                )
            if self.docs_enabled:
                warnings.warn(
                    "LIAS_DOCS_ENABLED=true exposes Swagger/OpenAPI in production.",
                    stacklevel=1,
                )
            if self.auto_create_tables or self.auto_seed:
                warnings.warn(
                    "LIAS_AUTO_CREATE_TABLES or LIAS_AUTO_SEED is enabled in production. "
                    "Use Alembic migrations and official data for deployment.",
                    stacklevel=1,
                )
        cors_origins = os.getenv(
            "LIAS_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        )
        self.cors_origins = [
            origin.strip() for origin in cors_origins.split(",") if origin.strip()
        ]
        self.frontend_url = os.getenv("LIAS_FRONTEND_URL", "http://localhost:5173")
        self.orcid_client_id = os.getenv("LIAS_ORCID_CLIENT_ID", "")
        self.orcid_client_secret = os.getenv("LIAS_ORCID_CLIENT_SECRET", "")
        self.orcid_base_url = os.getenv("LIAS_ORCID_BASE_URL", "https://orcid.org")
        self.smtp_host = os.getenv("LIAS_SMTP_HOST", "")
        self.smtp_port = int(os.getenv("LIAS_SMTP_PORT", "587"))
        self.smtp_username = os.getenv("LIAS_SMTP_USERNAME", "")
        self.smtp_password = os.getenv("LIAS_SMTP_PASSWORD", "")
        self.smtp_from_email = os.getenv("LIAS_SMTP_FROM_EMAIL", self.smtp_username)
        self.smtp_use_tls = self._bool_env("LIAS_SMTP_USE_TLS", default=True)

    @staticmethod
    def _bool_env(name: str, default: bool) -> bool:
        value = os.getenv(name)
        if value is None:
            return default
        return value.strip().lower() in {"1", "true", "yes", "on"}


settings = Settings()
