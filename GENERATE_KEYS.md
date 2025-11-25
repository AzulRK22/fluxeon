# FLUXEON - Generador de Credenciales Ed25519

## Herramienta Encontrada

**Ubicación**: `d:\..\beckn-home\beckn-onix-main\install\generate-ed25519-keys.go`

## Comando para Generar Claves

### Opción 1: Usando Go (Recomendado)

```bash
cd d:\..\beckn-home\beckn-onix-main
go run install/generate-ed25519-keys.go
```

**Salida esperada**:

```
=== Ed25519 Key Pair ===
signingPrivateKey: lP3sHA+9gileOkXYJXh7Jg8tK0gEEMbf9yCPnFpbldhrGLzKGkgQQPyGRCz/CM+kpMCv0n3a8i5k2RfLsVoObQ==
signingPublicKey: axi8yhpIEED8hkQs/wjPpKTAr9J92vIuZNkXy7FaDm0=
```

### Opción 2: Script Python (Alternativo)

Si no tienes Go instalado, puedes usar este script Python:

```python
# generate_keys.py
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

# Generate key pair
private_key = Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Get raw bytes
private_bytes = private_key.private_bytes_raw()  # 32 bytes seed
public_bytes = public_key.public_bytes_raw()     # 32 bytes

# Encode to base64
print("=== Ed25519 Key Pair ===")
print(f"signingPrivateKey: {base64.b64encode(private_bytes).decode()}")
print(f"signingPublicKey: {base64.b64encode(public_bytes).decode()}")
```

Ejecutar:

```bash
pip install cryptography
python generate_keys.py
```

## Cómo Usar las Claves Generadas

1. **Ejecuta el generador** (opción 1 o 2)
2. **Copia las claves** de la salida
3. **Actualiza `.env`**:

```ini
# Beckn Credentials (from key generator)
BECKN_SUBSCRIBER_ID=fluxeon-dso-bap-dev
BECKN_KEY_ID=fluxeon-key-001
BECKN_SIGNING_PRIVATE_KEY=<pega aquí signingPrivateKey>
BECKN_SIGNING_PUBLIC_KEY=<pega aquí signingPublicKey>
BECKN_ENCRYPTION_PRIVATE_KEY=<pega aquí signingPrivateKey>
BECKN_ENCRYPTION_PUBLIC_KEY=<pega aquí signingPublicKey>
```

4. **Registra en DeDi** (si aplica):
   - Usa `signingPublicKey` para el registro
   - Guarda `signingPrivateKey` de forma segura

## Notas Importantes

- **NO compartas** la `signingPrivateKey` públicamente
- Las claves son en formato **Base64**
- El `signingPrivateKey` es el **seed** (32 bytes)
- El `signingPublicKey` es la clave pública (32 bytes)
- Para DEG Hackathon, puedes usar las mismas claves para signing y encryption

## Verificación

Para verificar que las claves funcionan:

```bash
cd d:\..\fluxeon
docker-compose restart beckn-onix
docker logs beckn-onix | grep "subscriber"
```

Deberías ver el `BECKN_SUBSCRIBER_ID` en los logs.
