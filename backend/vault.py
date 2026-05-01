import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We need a master key. In production this should be set via env var,
# but for local dev we can generate one and save it to .env if missing.
SECRET_KEY = os.getenv("NEXUS_VAULT_KEY")

if not SECRET_KEY:
    SECRET_KEY = Fernet.generate_key().decode()
    # Save it to .env for persistence
    with open(".env", "a") as f:
        f.write(f"\nNEXUS_VAULT_KEY={SECRET_KEY}\n")
    print("Generated new NEXUS_VAULT_KEY and saved to .env")

cipher_suite = Fernet(SECRET_KEY.encode())

def encrypt_secret(value: str) -> str:
    """Encrypts a string value."""
    if not value:
        return ""
    return cipher_suite.encrypt(value.encode()).decode()

def decrypt_secret(encrypted_value: str) -> str:
    """Decrypts a string value."""
    if not encrypted_value:
        return ""
    return cipher_suite.decrypt(encrypted_value.encode()).decode()
