from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Multi-Vendor Marketplace"
    secret_key: str = "your-super-secret-key-change-in-production-min-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    db_path: str = "data/marketplace.json"
    razorpay_key_id: str = "rzp_test_placeholder"
    razorpay_key_secret: str = "razorpay_secret_placeholder"
    stripe_secret_key: str = "sk_test_placeholder"
    stripe_publishable_key: str = "pk_test_placeholder"
    upi_id: str = "marketplace@upi"
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
