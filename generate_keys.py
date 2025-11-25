# generate_keys.py
"""
Ed25519 Key Generator for FLUXEON Beckn Integration
Generates signing and encryption key pairs for DEG Hackathon
"""
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

def generate_ed25519_keypair():
    """Generate Ed25519 key pair and return base64-encoded strings."""
    # Generate key pair
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    # Get raw bytes (32 bytes each)
    private_bytes = private_key.private_bytes_raw()  # Seed
    public_bytes = public_key.public_bytes_raw()
    
    # Encode to base64
    private_b64 = base64.b64encode(private_bytes).decode()
    public_b64 = base64.b64encode(public_bytes).decode()
    
    return private_b64, public_b64

if __name__ == "__main__":
    print("=" * 60)
    print("FLUXEON - Ed25519 Key Generator")
    print("=" * 60)
    
    private_key, public_key = generate_ed25519_keypair()
    
    print("\n=== Ed25519 Key Pair ===")
    print(f"signingPrivateKey: {private_key}")
    print(f"signingPublicKey: {public_key}")
    
    print("\n=== Copy to .env ===")
    print(f"BECKN_SIGNING_PRIVATE_KEY={private_key}")
    print(f"BECKN_SIGNING_PUBLIC_KEY={public_key}")
    print(f"BECKN_ENCRYPTION_PRIVATE_KEY={private_key}")
    print(f"BECKN_ENCRYPTION_PUBLIC_KEY={public_key}")
    
    print("\n" + "=" * 60)
    print("⚠️  IMPORTANT: Keep the private key secure!")
    print("=" * 60)
