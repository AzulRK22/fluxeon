# FLUXEON - Guía de Prueba de Conectividad DEG Hackathon

## 📋 Checklist Pre-Prueba

### 1. Túnel Ngrok

```bash
# Terminal 1: Iniciar ngrok
ngrok http 8000
```

**Copiar URL HTTPS**: `https://xxxx.ngrok.io`

**Actualizar `.env`**:

```ini
BAP_URI=https://xxxx.ngrok.io/beckn/webhook
```

### 2. Iniciar Servicios

```bash
# Terminal 2: Levantar stack completo
cd d:\Users\lauta\Desktop\hackathonDEG\fluxeon
docker-compose up -d --build
```

**Verificar logs**:

```bash
# Ver logs de backend
docker logs -f fluxeon-backend

# Buscar confirmación de inicio
# Esperado: "Application startup complete"
```

---

## 🧪 Prueba 1: Discover (Descubrimiento de DERs)

### Endpoint de Prueba

**Crear endpoint de test** en `backend/app/main.py`:

```python
@app.post("/test/discover")
async def test_discover():
    """Endpoint de prueba para disparar discover manualmente"""
    from app.core.beckn_client import run_agent
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    result = await run_agent(
        feeder_id="F1-TEST",
        risk_level=2,
        flexibility_kw=50.0,
        window_start=now + timedelta(minutes=15),
        window_end=now + timedelta(minutes=75)
    )

    return result
```

### Ejecutar Prueba

**Opción A: Desde terminal**

```bash
curl -X POST http://localhost:8000/test/discover \
  -H "Content-Type: application/json"
```

**Opción B: Desde Python**

```python
import requests
response = requests.post("http://localhost:8000/test/discover")
print(response.json())
```

### Respuesta Esperada (Síncrona)

```json
{
  "message": {
    "ack": {
      "status": "ACK"
    }
  }
}
```

**Esto solo confirma que el Sandbox recibió la request.**

---

## 🔍 Verificación de Callback Asíncrono

### Monitorear Ngrok

En la terminal de ngrok, deberías ver:

```
POST /beckn/webhook/on_discover   200 OK
```

### Logs del Backend

```bash
docker logs -f fluxeon-backend | grep "on_discover"
```

**Esperado**:

```
INFO: Received ON_DISCOVER callback from Sandbox
✓ Updated transaction <uuid>: 3 providers
```

### Estructura del Callback

El Sandbox enviará algo como:

```json
{
  "context": {
    "domain": "beckn.one.DEG:compute-energy:1.0",
    "action": "on_discover",
    "version": "2.0.0",
    "transaction_id": "<mismo-uuid>",
    ...
  },
  "message": {
    "catalog": {
      "providers": [
        {
          "id": "provider-1",
          "descriptor": { "name": "DER Provider 1" },
          "items": [
            {
              "id": "item-1",
              "descriptor": { "code": "DR_EVENT" },
              "price": { "value": "1500" },
              "quantity": { "available": { "count": 100 } }
            }
          ]
        }
      ]
    }
  }
}
```

---

## 🎯 Flujo Completo (Discover → Confirm)

### Estado Actual del Código

✅ **Ya implementado**:

1. `send_discover()` - Envía a `/api/discover` con dominio `compute-energy`
2. `on_search_callback()` - Recibe callback y extrae catálogo
3. `select_best_der()` - Selecciona mejor proveedor por precio/capacidad
4. `send_confirm()` - Envía a `/api/confirm` con dominio `demand-flexibility`
5. `on_confirm_callback()` - Extrae `obp_id` para P444

### Flujo Automático

El orchestrator `run_agent()` ya hace todo automáticamente:

```
1. DISCOVER → Espera ON_DISCOVER (60s timeout)
2. Selecciona mejor DER del catálogo
3. CONFIRM → Espera ON_CONFIRM (60s timeout)
4. Extrae OBP_ID para auditoría
5. Retorna resultado completo
```

---

## 📊 Verificación de Datos P444

### Frontend: AuditView.tsx

El `obp_id` se mostrará automáticamente en la tabla de auditoría (línea 122).

**Mock actual**:

```typescript
obpId: "OBP-12345"; // Será reemplazado con el real del Sandbox
```

### Backend: Persistencia

El `obp_id` se guarda en:

```python
transaction_store[transaction_id].obp_id = order_id
```

**TODO**: Persistir en base de datos para cumplir P444.

---

## 🐛 Troubleshooting

### Problema: No llega callback

**Verificar**:

1. Ngrok está corriendo: `curl https://xxxx.ngrok.io/health`
2. BAP_URI actualizado en `.env`
3. Backend escuchando en puerto 8000: `docker ps`
4. Ruta del webhook correcta: `/beckn/webhook/on_discover`

### Problema: Firma inválida

**Verificar**:

1. Claves en `.env` coinciden con las generadas
2. `BECKN_SUBSCRIBER_ID` correcto
3. Logs de beckn-onix: `docker logs beckn-onix | grep signature`

### Problema: Timeout esperando callback

**Causas comunes**:

1. Ngrok URL no actualizada
2. Firewall bloqueando ngrok
3. Sandbox caído (verificar status del hackathon)

---

## ✅ Criterios de Éxito

- [ ] Ngrok túnel activo y accesible
- [ ] Docker containers corriendo sin errores
- [ ] POST /test/discover retorna ACK
- [ ] Ngrok muestra POST /beckn/webhook/on_discover
- [ ] Logs muestran "✓ Updated transaction"
- [ ] Callback contiene catálogo de providers
- [ ] Orchestrator completa flujo hasta CONFIRM
- [ ] `obp_id` extraído y guardado

---

## 🚀 Comando Rápido de Prueba

```bash
# 1. Iniciar ngrok (Terminal 1)
ngrok http 8000

# 2. Copiar URL y actualizar .env
# BAP_URI=https://xxxx.ngrok.io/beckn/webhook

# 3. Iniciar servicios (Terminal 2)
cd d:\Users\lauta\Desktop\hackathonDEG\fluxeon
docker-compose up -d --build

# 4. Probar discover (Terminal 3)
curl -X POST http://localhost:8000/test/discover

# 5. Monitorear logs
docker logs -f fluxeon-backend
```

---

## 📝 Notas Importantes

- **Versión**: Siempre 2.0.0
- **Dominios**: compute-energy para discover, demand-flexibility para confirm/status
- **Timeout**: 60 segundos por callback
- **ACK**: Respuesta síncrona vacía es normal
- **Datos reales**: Vienen en el callback asíncrono
