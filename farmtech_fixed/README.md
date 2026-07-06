# FarmTech

Full-stack smart farming platform — Django DRF backend + Next.js frontend + AI/ML models.

## 🏗 Stack

| Layer     | Tech                                        |
|-----------|---------------------------------------------|
| Backend   | Django 5 + DRF + SimpleJWT + WhiteNoise    |
| Database  | SQLite (Default for local) / PostgreSQL    |
| Frontend  | Next.js 16 + TypeScript + Tailwind          |
| AI/ML     | PyTorch + Transformers + scikit-learn       |

---

## 🚀 Quick Start
1. Start the Backend: `cd backend && python manage.py runserver`
2. Start the Frontend: `cd frontend && npm run dev`

## 🔧 Manual Setup

### Backend
1. Activate virtual environment: `..\.venv\Scripts\activate`
2. Navigate to `backend`
3. Run migrations: `python manage.py migrate`
4. Start server: `python manage.py runserver`

### Data Engineering Pipeline
The project includes a robust pipeline for generating the datasets used by the AI models.
1. Navigate to `backend/scripts`
2. Ensure you have the `CROPGRIDSv1.08_NC_maps` folder with NetCDF files.
3. Authenticate with Google Earth Engine: `earthengine authenticate`
4. Run the pipeline: `python data_pipeline.py`

### Frontend
1. Navigate to `frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
