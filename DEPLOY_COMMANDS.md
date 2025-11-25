# FLUXEON DEG Hackathon - Comandos de Despliegue

## ✅ Fixes Críticos Aplicados

1. ✅ Credenciales ONIX sincronizadas
2. ✅ Import TransactionStatus agregado
3. ✅ print_config() corregido

---

## 🚀 CONSTRUCCIÓN Y ARRANQUE DE INFRAESTRUCTURA

### Paso 1: Construir Imágenes Docker

```bash
cd d:\Users\lauta\Desktop\hackathonDEG\fluxeon
docker-compose build
```

**Esto compila**:

- ✅ FLUXEON Backend (Python/FastAPI)

---

### Paso 2: Iniciar Servicios

```bash
docker-compose up -d
```

**Esto levanta**:

- ✅ fluxeon-backend (puerto 8000)

---

### Paso 3: Verificar Estado

```bash
# Ver logs del backend
docker logs -f fluxeon-backend

# Verificar que esté corriendo
docker ps

# Probar health check
curl http://localhost:8000/health
```

---

## 🌐 CONFIGURACIÓN NGROK (YA HECHO)

✅ **Ngrok ya está corriendo** en:

```
https://geraldo-unsensualized-golden.ngrok-free.dev
```

✅ **BAP_URI ya actualizado** en `.env`:

```ini
BAP_URI=https://geraldo-unsensualized-golden.ngrok-free.dev/beckn/webhook
```

---

## 🧪 PRUEBA DE CONECTIVIDAD FINAL

Una vez que Docker esté corriendo:

```bash
# Probar endpoint de discover
curl -X POST http://localhost:8000/test/discover

# Monitorear logs para ver la respuesta
docker logs -f fluxeon-backend

# Monitorear ngrok para ver callbacks
# (En la terminal donde corre ngrok)
```

---

## 📊 Flujo Esperado

```
1. curl POST /test/discover
   ↓
2. Backend → POST https://deg-hackathon-bap-sandbox.becknprotocol.io/api/discover
   ↓ (ACK inmediato)
3. Sandbox → POST https://geraldo-unsensualized-golden.ngrok-free.dev/beckn/webhook/on_discover
   ↓ (Catálogo de DERs)
4. Backend selecciona mejor DER
   ↓
5. Backend → POST /api/confirm
   ↓
6. Sandbox → POST /beckn/webhook/on_confirm
   ↓ (OBP ID)
7. ✅ Resultado completo
```

---

## ⚠️ Troubleshooting

### Si el backend no inicia:

```bash
# Ver logs de error
docker logs fluxeon-backend

# Reconstruir sin caché
docker-compose build --no-cache

# Reiniciar
docker-compose restart fluxeon-backend
```

### Si no llegan callbacks:

1. Verificar ngrok está corriendo
2. Verificar BAP_URI en `.env`
3. Verificar logs del Sandbox (si están disponibles)

---

## 🎯 Comandos Rápidos

```bash
# Todo en uno
cd d:\Users\lauta\Desktop\hackathonDEG\fluxeon && docker-compose build && docker-compose up -d

# Probar
curl -X POST http://localhost:8000/test/discover

# Monitorear
docker logs -f fluxeon-backend
```
