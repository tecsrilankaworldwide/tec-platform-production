web: cd backend && python -m uvicorn server:app --host=0.0.0.0 --port=${PORT:-8000}
frontend: cd frontend && serve -s build -l ${PORT:-3000}