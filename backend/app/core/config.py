import os
import warnings


class Settings:
    def __init__(self) -> None:
        self.app_name = os.getenv("LIAS_APP_NAME", "LIAS Scientific Platform API")
        self.api_prefix = "/api/v1"
        self.secret_key = os.getenv("LIAS_SECRET_KEY", "dev-secret-key-change-me")
        if self.secret_key == "dev-secret-key-change-me":
            warnings.warn(
                "LIAS_SECRET_KEY is using the default development value. "
                "Set a strong secret key in backend/.env before any deployment.",
                stacklevel=1,
            )
        self.algorithm = "HS256"
        self.access_token_expire_minutes = int(
            os.getenv("LIAS_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )
        self.database_url = os.getenv("LIAS_DATABASE_URL", "sqlite:///./lias.db")
        cors_origins = os.getenv(
            "LIAS_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        )
        self.cors_origins = [
            origin.strip() for origin in cors_origins.split(",") if origin.strip()
        ]


settings = Settings()
