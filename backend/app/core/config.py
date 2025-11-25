# backend/app/core/config.py
"""
Centralized configuration management for FLUXEON.
Loads environment variables and provides typed access to configuration.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Beckn BAP Configuration
    bap_id: str = Field(default="fluxeon-dso-bap-dev", env="BAP_ID")
    bap_uri: str = Field(default="https://your-ngrok-url.ngrok.io/beckn/webhook", env="BAP_URI")
    
    # DEG Hackathon BAP Sandbox Configuration
    # CRITICAL: Official API endpoints - DO NOT use generic Beckn Gateway
    beckn_bap_sandbox_url: str = Field(
        default="https://deg-hackathon-bap-sandbox.becknprotocol.io",
        env="BECKN_BAP_SANDBOX_URL"
    )
    
    # Beckn Protocol Version (DEG Hackathon uses 2.0.0)
    beckn_core_version: str = Field(default="2.0.0", env="BECKN_CORE_VERSION")
    
    # Dynamic Domains (DEG Hackathon Specification)
    # Domain for /api/discover endpoint
    beckn_domain_compute_energy: str = Field(
        default="beckn.one.DEG:compute-energy:1.0",
        env="BECKN_DOMAIN_COMPUTE_ENERGY"
    )
    # Domain for /api/confirm and /api/status endpoints
    beckn_domain_demand_flexibility: str = Field(
        default="beckn.one.DEG:demand-flexibility:1.0",
        env="BECKN_DOMAIN_DEMAND_FLEXIBILITY"
    )
    
    # Location Configuration
    beckn_country: str = Field(default="ARG", env="BECKN_COUNTRY")
    beckn_city: str = Field(default="Buenos Aires", env="BECKN_CITY")
    
    # Application Settings
    debug: bool = Field(default=True, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        # Load from .env file in project root
        env_file = os.path.join(os.path.dirname(__file__), "../../../.env")
        env_file_encoding = "utf-8"
        case_sensitive = False

# Singleton instance
settings = Settings()

# Helper function for debugging
def print_config():
    """Print current configuration (for debugging)."""
    print("=" * 60)
    print("FLUXEON DEG Hackathon Configuration")
    print("=" * 60)
    print(f"BAP_ID: {settings.bap_id}")
    print(f"BAP_URI: {settings.bap_uri}")
    print(f"Sandbox: {settings.beckn_bap_sandbox_url}")
    print(f"Domain (compute): {settings.beckn_domain_compute_energy}")
    print(f"Domain (flexibility): {settings.beckn_domain_demand_flexibility}")
    print(f"Location: {settings.beckn_city}, {settings.beckn_country}")
    print(f"Core Version: {settings.beckn_core_version}")
    print("=" * 60)

if __name__ == "__main__":
    print_config()
