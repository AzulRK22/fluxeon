# FLUXEON – Hackathon Monorepo

**Grid-Scale Flexibility Orchestration using AI Agents + Beckn-style Protocol**

[<FLUXEON - DESIGN DOCUMENT PREVIEW AND DOWNLOAD>](<(https://drive.google.com/file/d/19YJFNvDkla4nkgLj-8cNe2FbReVt3hrh/view?usp=sharing)>)

FLUXEON is a demo Command Centre for DSOs.  
It detects feeder overload risk and orchestrates flexibility from distributed energy resources (DERs) using:

- A FastAPI backend (simulation + agent logic)
- A Next.js + Tailwind dashboard (operator view)
- A mock Beckn-inspired workflow (DISCOVER → SELECT → INIT → CONFIRM → STATUS → COMPLETE)

---

## 2. Tech Stack

**Backend**
- FastAPI  
- Uvicorn  
- Pydantic  
- Simple time-series classifier (0 = Normal, 1 = Alert, 2 = Critical)  
- Mock Beckn-inspired orchestration & audit trail  

**Frontend**
- Next.js 15 (App Router)  
- React + TypeScript  
- Tailwind CSS  
- Dark-mode Command Centre UI  

---

## 3. Backend Setup (FastAPI)

Run these commands **the first time** you set up the backend:

```bash
cd backend

# 1) create virtual environment
python3 -m venv .venv

# 2) activate environment
source .venv/bin/activate      # macOS / Linux
# .venv\Scripts\Activate.ps1   # Windows PowerShell

# 3) install dependencies
pip install -r requirements.txt

# 4) run backend
uvicorn app.main:app --reload
```

Backend endpoints:
- http://127.0.0.1:8000/
- Swagger UI: http://127.0.0.1:8000/docs

---

## 🔁 Daily Backend Workflow (every time you work on backend)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

---

## 🌐 Frontend Setup (Next.js Dashboard)

```bash
cd frontend/dashboard

# install dependencies (first time)
npm install

# run dev server
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔗 Backend ↔ Frontend Integration (CORS)

CORS is already enabled in `backend/app/main.py`:

```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

The frontend fetches from these endpoints:

```
GET http://localhost:8000/feeders
GET http://localhost:8000/feeders/{id}/state
GET http://localhost:8000/events/active
GET http://localhost:8000/audit/{obp_id}
```

---

## 🧠 VS Code – Python Interpreter Setup

To avoid `import fastapi could not be resolved` warnings:

1. Open the **backend** folder in VS Code.  
2. Press `Cmd + Shift + P` → **Python: Select Interpreter**.  
3. Choose:

```
backend/.venv/bin/python
```

4. Reload VS Code if needed.

---

## 🧩 Frontend Components Overview

- **FeederTable** – Overview of feeders with live state  
- **StatusChip** – Green / Amber / Red indicator pills  
- **LoadChart** – Displays load + threshold (chart-ready placeholder)  
- More coming: Beckn timeline, DER card grid, audit view

---

## 👥 Contribution Workflow (Hackathon-friendly)

1. Create your feature branch:

```bash
git checkout -b feature/my-change
```

2. Make edits (backend or frontend).

3. Run locally:  
   Backend → `uvicorn app.main:app --reload`  
   Frontend → `npm run dev`

4. Commit:

```bash
git add .
git commit -m "feat: update dashboard UI"
```

5. Push:

```bash
git push origin feature/my-change
```

6. Open Pull Request.

---

## ⚡ Project Vision

**FLUXEON**  
A command-centre demo for DSOs to predict feeder overloads and orchestrate real-time flexibility via agentic workflows and Beckn-style interactions.

*Grid flexibility, orchestrated.* ⚡💚
