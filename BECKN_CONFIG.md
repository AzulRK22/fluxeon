# Beckn-ONIX Configuration Guide

## Environment Variables for Production

When you register with the **DeDi Registry**, you'll receive credentials that must be configured in Beckn-ONIX.

### 1. Update `.env` File

Add these variables to `fluxeon/.env`:

```ini
# Beckn Credentials (from DeDi Registry)
BECKN_SUBSCRIBER_ID=your-subscriber-id-from-dedi
BECKN_KEY_ID=your-key-id-from-dedi
BECKN_SIGNING_PRIVATE_KEY=your-ed25519-private-key-base64
BECKN_SIGNING_PUBLIC_KEY=your-ed25519-public-key-base64
BECKN_ENCRYPTION_PRIVATE_KEY=your-encryption-private-key-base64
BECKN_ENCRYPTION_PUBLIC_KEY=your-encryption-public-key-base64
```

### 2. How It Works

**Development Mode** (default):

- ONIX uses hardcoded keys from `fluxeon-bap.yaml`
- Works for local testing without DeDi registration

**Production Mode** (with env vars):

- ONIX reads credentials from environment variables
- Overrides hardcoded values
- Uses syntax: `${ENV_VAR:-default_value}`

### 3. Configuration Flow

```
.env file
   ↓
docker-compose.yml (passes to container)
   ↓
beckn-onix container
   ↓
fluxeon-bap.yaml (reads env vars)
   ↓
ONIX uses credentials for signing
```

### 4. Verify Configuration

```bash
# Check ONIX is using correct subscriber ID
docker exec -it fluxeon-beckn-onix env | grep BECKN_SUBSCRIBER_ID

# Check ONIX logs for signing
docker logs fluxeon-beckn-onix | grep "subscriber"
```

### 5. Backend Configuration

Python backend automatically uses ONIX URL from config:

```python
# backend/app/core/config.py
beckn_onix_url: str = Field(default="http://localhost:8081", env="BECKN_ONIX_URL")

# backend/app/core/beckn_client.py
self.onix_url = settings.beckn_onix_url  # Uses config value
```

**All requests go to ONIX**, not directly to Gateway:

- ✅ `http://localhost:8081/bap/caller/search`
- ✅ `http://localhost:8081/bap/caller/select`
- ✅ `http://localhost:8081/bap/caller/init`
- ✅ `http://localhost:8081/bap/caller/confirm`

ONIX then signs and forwards to Beckn Gateway.

## Summary

✅ **Development**: Works out of the box with default keys
✅ **Production**: Set env vars from DeDi registry
✅ **Backend**: Automatically uses ONIX URL from config
✅ **Docker**: Passes env vars to ONIX container
