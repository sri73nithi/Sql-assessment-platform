# AI-Assisted SQL Assessment Management Platform

A production-quality automated SQL evaluation platform allowing organizations to conduct SQL exams, test student queries against isolated sandbox databases, and review submissions using weighted grading rules and Google Gemini AI feedback.

---

## Key Features

- **Decoupled Architecture**: FastAPI backend + Next.js App Router (TypeScript, TailwindCSS).
- **Secure SQL Sandbox Isolation**: Supports isolated schema execution with low-privileged database roles to prevent malicious SQL injections or server manipulation.
- **Dual-Mode Sandbox**: 
  1. **Production mode**: Connects to an isolated PostgreSQL Docker instance.
  2. **Local dev mode**: Uses in-memory SQLite fallbacks for quick development.
- **Objective Output Grading**: Compares row sets, column layouts, and types (ignoring row order unless query sorting is explicitly required).
- **Gemini AI Grading Assistant**: Evaluates logic, efficiency, formatting, and readability, returning mistakes and suggestions.
- **Rule Engine calculations**: Combines test outcomes (50%) and AI review scores (Logic 20%, Efficiency 10%, Standards 10%, Readability 10%) to output final scores.
- **Reports Export Center**: Admin downloads CSV files (Task results, Overall summaries, and Detailed performance matrices).
- **Analytics Dashboard**: Interactive charts displaying topic performance, completion percentages, and ranking boards.

---

## Project Structure

```
├── docker/                     # Orchestration and build dockerfiles
│   ├── docker-compose.yml      # Service setups (API, App DB, Sandbox DB)
│   ├── backend.Dockerfile      # Production FastAPI build layout
│   └── sandbox.sql             # SQL sandbox permission locks
├── backend/                    # FastAPI python directory
│   ├── app/                    # Codebase (main, core, models, schemas, services, api)
│   ├── tests/                  # Pytest verification tests
│   ├── requirements.txt        # python packages list
│   └── .env                    # Environment settings
└── frontend/                   # Next.js React frontend
    ├── src/                    # Frontend source (app, context, services, components)
    └── package.json            # Node modules list
```

---

## Quick Start (Local SQLite Dev Mode)

For zero-dependency local development testing (does not require Docker or PostgreSQL on the host machine):

### 1. Backend Setup
1. Open terminal and navigate to `backend/` directory.
2. Initialize virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   source venv/bin/activate  # macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install pytest-asyncio
   ```
4. Verify the `.env` settings under `backend/.env` resemble:
   ```env
   DATABASE_URL=sqlite+aiosqlite:///./platform.db
   SANDBOX_DATABASE_URL=sqlite:///./sandbox.db
   JWT_SECRET=super_secret_jwt_key_for_sql_assessment_platform_2026
   ENVIRONMENT=development
   GEMINI_API_KEY=your_gemini_key_here  # Optional: mocks AI evaluations if empty
   ```
5. Run the dev server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will automatically migrate the database and seed the default administrator user and SQL topic trees on start.*

### 2. Frontend Setup
1. Open a separate terminal and navigate to `frontend/` directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

### 3. Default Login Credentials
- **Administrator**:
  - Email: `admin@assessment.com`
  - Password: `admin_password`
- **Student**:
  - Create student accounts inside the **Student Manager** tab on the Admin Dashboard to log in as a student.

---

## Production Setup (Docker Mode)

To deploy the platform in a containerized production environment with fully-isolated PostgreSQL query sandboxes:

1. Configure production environment variables in a root `.env` file or pass them directly:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
2. Build and run containers using Docker Compose from the root workspace:
   ```bash
   docker-compose -f docker/docker-compose.yml up --build -d
   ```
3. Port mappings:
   - **Frontend portal**: `http://localhost:3000`
   - **Backend API Docs**: `http://localhost:8000/docs`
   - **App Database**: `localhost:5432`
   - **SQL Sandbox Database**: `localhost:5433`

---

## Verification & Testing

Verify system functionalities by executing the test suite:
```bash
# From the backend/ folder
$env:PYTHONPATH="."
pytest tests/test_platform.py
```
This runs assertions for Sandbox query executions, order-independent outputs checks, syntax errors, and scoring calculation formulas.
