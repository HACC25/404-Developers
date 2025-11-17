#!/usr/bin/env python3
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/jobs")
async def get_jobs():
    """Get list of all available job titles from SOC"""
    try:
        with open("detailed_occupations.json", "r", encoding="utf-8") as f:
            jobs = json.load(f)
        job_titles = [job["SOC Title"] for job in jobs]
        print(f"✓ Loaded {len(job_titles)} jobs")
        return {"jobs": job_titles}
    except Exception as e:
        print(f"✗ Error: {e}")
        return {"error": str(e), "jobs": []}

if __name__ == "__main__":
    import uvicorn
    print("Starting test server on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
