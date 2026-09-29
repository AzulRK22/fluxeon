# ⚡ FLUXEON

### Grid-Scale Flexibility Orchestration using AI Agents + Beckn-Style Workflows

FLUXEON is a demo Command Centre for Distribution System Operators
(DSOs).

It detects feeder overload risk and orchestrates flexibility from
distributed energy resources (DERs) using:

-   a FastAPI backend for simulation and agent logic,
-   a Next.js + Tailwind dashboard for the operator view,
-   a mock Beckn-inspired workflow:
    `DISCOVER → SELECT → INIT → CONFIRM → STATUS → COMPLETE`.

**Recognition:** UK AI Agent Hackathon --- Top 15 · Intel Guadalajara
--- Top 10

### 📄 Design Document

[📘 View FLUXEON Design Document
(PDF)](https://drive.google.com/file/d/11knBDejwSl_-LenQNehANLYawTmy1qh0/view?usp=share_link)

------------------------------------------------------------------------

## Project Vision

Modern grids increasingly depend on distributed resources such as
batteries, EV charging, flexible demand, and local generation.

When a feeder approaches an overload condition, operators need to
understand the risk, identify available flexibility, coordinate a
response, monitor execution, and retain an auditable record.

FLUXEON models that workflow as an operator-facing product.

> **Grid flexibility, orchestrated.**

------------------------------------------------------------------------

## Core Workflow

``` text
Grid telemetry
      ↓
Feeder overload risk
      ↓
Flexibility requirement
      ↓
Discover available resources
      ↓
Select response
      ↓
Initiate + confirm
      ↓
Monitor status
      ↓
Complete + audit
```

The mock orchestration follows a Beckn-inspired sequence:

``` text
DISCOVER → SELECT → INIT → CONFIRM → STATUS → COMPLETE
```

------------------------------------------------------------------------

## Tech Stack

### Backend

-   FastAPI
-   Uvicorn
-   Pydantic
-   Simple time-series classifier:
    -   `0` = Normal
    -   `1` = Alert
    -   `2` = Critical
-   Mock Beckn-inspired orchestration
-   Audit trail

### Frontend

-   Next.js 15
-   App Router
-   React
-   TypeScript
-   Tailwind CSS
-   Dark-mode Command Centre UI

------------------------------------------------------------------------

## Architecture

``` text
┌─────────────────────────────┐
│   Next.js Command Centre    │
│                             │
│ Feeders · Events · Audit    │
└──────────────┬──────────────┘
               │ REST
┌──────────────▼──────────────┐
│        FastAPI API          │
│                             │
│ Simulation · Risk · Agents  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Flexibility Orchestration   │
│                             │
│ Discover → Select → Init →  │
│ Confirm → Status → Complete │
└─────────────────────────────┘
```

------------------------------------------------------------------------

## Backend Setup

Run these commands the first time you set up the backend:

``` bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate environment — macOS / Linux
source .venv/bin/activate

# Windows PowerShell:
# .venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn app.main:app --reload
```

Backend:

``` text
http://127.0.0.1:8000/
```

Swagger UI:

``` text
http://127.0.0.1:8000/docs
```

------------------------------------------------------------------------

## Daily Backend Workflow

After the environment has been created:

``` bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

------------------------------------------------------------------------

## Frontend Setup

``` bash
cd frontend/dashboard
npm install
npm run dev
```

Frontend:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## Backend ↔ Frontend Integration

CORS is enabled in `backend/app/main.py` for the local frontend origins:

``` python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

The frontend consumes endpoints including:

``` text
GET http://localhost:8000/feeders
GET http://localhost:8000/feeders/{id}/state
GET http://localhost:8000/events/active
GET http://localhost:8000/audit/{obp_id}
```

------------------------------------------------------------------------

## API Surface

### Feeders

``` text
GET /feeders
GET /feeders/{id}/state
```

Used to retrieve feeder information and current simulated state.

### Active Events

``` text
GET /events/active
```

Returns active grid events for the operator dashboard.

### Audit

``` text
GET /audit/{obp_id}
```

Provides audit information associated with an orchestration workflow.

------------------------------------------------------------------------

## VS Code --- Python Interpreter Setup

If VS Code shows warnings such as:

``` text
import fastapi could not be resolved
```

select the backend virtual environment:

1.  Open the `backend` folder in VS Code.
2.  Press `Cmd + Shift + P`.
3.  Choose **Python: Select Interpreter**.
4.  Select:

``` text
backend/.venv/bin/python
```

5.  Reload VS Code if necessary.

------------------------------------------------------------------------

## Frontend Components Overview

### FeederTable

Overview of feeders with live state.

### StatusChip

Green / Amber / Red indicator pills for feeder condition.

### LoadChart

Displays load and threshold information.

### Planned / Expandable Operator Views

The Command Centre architecture can support:

-   Beckn workflow timeline,
-   DER resource cards,
-   active flexibility actions,
-   orchestration state,
-   audit history.

------------------------------------------------------------------------

## Product Principles

### Operator clarity

The interface prioritizes the information an operator needs to
understand grid state and the current response.

### Explainable orchestration

Actions move through explicit stages rather than appearing as opaque
automated decisions.

### Auditability

The workflow retains a history of orchestration events so system actions
can be reviewed.

### Interoperability

The Beckn-inspired sequence explores how heterogeneous flexibility
resources could participate through a shared interaction model.

------------------------------------------------------------------------

## Contribution Workflow

Create a feature branch:

``` bash
git checkout -b feature/my-change
```

Make the required frontend or backend changes.

Run locally:

Backend:

``` bash
uvicorn app.main:app --reload
```

Frontend:

``` bash
npm run dev
```

Commit:

``` bash
git add .
git commit -m "feat: update dashboard UI"
```

Push:

``` bash
git push origin feature/my-change
```

Then open a Pull Request.

------------------------------------------------------------------------

## Recognition

FLUXEON was developed through international AI and energy innovation
competitions.

-   🏆 **Top 15 --- UK AI Agent Hackathon**
-   🏆 **Top 10 --- Intel Guadalajara**

------------------------------------------------------------------------

## About

FLUXEON is part of my work exploring product engineering, energy
systems, decision-support interfaces, and agent-style orchestration.

-   Portfolio: https://www.azulrk.com
-   GitHub: https://github.com/AzulRK22

