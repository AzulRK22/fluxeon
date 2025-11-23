FLUXEON – Hackathon Monorepo

Grid-Scale Flexibility Orchestration using AI Agents + Beckn Protocol

This repository contains both the FastAPI backend and the Next.js (Tailwind) frontend dashboard used for the FLUXEON Command Centre.

The repo is lightweight and optimized for rapid hackathon development (2–3 days).
Everything below explains how to install, run, and collaborate.

🚀 Project Structure
fluxeon/
backend/
app/
api/
feeders.py
events.py
audit.py
core/
simulator.py
ts_pipeline.py
agent_core.py
beckn_client.py
audit_log.py
models/
feeder.py
der.py
events.py
audit.py
main.py
requirements.txt
.venv/ <-- local virtual environment (not tracked)

frontend/
dashboard/
public/
src/
app/
layout.tsx
page.tsx
components/
FeederTable.tsx
LoadChart.tsx
StatusChip.tsx
package.json
next.config.ts
tailwind + TS setup

docs/
SRS-FLUXEON.pdf
BrandSheet-FLUXEON.pdf

🧩 Tech Stack
Backend
• FastAPI
• Uvicorn
• Pydantic
• Custom mock Beckn workflow (DISCOVER → SELECT → INIT → CONFIRM → STATUS → COMPLETE)

Frontend
• Next.js 15
• React + TypeScript
• Tailwind CSS
• Responsive Command Centre UI

⚙️ Backend Setup (FastAPI)
Run these commands only once when first setting up the environment.

1. Navigate to the backend folder
   cd ...../.../fluxeon/backend
2. Create the virtual environment
   python3 -m venv .venv
3. Activate the virtual environment
   macOS/Linux: source .venv/bin/activate
   Windows PowerShell: .venv\Scripts\Activate.ps1
4. Install backend dependencies
   pip install -r requirements.txt
5. Run the backend server
   uvicorn app.main:app --reload

The API will be available at:
• http://127.0.0.1:8000/
• Swagger docs: http://127.0.0.1:8000/docs

🔁 Daily Backend Workflow (every time you work on backend)
cd /.../.../.../GitHub/fluxeon/backend
source .venv/bin/activate
uvicorn app.main:app --reload

🌐 Frontend Setup (Next.js Dashboard)
Only needed once per machine.

1. Navigate to the dashboard
   cd /.../.../fluxeon/frontend/dashboard
2. Install dependencies
   npm install
3. Run development server
   npm run dev

Frontend runs at:
http://localhost:3000

⚠️ CORS is enabled by default
The backend already includes:
origins = [
"http://localhost:3000",
"http://127.0.0.1:3000",
]
This allows the Next.js dashboard to call:
http://localhost:8000/feeders
http://localhost:8000/events/active
http://localhost:8000/audit/{id}

🧠 How to Select Python Interpreter in VS Code

1. Open VS Code in the backend/ folder
2. Press Cmd + Shift + P
3. Select: Python: Select Interpreter
4. Choose:
   fluxeon/backend/.venv/bin/python
   This fixes Pylance warnings like “import fastapi could not be resolved”.

🧩 Development Notes
• Always activate your venv before running backend.
• If frontend shows CORS errors, restart backend (CORS already enabled).
• If VS Code shows fastapi import errors, reselect the interpreter.
• Backend is intentionally mock-based for rapid development.

🚀 Ready for Hackathon Demo

This repo is optimized for:
• Fast iteration
• Clean structure
• Easy onboarding
• Rapid visual progress in the dashboard
• Plug-and-play backend mocks

If you have any issues running the project, check:
• Backend running at 8000
• Frontend running at 3000
• Correct venv activation
• Correct Python interpreter in VS Code

⸻

🏁 Contributors
• Backend Engineer A
• Backend Engineer B
• Software Engineer : Azul Kuri
• Frontend Engineer B

FLUXEON — Grid flexibility, orchestrated. ⚡💚
