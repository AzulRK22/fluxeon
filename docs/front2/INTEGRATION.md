# Backend Integration Guide

## Expected Endpoints

Your backend should provide these REST endpoints:

### GET /events/active

Returns active flexibility events.

**Response:**
```json
{
  "events": [
    {
      "id": "EVT-001",
      "feederId": "F12",
      "feederName": "Feeder 12 - Downtown",
      "status": "ACTIVE",
      "flexRequested": 45,
      "flexDelivered": 42,
      "timestamp": "2025-11-23T14:23:00Z",
      "derCount": 3,
      "obpId": "OBP-12345"
    }
  ]
}
```

### GET /audit/{obp_id}

Returns audit logs for a specific OBP ID.

**Response:**
```json
{
  "obpId": "OBP-12345",
  "timestamp": "2025-11-23T14:23:00Z",
  "feeder": "F12",
  "dersActivated": ["DER-001", "DER-003", "DER-005"],
  "requestedKw": 45,
  "deliveredKw": 42,
  "status": "SUCCESS",
  "duration": 3.2
}
```

### GET /ders

Returns available distributed energy resources.

**Response:**
```json
{
  "ders": [
    {
      "id": "DER-001",
      "name": "Downtown EV Charger",
      "type": "EV",
      "capacity": 50,
      "available": 15,
      "status": "ACTIVE",
      "responseTime": 2.1,
      "cost": 0.35
    }
  ]
}
```

### GET /feeders/{id}/state

Returns current state of a feeder.

**Response:**
```json
{
  "feederId": "F12",
  "state": 1,
  "currentLoad": 180,
  "threshold": 200,
  "timestamp": "2025-11-23T14:23:00Z"
}
```

## Integration Methods

### Method 1: Using Custom Hooks (Recommended)

Copy `useFront2Hooks.ts` to your project:

```bash
cp useFront2Hooks.ts src/hooks/
```

Then use in your components:

```typescript
import { useFlexEvents, useDERs, useAuditLogs } from '@/hooks/useFront2Hooks';

export default function Front2() {
  const { events, isLoading, error } = useFlexEvents();
  const { ders } = useDERs();
  const { logs } = useAuditLogs();

  if (error) return <div>Error: {error}</div>;
  
  return (
    <>
      <EventsList events={events} isLoading={isLoading} />
      {/* ... */}
    </>
  );
}
```

**Hooks available:**
- `useFlexEvents()` – Polling every 2.5 seconds
- `useDERs()` – Polling every 5 seconds
- `useAuditLogs(obpIdFilter?)` – Fetch with optional OBP ID filter
- `useFeederState(feederId)` – Specific feeder state
- `useRealtimeEvents()` – WebSocket (future use)
- `useBecknProgress()` – Track Beckn workflow steps
- `useRetry()` – Retry with exponential backoff

### Method 2: Direct Fetch in Component

Modify `page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function Front2Page() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:8000/events/active');
        const data = await res.json();
        setEvents(data.events);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchEvents();

    // Poll every 2.5 seconds (as per SRS)
    const interval = setInterval(fetchEvents, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <EventsList events={events} isLoading={isLoading} />
      {/* ... */}
    </>
  );
}
```

## Configuring Backend URL

### Development (localhost)

Update hooks or components:

```typescript
const API_BASE = 'http://localhost:8000';
```

### Production

Use environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://api.fluxeon.com
```

Then in components:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
```

## Polling vs WebSocket

### Polling (Current - Recommended for 2-3 day hackathon)

**Pros:**
- Simple to implement
- Works everywhere
- Easy to debug

**Cons:**
- Higher latency
- More network traffic

**Usage:**
```typescript
const interval = setInterval(fetchData, 2500);
```

### WebSocket (Advanced - Future feature)

**Pros:**
- Real-time updates
- Lower latency
- Less network overhead

**Cons:**
- More complex
- Requires backend support
- Need reconnection logic

**Usage:**
```typescript
import { useRealtimeEvents } from '@/hooks/useFront2Hooks';

const { events, isConnected } = useRealtimeEvents();
```

## Example: Complete Integration

### Step 1: Create API client

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export async function fetchFlexEvents() {
  const res = await fetch(`${API_BASE}/events/active`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function fetchDERs() {
  const res = await fetch(`${API_BASE}/ders`);
  if (!res.ok) throw new Error('Failed to fetch DERs');
  return res.json();
}

export async function fetchAuditLogs(obpId?: string) {
  const url = obpId 
    ? `${API_BASE}/audit/${obpId}`
    : `${API_BASE}/audit`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}
```

### Step 2: Use in component

```typescript
import { useEffect, useState } from 'react';
import { fetchFlexEvents, fetchDERs } from '@/lib/api';
import { EventsList } from '@/components/Front2/EventsList';

export default function Front2() {
  const [events, setEvents] = useState([]);
  const [ders, setDers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sync = async () => {
      setIsLoading(true);
      try {
        const [eventsData, dersData] = await Promise.all([
          fetchFlexEvents(),
          fetchDERs(),
        ]);
        setEvents(eventsData.events);
        setDers(dersData.ders);
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    sync();
    const interval = setInterval(sync, 2500);
    return () => clearInterval(interval);
  }, []);

  return <EventsList events={events} isLoading={isLoading} />;
}
```

## Error Handling

### Network Errors

```typescript
try {
  const data = await fetchFlexEvents();
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Network error:', error);
    // Fallback to cached data or show error UI
  }
}
```

### Timeout

```typescript
const fetchWithTimeout = (url: string, timeout = 5000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]);
};
```

### Retry Logic

Use the `useRetry` hook:

```typescript
import { useRetry } from '@/hooks/useFront2Hooks';

const { execute, isLoading, error, data } = useRetry(
  () => fetchFlexEvents(),
  3 // max retries
);

await execute();
```

## CORS Configuration

### Backend (FastAPI)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Verification

Check browser console for CORS errors. If present, verify backend configuration.

## Testing Without Backend

All components include mock data. To use mock data:

1. Don't use the hooks
2. Keep the MOCK_* constants in components
3. Component will render mock data automatically

Switch to real data by:
1. Importing the hooks
2. Replacing mock state with hook results
3. Removing mock data constants

## Performance Optimization

### Reduce Polling Frequency

```typescript
// Default: 2.5 seconds
const interval = setInterval(fetchEvents, 5000); // 5 seconds
```

### Use React Query (Optional)

```bash
npm install @tanstack/react-query
```

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: events } = useQuery({
  queryKey: ['events'],
  queryFn: fetchFlexEvents,
  refetchInterval: 2500,
});
```

### Memoize Expensive Components

```typescript
const EventsList = React.memo(({ events }: Props) => {
  // Component won't re-render unless events changes
  return <div>{/* ... */}</div>;
});
```

## Deployment Checklist

- [ ] Update API_BASE URL to production
- [ ] Test all endpoints with real backend
- [ ] Add error boundaries
- [ ] Verify CORS is configured
- [ ] Set up logging/monitoring
- [ ] Test on mobile devices
- [ ] Verify authentication (if needed)
- [ ] Load test with realistic data

## Troubleshooting

### "Cannot GET /events/active"

**Cause:** Backend endpoint doesn't exist or wrong URL

**Solution:**
- Verify endpoint exists in backend
- Check API_BASE URL is correct
- Test endpoint with curl: `curl http://localhost:8000/events/active`

### CORS error

**Cause:** Backend doesn't allow requests from your frontend URL

**Solution:**
- Add frontend URL to CORS origins in backend
- For development: add `http://localhost:3000`

### Data is stale

**Cause:** Polling interval too long or backend not updating

**Solution:**
- Reduce polling interval: `setInterval(fetch, 2000)`
- Check backend is actually updating data
- Use WebSocket for real-time updates

### High memory usage

**Cause:** Too many intervals or not cleaning up

**Solution:**
- Clear interval on component unmount (return cleanup)
- Use React Query for automatic caching
- Implement pagination for large datasets

---

**Next:** Read ADVANCED_EXAMPLES.tsx for more features!
