# FLUXEON Front 2 - Beckn Flow + DER Cards + Audit View

## Overview

Front 2 is the second part of the FLUXEON Command Centre dashboard. It displays:

1. **Beckn Timeline** – Visual workflow of 6 sequential steps
2. **Flex Events** – Active flexibility requests with delivery metrics
3. **DER Cards** – Grid of available distributed energy resources
4. **Audit View** – Regulatory-grade audit logs with OBP ID tracking

## Files Included

```
Components (React):
├── BecknTimeline.tsx       # Beckn workflow (DISCOVER → COMPLETE)
├── DERCard.tsx             # Individual DER resource card
├── EventsList.tsx          # Active flex events panel
└── AuditView.tsx           # Audit logs table with export

Page:
└── page.tsx                # Main page: app/front2/

Hooks:
└── useFront2Hooks.ts       # 7 custom hooks for API integration

Documentation:
├── README.md               # This file
├── INTEGRATION.md          # Backend connection guide
├── ADVANCED_EXAMPLES.tsx   # 10 extension examples
```


### Run Development Server

```bash
npm run dev
```

### Visit in Browser

```
http://localhost:3000/front2
```

Everything works with **mock data** - no backend needed yet!

## Component Details

### BecknTimeline

Displays the 6-step Beckn workflow visually:

```
DISCOVER → SELECT → INIT → CONFIRM → STATUS → COMPLETE
```

**Props:**
- `currentStep`: Current step (string)
- `timestamps`: Object with timestamps for each step

**Features:**
- Visual connectors between steps
- Progress indicator
- Timestamps for audit trail
- Color-coded: green (completed), amber (current), gray (pending)

### DERCard

Individual card showing a distributed energy resource.

**Props:**
- `id`: Unique identifier
- `name`: Resource name
- `type`: EV | BATTERY | HVAC | LOAD | PV
- `capacity`: Total capacity in kW
- `available`: Available capacity in kW
- `status`: AVAILABLE | ALLOCATED | ACTIVE | UNAVAILABLE
- `responseTime`: Response time in seconds (optional)
- `cost`: Cost per kWh (optional)

**Features:**
- Capacity utilization bar
- Status badge with color
- Type icon (emoji)
- Allocate button (when available)

### EventsList

Panel showing active flexibility events.

**Features:**
- Scrollable list
- Metrics: Requested vs Delivered
- Success percentage
- Relative time (5m ago, 1h ago)
- Click event to view details
- Mock data included

### AuditView

Table of audit logs with OBP IDs for regulatory compliance.

**Columns:**
- OBP ID
- Timestamp
- Feeder
- DERs Activated
- Requested (kW)
- Delivered (kW)
- Status
- Duration (s)

**Features:**
- Search by OBP ID
- Export CSV button
- Hover effects
- Responsive design

## Design

### Color Palette (FLUXEON Brand)

```
✅ Success/Active:    #00E698  (green-500)   - Delivered, active DER
⚠️  Warning:          #FFC62E  (amber-500)   - Allocated, partial
❌ Critical/Error:    #FF3B30  (red-500)     - Failed, unavailable
🔵 Info:              #0099FF  (blue-500)    - Current step, info
⬛ Background:        #0F172A  (slate-950)   - Dark mode
```

### Typography

- **Headers:** font-bold, uppercase, tracking-wider
- **Body:** font-semibold, text-sm
- **Meta:** text-xs, text-slate-400
- **Font:** Inter (recommended in brand sheet)

## Features Implemented

- ✅ Beckn Timeline with 6 steps
- ✅ Flex Events panel
- ✅ DER cards grid (responsive)
- ✅ Audit logs table
- ✅ Search by OBP ID
- ✅ Export CSV
- ✅ Mock data included
- ✅ Dark mode optimized
- ✅ TypeScript strict mode
- ✅ FLUXEON brand colors
- ✅ Smooth animations
- ✅ Mobile responsive

## Connecting to Backend

### Using Hooks (Recommended)

```typescript
import { useFlexEvents, useDERs, useAuditLogs } from '@/hooks/useFront2Hooks';

export default function Front2() {
  const { events, isLoading } = useFlexEvents();
  const { ders } = useDERs();
  const { logs } = useAuditLogs();

  return (
    <>
      <EventsList events={events} isLoading={isLoading} />
      {/* ... */}
    </>
  );
}
```

### Direct Fetch

```typescript
useEffect(() => {
  fetch('http://localhost:8000/events/active')
    .then(res => res.json())
    .then(data => setEvents(data.events));
}, []);
```

See **INTEGRATION.md** for detailed backend connection guide.

## Mock Data

All components include mock data for testing without a backend:

- **BecknTimeline:** 3 completed steps
- **EventsList:** 3 simulated events
- **DERCard:** 6 distributed resources
- **AuditView:** 4 audit logs

Perfect for UI testing and prototyping!

## Nice-to-Have Features

- [ ] WebSocket for real-time updates
- [ ] Charts with Recharts (trends, metrics)
- [ ] Advanced filtering (by feeder, DER type, date)
- [ ] Toast notifications
- [ ] DER detail modal
- [ ] JSON export
- [ ] Analytics panel
- [ ] AI predictions

See **ADVANCED_EXAMPLES.tsx** for code samples.

## Troubleshooting

### Module not found error

Verify `tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### CORS errors

Check backend has CORS enabled:
```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Styles not applied

Restart dev server and clear browser cache:
```bash
npm run dev
```

## Next Steps

1. **Read:** INTEGRATION.md (connect to backend)
2. **Read:** ADVANCED_EXAMPLES.tsx (extend features)
3. **Customize:** Colors, layout, components
4. **Deploy:** To production

## Support

- **Issues?** Check the troubleshooting section
- **Want examples?** Read ADVANCED_EXAMPLES.tsx
- **Need more?** Extend the hooks in useFront2Hooks.ts

## Status

- Version: 1.0 MVP
- Status: ✅ Ready to integrate
- Test with: Mock data (no backend required)
- Connection: Hooks ready for backend

---

**Made with ❤️ for FLUXEON**  
**November 2025**
