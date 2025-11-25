# FLUXEON Beckn Integration - Deployment Guide

## Architecture

```
FLUXEON (Python) → Beckn-ONIX (Go) → Beckn Gateway (Sandbox)
     ↓                    ↓                    ↓
AI Pipeline          Redis Cache         DER Providers
```

## Prerequisites

- Docker & Docker Compose
- ngrok (for public callback URL)
- Go 1.23+ (for building ONIX)

## Quick Start

### 1. Build Beckn-ONIX

```bash
cd d:\..\beckn-home\beckn-onix-main

# Extract schemas
unzip schemas.zip

# Build plugins
chmod +x install/build-plugins.sh
./install/build-plugins.sh

# Build server
go build -o server cmd/adapter/main.go
```

### 2. Start Services with Docker

```bash
cd \..\..\fluxeon

# Build all images
docker-compose build

# Start all services
docker-compose up -d
```

This starts:

- **Redis** (port 6379) - Caching
- **Beckn-ONIX** (port 8081) - Protocol adapter
- **FLUXEON Backend** (port 8000) - FastAPI

### 3. Expose with ngrok

```bash
ngrok http 8000
```

Copy the HTTPS URL (e.g., `YOUR_NGROK_URL_HERE.ngrook-free.dev`) and update `.env`:

```ini
BAP_URI=YOUR_NGROK_URL_HERE.ngrook-free.dev/beckn/callbacks
```

Restart FLUXEON backend:

```bash
docker-compose restart fluxeon-backend
```

### 4. Test the Flow

```bash
# Test ONIX health
curl http://localhost:8081/health

# Test FLUXEON backend
curl http://localhost:8000/

# Run orchestrator test
docker exec -it fluxeon-backend python -m app.core.beckn_client
```

## Manual Testing (without Docker)

### Start Redis

```bash
docker run -d -p 6379:6379 redis:alpine
```

### Start Beckn-ONIX

```bash
cd ..\beckn-home\beckn-onix-main
./server --config=config/fluxeon-bap.yaml
```

### Start FLUXEON Backend

```bash
cd d:\Users\lauta\Desktop\hackathonDEG\fluxeon\backend
uvicorn app.main:app --reload
```

### Expose with ngrok

```bash
ngrok http 8000
```

## Verification

### Check Services

```bash
# Redis
docker exec -it fluxeon-redis redis-cli ping
# Expected: PONG

# Beckn-ONIX
curl http://localhost:8081/health
# Expected: 200 OK

# FLUXEON
curl http://localhost:8000/
# Expected: {"status": "ok", "service": "fluxeon-backend"}
```

### Test Complete Flow

```python
# Inside fluxeon-backend container
python -m app.core.beckn_client
```

Expected output:

```
FLUXEON BECKN ORCHESTRATOR (via ONIX)
[1/4] Sending SEARCH via ONIX...
✓ SEARCH sent via ONIX
[1/4] Waiting for ON_SEARCH callbacks from ONIX...
✓ Received 3 providers
[2/4] Selecting best DER provider...
✓ Selected: der-provider-123
...
✓ ORDER CONFIRMED! OBP ID: OBP-2025-001
```

## Troubleshooting

### ONIX not starting

- Check Redis is running: `docker ps | grep redis`
- Check schemas are extracted: `ls beckn-home/beckn-onix-main/schemas`
- Check plugins are built: `ls beckn-home/beckn-onix-main/plugins`

### Callbacks not received

- Verify ngrok URL is updated in `.env`
- Check ONIX routing config: `cat beckn-home/beckn-onix-main/config/fluxeon-routing.yaml`
- Check FLUXEON callback endpoints: `curl http://localhost:8000/beckn/callbacks/on_search`

### Transaction timeout

- Check ONIX logs: `docker logs fluxeon-beckn-onix`
- Check FLUXEON logs: `docker logs fluxeon-backend`
- Verify Gateway URL in routing config

## Configuration Files

- **ONIX Config**: `beckn-home/beckn-onix-main/config/fluxeon-bap.yaml`
- **Routing**: `beckn-home/beckn-onix-main/config/fluxeon-routing.yaml`
- **Environment**: `fluxeon/.env`
- **Docker**: `fluxeon/docker-compose.yml`

## Next Steps

1. ✅ Deploy with Docker Compose
2. ✅ Set up ngrok for public callbacks
3. 🔄 Test with real Beckn Sandbox
4. 📊 Monitor transactions in logs
5. 🎯 Integrate with AI pipeline for automatic DER requests
